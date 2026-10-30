"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ListChecks, Users } from "lucide-react";
import { SettingsDialog } from "@/components/settings-dialog";
import { ThemeToggle } from "@/components/theme-toggle";
import { useIsAuthScreen } from "@/components/shell-frame";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/patients", label: "Patients", icon: Users },
  { href: "/procedures", label: "Procedures", icon: ListChecks },
] as const;

const circle =
  "grid size-11 shrink-0 place-items-center rounded-full text-foreground transition-colors outline-none hover:bg-foreground/10 focus-visible:ring-2 focus-visible:ring-ring";

interface AppRailProps {
  practiceName: string;
  practiceAddress: string;
}

export function AppRail({ practiceName, practiceAddress }: AppRailProps) {
  const pathname = usePathname();
  const onAuthScreen = useIsAuthScreen();

  if (onAuthScreen) return null;

  return (
    <nav
      aria-label="Main"
      className="panel fixed bottom-3 left-1/2 z-20 flex -translate-x-1/2 flex-row items-center gap-1.5 rounded-full p-1.5 md:inset-y-4 md:bottom-auto md:left-4 md:w-[4.25rem] md:translate-x-0 md:flex-col md:py-3 print:hidden"
    >
      <Link
        href="/patients"
        aria-label="TXP Pro home"
        className="hidden size-11 shrink-0 place-items-center rounded-full bg-navy text-sm font-semibold tracking-tight text-navy-foreground md:grid"
      >
        Tx
      </Link>
      <div className="flex flex-row gap-1.5 md:mt-4 md:flex-col">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(`${href}/`);
          return (
            <Link
              key={href}
              href={href}
              aria-label={label}
              aria-current={active ? "page" : undefined}
              title={label}
              className={cn(circle, active && "bg-navy text-navy-foreground hover:bg-navy")}
            >
              <Icon className="size-[1.15rem]" />
            </Link>
          );
        })}
      </div>
      <div className="flex flex-row gap-1.5 md:mt-auto md:flex-col">
        <SettingsDialog
          initialPracticeName={practiceName}
          initialPracticeAddress={practiceAddress}
          triggerClassName={circle}
        />
        <ThemeToggle className={cn(circle, "size-11 p-0")} />
      </div>
    </nav>
  );
}
