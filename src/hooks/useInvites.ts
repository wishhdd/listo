import { useCallback, useEffect, useState } from "react";
import { api } from "../api/client";
import type { InviteDeclineReason, ListInvite } from "../types";

export function useInvites(
  user: { userId: number } | null,
  activeListId: string | null,
  onSync: () => void | Promise<void>
) {
  const [invites, setInvites] = useState<ListInvite[]>([]);
  const [showInviteModal, setShowInviteModal] = useState(false);

  useEffect(() => {
    if (!user || activeListId !== null) return;
    let cancelled = false;
    api
      .get<ListInvite[]>("/api/listo/invites")
      .then((data) => {
        if (!cancelled) {
          setInvites(data);
          setShowInviteModal(data.length > 0);
        }
      })
      .catch((e) => console.error("Fetch invites error:", e));
    return () => {
      cancelled = true;
    };
  }, [user, activeListId]);

  const handleInviteAccept = useCallback(
    async (inviteId: number) => {
      await api.post(`/api/listo/invites/${inviteId}/accept`, {});
      setInvites((prev) => {
        const next = prev.filter((i) => i.inviteId !== inviteId);
        setShowInviteModal(next.length > 0);
        return next;
      });
      await onSync();
    },
    [onSync]
  );

  const handleInviteDecline = useCallback(
    async (inviteId: number, reason: InviteDeclineReason) => {
      await api.post(`/api/listo/invites/${inviteId}/decline`, { reason });
      setInvites((prev) => {
        const next = prev.filter((i) => i.inviteId !== inviteId);
        setShowInviteModal(next.length > 0);
        return next;
      });
    },
    []
  );

  return {
    invites,
    showInviteModal,
    setShowInviteModal,
    handleInviteAccept,
    handleInviteDecline,
  };
}
