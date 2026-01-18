import { useEffect, useRef } from "react";

export function useAutoSync(
  activeListId: string | null,
  syncFunction: (listId?: string) => void
) {
  const syncRef = useRef(syncFunction);

  useEffect(() => {
    syncRef.current = syncFunction;
  }, [syncFunction]);

  useEffect(() => {
    if (activeListId) {
      syncRef.current(activeListId);
    } else {
      syncRef.current();
    }
  }, [activeListId]);

  useEffect(() => {
    if (!activeListId) return;

    const intervalId = setInterval(() => {
      if (navigator.onLine) {
        console.log(`[Sync] 🔄 Фоновое обновление...`);
        syncRef.current(activeListId);
      }
    }, 15000);

    return () => {
      clearInterval(intervalId);
    };
  }, [activeListId]);
}
