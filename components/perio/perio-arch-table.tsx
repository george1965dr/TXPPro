"use client";

import { useMemo, useRef, type KeyboardEvent } from "react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { ALL_SITES, buildPerioTabSequence, calSeverity, pdSeverity, recessionSeverity } from "@/lib/dental/perio";
import { MOLAR_TEETH } from "@/lib/dental/tooth-geometry";
import type { PerioSite } from "@/lib/types";
import { maxCal, siteValues, toothStatus, type PerioMeasurementState, type PerioStatusState } from "./perio-state";

interface PerioArchTableProps {
  label: string;
  teeth: number[];
  measurements: PerioMeasurementState;
  statuses: PerioStatusState;
  onPdOrRecChange: (tooth: number, site: PerioSite, field: "probing_depth" | "recession", value: number) => void;
  onBopToggle: (tooth: number, site: PerioSite) => void;
  onStatusChange: (tooth: number, field: "mobility" | "furcation", value: number) => void;
}

const severityClass = {
  normal: "",
  watch: "bg-amber-100 border-amber-400 dark:bg-amber-950 dark:border-amber-700",
  significant: "bg-red-100 border-red-400 dark:bg-red-950 dark:border-red-700",
} as const;

function NumberCell({
  value,
  onCommit,
  severity,
  inputRef,
  onKeyDown,
}: {
  value: number;
  onCommit: (value: number) => void;
  severity: "normal" | "watch" | "significant";
  inputRef?: (el: HTMLInputElement | null) => void;
  onKeyDown?: (e: KeyboardEvent<HTMLInputElement>) => void;
}) {
  return (
    <Input
      ref={inputRef}
      type="number"
      min={0}
      max={15}
      defaultValue={value}
      key={value}
      onBlur={(e) => {
        const parsed = Number(e.target.value);
        onCommit(Number.isFinite(parsed) ? Math.max(0, Math.min(15, parsed)) : 0);
      }}
      onKeyDown={onKeyDown}
      className={cn("h-8 w-12 px-1 text-center text-sm", severityClass[severity])}
    />
  );
}

export function PerioArchTable({
  label,
  teeth,
  measurements,
  statuses,
  onPdOrRecChange,
  onBopToggle,
  onStatusChange,
}: PerioArchTableProps) {
  const tabSequence = useMemo(() => buildPerioTabSequence([...teeth].sort((a, b) => a - b)), [teeth]);
  const inputRefs = useRef(new Map<string, HTMLInputElement | null>());

  function cellKey(field: "pd" | "rec", tooth: number, site: PerioSite) {
    return `${field}-${tooth}-${site}`;
  }

  function makeKeyDownHandler(field: "pd" | "rec", tooth: number, site: PerioSite) {
    return (e: KeyboardEvent<HTMLInputElement>) => {
      if (e.key !== "Tab") return;
      const index = tabSequence.findIndex((stop) => stop.tooth === tooth && stop.site === site);
      if (index === -1) return;
      const next = tabSequence[e.shiftKey ? index - 1 : index + 1];
      if (!next) return;
      const el = inputRefs.current.get(cellKey(field, next.tooth, next.site));
      if (!el) return;
      e.preventDefault();
      el.focus();
      el.select();
    };
  }

  return (
    <div className="overflow-x-auto">
      <p className="mb-1 text-xs font-medium text-muted-foreground">{label}</p>
      <table className="border-collapse text-sm">
        <thead>
          <tr>
            <th className="w-6" />
            <th className="w-8" />
            {teeth.map((t) => (
              <th key={t} className="border-b px-1 pb-1 text-center text-xs font-medium">
                #{t}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {ALL_SITES.map((site, i) => (
            <tr key={`pd-${site}`}>
              {i === 0 && (
                <td rowSpan={6} className="border-b px-1 text-xs font-medium text-muted-foreground">
                  <span className="[writing-mode:vertical-rl]">PD</span>
                </td>
              )}
              <td className="border-b px-1 text-xs text-muted-foreground">{site}</td>
              {teeth.map((t) => {
                const v = siteValues(measurements, t, site);
                return (
                  <td key={t} className="border-b px-0.5 py-1 text-center">
                    <div className="flex flex-col items-center gap-1">
                      <NumberCell
                        value={v.probing_depth}
                        severity={pdSeverity(v.probing_depth)}
                        onCommit={(val) => onPdOrRecChange(t, site, "probing_depth", val)}
                        inputRef={(el) => {
                          inputRefs.current.set(cellKey("pd", t, site), el);
                        }}
                        onKeyDown={makeKeyDownHandler("pd", t, site)}
                      />
                      <button
                        type="button"
                        tabIndex={-1}
                        aria-label="Bleeding on probing"
                        onClick={() => onBopToggle(t, site)}
                        className={cn(
                          "size-2 rounded-full border",
                          v.bleeding_on_probing ? "border-red-500 bg-red-500" : "border-muted-foreground/40",
                        )}
                      />
                    </div>
                  </td>
                );
              })}
            </tr>
          ))}

          {ALL_SITES.map((site, i) => (
            <tr key={`rec-${site}`}>
              {i === 0 && (
                <td rowSpan={6} className="border-b px-1 text-xs font-medium text-muted-foreground">
                  <span className="[writing-mode:vertical-rl]">REC</span>
                </td>
              )}
              <td className="border-b px-1 text-xs text-muted-foreground">{site}</td>
              {teeth.map((t) => {
                const v = siteValues(measurements, t, site);
                return (
                  <td key={t} className="border-b px-0.5 py-1 text-center">
                    <NumberCell
                      value={v.recession}
                      severity={recessionSeverity(v.recession)}
                      onCommit={(val) => onPdOrRecChange(t, site, "recession", val)}
                      inputRef={(el) => {
                        inputRefs.current.set(cellKey("rec", t, site), el);
                      }}
                      onKeyDown={makeKeyDownHandler("rec", t, site)}
                    />
                  </td>
                );
              })}
            </tr>
          ))}

          <tr>
            <td colSpan={2} className="border-b px-1 py-1 text-xs font-medium">
              Max CAL
            </td>
            {teeth.map((t) => {
              const cal = maxCal(measurements, t);
              const severity = calSeverity(cal);
              return (
                <td
                  key={t}
                  className={cn(
                    "border-b px-1 py-1 text-center text-sm",
                    severity === "significant" && "font-medium text-red-600 dark:text-red-400",
                    severity === "watch" && "font-medium text-amber-600 dark:text-amber-400",
                  )}
                >
                  {cal}
                </td>
              );
            })}
          </tr>

          <tr>
            <td colSpan={2} className="border-b px-1 py-1 text-xs">
              Mobility
            </td>
            {teeth.map((t) => {
              const status = toothStatus(statuses, t);
              return (
                <td key={t} className="border-b px-0.5 py-1 text-center">
                  <NumberCell
                    value={status.mobility}
                    severity={status.mobility >= 3 ? "significant" : status.mobility >= 1 ? "watch" : "normal"}
                    onCommit={(val) => onStatusChange(t, "mobility", Math.min(val, 3))}
                  />
                </td>
              );
            })}
          </tr>

          <tr>
            <td colSpan={2} className="px-1 py-1 text-xs">
              Furcation
            </td>
            {teeth.map((t) => {
              const status = toothStatus(statuses, t);
              const isMolar = MOLAR_TEETH.has(t);
              return (
                <td key={t} className="px-0.5 py-1 text-center">
                  {isMolar ? (
                    <NumberCell
                      value={status.furcation ?? 0}
                      severity={
                        (status.furcation ?? 0) >= 3 ? "significant" : (status.furcation ?? 0) >= 1 ? "watch" : "normal"
                      }
                      onCommit={(val) => onStatusChange(t, "furcation", Math.min(val, 3))}
                    />
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </td>
              );
            })}
          </tr>
        </tbody>
      </table>
    </div>
  );
}
