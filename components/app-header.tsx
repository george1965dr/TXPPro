"use client";

import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";
import { SettingsDialog } from "@/components/settings-dialog";
import { useHeaderInfo } from "@/components/header-context";

export function AppHeader({ initialPracticeName }: { initialPracticeName: string }) {
  const { info } = useHeaderInfo();

  return (
    <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/80">
      <div className="mx-auto flex h-14 w-full max-w-4xl items-center justify-between px-8">
        <div className="flex items-center gap-6">
          <Link href="/patients" className="flex items-baseline gap-2">
            {initialPracticeName ? (
              <>
                <span className="text-sm font-medium tracking-tight">{initialPracticeName}</span>
                <span className="text-xs text-muted-foreground">TXP Pro</span>
              </>
            ) : (
              <span className="text-sm font-medium tracking-tight">
                TXP <span className="text-primary">Pro</span>
              </span>
            )}
          </Link>
          {info && (
            <div className="flex items-center gap-1.5 text-sm">
              <span className="text-muted-foreground">/</span>
              <span className="font-medium">{info.patientName}</span>
              <span className="text-muted-foreground">/</span>
              <span className="text-muted-foreground">{info.tabLabel}</span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-1">
          <SettingsDialog initialPracticeName={initialPracticeName} />
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
