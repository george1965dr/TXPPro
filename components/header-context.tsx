"use client";

import { createContext, useContext, useMemo, useState, type ReactNode } from "react";

export interface HeaderInfo {
  patientName: string;
  tabLabel: string;
}

interface HeaderContextValue {
  info: HeaderInfo | null;
  setInfo: (info: HeaderInfo | null) => void;
}

const HeaderContext = createContext<HeaderContextValue | null>(null);

/**
 * Lets a page deep in the tree (the patient workspace) tell the sticky
 * top-level AppHeader what to show - the patient's name and which of
 * Chart/Perio/Sequence/Photos is active - so that's visible even after
 * scrolling past the in-page tab bar. Pages that don't set it (Patients
 * list, Procedures) leave the header at its default.
 */
export function HeaderProvider({ children }: { children: ReactNode }) {
  const [info, setInfo] = useState<HeaderInfo | null>(null);
  const value = useMemo(() => ({ info, setInfo }), [info]);
  return <HeaderContext.Provider value={value}>{children}</HeaderContext.Provider>;
}

export function useHeaderInfo() {
  const ctx = useContext(HeaderContext);
  if (!ctx) throw new Error("useHeaderInfo must be used within HeaderProvider");
  return ctx;
}
