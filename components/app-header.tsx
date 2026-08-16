"use client";

import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";
import { useHeaderInfo } from "@/components/header-context";

export function AppHeader() {
  const { info } = useHeaderInfo();

  return (
    <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/80">
      <div className="mx-auto flex h-14 w-full max-w-4xl items-center justify-between px-8">
        <div className="flex items-center gap-6">
          <Link href="/patients" className="text-sm font-medium tracking-tight">
            TXP <span className="text-primary">Pro</span>
          </Link>
          {info && (
            <div className="flex items-center gap-1.5 text-sm">
              <span className="text-muted-foreground">/</span>
              <span className="font-medium">{info.patientName}</span>
              <span className="text-muted-foreground">/</span>
              <span className="text-muted-foreground">{info.tabLabel}</span>
            </div>
          )}
          <Link href="/procedures" className="text-sm text-muted-foreground hover:text-foreground">
            Procedures
          </Link>
        </div>
        <ThemeToggle />
      </div>
    </header>
  );
}
