"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { AlertTriangle, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SaveFailure {
  id: number;
  label: string;
  message: string;
  run: () => Promise<unknown>;
}

interface SaveTrackerValue {
  pending: number;
  failures: SaveFailure[];
  /**
   * Runs a write and records its outcome. Never throws: a failure is kept
   * (with its `run`) so Retry can repeat it. The UI keeps showing what was
   * intended, so put every state update that depends on the write's result
   * inside `run` - that way Retry reapplies it too.
   */
  track: <T>(label: string, run: () => Promise<T>) => Promise<T | undefined>;
  retryAll: () => void;
}

const SaveTrackerContext = createContext<SaveTrackerValue | null>(null);

function errorMessage(err: unknown) {
  return err instanceof Error && err.message ? err.message : "Unknown error";
}

export function SaveStatusProvider({ children }: { children: ReactNode }) {
  const [pending, setPending] = useState(0);
  const [failures, setFailures] = useState<SaveFailure[]>([]);
  const nextId = useRef(1);
  const failuresRef = useRef<SaveFailure[]>([]);

  useEffect(() => {
    failuresRef.current = failures;
  }, [failures]);

  const track = useCallback(async <T,>(label: string, run: () => Promise<T>) => {
    setPending((n) => n + 1);
    try {
      return await run();
    } catch (err) {
      const failure: SaveFailure = { id: nextId.current++, label, message: errorMessage(err), run };
      setFailures((prev) => [...prev, failure]);
      return undefined;
    } finally {
      setPending((n) => n - 1);
    }
  }, []);

  const retryAll = useCallback(() => {
    const toRetry = failuresRef.current;
    if (toRetry.length === 0) return;
    setFailures([]);
    for (const failure of toRetry) void track(failure.label, failure.run);
  }, [track]);

  // Closing the tab mid-write, or with an unsaved failure, would lose
  // clinical data without a word - ask first.
  const hasUnsaved = pending > 0 || failures.length > 0;
  useEffect(() => {
    if (!hasUnsaved) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [hasUnsaved]);

  const value = useMemo(() => ({ pending, failures, track, retryAll }), [pending, failures, track, retryAll]);
  return <SaveTrackerContext.Provider value={value}>{children}</SaveTrackerContext.Provider>;
}

export function useSaveTracker() {
  const ctx = useContext(SaveTrackerContext);
  if (!ctx) throw new Error("useSaveTracker must be used within SaveStatusProvider");
  return ctx;
}

/** The one place a save's state shows: Saving / Saved / Not saved + Retry. */
export function SaveStatusIndicator({ showWhenIdle }: { showWhenIdle: boolean }) {
  const { pending, failures, retryAll } = useSaveTracker();

  if (failures.length === 0 && pending === 0 && !showWhenIdle) return null;

  if (failures.length > 0) {
    const labels = failures.map((f) => `${f.label} (${f.message})`).join("\n");
    return (
      <div role="alert" className="flex items-center gap-2 text-xs" title={labels}>
        <AlertTriangle className="size-3.5 text-destructive" aria-hidden />
        <span className="font-medium text-destructive">
          {failures.length === 1 ? "Change not saved" : `${failures.length} changes not saved`}
        </span>
        <Button type="button" size="sm" variant="outline" className="h-6 px-2 text-xs" onClick={retryAll}>
          Retry
        </Button>
      </div>
    );
  }

  return (
    <p role="status" aria-live="polite" className="flex items-center gap-1.5 text-xs text-foreground/75">
      {pending > 0 ? (
        <>
          <Loader2 className="size-3.5 animate-spin" aria-hidden />
          Saving…
        </>
      ) : (
        <>
          <Check className="size-3.5 text-success" aria-hidden />
          Saved
        </>
      )}
    </p>
  );
}
