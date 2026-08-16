export type ConditionId =
  // filling
  | "caries"
  | "filling"
  // prosthodontic
  | "crown"
  | "inlay_onlay"
  | "veneer"
  | "bridge"
  | "implant_bridge"
  // endodontic
  | "root_canal"
  | "retreatment"
  | "apicoectomy"
  | "periapical_lesion"
  // surgical
  | "implant"
  | "missing"
  | "extraction"
  | "bone_graft"
  | "soft_tissue_graft"
  | "sinus_lift"
  | "cyst_removal"
  // pathology
  | "biopsy"
  | "soft_tissue_lesion"
  | "impacted"
  | "fracture"
  | "cyst"
  // universal
  | "erase";

export type ConditionGroup = "operative" | "prosthodontic" | "endodontic" | "surgical" | "pathology";

/**
 * Where a condition applies and how it's stored:
 * - "surface": one of the 5 surface zones, mutually exclusive per zone (tooth_conditions)
 * - "whole": the tooth's single cap state, mutually exclusive (tooth_conditions, surface='whole')
 * - "overlay": a non-exclusive whole-tooth flag - a tooth can have several at once (tooth_overlays)
 * - "bridge": its own multi-tooth click flow, not a single paint action
 */
export type ConditionTarget = "surface" | "whole" | "overlay" | "bridge";

export interface ConditionDef {
  id: ConditionId;
  label: string;
  target: ConditionTarget;
  group: ConditionGroup | null; // null for erase, which stands alone
  /**
   * Findings that describe the current state of a tooth (a diagnosis) can
   * never be "proposed" - you don't plan to give a patient a fracture. Only
   * actual treatments are valid in both layers.
   */
  existingOnly?: boolean;
  /**
   * Procedures that leave nothing to chart once healed/completed (a biopsy
   * site, an extraction) - or that this practice simply never charts as a
   * pre-existing finding - so they're hidden from the odontogram's Existing
   * picker but stay fully available to propose from the kanban.
   */
  proposedOnly?: boolean;
}

export const CONDITIONS: ConditionDef[] = [
  { id: "caries", label: "Caries", target: "surface", group: "operative", existingOnly: true },
  { id: "filling", label: "Filling", target: "surface", group: "operative" },

  { id: "crown", label: "Crown", target: "whole", group: "prosthodontic" },
  { id: "inlay_onlay", label: "Inlay / onlay", target: "surface", group: "prosthodontic" },
  { id: "veneer", label: "Veneer", target: "surface", group: "prosthodontic" },
  { id: "bridge", label: "Bridge", target: "bridge", group: "prosthodontic" },
  { id: "implant_bridge", label: "Implant-retained bridge", target: "bridge", group: "prosthodontic" },

  { id: "root_canal", label: "Root canal", target: "overlay", group: "endodontic" },
  { id: "retreatment", label: "Retreatment", target: "overlay", group: "endodontic" },
  { id: "apicoectomy", label: "Apicoectomy", target: "overlay", group: "endodontic" },
  {
    id: "periapical_lesion",
    label: "Periapical lesion",
    target: "overlay",
    group: "endodontic",
    existingOnly: true,
  },

  { id: "implant", label: "Implant placement", target: "whole", group: "surgical", proposedOnly: true },
  { id: "missing", label: "Missing", target: "whole", group: "surgical", existingOnly: true },
  { id: "extraction", label: "Extraction", target: "whole", group: "surgical", proposedOnly: true },
  { id: "bone_graft", label: "Bone graft", target: "overlay", group: "surgical" },
  { id: "soft_tissue_graft", label: "Soft tissue graft", target: "overlay", group: "surgical" },
  { id: "sinus_lift", label: "Sinus lift", target: "overlay", group: "surgical" },
  { id: "cyst_removal", label: "Cyst removal", target: "overlay", group: "surgical" },

  { id: "biopsy", label: "Biopsy", target: "overlay", group: "pathology", proposedOnly: true },
  {
    id: "soft_tissue_lesion",
    label: "Soft tissue lesion",
    target: "overlay",
    group: "pathology",
    existingOnly: true,
  },
  { id: "impacted", label: "Impaction", target: "overlay", group: "pathology", existingOnly: true },
  { id: "fracture", label: "Fracture", target: "overlay", group: "pathology", existingOnly: true },
  { id: "cyst", label: "Cyst", target: "overlay", group: "pathology", existingOnly: true },

  { id: "erase", label: "Erase", target: "surface", group: null },
];

export const CONDITION_GROUP_LABEL: Record<ConditionGroup, string> = {
  operative: "Operative",
  prosthodontic: "Prosthodontic",
  endodontic: "Endodontic",
  surgical: "Surgical",
  pathology: "Pathology",
};

export const CONDITION_GROUP_ORDER: ConditionGroup[] = [
  "operative",
  "prosthodontic",
  "endodontic",
  "surgical",
  "pathology",
];

/** Findings that document a diagnosis rather than a procedure - never generate a treatment-plan line item. */
export const NON_BILLABLE_OVERLAYS = new Set([
  "periapical_lesion",
  "fracture",
  "impacted",
  "soft_tissue_lesion",
  "cyst",
]);
