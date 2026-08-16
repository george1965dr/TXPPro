"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useHeaderInfo } from "@/components/header-context";
import { Odontogram } from "@/components/odontogram/odontogram";
import {
  buildBridgeInfos,
  buildChartState,
  buildOverlayState,
  type BridgeInfo,
  type ChartState,
  type OverlayState,
} from "@/components/odontogram/chart-state";
import { PerioGrid } from "@/components/perio/perio-grid";
import { VisitBoard } from "@/components/treatment-plans/visit-board";
import { MediaGallery } from "@/components/media/media-gallery";
import { toothsWithPhotos, type MediaItem } from "@/components/media/media-state";
import {
  addKanbanProcedure,
  addProcedureToPlan,
  removeKanbanItem,
  scheduleItem,
  updatePlanItemFee,
  type KanbanAddInput,
} from "@/app/actions/treatment-plan";
import { buildBoardItems, type BoardItem } from "@/components/treatment-plans/board-state";
import { CONDITIONS, type ConditionId } from "@/lib/dental/conditions";
import { bridgeIdFromChartKey } from "@/lib/dental/chart-key";
import { SURFACE_BY_ABBREVIATION } from "@/lib/dental/tooth-geometry";
import type {
  Bridge,
  BridgeTooth,
  BridgeType,
  OverlayType,
  PeriodontalMeasurement,
  Procedure,
  SequencedTreatmentPlanItem,
  ToothCondition,
  ToothOverlay,
  ToothPerioStatus,
  TreatmentPlanItem,
} from "@/lib/types";

const TAB_LABEL: Record<string, string> = {
  chart: "Chart",
  perio: "Perio",
  sequence: "Sequence",
  media: "Photos",
};

interface WorkspaceTabsProps {
  patientId: string;
  patientName: string;
  toothConditions: ToothCondition[];
  toothOverlays: ToothOverlay[];
  bridges: Bridge[];
  bridgeTeeth: BridgeTooth[];
  procedures: Procedure[];
  perioMeasurements: PeriodontalMeasurement[];
  perioStatuses: ToothPerioStatus[];
  treatmentPlanId: string | null;
  treatmentPlanItems: TreatmentPlanItem[];
  sequencedItems: SequencedTreatmentPlanItem[];
  mediaItems: MediaItem[];
}

export function WorkspaceTabs({
  patientId,
  patientName,
  toothConditions,
  toothOverlays,
  bridges,
  bridgeTeeth,
  procedures,
  perioMeasurements,
  perioStatuses,
  treatmentPlanId,
  treatmentPlanItems,
  sequencedItems,
  mediaItems,
}: WorkspaceTabsProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { setInfo } = useHeaderInfo();

  const rawTab = searchParams.get("tab");
  const activeTab = rawTab && rawTab in TAB_LABEL ? rawTab : "chart";

  // Mirrors the active tab into the URL (so reload/back-button keep it) and
  // into the sticky app header (so the patient + tab stay visible once
  // you've scrolled past this page's own tab bar).
  useEffect(() => {
    setInfo({ patientName, tabLabel: TAB_LABEL[activeTab] });
    return () => setInfo(null);
  }, [patientName, activeTab, setInfo]);

  function handleTabChange(next: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", next);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }

  const [planId, setPlanId] = useState(treatmentPlanId);
  const [boardItems, setBoardItems] = useState<BoardItem[]>(() =>
    buildBoardItems(treatmentPlanItems, sequencedItems),
  );

  // Chart state is lifted up here (rather than owned inside Odontogram) since
  // both the Chart tab (existing-layer painting) and the kanban's add-
  // procedure dialog (which draws the proposed-layer graphic) need to read
  // and patch it. The kanban is authoritative - these are optimistic
  // mirrors of what addKanbanProcedure/removeKanbanItem write server-side.
  const [chartState, setChartState] = useState<ChartState>(() => buildChartState(toothConditions));
  const [overlayState, setOverlayState] = useState<OverlayState>(() => buildOverlayState(toothOverlays));
  const [chartBridges, setChartBridges] = useState<BridgeInfo[]>(() => buildBridgeInfos(bridges, bridgeTeeth));

  const [isSavingBoard, startBoardSave] = useTransition();

  // Read via ref inside async callbacks so they can stay referentially
  // stable instead of re-subscribing every time planId resolves.
  const planIdRef = useRef(planId);
  useEffect(() => {
    planIdRef.current = planId;
  }, [planId]);

  function patchChartStateForAdd(input: KanbanAddInput, bridgeChartKey: string | undefined) {
    if (input.kind === "surface") {
      setChartState((prev) => {
        const tooth = prev[input.toothNumber] ?? { surfaces: {}, whole: {} };
        const nextSurfaces = { ...tooth.surfaces };
        for (const surface of input.surfaces) {
          nextSurfaces[surface] = { ...nextSurfaces[surface], proposed: input.conditionId };
        }
        return { ...prev, [input.toothNumber]: { ...tooth, surfaces: nextSurfaces } };
      });
    } else if (input.kind === "whole") {
      setChartState((prev) => {
        const tooth = prev[input.toothNumber] ?? { surfaces: {}, whole: {} };
        return {
          ...prev,
          [input.toothNumber]: { ...tooth, whole: { ...tooth.whole, proposed: input.conditionId } },
        };
      });
    } else if (input.kind === "overlay") {
      setOverlayState((prev) => {
        const tooth = { ...(prev[input.toothNumber] ?? {}) };
        const overlayType = input.conditionId as OverlayType;
        tooth[overlayType] = { ...tooth[overlayType], proposed: true };
        return { ...prev, [input.toothNumber]: tooth };
      });
    } else if (input.kind === "bridge" && bridgeChartKey) {
      const bridgeId = bridgeIdFromChartKey(bridgeChartKey);
      const bridgeType: BridgeType = input.conditionId === "implant_bridge" ? "implant" : "tooth";
      setChartBridges((prev) => [...prev, { id: bridgeId, layer: "proposed", bridgeType, teeth: input.teeth }]);
    }
  }

  function stripChartGraphic(chartKey: string, surfaceAbbreviations: string[]) {
    if (chartKey.startsWith("bridge-")) {
      const bridgeId = bridgeIdFromChartKey(chartKey);
      setChartBridges((prev) => prev.filter((b) => b.id !== bridgeId));
      return;
    }

    const dashIndex = chartKey.indexOf("-");
    const toothNumber = Number(chartKey.slice(0, dashIndex));
    const conditionId = chartKey.slice(dashIndex + 1) as ConditionId;
    const conditionDef = CONDITIONS.find((c) => c.id === conditionId);
    if (!conditionDef || Number.isNaN(toothNumber)) return;

    if (conditionDef.target === "overlay") {
      setOverlayState((prev) => {
        const tooth = { ...(prev[toothNumber] ?? {}) };
        const overlayType = conditionId as OverlayType;
        tooth[overlayType] = { ...tooth[overlayType], proposed: false };
        return { ...prev, [toothNumber]: tooth };
      });
    } else if (conditionDef.target === "whole") {
      setChartState((prev) => {
        const tooth = prev[toothNumber];
        if (!tooth) return prev;
        return { ...prev, [toothNumber]: { ...tooth, whole: { ...tooth.whole, proposed: undefined } } };
      });
    } else if (conditionDef.target === "surface") {
      setChartState((prev) => {
        const tooth = prev[toothNumber];
        if (!tooth) return prev;
        const nextSurfaces = { ...tooth.surfaces };
        for (const abbr of surfaceAbbreviations) {
          const surface = SURFACE_BY_ABBREVIATION[abbr];
          if (surface && nextSurfaces[surface]) {
            nextSurfaces[surface] = { ...nextSurfaces[surface], proposed: undefined };
          }
        }
        return { ...prev, [toothNumber]: { ...tooth, surfaces: nextSurfaces } };
      });
    }
  }

  function handleAddKanban(input: KanbanAddInput) {
    startBoardSave(async () => {
      const { planId: resolvedPlanId, items } = await addKanbanProcedure(patientId, planIdRef.current, input);
      setPlanId(resolvedPlanId);
      setBoardItems((prev) => [
        ...prev,
        ...items.map((item) => ({
          id: item.id,
          procedureId: item.procedureId,
          adaCode: item.adaCode,
          description: item.description,
          fee: item.fee,
          appointmentNumber: null,
          chartKey: item.chartKey,
          toothNumber: item.toothNumber,
          surfaces: item.surfaces,
        })),
      ]);
      patchChartStateForAdd(input, items[0]?.chartKey);
    });
  }

  function handleAddManual(procedure: Procedure, toothNumber?: number) {
    startBoardSave(async () => {
      const { planId: resolvedPlanId, item } = await addProcedureToPlan(
        patientId,
        planIdRef.current,
        procedure.id,
        toothNumber,
      );
      setPlanId(resolvedPlanId);
      setBoardItems((prev) => [
        ...prev,
        {
          id: item.id,
          procedureId: procedure.id,
          adaCode: procedure.ada_code,
          description: procedure.description,
          fee: procedure.fee,
          appointmentNumber: null,
          chartKey: null,
          toothNumber: toothNumber ?? null,
          surfaces: [],
        },
      ]);
    });
  }

  function handleRemove(itemId: string) {
    const item = boardItems.find((i) => i.id === itemId);
    const chartKey = item?.chartKey ?? null;

    if (chartKey?.startsWith("bridge-")) {
      // A bridge is one clinical unit - removing any of its teeth removes
      // every tooth's card, matching removeKanbanItem's server-side behavior.
      const prefix = `bridge-${bridgeIdFromChartKey(chartKey)}-`;
      setBoardItems((prev) => prev.filter((i) => !i.chartKey?.startsWith(prefix)));
      stripChartGraphic(chartKey, []);
    } else {
      setBoardItems((prev) => prev.filter((i) => i.id !== itemId));
      if (chartKey) stripChartGraphic(chartKey, item!.surfaces);
    }

    startBoardSave(async () => {
      await removeKanbanItem(patientId, itemId);
    });
  }

  function handleFeeChange(itemId: string, fee: number) {
    setBoardItems((prev) => prev.map((item) => (item.id === itemId ? { ...item, fee } : item)));
    startBoardSave(async () => {
      await updatePlanItemFee(patientId, itemId, fee);
    });
  }

  function handleMove(itemId: string, appointmentNumber: number | null) {
    const currentPlanId = planIdRef.current;
    if (!currentPlanId) return;
    setBoardItems((prev) =>
      prev.map((item) => (item.id === itemId ? { ...item, appointmentNumber } : item)),
    );
    startBoardSave(async () => {
      await scheduleItem(patientId, currentPlanId, itemId, appointmentNumber);
    });
  }

  return (
    <Tabs value={activeTab} onValueChange={handleTabChange}>
      <TabsList>
        <TabsTrigger value="chart">Chart</TabsTrigger>
        <TabsTrigger value="perio">Perio</TabsTrigger>
        <TabsTrigger value="sequence">Sequence</TabsTrigger>
        <TabsTrigger value="media">Photos</TabsTrigger>
      </TabsList>
      <TabsContent value="chart" className="pt-4">
        <Odontogram
          patientId={patientId}
          chartState={chartState}
          overlayState={overlayState}
          bridges={chartBridges}
          onChartStateChange={setChartState}
          onOverlayStateChange={setOverlayState}
          onBridgesChange={setChartBridges}
          photoTeeth={toothsWithPhotos(mediaItems)}
        />
      </TabsContent>
      <TabsContent value="perio" className="pt-4">
        <PerioGrid
          patientId={patientId}
          initialMeasurements={perioMeasurements}
          initialStatuses={perioStatuses}
        />
      </TabsContent>
      <TabsContent value="sequence" className="pt-4">
        <VisitBoard
          patientId={patientId}
          items={boardItems}
          procedures={procedures}
          isSaving={isSavingBoard}
          onAddManual={handleAddManual}
          onAddKanban={handleAddKanban}
          onRemove={handleRemove}
          onMove={handleMove}
          onFeeChange={handleFeeChange}
        />
      </TabsContent>
      <TabsContent value="media" className="pt-4">
        <MediaGallery patientId={patientId} initialItems={mediaItems} />
      </TabsContent>
    </Tabs>
  );
}
