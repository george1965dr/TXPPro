---
name: TXP Pro
description: A calm clinical dashboard of frosted panels over a soft sky gradient, with the practice's own name as the backdrop.
colors:
  primary: "oklch(0.52 0.19 255)"
  navy: "oklch(0.27 0.07 262)"
  navy-foreground: "oklch(0.99 0 0)"
  canvas-top: "oklch(0.85 0.08 245)"
  canvas-mid: "oklch(0.94 0.035 285)"
  canvas-base: "oklch(0.975 0.012 245)"
  panel: "oklch(1 0 0 / 0.82)"
  foreground: "oklch(0.145 0 0)"
  muted-foreground: "oklch(0.52 0 0)"
  border: "oklch(0.922 0 0)"
  accent: "oklch(0.96 0.025 255)"
  success: "oklch(0.5 0.14 150)"
  proposed: "oklch(0.5 0.13 55)"
  destructive: "oklch(0.577 0.245 27.325)"
typography:
  display:
    fontFamily: "Geist, system-ui, sans-serif"
    fontSize: "2.25rem"
    fontWeight: 300
    lineHeight: 1
  title:
    fontFamily: "Geist, system-ui, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 500
    lineHeight: 1.4
  body:
    fontFamily: "Geist, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "Geist, system-ui, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 400
    lineHeight: 1.4
rounded:
  tile: "1rem"
  card: "1.5rem"
  panel: "1.75rem"
  pill: "9999px"
spacing:
  tile-gap: "10px"
  panel-gap: "20px"
  panel-padding: "24px"
components:
  button-navy-pill:
    backgroundColor: "{colors.navy}"
    textColor: "{colors.navy-foreground}"
    rounded: "{rounded.pill}"
    height: "44px"
  panel:
    backgroundColor: "{colors.panel}"
    textColor: "{colors.foreground}"
    rounded: "{rounded.panel}"
    padding: "{spacing.panel-padding}"
  patient-tile:
    backgroundColor: "oklch(1 0 0 / 0.8)"
    textColor: "{colors.foreground}"
    rounded: "{rounded.tile}"
    padding: "16px"
  rail-button-active:
    backgroundColor: "{colors.navy}"
    textColor: "{colors.navy-foreground}"
    rounded: "{rounded.pill}"
    size: "44px"
---

# Design System: TXP Pro

## Overview

**Creative North Star: "The Quiet Dashboard"**

A frosted-panel clinical dashboard on a sky-blue to lavender gradient (dusk navy in dark theme). It was pinned by a user-supplied reference screenshot, not invented. Surfaces are mostly opaque white panels with soft blur, large radii and long soft shadows. The practice's own name is the large faint backdrop, so identity is atmosphere rather than a header label. Density stays clinical: tiles are scannable, numbers are tabular, titles are light.

The world is only applied so far to Patients, the workspace tabs, the Sequence (visit) board, Procedures and Present. The login page and dialogs inherit the tokens but were not redesigned. No rendered-screenshot review was run (the user chose to skip it); everything here is derived from source.

**Key Characteristics:**
- Gradient canvas, fixed to the viewport, with opaque-ish panels on top.
- Round things: pill actions, circular rail buttons, circular avatars, orbs.
- Navy is the "you are here / do this" color; primary blue is the chart's Existing layer and links.
- Status is an orb plus a word, never color alone.
- Light and dark themes follow the system; Geist and Geist Mono.

## Colors

Cool sky and navy neutrals, with three semantic hues that never swap roles.

### Primary
- **Chart Blue** (`primary`): the Existing layer on the odontogram, small accent text (the "Pro" in the wordmark, tooth numbers on visit cards), focus ring family (`ring` is a lighter 255-hue blue).

### Secondary
- **Ink Navy** (`navy`): active rail button, active tab, selected view switch, primary pill action, home mark. In dark theme it inverts to a pale blue with dark text.

### Tertiary
- **Confirmed Green** (`success`): confirmed or OK only: accepted plan orb and word, the Saved check, veneer surfaces on the chart.
- **Proposed Orange** (`proposed`): the proposed plan layer on the chart.
- **Alert Red** (`destructive`): failures (Change not saved) and chart alerts.

### Neutral
- **Sky Canvas** (`canvas-top`, `canvas-mid`, `canvas-base`): body gradient, stops at 0, 30rem and 72rem, fixed attachment. Dark theme uses dusk navy stops.
- **Frosted Panel** (`panel`): 82% white (78% dark) with a hairline white border.
- **Ink** (`foreground`) and **Quiet Ink** (`muted-foreground`).
- **Hairline** (`border`), **Accent Wash** (`accent`).

The sidebar-* and chart-* tokens are shadcn leftovers (neutral grays) and are not part of this world.

### Named Rules
**The Panel-Only Muted Rule.** muted-foreground text never sits directly on the gradient canvas; it measures about 4.1:1 there. Text on the canvas (the header strip) uses full foreground or foreground at 60-80% opacity only for non-essential separators. All other text lives on panels.
**The Hue-Owns-Meaning Rule.** Green means confirmed/OK only. Orange means the proposed layer. Blue means existing. Red means failure or alert. Do not borrow a hue for decoration.

## Typography

**Display and Body Font:** Geist (variable, with system sans fallback)
**Mono Font:** Geist Mono (loaded; available for codes)

**Character:** One family at several weights. Large titles go light; labels go medium. Hierarchy comes from weight and size, not a second face.

### Hierarchy
- **Display** (300, 2.25rem / text-4xl, tight): big stat numbers in the overview tiles, tabular-nums. Page titles are also light and large.
- **Title** (500, 1.125rem): panel headings such as "Overview".
- **Body** (400-500, 0.875rem): tile names (medium), meta lines (muted), tab triggers (medium).
- **Label** (400, 0.75rem): visit-card detail, subtotals, save status.

### Named Rules
**The Tabular Numbers Rule.** Counts, fees and subtotals use tabular-nums.

## Layout

A fixed 64-68px floating rail at the left (4.25rem wide, inset 1rem); content is offset `md:pl-24`. On small screens the rail becomes a bottom pill bar and content gets bottom padding. Sticky header strip is 3.5rem high with 40% background blur, content capped at max-w-6xl with 2rem side padding. Patients page: a 18rem overview panel beside a wide patients panel (`lg:grid-cols-[18rem_1fr]`), 1.25rem gap, 1.5rem panel padding, 0.625rem between tiles. The watermark is fixed under the header, sized `min(11, 120/length)vw`, masked to fade out toward the content, and hidden in print.

## Elevation & Depth

Hybrid: tonal layering plus soft, long, blue-tinted shadows. Panels carry an inset 1px white top highlight and an 18px-offset, 48px-blur shadow tinted navy. Tiles use a two-layer small shadow; in dark theme tiles are flat with a hairline white border.

### Shadow Vocabulary
- **Panel** (`0 1px 0 oklch(1 0 0 / 0.7) inset, 0 18px 48px -18px oklch(0.4 0.09 262 / 0.22)`): panels, rail, cards.
- **Tile** (`0 1px 2px oklch(0.35 0.08 262 / 0.08), 0 6px 16px -8px oklch(0.35 0.08 262 / 0.14)`): patient tiles, stat tiles, visit cards.

### Named Rules
**The Mostly-Opaque Rule.** Panels blur at 24px with 1.4 saturation but stay at 82% or more opaque so text holds 4.5:1.

## Shapes

Generously round. Panels 1.75rem, Cards 1.5rem (3xl), tiles 1rem (2xl), visit columns 1rem, visit cards 0.75rem. Actions, search, tabs, rail buttons, toggles, avatars and orbs are full pills or circles. Borders are hairlines (6% foreground or white at 70%).

## Components

### Buttons
- **Navy pill:** navy fill, near-white text, full radius, 44px control height for the primary "New patient" style action.
- **Small pills:** outline and secondary variants at 32px height, full radius (View, Restore).

### Cards / Containers
- **Panel:** the `panel` utility. **Card:** same fill, border and shadow tokens at 1.5rem radius, 1.25rem spacing.

### Inputs / Fields
- **Pill search:** 44px high, full radius, 80% white fill, leading search icon; dark theme uses white at 5%. Focus uses the ring token.

### Navigation
- **Rail:** circular 44px buttons; the active one fills navy. Home mark "Tx" in navy circle. Settings and theme toggle sit at the bottom.
- **Tabs:** pill-shaped list at 44px on a 60% white track; active trigger fills navy.
- **Header:** practice name, TXP Pro wordmark, breadcrumb of patient and tab, save status at right.

### Patient tile and avatar
Soft white tile with a pastel initials circle (hue hashed from the name; light fill at L0.9, dark fill at L0.34), name, muted meta line, and for accepted plans a green orb plus the word "Accepted".

### Visit board
Columns are faint foreground-tinted 1rem blocks; "Unscheduled" has a dashed border; drag-over tints primary at 10%. Cards are soft white tiles with ADA code, primary-colored tooth number, muted description, inline visit select and click-to-edit fee.

### Save status
Saving spinner, Saved with green check, or red alert with Retry; text at 75% foreground.

### Present (paper sheet)
A white 3xl-rounded sheet pinned to light tokens regardless of theme, max-w-2xl, 2.5rem padding. In print it loses radius, shadow and padding, the body background becomes plain white, and the rail, header and watermark are hidden. Print forces light tokens, darker muted text and 0.6in page margins.

## Do's and Don'ts

### Do:
- **Do** put text on panels or tiles, and keep panels at 82%+ opacity.
- **Do** pair every status color with a word (orb plus "Accepted").
- **Do** keep chart layers: existing blue, proposed orange, veneer green, alert red.
- **Do** keep the Present page plain white and print-first.
- **Do** use navy for the single active or primary thing in a group.

### Don't:
- **Don't** place muted-foreground text directly on the gradient canvas.
- **Don't** use green for anything but confirmed or OK.
- **Don't** show the watermark in print or let it compete with content.
- **Don't** theme the printed plan with dark tokens.
