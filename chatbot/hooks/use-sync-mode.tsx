"use client";

import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  readStoredSyncMode,
  type SyncMode,
  writeStoredSyncMode,
} from "@/lib/sync-mode";

type SyncModeContextValue = {
  canUseCloud: boolean;
  hydrated: boolean;
  isLocal: boolean;
  setSyncMode: (mode: SyncMode) => void;
  syncMode: SyncMode;
};

const SyncModeContext = createContext<SyncModeContextValue | null>(null);

export function SyncModeProvider({
  canUseCloud,
  children,
}: {
  canUseCloud: boolean;
  children: ReactNode;
}) {
  const [syncMode, setSyncModeState] = useState<SyncMode>(
    canUseCloud ? "cloud" : "local"
  );
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const stored = readStoredSyncMode();

    if (!canUseCloud) {
      setSyncModeState("local");
    } else if (stored) {
      setSyncModeState(stored);
    }

    setHydrated(true);
  }, [canUseCloud]);

  const setSyncMode = useCallback(
    (mode: SyncMode) => {
      const next = canUseCloud ? mode : "local";
      setSyncModeState(next);
      writeStoredSyncMode(next);
    },
    [canUseCloud]
  );

  const value = useMemo<SyncModeContextValue>(
    () => ({
      canUseCloud,
      hydrated,
      isLocal: syncMode === "local",
      setSyncMode,
      syncMode,
    }),
    [canUseCloud, hydrated, setSyncMode, syncMode]
  );

  return (
    <SyncModeContext.Provider value={value}>
      {children}
    </SyncModeContext.Provider>
  );
}

export function useSyncMode() {
  const context = useContext(SyncModeContext);

  if (!context) {
    throw new Error("useSyncMode must be used within SyncModeProvider");
  }

  return context;
}
