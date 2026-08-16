import { ALL_SITES } from "@/lib/dental/perio";
import type { PeriodontalMeasurement, PerioSite, ToothPerioStatus } from "@/lib/types";

export interface SiteValues {
  probing_depth: number;
  recession: number;
  bleeding_on_probing: boolean;
}

export type PerioMeasurementState = Record<number, Partial<Record<PerioSite, SiteValues>>>;
export type PerioStatusState = Record<number, { mobility: number; furcation: number | null }>;

const EMPTY_SITE: SiteValues = { probing_depth: 0, recession: 0, bleeding_on_probing: false };

export function buildMeasurementState(rows: PeriodontalMeasurement[]): PerioMeasurementState {
  const state: PerioMeasurementState = {};
  for (const row of rows) {
    if (!state[row.tooth_number]) state[row.tooth_number] = {};
    state[row.tooth_number][row.site] = {
      probing_depth: row.probing_depth ?? 0,
      recession: row.recession ?? 0,
      bleeding_on_probing: row.bleeding_on_probing,
    };
  }
  return state;
}

export function buildStatusState(rows: ToothPerioStatus[]): PerioStatusState {
  const state: PerioStatusState = {};
  for (const row of rows) {
    state[row.tooth_number] = { mobility: row.mobility, furcation: row.furcation };
  }
  return state;
}

export function siteValues(state: PerioMeasurementState, tooth: number, site: PerioSite): SiteValues {
  return state[tooth]?.[site] ?? EMPTY_SITE;
}

export function maxCal(state: PerioMeasurementState, tooth: number): number {
  let max = 0;
  for (const site of ALL_SITES) {
    const v = siteValues(state, tooth, site);
    max = Math.max(max, v.probing_depth + v.recession);
  }
  return max;
}

export function toothStatus(state: PerioStatusState, tooth: number): { mobility: number; furcation: number | null } {
  return state[tooth] ?? { mobility: 0, furcation: null };
}
