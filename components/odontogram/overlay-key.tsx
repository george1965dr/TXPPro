import { OVERLAY_BADGE, OVERLAY_LABEL } from "./tooth-surface-diagram";
import type { OverlayState } from "./chart-state";
import type { ChartLayer, OverlayType } from "@/lib/types";

/** Spells out the short badge codes (Fx, PA, RC...) for whichever findings are on the chart right now. */
export function OverlayKey({ overlayState, view }: { overlayState: OverlayState; view: ChartLayer }) {
  const present = new Set<OverlayType>();
  for (const flags of Object.values(overlayState)) {
    for (const [type, layered] of Object.entries(flags)) {
      if (layered?.[view]) present.add(type as OverlayType);
    }
  }
  if (present.size === 0) return null;

  const types = (Object.keys(OVERLAY_BADGE) as OverlayType[]).filter((type) => present.has(type));

  return (
    <ul aria-label="Finding badge key" className="flex flex-wrap gap-x-5 gap-y-1 text-xs text-muted-foreground">
      {types.map((type) => (
        <li key={type}>
          <span className="font-medium text-foreground">{OVERLAY_BADGE[type]}</span> {OVERLAY_LABEL[type]}
        </li>
      ))}
    </ul>
  );
}
