import { useEffect, useRef } from "react";

export const AUTO_SYNC_INTERVAL_MS = 15_000;

export function useAutoSync(
  activeListId: string | null,
  syncFunction: (listId?: string) => void | Promise<void>
) {
  const syncRef = useRef(syncFunction);

  useEffect(() => {
    syncRef.current = syncFunction;
  }, [syncFunction]);

  useEffect(() => {
    if (activeListId) {
      void syncRef.current(activeListId);
    } else {
      void syncRef.current();
    }
  }, [activeListId]);

  useEffect(() => {
    const intervalId = setInterval(() => {
      if (navigator.onLine) {
        void syncRef.current(activeListId || undefined);
      }
    }, AUTO_SYNC_INTERVAL_MS);

    return () => {
      clearInterval(intervalId);
    };
  }, [activeListId]);
}
