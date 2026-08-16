"use client";

import Link from "next/link";
import { Settings } from "lucide-react";
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
        </div>
        <div className="flex items-center gap-1">
          <Link
            href="/procedures"
            aria-label="Manage procedure codes"
            title="Manage procedure codes"
            className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <Settings className="size-4" />
          </Link>
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
