import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { WorkspaceTabs } from "@/components/patients/workspace-tabs";
import { fromRow } from "@/components/media/media-state";
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
    { data: plans },
    { data: media },
  ] = await Promise.all([
    supabase.from("patients").select("*").eq("id", id).single(),
    supabase.from("tooth_conditions").select("*").eq("patient_id", id),
    supabase.from("tooth_overlays").select("*").eq("patient_id", id),
    supabase.from("bridges").select("*").eq("patient_id", id),
    supabase.from("procedures").select("*"),
    supabase.from("periodontal_measurements").select("*").eq("patient_id", id),
    supabase.from("tooth_perio_status").select("*").eq("patient_id", id),
    supabase
      .from("treatment_plans")
      .select("*")
      .eq("patient_id", id)
      .order("created_at", { ascending: false })
      .limit(1),
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

  const activePlan = ((plans as TreatmentPlan[] | null)?.[0] ?? null) as TreatmentPlan | null;

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
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 p-8">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" asChild>
          <Link href="/patients">
            <ArrowLeft className="size-4" />
            Patients
          </Link>
        </Button>
        <div>
          <h1 className="text-xl font-medium">{typedPatient.name}</h1>
          <p className="text-sm text-muted-foreground">
            Born {new Date(typedPatient.birth_date).toLocaleDateString()}
          </p>
        </div>
      </div>

      <WorkspaceTabs
        patientId={typedPatient.id}
        patientName={typedPatient.name}
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
        mediaItems={mediaItems}
      />
    </div>
  );
}
