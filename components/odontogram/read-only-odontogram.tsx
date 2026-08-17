"use client";

import { useMemo } from "react";
import { UPPER_ARCH, LOWER_ARCH } from "@/lib/dental/tooth-geometry";
import { ToothSurfaceDiagram } from "./tooth-surface-diagram";
import { buildToothToBridge, resolveToothDisplay, type BridgeInfo, type ChartState, type OverlayState } from "./chart-state";
import type { ChartLayer } from "@/lib/types";

interface ReadOnlyOdontogramProps {
  view: ChartLayer;
  chartState: ChartState;
  overlayState: OverlayState;
  bridges: BridgeInfo[];
}

const noop = () => {};

/**
 * A passive picture of the chart - same rendering as the editable Odontogram
 * (via the shared resolveToothDisplay helper) but with no ConditionPalette
 * and no click handlers. Used where a chart needs to be visible alongside
 * other work (e.g. sequencing) without inviting edits from the wrong place.
 */
export function ReadOnlyOdontogram({ view, chartState, overlayState, bridges }: ReadOnlyOdontogramProps) {
  const toothToBridge = useMemo(() => buildToothToBridge(bridges, view), [bridges, view]);

  const renderTooth = (toothNumber: number) => {
    const display = resolveToothDisplay(toothNumber, view, chartState, overlayState, toothToBridge);
    return (
      <ToothSurfaceDiagram
        key={toothNumber}
        toothNumber={toothNumber}
        view={view}
        size={40}
        surfaces={display.surfaces}
        whole={display.whole}
        overlays={display.overlays}
        bridge={display.bridge}
        alert={display.alert}
        onSurfaceClick={noop}
        onWholeClick={noop}
        onOverlayClick={noop}
      />
    );
  };

  return (
    <div className="flex flex-col gap-3 overflow-x-auto pb-2">
      <div className="flex justify-center gap-1.5">{UPPER_ARCH.map(renderTooth)}</div>
      <div className="flex justify-center gap-1.5">{LOWER_ARCH.map(renderTooth)}</div>
    </div>
  );
}
