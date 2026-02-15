import { useEffect } from "react";
import { useInterval } from "../../hooks/useInterval";
import { useOnFocus } from "../../hooks/useOnFocus";
import { useAuthStore } from "../../store/authStore";
import { useListStore } from "../../store/listStore";

const SYNC_INTERVAL_MS = 30_000;

export function SyncManager() {
  const user = useAuthStore((s) => s.user);
  const syncWithServer = useListStore((s) => s.syncWithServer);

  useEffect(() => {
    if (user) {
      void syncWithServer();
    }
  }, [user, syncWithServer]);

  useInterval(
    () => {
      if (user && document.visibilityState === "visible") {
        void syncWithServer();
      }
    },
    user ? SYNC_INTERVAL_MS : null
  );

  useOnFocus(() => {
    if (user) {
      void syncWithServer();
    }
  });

  return null;
}
