import { useEffect } from "react";
import { useParams } from "react-router-dom";
import { api } from "../../api/client";
import type { ListInvite } from "../../types";
import { useAuthStore } from "../../store/authStore";
import { useUIStore } from "../../store/uiStore";

export function InviteFetcher() {
  const user = useAuthStore((s) => s.user);
  const { id: listIdFromUrl } = useParams<{ id?: string }>();
  const openInviteModal = useUIStore((s) => s.actions.openInviteModal);

  useEffect(() => {
    if (!user || listIdFromUrl != null) return;
    let cancelled = false;
    api
      .get<ListInvite[]>("/api/listo/invites")
      .then((data) => {
        if (!cancelled && data.length > 0) {
          openInviteModal(data[0]);
        }
      })
      .catch((e) => console.error("Fetch invites error:", e));
    return () => {
      cancelled = true;
    };
  }, [user, listIdFromUrl, openInviteModal]);

  return null;
}
