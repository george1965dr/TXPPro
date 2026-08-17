import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PresentActions } from "@/components/treatment-plans/present-actions";
import { PresentTotals } from "@/components/treatment-plans/present-totals";
import { buildPresentSummary, type PresentVisit } from "@/components/treatment-plans/present-state";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import type {
  Patient,
  PracticeSettings,
  SequencedTreatmentPlanItem,
  TreatmentPlan,
  TreatmentPlanItem,
} from "@/lib/types";

function VisitSection({ visit }: { visit: PresentVisit }) {
  if (visit.items.length === 0) return null;
  return (
    <div className="mb-6">
      <h2 className="mb-2 text-sm font-medium">{visit.label}</h2>
      <table className="w-full border-collapse text-sm">
        <tbody>
          {visit.items.map((item) => (
            <tr key={item.id} className="border-b">
              <td className="py-1.5 pr-3 text-muted-foreground">{item.adaCode}</td>
              <td className="py-1.5">
                {item.description}
                {item.toothNumber !== null && (
                  <span className="text-muted-foreground">
                    {" "}
                    — tooth #{item.toothNumber}
                    {item.surfaces.length > 0 && ` (${item.surfaces.join("")})`}
                  </span>
                )}
              </td>
              <td className="py-1.5 pl-3 text-right">${item.fee.toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="mt-1 text-right text-sm text-muted-foreground">
        Subtotal: ${visit.subtotal.toLocaleString()}
      </p>
    </div>
  );
}

export default async function PresentPlanPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: patient } = await supabase.from("patients").select("*").eq("id", id).single();
  const typedPatient = patient as Patient | null;
  if (!typedPatient) notFound();

  const { data: settingsRow } = await supabase.from("practice_settings").select("*").eq("id", 1).maybeSingle();
  const practiceSettings = settingsRow as PracticeSettings | null;

  const { data: planRow } = await supabase
    .from("treatment_plans")
    .select("*")
    .eq("patient_id", id)
    .is("archived_at", null)
    .maybeSingle();
  const activePlan = planRow as TreatmentPlan | null;

  let items: TreatmentPlanItem[] = [];
  let sequencedItems: SequencedTreatmentPlanItem[] = [];

  if (activePlan) {
    const [{ data: planItems }, { data: seqPlan }] = await Promise.all([
      supabase.from("treatment_plan_items").select("*, procedure:procedures(*)").eq("treatment_plan_id", activePlan.id),
      supabase.from("sequenced_treatment_plans").select("id").eq("treatment_plan_id", activePlan.id).maybeSingle(),
    ]);
    items = (planItems ?? []) as TreatmentPlanItem[];

    if (seqPlan) {
      const { data: seqItems } = await supabase
        .from("sequenced_treatment_plan_items")
        .select("*")
        .eq("sequenced_treatment_plan_id", seqPlan.id);
      sequencedItems = (seqItems ?? []) as SequencedTreatmentPlanItem[];
    }
  }

  const backHref = `/patients/${id}`;

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 p-8">
      {(practiceSettings?.name || practiceSettings?.address) && (
        <div className="border-b pb-4">
          {practiceSettings.name && <p className="text-lg font-semibold">{practiceSettings.name}</p>}
          {practiceSettings.address && (
            <p className="whitespace-pre-line text-sm text-muted-foreground">{practiceSettings.address}</p>
          )}
        </div>
      )}

      <div className="flex items-center justify-between print:hidden">
        <Button variant="outline" size="sm" asChild>
          <Link href={backHref}>
            <ArrowLeft className="size-4" />
            Back to workspace
          </Link>
        </Button>
        {activePlan && (
          <PresentActions
            patientId={id}
            treatmentPlanId={activePlan.id}
            accepted={activePlan.accepted_at != null}
          />
        )}
      </div>

      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Treatment plan</h1>
        <p className="text-sm text-muted-foreground">
          {typedPatient.name} · {new Date().toLocaleDateString()}
        </p>
        {activePlan?.accepted_at && (
          <p className="mt-1 text-sm text-green-700 dark:text-green-400">
            Accepted {new Date(activePlan.accepted_at).toLocaleDateString()}
          </p>
        )}
      </div>

      {!activePlan || items.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Nothing on this plan yet. Chart proposed treatment or add a procedure, then come back here.
        </p>
      ) : (
        <>
          {(() => {
            const summary = buildPresentSummary(items, sequencedItems);
            return (
              <>
                {summary.visits.map((visit) => (
                  <VisitSection key={visit.label} visit={visit} />
                ))}
                <VisitSection visit={summary.unscheduled} />

                <PresentTotals
                  patientId={id}
                  treatmentPlanId={activePlan!.id}
                  subtotal={summary.grandTotal}
                  initialAdjustment={activePlan!.adjustment}
                />

                <div className="mt-8 grid grid-cols-2 gap-x-8 gap-y-1 text-sm">
                  <div className="h-10 border-b border-foreground/40" />
                  <div className="h-10 border-b border-foreground/40" />
                  <p className="text-muted-foreground">Patient signature</p>
                  <p className="text-muted-foreground">Date</p>
                </div>
              </>
            );
          })()}
        </>
      )}
    </div>
  );
}
