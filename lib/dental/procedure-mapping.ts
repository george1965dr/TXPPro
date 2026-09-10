import { NON_BILLABLE_OVERLAYS } from "@/lib/dental/conditions"
import type { BridgeType, OverlayType, SurfaceCondition, WholeToothCondition } from "@/lib/types"
import type { ToothPosition } from "@/lib/dental/tooth-geometry"

/**
 * Maps a charted condition to the ADA code that should be looked up in the
 * `procedures` table for its fee. This is static reference data (CDT codes),
 * not something a doctor edits day-to-day - a hardcoded table is simpler to
 * reason about than a DB-backed rules engine for something that rarely changes.
 *
 * PLACEHOLDER CODES: these default to common composite-resin restoration
 * codes and single representative codes per procedure family. Confirm
 * against the practice's real fee schedule before relying on generated fees.
 */

const POSTERIOR_FILLING_CODES_BY_SURFACE_COUNT: Record<number, string> = {
  1: "D2391",
  2: "D2392",
  3: "D2393",
  4: "D2394", // also used for 4+ surfaces
}

const ANTERIOR_FILLING_CODES_BY_SURFACE_COUNT: Record<number, string> = {
  1: "D2330",
  2: "D2331",
  3: "D2332",
  4: "D2335", // also used for 4+ surfaces
}

const WHOLE_TOOTH_CODES: Record<WholeToothCondition, string> = {
  crown: "D2740",
  implant: "D6010",
  missing: "D7140", // "missing" is existing-only (see conditions.ts) - proposing removal uses "extraction" instead
  extraction: "D7140",
}

const VENEER_CODE = "D2962"

// Inlay and onlay are separate procedures, not a single one split by surface
// count - they overlap on the same counts (e.g. a 2-surface inlay and a
// 2-surface onlay are different codes/fees), so each needs its own table.
const INLAY_CODES_BY_SURFACE_COUNT: Record<number, string> = {
  1: "D2610",
  2: "D2620",
  3: "D2630", // also used for 3+ surfaces
}
const ONLAY_CODES_BY_SURFACE_COUNT: Record<number, string> = {
  2: "D2642", // also used for <=2 surfaces - an onlay caps at least one cusp
  3: "D2643",
  4: "D2644", // also used for 4+ surfaces
}

const BRIDGE_RETAINER_CODES: Record<BridgeType, string> = {
  tooth: "D6740", // retainer crown, porcelain/ceramic, tooth-supported
  implant: "D6075", // implant supported retainer for ceramic FPD
}
const BRIDGE_PONTIC_CODE = "D6245"

/** Root canal / retreatment / apicoectomy fees differ by tooth position (CDT convention). */
const ROOT_CANAL_CODES: Record<ToothPosition, string> = {
  anterior: "D3310",
  premolar: "D3320",
  molar: "D3330",
}
const RETREATMENT_CODES: Record<ToothPosition, string> = {
  anterior: "D3346",
  premolar: "D3347",
  molar: "D3348",
}
const APICOECTOMY_CODES: Record<ToothPosition, string> = {
  anterior: "D3410",
  premolar: "D3421",
  molar: "D3425",
}

/** Overlays whose fee doesn't depend on tooth position - one code regardless of anterior/premolar/molar. */
const FLAT_OVERLAY_CODES: Partial<Record<OverlayType, string>> = {
  bone_graft: "D7953",
  soft_tissue_graft: "D4273",
  sinus_lift: "D7951",
  cyst_removal: "D7450",
  biopsy: "D7286",
  gtr: "D4266",
}

const POSITION_BASED_OVERLAY_CODES: Partial<Record<OverlayType, Record<ToothPosition, string>>> = {
  root_canal: ROOT_CANAL_CODES,
  retreatment: RETREATMENT_CODES,
  apicoectomy: APICOECTOMY_CODES,
}

/** Caries is a diagnostic finding, not a billable procedure on its own. */
const NON_BILLABLE_CONDITIONS: SurfaceCondition[] = ["caries"]

export function isBillableSurfaceCondition(condition: SurfaceCondition): boolean {
  return !NON_BILLABLE_CONDITIONS.includes(condition)
}

export function isBillableOverlay(overlayType: OverlayType): boolean {
  return !NON_BILLABLE_OVERLAYS.has(overlayType)
}

export function adaCodeForFilling(surfaceCount: number, position: ToothPosition): string {
  const tier = Math.min(surfaceCount, 4)
  const table = position === "anterior" ? ANTERIOR_FILLING_CODES_BY_SURFACE_COUNT : POSTERIOR_FILLING_CODES_BY_SURFACE_COUNT
  return table[tier]
}

export function adaCodeForVeneer(): string {
  return VENEER_CODE
}

export function adaCodeForInlay(surfaceCount: number): string {
  const tier = Math.min(Math.max(surfaceCount, 1), 3)
  return INLAY_CODES_BY_SURFACE_COUNT[tier]
}

/** An onlay caps at least one cusp - clinically never a 1-surface restoration, so the smallest tier is 2. */
export function adaCodeForOnlay(surfaceCount: number): string {
  const tier = Math.min(Math.max(surfaceCount, 2), 4)
  return ONLAY_CODES_BY_SURFACE_COUNT[tier]
}

export function adaCodeForWholeTooth(condition: WholeToothCondition): string {
  return WHOLE_TOOTH_CODES[condition]
}

/** Returns null for findings-only overlays (periapical lesion, fracture, impacted, cyst, soft tissue lesion). */
export function adaCodeForOverlay(overlayType: OverlayType, position: ToothPosition): string | null {
  const positionTable = POSITION_BASED_OVERLAY_CODES[overlayType]
  if (positionTable) return positionTable[position]
  return FLAT_OVERLAY_CODES[overlayType] ?? null
}

export function adaCodeForBridgeRetainer(bridgeType: BridgeType): string {
  return BRIDGE_RETAINER_CODES[bridgeType]
}

export function adaCodeForBridgePontic(): string {
  return BRIDGE_PONTIC_CODE
}
