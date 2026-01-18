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
    const intervalId = setInterval(() => {
      if (navigator.onLine) {
        syncRef.current(activeListId || undefined);
      }
    }, 15000);

    return () => {
      clearInterval(intervalId);
    };
  }, [activeListId]);
}
