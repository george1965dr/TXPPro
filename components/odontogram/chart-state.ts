import type {
  BridgeRole,
  BridgeType,
  ChartLayer,
  OverlayType,
  ToothCondition,
  ToothOverlay,
  ToothSurface,
} from "@/lib/types";

/**
 * Existing and proposed are stored independently per slot, never merged -
 * a surface can carry a failed existing filling AND a newly proposed one
 * at the same time without either overwriting the other. Which one is
 * visible/editable is purely a display concern (the active view), not a
 * data concern.
 */
export interface LayeredValue {
  existing?: string;
  proposed?: string;
}

export interface ToothChartState {
  surfaces: Partial<Record<ToothSurface, LayeredValue>>;
  whole: LayeredValue;
}

export type ChartState = Record<number, ToothChartState>;

export interface LayeredFlag {
  existing?: boolean;
  proposed?: boolean;
}

export type OverlayState = Record<number, Partial<Record<OverlayType, LayeredFlag>>>;

export interface BridgeInfo {
  id: string;
  layer: ChartLayer;
  bridgeType: BridgeType;
  teeth: { toothNumber: number; role: BridgeRole }[];
}

function emptyTooth(): ToothChartState {
  return { surfaces: {}, whole: {} };
}

export function buildChartState(rows: ToothCondition[]): ChartState {
  const state: ChartState = {};

  for (const row of rows) {
    if (!state[row.tooth_number]) state[row.tooth_number] = emptyTooth();
    const tooth = state[row.tooth_number];

    if (row.surface === "whole") {
      tooth.whole[row.layer] = row.condition_type;
    } else {
      const surface = row.surface as ToothSurface;
      if (!tooth.surfaces[surface]) tooth.surfaces[surface] = {};
      tooth.surfaces[surface]![row.layer] = row.condition_type;
    }
  }

  return state;
}

export function buildOverlayState(rows: ToothOverlay[]): OverlayState {
  const state: OverlayState = {};
  for (const row of rows) {
    if (!state[row.tooth_number]) state[row.tooth_number] = {};
    const tooth = state[row.tooth_number];
    if (!tooth[row.overlay_type]) tooth[row.overlay_type] = {};
    tooth[row.overlay_type]![row.layer] = true;
  }
  return state;
}

export function buildBridgeInfos(
  bridges: { id: string; layer: ChartLayer; bridge_type: BridgeType }[],
  bridgeTeeth: { bridge_id: string; tooth_number: number; role: BridgeRole }[],
): BridgeInfo[] {
  return bridges.map((bridge) => ({
    id: bridge.id,
    layer: bridge.layer,
    bridgeType: bridge.bridge_type,
    teeth: bridgeTeeth
      .filter((t) => t.bridge_id === bridge.id)
      .map((t) => ({ toothNumber: t.tooth_number, role: t.role })),
  }));
}

/** Quick lookup for rendering: which bridge (if any) does this tooth belong to, among bridges in the given view. */
export function buildToothToBridge(
  bridges: BridgeInfo[],
  view: ChartLayer,
): Map<number, { bridge: BridgeInfo; role: BridgeRole }> {
  const map = new Map<number, { bridge: BridgeInfo; role: BridgeRole }>();
  for (const bridge of bridges) {
    if (bridge.layer !== view) continue;
    for (const t of bridge.teeth) {
      map.set(t.toothNumber, { bridge, role: t.role });
    }
  }
  return map;
}
