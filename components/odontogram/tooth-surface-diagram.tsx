"use client";

import { Camera } from "lucide-react";
import {
  SURFACE_ORDER,
  SURFACE_ZONE_POINTS,
  SURFACE_LABEL_POSITION,
} from "@/lib/dental/tooth-geometry";
import type { BridgeRole, ChartLayer, OverlayType, ToothSurface } from "@/lib/types";

export interface BridgeMembership {
  role: BridgeRole;
}

interface ToothSurfaceDiagramProps {
  toothNumber: number;
  /** Which layer is currently being viewed/edited - drives color for everything on this tooth. */
  view: ChartLayer;
  /** Already resolved to the active view - no layer info left to disambiguate. */
  surfaces: Partial<Record<ToothSurface, string>>;
  whole?: string;
  overlays?: Partial<Record<OverlayType, true>>;
  bridge?: BridgeMembership;
  hasPhoto?: boolean;
  /** Rendered pixel size of the square diagram (viewBox stays 44x44, so this just scales it). */
  size?: number;
  onSurfaceClick: (surface: ToothSurface) => void;
  onWholeClick: () => void;
  onOverlayClick: (overlay: OverlayType) => void;
}

// Tied to theme tokens (not hardcoded hex) so the active view's color
// adapts automatically between light and dark mode.
const VIEW_COLOR = {
  existing: {
    fill: "color-mix(in oklch, var(--primary) 15%, var(--background))",
    stroke: "var(--primary)",
    text: "var(--primary)",
  },
  proposed: {
    fill: "color-mix(in oklch, var(--destructive) 15%, var(--background))",
    stroke: "var(--destructive)",
    text: "var(--destructive)",
  },
} as const;

const EMPTY_COLOR = { fill: "var(--muted)", stroke: "var(--border)", text: "var(--muted-foreground)" };

const CONDITION_LETTER: Record<string, string> = {
  caries: "c",
  filling: "f",
  sealant: "s",
  veneer: "v",
  inlay_onlay: "i",
};

const WHOLE_LABEL: Record<string, string> = {
  crown: "CR",
  implant: "IM",
  missing: "X",
  extraction: "X",
};

/** Rendered as an empty, dashed outline - the tooth is (or will be) gone. */
const EMPTY_WHOLE_VALUES = new Set(["missing", "extraction"]);

const OVERLAY_BADGE: Record<OverlayType, string> = {
  root_canal: "R",
  retreatment: "Rt",
  apicoectomy: "Ax",
  periapical_lesion: "PA",
  fracture: "Fx",
  impacted: "Im",
  bone_graft: "BG",
  soft_tissue_graft: "SG",
  sinus_lift: "Sn",
  cyst_removal: "CyR",
  biopsy: "Bx",
  soft_tissue_lesion: "SL",
  cyst: "Cy",
};

export function ToothSurfaceDiagram({
  toothNumber,
  view,
  surfaces,
  whole,
  overlays,
  bridge,
  hasPhoto,
  size = 40,
  onSurfaceClick,
  onWholeClick,
  onOverlayClick,
}: ToothSurfaceDiagramProps) {
  const color = VIEW_COLOR[view];
  const overlayTypes = Object.keys(overlays ?? {}) as OverlayType[];

  return (
    <div className="relative flex flex-col items-center gap-0.5">
      {hasPhoto && (
        <span
          aria-label="Has photo"
          className="absolute -top-0.5 right-1 flex size-3.5 items-center justify-center rounded-full bg-primary"
        >
          <Camera className="size-2.5 text-primary-foreground" />
        </span>
      )}
      <svg viewBox="0 0 44 44" width={size} height={size}>
        {bridge ? (
          <>
            <rect
              x={0}
              y={0}
              width={44}
              height={44}
              rx={5}
              fill={bridge.role === "pontic" ? "transparent" : color.fill}
              stroke={color.stroke}
              strokeDasharray={bridge.role === "pontic" ? "3,3" : undefined}
              onClick={onWholeClick}
              className="cursor-pointer"
            />
            <text
              x={22}
              y={26}
              textAnchor="middle"
              fontSize={9}
              fill={color.text}
              style={{ pointerEvents: "none" }}
            >
              {bridge.role === "abutment" ? "AB" : "PO"}
            </text>
          </>
        ) : whole ? (
          <>
            <rect
              x={0}
              y={0}
              width={44}
              height={44}
              rx={5}
              fill={EMPTY_WHOLE_VALUES.has(whole) ? "transparent" : color.fill}
              stroke={color.stroke}
              strokeDasharray={EMPTY_WHOLE_VALUES.has(whole) ? "3,3" : undefined}
              onClick={onWholeClick}
              className="cursor-pointer"
            />
            <text
              x={22}
              y={26}
              textAnchor="middle"
              fontSize={11}
              fill={color.text}
              style={{ pointerEvents: "none" }}
            >
              {WHOLE_LABEL[whole] ?? "?"}
            </text>
          </>
        ) : (
          SURFACE_ORDER.map((surface) => {
            const entry = surfaces[surface];
            const zoneColor = entry ? color : EMPTY_COLOR;
            const labelPos = SURFACE_LABEL_POSITION[surface];
            return (
              <g key={surface}>
                <polygon
                  points={SURFACE_ZONE_POINTS[surface]}
                  fill={zoneColor.fill}
                  stroke={zoneColor.stroke}
                  strokeWidth={1}
                  className="cursor-pointer"
                  onClick={() => onSurfaceClick(surface)}
                />
                {entry && CONDITION_LETTER[entry] && (
                  <text
                    x={labelPos.x}
                    y={labelPos.y + 3}
                    textAnchor="middle"
                    fontSize={7.5}
                    fill={zoneColor.text}
                    style={{ pointerEvents: "none" }}
                  >
                    {CONDITION_LETTER[entry]}
                  </text>
                )}
              </g>
            );
          })
        )}
      </svg>

      {bridge && (
        <div
          className="h-1 rounded-full"
          style={{ background: color.stroke, width: size - 4 }}
          aria-hidden="true"
        />
      )}

      {overlayTypes.length > 0 && (
        <div className="flex flex-wrap justify-center gap-0.5" style={{ maxWidth: size }}>
          {overlayTypes.map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => onOverlayClick(type)}
              className="cursor-pointer rounded-sm px-1 text-[9px] leading-tight"
              style={{ background: color.fill, color: color.text }}
            >
              {OVERLAY_BADGE[type]}
            </button>
          ))}
        </div>
      )}

      <button
        type="button"
        onClick={onWholeClick}
        className="text-sm text-muted-foreground hover:text-foreground"
      >
        #{toothNumber}
      </button>
    </div>
  );
}
