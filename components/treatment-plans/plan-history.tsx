"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import type { TreatmentPlan } from "@/lib/types";

function formatDate(value: string) {
  return new Date(value).toLocaleDateString();
}

function PlanRow({ plan }: { plan: TreatmentPlan }) {
  const [open, setOpen] = useState(false);
  const items = plan.treatment_plan_items ?? [];
  const total = items.reduce((sum, item) => sum + item.fee * item.quantity, 0);

  return (
    <Card>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-2 px-4 py-3 text-left text-sm"
      >
        <span className="flex items-center gap-2">
          {open ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
          <span>
            Started {formatDate(plan.created_at)}
            {plan.archived_at ? ` · Archived ${formatDate(plan.archived_at)}` : ""}
          </span>
        </span>
        <span className="flex items-center gap-2 text-muted-foreground">
          <span>
            {items.length} item{items.length === 1 ? "" : "s"} · ${total.toFixed(2)}
          </span>
          <Badge variant={plan.accepted_at ? "default" : "outline"}>
            {plan.accepted_at ? "Accepted" : "Not accepted"}
          </Badge>
        </span>
      </button>
      {open && (
        <CardContent className="border-t pt-3">
          {items.length === 0 ? (
            <p className="text-sm text-muted-foreground">No items on this plan.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-muted-foreground">
                  <th className="pb-2 font-medium">Procedure</th>
                  <th className="pb-2 font-medium">ADA</th>
                  <th className="pb-2 font-medium">Tooth</th>
                  <th className="pb-2 text-right font-medium">Fee</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id} className="border-t">
                    <td className="py-1.5 pr-2">{item.procedure?.description ?? "—"}</td>
                    <td className="py-1.5 pr-2 text-muted-foreground">{item.procedure?.ada_code ?? "—"}</td>
                    <td className="py-1.5 pr-2 text-muted-foreground">
                      {item.tooth_numbers && item.tooth_numbers.length > 0
                        ? item.tooth_numbers.join(", ")
                        : "—"}
                      {item.surfaces && item.surfaces.length > 0 ? ` (${item.surfaces.join("")})` : ""}
                    </td>
                    <td className="py-1.5 text-right">${item.fee.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      )}
    </Card>
  );
}

export function PlanHistory({ plans }: { plans: TreatmentPlan[] }) {
  if (plans.length === 0) return null;

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm font-medium text-muted-foreground">Plan history</p>
      <div className="flex flex-col gap-2">
        {plans.map((plan) => (
          <PlanRow key={plan.id} plan={plan} />
        ))}
      </div>
    </div>
  );
}
