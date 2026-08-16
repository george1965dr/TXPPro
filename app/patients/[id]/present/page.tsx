import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PresentActions } from "@/components/treatment-plans/present-actions";
import { buildPresentSummary, type PresentVisit } from "@/components/treatment-plans/present-state";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import type { Patient, SequencedTreatmentPlanItem, TreatmentPlan, TreatmentPlanItem } from "@/lib/types";

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

  const { data: plans } = await supabase
    .from("treatment_plans")
    .select("*")
    .eq("patient_id", id)
    .order("created_at", { ascending: false })
    .limit(1);
  const activePlan = ((plans as TreatmentPlan[] | null)?.[0] ?? null) as TreatmentPlan | null;

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
        <h1 className="text-2xl font-medium">Treatment plan</h1>
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

                <div className="flex items-center justify-between border-t pt-4">
                  <p className="text-sm text-muted-foreground">Total</p>
                  <p className="text-xl font-medium">${summary.grandTotal.toLocaleString()}</p>
                </div>
              </>
            );
          })()}
        </>
      )}
    </div>
  );
}
