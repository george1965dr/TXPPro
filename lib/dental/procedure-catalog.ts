import type { ConditionId } from "@/lib/dental/conditions";
import {
  adaCodeForBridgeRetainer,
  adaCodeForFilling,
  adaCodeForInlay,
  adaCodeForOnlay,
  adaCodeForOverlay,
  adaCodeForVeneer,
  adaCodeForWholeTooth,
} from "@/lib/dental/procedure-mapping";
import type { ToothPosition } from "@/lib/dental/tooth-geometry";
import type { OverlayType } from "@/lib/types";

/**
 * Reverse of procedure-mapping.ts: given an ada_code picked from the flat
 * procedure catalog, what tooth input does adding it need, and which
 * condition/chart graphic does it draw? Built once from the same handful of
 * mapping functions the forward (condition -> code) direction already uses,
 * so the two can never drift. A code with no entry here isn't part of the
 * clinical chart taxonomy (an exam, a cleaning, a sealant) - AddProcedureDialog
 * falls back to the procedure's own `tooth_required` flag for those.
 */
export type CatalogEntry =
  | { conditionId: ConditionId; toothMode: "whole" }
  | { conditionId: ConditionId; toothMode: "overlay"; expectedPosition?: ToothPosition }
  | {
      conditionId: ConditionId;
      toothMode: "surface";
      minSurfaces: number;
      maxSurfaces: number | null;
      // "posterior" covers both premolar and molar - CDT doesn't split composite
      // filling fees any finer than anterior/posterior.
      expectedPosition?: ToothPosition | "posterior";
    }
  | { conditionId: ConditionId; toothMode: "bridge" };

const POSITIONS: ToothPosition[] = ["anterior", "premolar", "molar"];
const FLAT_OVERLAYS: OverlayType[] = ["bone_graft", "soft_tissue_graft", "sinus_lift", "cyst_removal", "biopsy", "gtr"];
const POSITION_OVERLAYS: OverlayType[] = ["root_canal", "retreatment", "apicoectomy"];

function buildCatalog(): Map<string, CatalogEntry> {
  const map = new Map<string, CatalogEntry>();

  map.set(adaCodeForWholeTooth("crown"), { conditionId: "crown", toothMode: "whole" });
  map.set(adaCodeForWholeTooth("implant"), { conditionId: "implant", toothMode: "whole" });
  map.set(adaCodeForWholeTooth("extraction"), { conditionId: "extraction", toothMode: "whole" });

  for (let n = 1; n <= 4; n++) {
    map.set(adaCodeForFilling(n, "molar"), {
      conditionId: "filling",
      toothMode: "surface",
      minSurfaces: n,
      maxSurfaces: n === 4 ? null : n,
      expectedPosition: "posterior",
    });
    map.set(adaCodeForFilling(n, "anterior"), {
      conditionId: "filling",
      toothMode: "surface",
      minSurfaces: n,
      maxSurfaces: n === 4 ? null : n,
      expectedPosition: "anterior",
    });
  }
  map.set(adaCodeForVeneer(), { conditionId: "veneer", toothMode: "surface", minSurfaces: 1, maxSurfaces: null });

  for (let n = 1; n <= 3; n++) {
    map.set(adaCodeForInlay(n), {
      conditionId: "inlay",
      toothMode: "surface",
      minSurfaces: n,
      maxSurfaces: n === 3 ? null : n,
    });
  }
  for (let n = 2; n <= 4; n++) {
    map.set(adaCodeForOnlay(n), {
      conditionId: "onlay",
      toothMode: "surface",
      minSurfaces: n,
      maxSurfaces: n === 4 ? null : n,
    });
  }
  // D2544 (metallic, 4+ surfaces) bills the same 4+ surface onlay as D2644
  // (porcelain/ceramic) - a material variant of the same tier, not derivable
  // from adaCodeForOnlay since that only returns the ceramic default.
  map.set("D2544", { conditionId: "onlay", toothMode: "surface", minSurfaces: 4, maxSurfaces: null });

  for (const overlay of FLAT_OVERLAYS) {
    const code = adaCodeForOverlay(overlay, "anterior");
    if (code) map.set(code, { conditionId: overlay as ConditionId, toothMode: "overlay" });
  }

  for (const overlay of POSITION_OVERLAYS) {
    for (const position of POSITIONS) {
      const code = adaCodeForOverlay(overlay, position);
      if (code) map.set(code, { conditionId: overlay as ConditionId, toothMode: "overlay", expectedPosition: position });
    }
  }

  map.set(adaCodeForBridgeRetainer("tooth"), { conditionId: "bridge", toothMode: "bridge" });
  map.set(adaCodeForBridgeRetainer("implant"), { conditionId: "implant_bridge", toothMode: "bridge" });

  return map;
}

export const PROCEDURE_CATALOG = buildCatalog();
