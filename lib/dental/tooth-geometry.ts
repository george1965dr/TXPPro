import type { BridgeRole, ToothSurface } from "@/lib/types";

/**
 * Classic 5-zone dental surface diagram: an outer 44x44 square with a
 * 12x12 center square (occlusal/incisal), connected corner-to-corner to
 * form a trapezoid on each side for the remaining four surfaces.
 */
export const SURFACE_ORDER: ToothSurface[] = ["facial", "distal", "occlusal", "mesial", "lingual"];

export const SURFACE_ZONE_POINTS: Record<ToothSurface, string> = {
  facial: "0,0 44,0 28,16 16,16",
  distal: "44,0 44,44 28,28 28,16",
  lingual: "44,44 0,44 16,28 28,28",
  mesial: "0,44 0,0 16,16 16,28",
  occlusal: "16,16 28,16 28,28 16,28",
};

export const SURFACE_LABEL_POSITION: Record<ToothSurface, { x: number; y: number }> = {
  facial: { x: 22, y: 10 },
  distal: { x: 34, y: 22 },
  lingual: { x: 22, y: 37 },
  mesial: { x: 9, y: 22 },
  occlusal: { x: 22, y: 22 },
};

export const SURFACE_ABBREVIATION: Record<ToothSurface, string> = {
  facial: "F",
  distal: "D",
  occlusal: "O",
  mesial: "M",
  lingual: "L",
};

// "I" (incisal) is the anterior-tooth spelling of the occlusal zone used by
// surfaceComboLabel below - both letters resolve back to "occlusal".
export const SURFACE_BY_ABBREVIATION: Record<string, ToothSurface> = {
  ...Object.fromEntries(Object.entries(SURFACE_ABBREVIATION).map(([surface, abbr]) => [abbr, surface as ToothSurface])),
  I: "occlusal",
};

/** Universal numbering 1-32. Molars are the teeth that can show furcation. */
export const MOLAR_TEETH = new Set([1, 2, 3, 14, 15, 16, 17, 18, 19, 30, 31, 32]);
export const PREMOLAR_TEETH = new Set([4, 5, 12, 13, 20, 21, 28, 29]);

export const UPPER_ARCH = Array.from({ length: 16 }, (_, i) => i + 1); // 1-16
export const LOWER_ARCH = Array.from({ length: 16 }, (_, i) => 32 - i); // 32-17

/** 0 = upper arch (teeth 1-16), 1 = lower arch (17-32). Bridges can't span both. */
export function archOf(toothNumber: number): 0 | 1 {
  return toothNumber <= 16 ? 0 : 1;
}

export interface BridgeRangeTooth {
  toothNumber: number;
  role: BridgeRole;
}

/**
 * Resolves a bridge's full teeth list (abutments at the two ends, pontics
 * in between) from its first and last tooth. `pierAbutments` marks any
 * interior teeth that are also abutments (e.g. a natural tooth or implant
 * between two pontics, as in a #2-#4-#6 bridge) rather than pontics.
 * Returns null for an invalid pair - the same tooth twice, or one spanning
 * both arches.
 */
export function resolveBridgeRange(
  firstTooth: number,
  secondTooth: number,
  pierAbutments: number[] = [],
): BridgeRangeTooth[] | null {
  if (firstTooth === secondTooth || archOf(firstTooth) !== archOf(secondTooth)) return null;

  const start = Math.min(firstTooth, secondTooth);
  const end = Math.max(firstTooth, secondTooth);
  const piers = new Set(pierAbutments);
  const teeth: BridgeRangeTooth[] = [];
  for (let n = start; n <= end; n++) {
    const isAbutment = n === start || n === end || piers.has(n);
    teeth.push({ toothNumber: n, role: isAbutment ? "abutment" : "pontic" });
  }
  return teeth;
}

export type ToothPosition = "anterior" | "premolar" | "molar";

/** Drives position-dependent CDT codes (e.g. root canal fee differs by position). */
export function toothPosition(toothNumber: number): ToothPosition {
  if (MOLAR_TEETH.has(toothNumber)) return "molar";
  if (PREMOLAR_TEETH.has(toothNumber)) return "premolar";
  return "anterior";
}

/**
 * Standard dental shorthand for a multi-surface restoration (MOD, DO, MI,
 * DL, etc.) - this is idiomatic terminology, not derivable from one fixed
 * alphabetical or anatomical ordering rule (MOD needs O between M and D,
 * but DO needs D before O with no M present). The actual rule: whichever
 * single proximal surface (mesial or distal) is present leads; if both are
 * present, mesial leads and distal trails with occlusal/incisal sandwiched
 * between them; facial and lingual always come last, in that order.
 * Anterior teeth use "I" (incisal) in place of "O" (occlusal).
 */
export function surfaceComboLabel(surfaces: ToothSurface[], toothNumber: number): string {
  const occlusalLetter = toothPosition(toothNumber) === "anterior" ? "I" : "O";
  const has = (s: ToothSurface) => surfaces.includes(s);
  const hasMesial = has("mesial");
  const hasDistal = has("distal");
  const hasOcclusal = has("occlusal");

  const parts: string[] = [];
  if (hasMesial) parts.push("M");
  if (hasMesial && hasDistal) {
    if (hasOcclusal) parts.push(occlusalLetter);
    parts.push("D");
  } else {
    if (hasOcclusal) parts.push(occlusalLetter);
    if (hasDistal) parts.push("D");
  }
  if (has("facial")) parts.push("F");
  if (has("lingual")) parts.push("L");

  return parts.join("");
}
