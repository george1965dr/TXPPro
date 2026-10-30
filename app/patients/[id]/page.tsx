import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { WorkspaceTabs } from "@/components/patients/workspace-tabs";
import { fromRow } from "@/components/media/media-state";
import { EditPatientDialog } from "@/components/patients/edit-patient-dialog";
import { ArchivePatientButton } from "@/components/patients/archive-patient-button";
import { restorePatient } from "@/app/actions/patients";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import type {
  Bridge,
  BridgeTooth,
  Patient,
  PatientMedia,
  PeriodontalMeasurement,
  Procedure,
  SequencedTreatmentPlanItem,
  ToothCondition,
  ToothOverlay,
  ToothPerioStatus,
  TreatmentPlan,
  TreatmentPlanItem,
} from "@/lib/types";

const SIGNED_URL_TTL_SECONDS = 3600;

export default async function PatientWorkspacePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const [
    { data: patient },
    { data: toothConditions },
    { data: toothOverlays },
    { data: bridgeRows },
    { data: procedures },
    { data: perioMeasurements },
    { data: perioStatuses },
    { data: activePlanRow },
    { data: planHistoryRows },
    { data: media },
  ] = await Promise.all([
    supabase.from("patients").select("*").eq("id", id).single(),
    supabase.from("tooth_conditions").select("*").eq("patient_id", id),
    supabase.from("tooth_overlays").select("*").eq("patient_id", id),
    supabase.from("bridges").select("*").eq("patient_id", id),
    supabase.from("procedures").select("*"),
    supabase.from("periodontal_measurements").select("*").eq("patient_id", id),
    supabase.from("tooth_perio_status").select("*").eq("patient_id", id),
    supabase.from("treatment_plans").select("*").eq("patient_id", id).is("archived_at", null).maybeSingle(),
    supabase
      .from("treatment_plans")
      .select("*, treatment_plan_items(*, procedure:procedures(*))")
      .eq("patient_id", id)
      .not("archived_at", "is", null)
      .order("archived_at", { ascending: false }),
    supabase.from("patient_media").select("*").eq("patient_id", id).order("captured_at", { ascending: false }),
  ]);

  const bridges = (bridgeRows ?? []) as Bridge[];
  let bridgeTeeth: BridgeTooth[] = [];
  if (bridges.length > 0) {
    const { data: bridgeTeethRows } = await supabase
      .from("bridge_teeth")
      .select("*")
      .in(
        "bridge_id",
        bridges.map((b) => b.id),
      );
    bridgeTeeth = (bridgeTeethRows ?? []) as BridgeTooth[];
  }

  const typedPatient = patient as Patient | null;
  if (!typedPatient) {
    notFound();
  }

  const activePlan = activePlanRow as TreatmentPlan | null;
  const planHistory = (planHistoryRows ?? []) as TreatmentPlan[];

  let treatmentPlanItems: TreatmentPlanItem[] = [];
  let sequencedItems: SequencedTreatmentPlanItem[] = [];

  if (activePlan) {
    const [{ data: items }, { data: seqPlan }] = await Promise.all([
      supabase
        .from("treatment_plan_items")
        .select("*, procedure:procedures(*)")
        .eq("treatment_plan_id", activePlan.id),
      supabase
        .from("sequenced_treatment_plans")
        .select("id")
        .eq("treatment_plan_id", activePlan.id)
        .maybeSingle(),
    ]);

    treatmentPlanItems = (items ?? []) as TreatmentPlanItem[];

    if (seqPlan) {
      const { data: seqItems } = await supabase
        .from("sequenced_treatment_plan_items")
        .select("*")
        .eq("sequenced_treatment_plan_id", seqPlan.id);
      sequencedItems = (seqItems ?? []) as SequencedTreatmentPlanItem[];
    }
  }

  const mediaRows = (media ?? []) as PatientMedia[];
  const mediaItems = await Promise.all(
    mediaRows.map(async (row) => {
      const { data: signed } = await supabase.storage
        .from("patient-media")
        .createSignedUrl(row.storage_path, SIGNED_URL_TTL_SECONDS);
      return fromRow(row, signed?.signedUrl ?? null);
    }),
  );

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-8 pt-6 pb-12">
      <div className="flex items-center gap-4">
        <Link
          href="/patients"
          aria-label="Back to patients"
          title="Back to patients"
          className="grid size-11 shrink-0 place-items-center rounded-full bg-white/70 text-foreground shadow-sm outline-none transition-colors hover:bg-white focus-visible:ring-2 focus-visible:ring-ring dark:bg-white/10 dark:hover:bg-white/20"
        >
          <ArrowLeft className="size-4" />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-4xl font-light tracking-tight">{typedPatient.name}</h1>
            {typedPatient.archived_at && <Badge variant="secondary">Archived</Badge>}
          </div>
          <p className="text-sm text-foreground/75">
            Born {new Date(typedPatient.birth_date).toLocaleDateString()}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <EditPatientDialog patient={typedPatient} />
          {typedPatient.archived_at ? (
            <form action={restorePatient.bind(null, typedPatient.id)}>
              <Button type="submit" variant="secondary" className="h-9 rounded-full px-4">
                Restore
              </Button>
            </form>
          ) : (
            <ArchivePatientButton patientId={typedPatient.id} patientName={typedPatient.name} />
          )}
        </div>
      </div>

      <WorkspaceTabs
        patientId={typedPatient.id}
        patientName={typedPatient.name}
        chartNotes={typedPatient.chart_notes ?? ""}
        toothConditions={(toothConditions ?? []) as ToothCondition[]}
        toothOverlays={(toothOverlays ?? []) as ToothOverlay[]}
        bridges={bridges}
        bridgeTeeth={bridgeTeeth}
        procedures={(procedures ?? []) as Procedure[]}
        perioMeasurements={(perioMeasurements ?? []) as PeriodontalMeasurement[]}
        perioStatuses={(perioStatuses ?? []) as ToothPerioStatus[]}
        treatmentPlanId={activePlan?.id ?? null}
        treatmentPlanItems={treatmentPlanItems}
        sequencedItems={sequencedItems}
        planHistory={planHistory}
        mediaItems={mediaItems}
      />
    </div>
  );
}
