export interface Patient {
  id: string
  name: string
  birth_date: string
  email?: string
  medical_history?: string
  created_at: string
  updated_at: string
}

export interface Procedure {
  id: string
  ada_code: string
  description: string
  fee: number
  tooth_required: boolean
  created_at: string
  updated_at: string
}

export interface TreatmentPlan {
  id: string
  patient_id: string
  total_fee: number
  accepted_at?: string | null
  created_at: string
  updated_at: string
  patient?: Patient
  treatment_plan_items?: TreatmentPlanItem[]
}

export interface TreatmentPlanItem {
  id: string
  treatment_plan_id: string
  procedure_id: string
  quantity: number
  tooth_numbers?: string[]
  surfaces?: string[]
  /** Snapshotted at add-time (or later edited) - never derived from the live procedure fee. */
  fee: number
  chart_key?: string | null
  created_at: string
  procedure?: Procedure
}

export interface SequencedTreatmentPlan {
  id: string
  treatment_plan_id: string
  created_at: string
  updated_at: string
  treatment_plan?: TreatmentPlan
  sequenced_treatment_plan_items?: SequencedTreatmentPlanItem[]
}

export interface SequencedTreatmentPlanItem {
  id: string
  sequenced_treatment_plan_id: string
  treatment_plan_item_id: string
  appointment_number: number
  created_at: string
  treatment_plan_item?: TreatmentPlanItem
}

// --- Odontogram / charting ---

export type ChartLayer = "existing" | "proposed"

export type ToothSurface = "mesial" | "distal" | "occlusal" | "facial" | "lingual"

export type SurfaceCondition = "caries" | "filling" | "sealant" | "veneer" | "inlay_onlay"

export type WholeToothCondition = "crown" | "implant" | "missing" | "extraction"

export interface ToothCondition {
  id: string
  patient_id: string
  tooth_number: number
  surface: ToothSurface | "whole"
  condition_type: SurfaceCondition | WholeToothCondition
  layer: ChartLayer
  notes?: string
  created_at: string
  updated_at: string
}

/** Non-exclusive whole-tooth flags - a tooth can carry any combination of these at once. */
export type OverlayType =
  | "root_canal"
  | "retreatment"
  | "apicoectomy"
  | "periapical_lesion"
  | "fracture"
  | "impacted"
  | "bone_graft"
  | "soft_tissue_graft"
  | "sinus_lift"
  | "cyst_removal"
  | "biopsy"
  | "soft_tissue_lesion"
  | "cyst"

export interface ToothOverlay {
  id: string
  patient_id: string
  tooth_number: number
  layer: ChartLayer
  overlay_type: OverlayType
  notes?: string | null
  created_at: string
}

export type BridgeRole = "abutment" | "pontic"
export type BridgeType = "tooth" | "implant"

export interface Bridge {
  id: string
  patient_id: string
  layer: ChartLayer
  bridge_type: BridgeType
  created_at: string
  updated_at: string
}

export interface BridgeTooth {
  id: string
  bridge_id: string
  tooth_number: number
  role: BridgeRole
}

// --- Periodontal charting ---

export type PerioSite = "DB" | "B" | "MB" | "ML" | "L" | "DL"
export type PerioArch = "facial" | "lingual"

export interface PeriodontalMeasurement {
  id: string
  patient_id: string
  tooth_number: number
  site: PerioSite
  probing_depth?: number
  recession?: number
  bleeding_on_probing: boolean
  created_at: string
  updated_at: string
}

export interface ToothPerioStatus {
  id: string
  patient_id: string
  tooth_number: number
  mobility: number // 0-3
  furcation: number | null // 0-3, null if not applicable (non-molar)
  created_at: string
  updated_at: string
}

// --- Patient media (photos / whole-mouth video) ---

export type MediaType = "photo" | "video"

export interface PatientMedia {
  id: string
  patient_id: string
  type: MediaType
  tooth_number: number | null
  storage_path: string
  duration_seconds: number | null
  captured_at: string
  created_at: string
}
