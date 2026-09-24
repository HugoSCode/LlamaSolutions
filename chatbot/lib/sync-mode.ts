export const SYNC_MODE_STORAGE_KEY = "llama.sync-mode";

export type SyncMode = "local" | "cloud";

export function isSyncMode(value: unknown): value is SyncMode {
  return value === "local" || value === "cloud";
}

export function readStoredSyncMode(): SyncMode | null {
  if (typeof window === "undefined") {
    return null;
  }

  const stored = window.localStorage.getItem(SYNC_MODE_STORAGE_KEY);
  return isSyncMode(stored) ? stored : null;
}

export function writeStoredSyncMode(mode: SyncMode) {
  window.localStorage.setItem(SYNC_MODE_STORAGE_KEY, mode);
}
