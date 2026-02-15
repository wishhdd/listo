import { useEffect } from "react";
import { useParams } from "react-router-dom";
import { useInterval } from "../../hooks/useInterval";
import { useOnFocus } from "../../hooks/useOnFocus";
import { useAuthStore } from "../../store/authStore";
import { useListStore } from "../../store/listStore";

const SYNC_INTERVAL_MS = 30_000;
const SYNC_INTERVAL_SHARED_LIST_MS = 5_000;

export function SyncManager() {
  const user = useAuthStore((s) => s.user);
  const syncWithServer = useListStore((s) => s.syncWithServer);
  const lists = useListStore((s) => s.lists);
  const { id: listIdFromUrl } = useParams<{ id?: string }>();

  const currentList = listIdFromUrl
    ? lists.find((l) => l.id === listIdFromUrl)
    : null;
  const hasOtherParticipants =
    currentList &&
    ((currentList.members?.length ?? 0) > 0 || currentList.ownerId !== user?.userId);
  const intervalMs =
    user && listIdFromUrl && hasOtherParticipants
      ? SYNC_INTERVAL_SHARED_LIST_MS
      : user
        ? SYNC_INTERVAL_MS
        : null;

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
    intervalMs
  );

  useOnFocus(() => {
    if (user) {
      void syncWithServer();
    }
  });

  return null;
}
