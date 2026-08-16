"use client";

import { useMemo, useState, useTransition } from "react";
import { AlertTriangle, Check } from "lucide-react";
import { setPerioSite, setToothPerioStatus } from "@/app/actions/perio";
import { ALL_SITES } from "@/lib/dental/perio";
import { UPPER_ARCH, LOWER_ARCH } from "@/lib/dental/tooth-geometry";
import type { PeriodontalMeasurement, PerioSite, ToothPerioStatus } from "@/lib/types";
import { PerioArchTable } from "./perio-arch-table";
import {
  buildMeasurementState,
  buildStatusState,
  siteValues,
  type PerioMeasurementState,
  type PerioStatusState,
} from "./perio-state";

interface PerioGridProps {
  patientId: string;
  initialMeasurements: PeriodontalMeasurement[];
  initialStatuses: ToothPerioStatus[];
}

const ALL_TEETH = [...UPPER_ARCH, ...LOWER_ARCH];

export function PerioGrid({ patientId, initialMeasurements, initialStatuses }: PerioGridProps) {
  const [measurements, setMeasurements] = useState<PerioMeasurementState>(() =>
    buildMeasurementState(initialMeasurements),
  );
  const [statuses, setStatuses] = useState<PerioStatusState>(() => buildStatusState(initialStatuses));
  const [isPending, startTransition] = useTransition();

  function handlePdOrRecChange(
    tooth: number,
    site: PerioSite,
    field: "probing_depth" | "recession",
    value: number,
  ) {
    setMeasurements((prev) => {
      const current = prev[tooth]?.[site] ?? { probing_depth: 0, recession: 0, bleeding_on_probing: false };
      return { ...prev, [tooth]: { ...prev[tooth], [site]: { ...current, [field]: value } } };
    });
    startTransition(async () => {
      await setPerioSite(patientId, tooth, site, field, value);
    });
  }

  function handleBopToggle(tooth: number, site: PerioSite) {
    const current = siteValues(measurements, tooth, site);
    const next = !current.bleeding_on_probing;
    setMeasurements((prev) => ({
      ...prev,
      [tooth]: { ...prev[tooth], [site]: { ...current, bleeding_on_probing: next } },
    }));
    startTransition(async () => {
      await setPerioSite(patientId, tooth, site, "bleeding_on_probing", next);
    });
  }

  function handleStatusChange(tooth: number, field: "mobility" | "furcation", value: number) {
    setStatuses((prev) => ({
      ...prev,
      [tooth]: {
        mobility: field === "mobility" ? value : (prev[tooth]?.mobility ?? 0),
        furcation: field === "furcation" ? value : (prev[tooth]?.furcation ?? null),
      },
    }));
    startTransition(async () => {
      await setToothPerioStatus(patientId, tooth, field, value);
    });
  }

  const { deepSites, bleedingSites } = useMemo(() => {
    let deep = 0;
    let bleeding = 0;
    for (const tooth of ALL_TEETH) {
      for (const site of ALL_SITES) {
        const v = siteValues(measurements, tooth, site);
        if (v.probing_depth >= 4) deep++;
        if (v.bleeding_on_probing) bleeding++;
      }
    }
    return { deepSites: deep, bleedingSites: bleeding };
  }, [measurements]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        {deepSites > 0 || bleedingSites > 0 ? (
          <div className="flex items-center gap-1.5 rounded-md bg-amber-100 px-2.5 py-1.5 text-sm text-amber-800 dark:bg-amber-950 dark:text-amber-300">
            <AlertTriangle className="size-3.5" />
            {deepSites} site{deepSites === 1 ? "" : "s"} ≥ 4mm · {bleedingSites} bleeding on probing
          </div>
        ) : (
          <div className="flex items-center gap-1.5 text-sm text-green-700 dark:text-green-400">
            <Check className="size-3.5" />
            All sites within normal limits
          </div>
        )}
        <span className="text-xs text-muted-foreground">{isPending ? "Saving…" : "Saved"}</span>
      </div>

      <p className="text-xs text-muted-foreground">
        Sites trace mesial to distal, facial then lingual · click the dot under a PD value to flag bleeding
      </p>

      <PerioArchTable
        label="Upper arch"
        teeth={UPPER_ARCH}
        measurements={measurements}
        statuses={statuses}
        onPdOrRecChange={handlePdOrRecChange}
        onBopToggle={handleBopToggle}
        onStatusChange={handleStatusChange}
      />
      <PerioArchTable
        label="Lower arch"
        teeth={LOWER_ARCH}
        measurements={measurements}
        statuses={statuses}
        onPdOrRecChange={handlePdOrRecChange}
        onBopToggle={handleBopToggle}
        onStatusChange={handleStatusChange}
      />

      <p className="text-xs text-muted-foreground">
        PD = probing depth (mm) · REC = gingival recession (mm) · Max CAL = highest attachment loss (PD + REC) at any
        single site
      </p>
    </div>
  );
}
