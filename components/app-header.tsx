"use client";

import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";
import { SettingsDialog } from "@/components/settings-dialog";
import { useHeaderInfo } from "@/components/header-context";

interface AppHeaderProps {
  initialPracticeName: string;
  initialPracticeAddress: string;
}

export function AppHeader({ initialPracticeName, initialPracticeAddress }: AppHeaderProps) {
  const { info } = useHeaderInfo();

  return (
    <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/80 print:hidden">
      <div className="mx-auto flex h-14 w-full max-w-4xl items-center justify-between px-8">
        <div className="flex items-center gap-6">
          <Link href="/patients" className="flex items-baseline gap-2">
            {initialPracticeName ? (
              <>
                <span className="text-sm font-medium tracking-tight">{initialPracticeName}</span>
                <span className="text-base font-medium text-muted-foreground">
                  TXP <span className="text-primary">Pro</span>
                </span>
              </>
            ) : (
              <span className="text-xl font-semibold tracking-tight">
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
          <SettingsDialog
            initialPracticeName={initialPracticeName}
            initialPracticeAddress={initialPracticeAddress}
          />
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
