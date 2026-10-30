import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PresentActions } from "@/components/treatment-plans/present-actions";
import { PresentTotals } from "@/components/treatment-plans/present-totals";
import { buildPresentSummary, type PresentVisit } from "@/components/treatment-plans/present-state";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Check } from "lucide-react";
import { formatMoney } from "@/lib/money";
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
    <section className="break-inside-avoid">
      <div className="flex items-baseline justify-between border-b-2 border-foreground/70 pb-1.5">
        <h2 className="text-lg font-semibold">{visit.label}</h2>
        <p className="text-base font-medium tabular-nums">{formatMoney(visit.subtotal)}</p>
      </div>
      <table className="w-full border-collapse">
        <thead className="sr-only">
          <tr>
            <th scope="col">Procedure</th>
            <th scope="col">Code</th>
            <th scope="col">Fee</th>
          </tr>
        </thead>
        <tbody>
          {visit.items.map((item) => (
            <tr key={item.id} className="break-inside-avoid border-b border-foreground/15">
              <td className="py-2.5 pr-4 align-top">
                <p className="text-base">{item.description}</p>
                {item.toothNumber !== null && (
                  <p className="text-sm text-muted-foreground">
                    Tooth {item.toothNumber}
                    {item.surfaces.length > 0 && ` · ${item.surfaces.join("")}`}
                  </p>
                )}
              </td>
              <td className="py-2.5 pr-4 align-top text-sm whitespace-nowrap text-muted-foreground">
                {item.adaCode}
              </td>
              <td className="py-2.5 text-right align-top text-base whitespace-nowrap tabular-nums">
                {formatMoney(item.fee)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
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

  const backHref = `/patients/${id}?tab=sequence`;
  const summary = activePlan ? buildPresentSummary(items, sequencedItems) : null;
  const hasUnscheduled = (summary?.unscheduled.items.length ?? 0) > 0;

  return (
    <div className="mx-auto my-6 flex w-full max-w-2xl flex-col gap-7 rounded-3xl bg-white p-10 text-foreground [--foreground:oklch(0.145_0_0)] [--muted-foreground:oklch(0.4_0_0)] [--border:oklch(0.85_0_0)] [--background:oklch(1_0_0)] [--success:oklch(0.5_0.14_150)] [--success-foreground:oklch(0.99_0_0)] [--input:oklch(0.9_0_0)] [--muted:oklch(0.97_0_0)] shadow-[0_18px_48px_-18px_oklch(0.4_0.09_262/0.3)] print:my-0 print:max-w-none print:rounded-none print:p-0 print:shadow-none">
      <header className="border-b-2 border-foreground pb-4">
        <p className="text-2xl font-semibold tracking-tight">{practiceSettings?.name || "Treatment plan"}</p>
        {practiceSettings?.address && (
          <p className="mt-1 text-sm whitespace-pre-line text-muted-foreground">{practiceSettings.address}</p>
        )}
      </header>

      <div className="flex items-center justify-between print:hidden">
        <Button variant="outline" size="sm" asChild>
          <Link href={backHref}>
            <ArrowLeft className="size-4" />
            Back to sequence
          </Link>
        </Button>
        {activePlan && (
          <PresentActions
            patientId={id}
            treatmentPlanId={activePlan.id}
            accepted={activePlan.accepted_at != null}
            hasUnscheduled={hasUnscheduled}
          />
        )}
      </div>

      <div className="flex items-end justify-between gap-6">
        <div>
          <h1 className="text-3xl font-light tracking-tight">Treatment plan</h1>
          <p className="mt-1 text-lg">{typedPatient.name}</p>
        </div>
        <div className="text-right text-sm text-muted-foreground">
          {activePlan && <p>Prepared {new Date(activePlan.created_at).toLocaleDateString()}</p>}
          {activePlan?.accepted_at && (
            <p className="mt-0.5 flex items-center justify-end gap-1.5 font-medium text-success">
              <Check className="size-4" aria-hidden />
              Accepted {new Date(activePlan.accepted_at).toLocaleDateString()}
            </p>
          )}
        </div>
      </div>

      {!activePlan || !summary || items.length === 0 ? (
        <p className="text-base text-muted-foreground">
          Nothing on this plan yet. Chart proposed treatment or add a procedure, then come back here.
        </p>
      ) : (
        <>
          {summary.visits.map((visit) => (
            <VisitSection key={visit.label} visit={visit} />
          ))}
          <VisitSection visit={summary.unscheduled} />

          <PresentTotals
            patientId={id}
            treatmentPlanId={activePlan.id}
            subtotal={summary.grandTotal}
            initialAdjustment={activePlan.adjustment}
          />

          <div className="mt-6 grid grid-cols-[2fr_1fr] gap-x-8 gap-y-1 break-inside-avoid text-sm">
            <div className="h-14 border-b border-foreground" />
            <div className="h-14 border-b border-foreground" />
            <p className="text-muted-foreground">Patient signature</p>
            <p className="text-muted-foreground">Date</p>
          </div>
        </>
      )}
    </div>
  );
}
