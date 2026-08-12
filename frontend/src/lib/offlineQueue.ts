import { create } from "zustand";
import { persist } from "zustand/middleware";
import { translationService } from "@/services";

export interface QueuedTranslation {
  tempId: string;
  sourceLanguage: string;
  targetLanguage: string;
  sourceText: string;
  targetText: string;
  domain: string;
  queuedAt: string;
}

interface OfflineState {
  queue: QueuedTranslation[];
  lastError: string | null;
  add: (item: QueuedTranslation) => void;
  remove: (tempId: string) => void;
  clear: () => void;
  setLastError: (message: string | null) => void;
}

export const useOfflineQueue = create<OfflineState>()(
  persist(
    (set) => ({
      queue: [],
      lastError: null,
      add: (item) => set((s) => ({ queue: [...s.queue, item] })),
      remove: (tempId) => set((s) => ({ queue: s.queue.filter((q) => q.tempId !== tempId) })),
      clear: () => set({ queue: [] }),
      setLastError: (message) => set({ lastError: message }),
    }),
    { name: "dh_offline_queue" }
  )
);

/**
 * Submit a translation. When online, POST to the API. When offline (no
 * network reachability), enqueue locally so it can be synced later.
 * Returns true if stored successfully (server or offline queue).
 */
export async function submitWithOfflineFallback(input: {
  sourceLanguage: string;
  targetLanguage: string;
  sourceText: string;
  targetText: string;
  domain: string;
}): Promise<{ submitted: boolean; offline: boolean }> {
  if (!navigator.onLine) {
    useOfflineQueue.getState().add({
      tempId: crypto.randomUUID(),
      ...input,
      queuedAt: new Date().toISOString(),
    });
    return { submitted: true, offline: true };
  }

  try {
    await translationService.create({ ...input, status: "pending" });
    return { submitted: true, offline: false };
  } catch {
    // Reached server but failed (auth/validation) — surface to caller; don't queue silently.
    throw new Error("Could not submit translation.");
  }
}

/** Attempt to flush the offline queue to the server. Returns number synced. */
export async function syncOfflineQueue(): Promise<{ synced: number; failed: number }> {
  const { queue, remove, setLastError } = useOfflineQueue.getState();
  if (!navigator.onLine) return { synced: 0, failed: 0 };

  let synced = 0;
  let failed = 0;
  for (const item of queue) {
    try {
      await translationService.create({
        sourceLanguage: item.sourceLanguage,
        targetLanguage: item.targetLanguage,
        sourceText: item.sourceText,
        targetText: item.targetText,
        domain: item.domain,
        status: "pending",
      });
      remove(item.tempId);
      synced++;
    } catch {
      failed++;
    }
  }
  if (failed > 0) setLastError(`${failed} item(s) could not be synced.`);
  else setLastError(null);
  return { synced, failed };
}