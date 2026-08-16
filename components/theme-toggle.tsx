"use client";

import { useSyncExternalStore } from "react";
import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";

function subscribeNoop() {
  return () => {};
}

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  // The server can't know the user's preferred theme, so this button must
  // render inert until hydration completes - useSyncExternalStore's server
  // snapshot diverges from the client one, which is exactly this case.
  const mounted = useSyncExternalStore(
    subscribeNoop,
    () => true,
    () => false,
  );

  if (!mounted) return <div className="size-9" />;

  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label="Toggle theme"
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
    >
      {resolvedTheme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
    </Button>
  );
}
