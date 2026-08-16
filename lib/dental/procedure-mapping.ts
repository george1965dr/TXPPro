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

const FILLING_CODES_BY_SURFACE_COUNT: Record<number, string> = {
  1: "D2391",
  2: "D2392",
  3: "D2393",
  4: "D2394", // also used for 4+ surfaces
}

const WHOLE_TOOTH_CODES: Record<WholeToothCondition, string> = {
  crown: "D2740",
  implant: "D6010",
  missing: "D7140", // "missing" is existing-only (see conditions.ts) - proposing removal uses "extraction" instead
  extraction: "D7140",
}

const VENEER_CODE = "D2962"
const INLAY_CODE = "D2650" // 1-2 surfaces
const ONLAY_CODE = "D2664" // 3+ surfaces

const BRIDGE_RETAINER_CODES: Record<BridgeType, string> = {
  tooth: "D6750", // retainer crown, tooth-supported
  implant: "D6068", // abutment supported retainer crown, implant-supported
}
const BRIDGE_PONTIC_CODE = "D6240"

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

export function adaCodeForFilling(surfaceCount: number): string {
  const tier = Math.min(surfaceCount, 4)
  return FILLING_CODES_BY_SURFACE_COUNT[tier]
}

export function adaCodeForVeneer(): string {
  return VENEER_CODE
}

export function adaCodeForInlayOnlay(surfaceCount: number): string {
  return surfaceCount <= 2 ? INLAY_CODE : ONLAY_CODE
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
