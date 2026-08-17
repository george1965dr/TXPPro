"use client";

import { useMemo, useState, useTransition } from "react";
import { createBridge, removeBridge, setToothCondition, setToothOverlay } from "@/app/actions/chart";
import { CONDITIONS, type ConditionId } from "@/lib/dental/conditions";
import { UPPER_ARCH, LOWER_ARCH, resolveBridgeRange } from "@/lib/dental/tooth-geometry";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import type { BridgeType, ChartLayer, OverlayType, ToothSurface } from "@/lib/types";
import { ConditionPalette } from "./condition-palette";
import { ToothSurfaceDiagram } from "./tooth-surface-diagram";
import {
  buildToothToBridge,
  resolveToothDisplay,
  type BridgeInfo,
  type ChartState,
  type OverlayState,
} from "./chart-state";

interface PendingBridge {
  first: number;
  last: number;
  bridgeType: BridgeType;
  pierAbutments: number[];
}

interface OdontogramProps {
  patientId: string;
  chartState: ChartState;
  overlayState: OverlayState;
  bridges: BridgeInfo[];
  /** Chart state is lifted to WorkspaceTabs - both this component (existing-layer painting)
   * and the kanban's add-procedure dialog (proposed-layer graphics) read and write it. */
  onChartStateChange: (updater: (prev: ChartState) => ChartState) => void;
  onOverlayStateChange: (updater: (prev: OverlayState) => OverlayState) => void;
  onBridgesChange: (updater: (prev: BridgeInfo[]) => BridgeInfo[]) => void;
}

export function Odontogram({
  patientId,
  chartState,
  overlayState,
  bridges,
  onChartStateChange,
  onOverlayStateChange,
  onBridgesChange,
}: OdontogramProps) {
  const [bridgeFirstTooth, setBridgeFirstTooth] = useState<number | null>(null);
  const [pendingBridge, setPendingBridge] = useState<PendingBridge | null>(null);
  // Doubles as the display filter: only this layer's data renders on the
  // arch below. Only "existing" is paintable - "proposed" is a read-only
  // picture of what's been authored on the kanban (see WorkspaceTabs).
  const [view, setView] = useState<ChartLayer>("existing");
  const [condition, setCondition] = useState<ConditionId>("filling");
  const [isPending, startTransition] = useTransition();
  const editable = view === "existing";

  const conditionDef = CONDITIONS.find((c) => c.id === condition)!;
  const toothToBridge = useMemo(() => buildToothToBridge(bridges, view), [bridges, view]);
  const pendingBridgeInteriorTeeth = pendingBridge
    ? Array.from({ length: pendingBridge.last - pendingBridge.first - 1 }, (_, i) => pendingBridge.first + 1 + i)
    : [];

  function selectCondition(next: ConditionId) {
    setCondition(next);
    setBridgeFirstTooth(null);
    setPendingBridge(null);
  }

  function eraseSurfaceOrWhole(toothNumber: number, target: ToothSurface | "whole") {
    onChartStateChange((prev) => {
      const existingTooth = prev[toothNumber] ?? { surfaces: {}, whole: {} };
      const nextTooth =
        target === "whole"
          ? { ...existingTooth, whole: { ...existingTooth.whole, existing: undefined } }
          : {
              ...existingTooth,
              surfaces: {
                ...existingTooth.surfaces,
                [target]: { ...existingTooth.surfaces[target], existing: undefined },
              },
            };
      return { ...prev, [toothNumber]: nextTooth };
    });
    startTransition(async () => {
      await setToothCondition(patientId, toothNumber, target, "existing", null);
    });
  }

  function paintSurfaceOrWhole(toothNumber: number, target: ToothSurface | "whole") {
    onChartStateChange((prev) => {
      const existingTooth = prev[toothNumber] ?? { surfaces: {}, whole: {} };
      const nextTooth =
        target === "whole"
          ? { ...existingTooth, whole: { ...existingTooth.whole, existing: condition } }
          : {
              ...existingTooth,
              surfaces: {
                ...existingTooth.surfaces,
                [target]: { ...existingTooth.surfaces[target], existing: condition },
              },
            };
      return { ...prev, [toothNumber]: nextTooth };
    });
    startTransition(async () => {
      await setToothCondition(patientId, toothNumber, target, "existing", condition);
    });
  }

  function toggleOverlay(toothNumber: number) {
    const overlayType = condition as OverlayType;
    const currentlyPresent = !!overlayState[toothNumber]?.[overlayType]?.existing;
    const nextPresent = !currentlyPresent;

    onOverlayStateChange((prev) => {
      const tooth = { ...(prev[toothNumber] ?? {}) };
      tooth[overlayType] = { ...tooth[overlayType], existing: nextPresent };
      return { ...prev, [toothNumber]: tooth };
    });

    startTransition(async () => {
      await setToothOverlay(patientId, toothNumber, "existing", overlayType, nextPresent);
    });
  }

  function eraseOverlay(toothNumber: number, overlayType: OverlayType) {
    onOverlayStateChange((prev) => {
      const tooth = { ...(prev[toothNumber] ?? {}) };
      tooth[overlayType] = { ...tooth[overlayType], existing: false };
      return { ...prev, [toothNumber]: tooth };
    });

    startTransition(async () => {
      await setToothOverlay(patientId, toothNumber, "existing", overlayType, false);
    });
  }

  /**
   * Clicking a finding's badge (e.g. "Fx") directly is the obvious way to
   * remove it - works with the erase tool active, or with that same finding
   * already selected in the palette. A different tool selected leaves it
   * alone rather than guessing what the click meant.
   */
  function handleOverlayClick(toothNumber: number, overlayType: OverlayType) {
    if (!editable) return;
    if (condition === "erase" || condition === overlayType) {
      eraseOverlay(toothNumber, overlayType);
    }
  }

  function removeBridgeLocal(bridgeId: string) {
    onBridgesChange((prev) => prev.filter((b) => b.id !== bridgeId));
    startTransition(async () => {
      await removeBridge(patientId, bridgeId);
    });
  }

  function handleBridgeClick(toothNumber: number) {
    if (bridgeFirstTooth === null) {
      setBridgeFirstTooth(toothNumber);
      return;
    }

    const span = resolveBridgeRange(bridgeFirstTooth, toothNumber);
    // Same tooth twice, or the second click landed in a different arch
    // (bridges can't span upper and lower) - start over from this click.
    if (!span) {
      setBridgeFirstTooth(toothNumber);
      return;
    }

    setBridgeFirstTooth(null);
    setPendingBridge({
      first: Math.min(bridgeFirstTooth, toothNumber),
      last: Math.max(bridgeFirstTooth, toothNumber),
      bridgeType: condition === "implant_bridge" ? "implant" : "tooth",
      pierAbutments: [],
    });
  }

  function togglePierAbutment(toothNumber: number) {
    setPendingBridge((prev) => {
      if (!prev) return prev;
      const has = prev.pierAbutments.includes(toothNumber);
      return {
        ...prev,
        pierAbutments: has
          ? prev.pierAbutments.filter((t) => t !== toothNumber)
          : [...prev.pierAbutments, toothNumber],
      };
    });
  }

  function cancelPendingBridge() {
    setPendingBridge(null);
  }

  function confirmPendingBridge() {
    if (!pendingBridge) return;
    const teeth = resolveBridgeRange(pendingBridge.first, pendingBridge.last, pendingBridge.pierAbutments)!;
    const bridgeType = pendingBridge.bridgeType;
    setPendingBridge(null);

    const tempId = `pending-bridge-${teeth[0].toothNumber}-${teeth[teeth.length - 1].toothNumber}`;
    onBridgesChange((prev) => [...prev, { id: tempId, layer: "existing", bridgeType, teeth }]);

    startTransition(async () => {
      const { bridgeId } = await createBridge(patientId, "existing", bridgeType, teeth);
      onBridgesChange((prev) => prev.map((b) => (b.id === tempId ? { ...b, id: bridgeId } : b)));
    });
  }

  function applyTool(toothNumber: number, target: ToothSurface | "whole") {
    if (condition === "erase") {
      if (target === "whole") {
        const membership = toothToBridge.get(toothNumber);
        if (membership) {
          removeBridgeLocal(membership.bridge.id);
          return;
        }
      }
      eraseSurfaceOrWhole(toothNumber, target);
      return;
    }

    if (conditionDef.target === "overlay") {
      if (target !== "whole") return; // overlays are tooth-level, not surface-level
      toggleOverlay(toothNumber);
      return;
    }

    const isWholeTool = conditionDef.target === "whole";
    const isWholeTarget = target === "whole";
    if (isWholeTool !== isWholeTarget) {
      // Surface tools only apply to surfaces; whole-tooth tools only apply
      // to the tooth number. Ignore a mismatched click rather than guessing.
      return;
    }
    paintSurfaceOrWhole(toothNumber, target);
  }

  function handleToothNumberClick(toothNumber: number) {
    if (!editable || pendingBridge) return;
    if (conditionDef.target === "bridge") {
      handleBridgeClick(toothNumber);
      return;
    }
    applyTool(toothNumber, "whole");
  }

  function handleSurfaceClick(toothNumber: number, surface: ToothSurface) {
    if (!editable || pendingBridge || conditionDef.target === "bridge") return; // bridges are whole-tooth only
    // Overlays are tooth-level findings - a tooth with an existing filling
    // (no whole-tooth state) renders as the 5-surface diagram, so clicking
    // any zone of it should still toggle the overlay rather than silently
    // doing nothing just because the click didn't land on the tooth number.
    if (conditionDef.target === "overlay") {
      applyTool(toothNumber, "whole");
      return;
    }
    applyTool(toothNumber, surface);
  }

  const renderTooth = (toothNumber: number) => {
    const display = resolveToothDisplay(toothNumber, view, chartState, overlayState, toothToBridge);

    return (
      <ToothSurfaceDiagram
        key={toothNumber}
        toothNumber={toothNumber}
        view={view}
        size={56}
        surfaces={display.surfaces}
        whole={display.whole}
        overlays={display.overlays}
        bridge={display.bridge}
        alert={display.alert}
        onSurfaceClick={(surface) => handleSurfaceClick(toothNumber, surface)}
        onWholeClick={() => handleToothNumberClick(toothNumber)}
        onOverlayClick={(overlay) => handleOverlayClick(toothNumber, overlay)}
      />
    );
  };

  return (
    <div className="flex flex-col gap-4">
      <ConditionPalette
        view={view}
        onViewChange={setView}
        isSaving={isPending}
        condition={condition}
        onConditionChange={selectCondition}
      />

      {editable && pendingBridge && (
        <div className="flex flex-col gap-2 rounded-md border p-3">
          <p className="text-sm font-medium">
            Bridge #{pendingBridge.first}-#{pendingBridge.last}
          </p>
          {pendingBridgeInteriorTeeth.length > 0 && (
            <div className="flex flex-col gap-1.5">
              <p className="text-xs text-muted-foreground">
                Teeth in between are pontics by default - click any that are also abutments (a pier
                abutment).
              </p>
              <div className="flex flex-wrap gap-1.5">
                {pendingBridgeInteriorTeeth.map((tooth) => (
                  <button
                    key={tooth}
                    type="button"
                    onClick={() => togglePierAbutment(tooth)}
                    className={cn(
                      "rounded-md border px-2.5 py-1 text-sm",
                      pendingBridge.pierAbutments.includes(tooth)
                        ? "border-foreground/40 bg-accent font-medium"
                        : "border-border text-muted-foreground hover:bg-accent/50",
                    )}
                  >
                    #{tooth}
                  </button>
                ))}
              </div>
            </div>
          )}
          <div className="flex gap-2">
            <Button type="button" size="sm" onClick={confirmPendingBridge}>
              Confirm bridge
            </Button>
            <Button type="button" size="sm" variant="outline" onClick={cancelPendingBridge}>
              Cancel
            </Button>
          </div>
        </div>
      )}

      {editable && !pendingBridge && (
        <p className="text-xs text-muted-foreground">
          {condition === "erase"
            ? "Click a surface, tooth number, or finding badge to erase it"
            : conditionDef.target === "bridge"
              ? bridgeFirstTooth === null
                ? "Click the first abutment tooth for the bridge"
                : `Click the other end of the bridge (started at #${bridgeFirstTooth})`
              : conditionDef.target === "overlay"
                ? "Click the tooth number (or its badge again) to toggle this finding"
                : "Click a surface to chart it · click the tooth number for crown, implant, or missing"}
        </p>
      )}

      <div className="flex flex-col gap-3 overflow-x-auto pb-2">
        <div className="flex justify-center gap-2">{UPPER_ARCH.map(renderTooth)}</div>
        <div className="flex justify-center gap-2">{LOWER_ARCH.map(renderTooth)}</div>
      </div>

      <p className="text-xs text-muted-foreground">
        Showing <span className="font-medium text-foreground">{view === "existing" ? "existing conditions" : "proposed treatment"}</span> only
        {" · "}switch above to compare against {view === "existing" ? "proposed treatment" : "existing conditions"}
      </p>
    </div>
  );
}
