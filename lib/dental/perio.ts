import type { PerioSite } from "@/lib/types";

/** Sites trace a continuous path around the tooth: facial distal→mesial, then lingual mesial→distal. */
export const FACIAL_SITES: PerioSite[] = ["DB", "B", "MB"];
export const LINGUAL_SITES: PerioSite[] = ["ML", "L", "DL"];
export const ALL_SITES: PerioSite[] = [...FACIAL_SITES, ...LINGUAL_SITES];

/** Order sites are called out when circling back along the lingual surface (distal→mesial), reversing LINGUAL_SITES. */
const LINGUAL_TAB_SITES: PerioSite[] = [...LINGUAL_SITES].reverse();

export interface PerioTabStop {
  tooth: number;
  site: PerioSite;
}

/**
 * Full-mouth tab order for a single arch, matching how an assistant calls out
 * numbers: facial surface tooth-by-tooth across the arch (DB, B, MB), then
 * reversing direction back across the arch on the lingual surface (DL, L, ML).
 * The bleeding-on-probing toggle is never part of this sequence.
 */
export function buildPerioTabSequence(teethAscending: number[]): PerioTabStop[] {
  const facial = teethAscending.flatMap((tooth) => FACIAL_SITES.map((site) => ({ tooth, site })));
  const lingual = [...teethAscending]
    .reverse()
    .flatMap((tooth) => LINGUAL_TAB_SITES.map((site) => ({ tooth, site })));
  return [...facial, ...lingual];
}

export function pdSeverity(value: number): "normal" | "watch" | "significant" {
  if (value >= 6) return "significant";
  if (value >= 4) return "watch";
  return "normal";
}

export function recessionSeverity(value: number): "normal" | "watch" | "significant" {
  if (value >= 4) return "significant";
  if (value >= 2) return "watch";
  return "normal";
}

export function calSeverity(value: number): "normal" | "watch" | "significant" {
  if (value >= 7) return "significant";
  if (value >= 5) return "watch";
  return "normal";
}
