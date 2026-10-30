# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

A single dentist-owner (Dr. George) who charts, plans and sequences treatment himself, at a desktop or laptop between patients. He is the only user: this is a dentist-only tool. Patients never see the app on a screen; the only patient-facing output is a printed plan. Staff and tablet use are not part of the confirmed picture.

## Product Purpose

TXP Pro is a treatment-planning tool for complex dental cases. It lets the dentist chart existing conditions on an odontogram, record periodontal measurements, build a proposed plan (including bridges and implants), sequence procedures into visits on a board, set fees, and print the finished plan for the patient. Success is a complete, accurate, sequenced and priced plan produced quickly, and a printout the patient can read.

## Positioning

Built around one practice's own workflow: the procedure catalog, ADA codes, fee schedule and bridge/implant conventions are the practice's own, not a generic dental-software default.

## Operating Context

- Patients, charts, perio data, media, procedures, plans and practice settings live in Supabase (tables: patients, procedures, treatment_plans, sequenced_treatment_plans, tooth_conditions, tooth_overlays, bridges, periodontal_measurements, patient_media, practice_settings).
- Main surfaces: dashboard of patients, per-patient workspace with tabs (odontogram chart, perio grid, visit board, media gallery, plan history, chart notes), a procedures catalog page, and `/patients/[id]/present`.
- The Present page exists to be printed (confirmed 2026-10-29: never shown to patients on a screen). Treat it as a print document: the practice name and address from Settings head it.
- Light and dark theme follow the system setting.

## Capabilities and Constraints

- Dental terminology, ADA codes, FDI/Universal tooth numbering handling and the plan/bridge/implant logic are clinical facts and stay exactly as built; design work must not reword or reinterpret them.
- A plan can only be accepted once fully scheduled.
- Findings such as fracture, impacted, periapical lesion and caries are Existing-only, never Proposed (see project memory on the odontogram layer constraint).
- Stack is Next.js 16 (breaking changes vs. older Next; read `node_modules/next/dist/docs/` before touching framework APIs), React 19, Tailwind 4, shadcn/Radix, Supabase.
- Undecided: whether staff or tablets will become regular users.

## Brand Commitments

The practice's own name and address, entered in Settings, appear in the app header and must stay prominent and correct. No logo or brand palette has been specified. The user did not bind any visual direction; the current look is a starting point.

## Evidence on Hand

Real application code, a Supabase schema with migrations, and seed data (`supabase/`). No patient-facing testimonials, case studies or marketing assets exist and none should be invented.

## Product Principles

1. Clinically precise and dense: show the information a clinician needs without dumbing it down.
2. The printed plan is the one patient-facing artifact: professional, legible on paper, and calm in tone.
3. The practice's identity (name, address) is a first-class element, not an afterthought.
4. Speed between patients beats decoration: the working screens favor scanability and familiar patterns.

## Accessibility & Inclusion

No product-specific standard was set. The printed plan must stay legible on paper at normal reading distance.
