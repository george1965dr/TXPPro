"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

/** True on the signed-out screens, which have no rail or header to make room for. */
export function useIsAuthScreen() {
  return usePathname().startsWith("/auth");
}

export function ShellFrame({ children }: { children: ReactNode }) {
  const onAuthScreen = useIsAuthScreen();
  return (
    <div
      className={cn(
        "relative z-10 flex flex-1 flex-col print:pb-0 print:pl-0",
        !onAuthScreen && "pb-24 md:pb-0 md:pl-24",
      )}
    >
      {children}
    </div>
  );
}
