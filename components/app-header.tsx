"use client";

import Link from "next/link";
import { useHeaderInfo } from "@/components/header-context";
import { SaveStatusIndicator } from "@/components/save-status";
import { useIsAuthScreen } from "@/components/shell-frame";

interface AppHeaderProps {
  practiceName: string;
}

// Text here sits straight on the gradient canvas, which holds 4.5:1 only for
// full-strength foreground text, so nothing in this strip uses muted-foreground.
export function AppHeader({ practiceName }: AppHeaderProps) {
  const { info } = useHeaderInfo();
  const onAuthScreen = useIsAuthScreen();

  if (onAuthScreen) return null;

  return (
    <header className="sticky top-0 z-10 bg-background/40 backdrop-blur-xl md:-ml-24 md:pl-24 print:hidden">
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between px-8">
        <div className="flex items-center gap-4">
          <Link href="/patients" className="flex items-baseline gap-2">
            {practiceName ? (
              <>
                <span className="text-sm font-medium tracking-tight">{practiceName}</span>
                <span className="text-sm font-medium text-foreground/70">
                  TXP <span className="text-primary">Pro</span>
                </span>
              </>
            ) : (
              <span className="text-lg font-semibold tracking-tight">
                TXP <span className="text-primary">Pro</span>
              </span>
            )}
          </Link>
          {info && (
            <div className="flex items-center gap-1.5 text-sm">
              <span className="text-foreground/60">/</span>
              <span className="font-medium">{info.patientName}</span>
              <span className="text-foreground/60">/</span>
              <span className="text-foreground/80">{info.tabLabel}</span>
            </div>
          )}
        </div>
        <SaveStatusIndicator showWhenIdle={!!info} />
      </div>
    </header>
  );
}
