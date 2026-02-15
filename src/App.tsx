import { useEffect, useRef } from "react";
import { Routes, Route, useParams, useNavigate } from "react-router-dom";
import { setupInterceptors } from "./api/client";
import { ConfirmModal } from "./components/auth/ConfirmModal";
import { InviteModal } from "./components/home/InviteModal";
import { InviteFetcher } from "./components/home/InviteFetcher";
import { ShareListModal } from "./components/home/ShareListModal";
import { MainLayout } from "./components/layout/MainLayout";
import { SyncManager } from "./components/sync/SyncManager";
import HomeView from "./components/views/HomeView";
import SingleListView from "./components/views/SingleListView";
import type { AuthState } from "./store/authStore";
import type { ListState } from "./store/listStore";
import type { UIState } from "./store/uiStore";
import { useAuthStore } from "./store/authStore";
import { useListStore } from "./store/listStore";
import { useUIStore } from "./store/uiStore";
import type { TodoList } from "./types";
import { setOnError } from "./utils/notify";

function AppContent() {
  const navigate = useNavigate();
  const { id: listIdFromUrl } = useParams<{ id?: string }>();
  const toastTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const confirmModal = useUIStore((s: UIState) => s.confirmModal);
  const shareListId = useUIStore((s: UIState) => s.shareListId);
  const toast = useUIStore((s: UIState) => s.toast);
  const inviteModal = useUIStore((s: UIState) => s.inviteModal);
  const uiActions = useUIStore((s: UIState) => s.actions);

  const lists = useListStore((s: ListState) => s.lists);
  const deleteList = useListStore((s: ListState) => s.deleteList);
  const leaveList = useListStore((s: ListState) => s.leaveList);
  const clearCompleted = useListStore((s: ListState) => s.clearCompleted);
  const updateListMembers = useListStore((s: ListState) => s.updateListMembers);
  const acceptInvite = useListStore((s: ListState) => s.acceptInvite);

  useEffect(() => {
    setOnError((msg) => {
      if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
      uiActions.showToast(msg, "error");
      toastTimeoutRef.current = setTimeout(() => {
        uiActions.clearToast();
        toastTimeoutRef.current = null;
      }, 3000);
    });
    return () => {
      setOnError(() => {});
      if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    };
  }, [uiActions]);

  const handleConfirmModalConfirm = () => {
    if (!confirmModal.isOpen || !confirmModal.type) return;
    if (
      confirmModal.type === "DELETE_LIST" &&
      "listId" in confirmModal.payload
    ) {
      deleteList(confirmModal.payload.listId);
      navigate("/");
    } else if (
      confirmModal.type === "LEAVE_LIST" &&
      "listId" in confirmModal.payload
    ) {
      void leaveList(confirmModal.payload.listId).then(() => navigate("/"));
    } else if (confirmModal.type === "CLEAR_COMPLETED") {
      if (listIdFromUrl) clearCompleted(listIdFromUrl);
    }
    uiActions.closeConfirm();
  };

  const confirmModalConfig =
    confirmModal.type === "DELETE_LIST"
      ? { title: "Удалить список?", message: "Удалить этот список?" }
      : confirmModal.type === "LEAVE_LIST"
        ? { title: "Выйти из списка?", message: "Выйти из списка?" }
        : confirmModal.type === "CLEAR_COMPLETED"
          ? {
              title: "Очистить завершённые",
              message: "Удалить все завершенные товары?",
            }
          : null;

  const shareList = shareListId
    ? (lists.find((l: TodoList) => l.id === shareListId) ?? null)
    : null;

  return (
    <>
      <SyncManager />
      <InviteFetcher />

      {listIdFromUrl ? <SingleListView /> : <HomeView />}

      <ShareListModal
        list={shareList}
        onClose={() => uiActions.setShareListId(null)}
        onUpdateMembers={updateListMembers}
      />

      {inviteModal.isOpen && inviteModal.invite && (
        <InviteModal
          invite={inviteModal.invite}
          onClose={uiActions.closeInviteModal}
          onAccept={acceptInvite}
          onDecline={async (inviteId, reason) => {
            const { api } = await import("./api/client");
            await api.post(`/api/listo/invites/${inviteId}/decline`, {
              reason,
            });
            uiActions.closeInviteModal();
          }}
          onRemindLater={uiActions.closeInviteModal}
        />
      )}

      {confirmModal.isOpen && confirmModalConfig && (
        <ConfirmModal
          isOpen
          title={confirmModalConfig.title}
          message={confirmModalConfig.message}
          confirmLabel="Да"
          cancelLabel="Отмена"
          onConfirm={handleConfirmModalConfirm}
          onCancel={uiActions.closeConfirm}
        />
      )}

      {toast && (
        <div
          className="fixed bottom-6 left-4 right-4 max-w-md mx-auto bg-slate-800 text-white py-3 px-4 rounded-xl shadow-lg z-[110] animate-in fade-in slide-in-from-bottom-2 duration-200"
          role="alert"
        >
          {toast.msg}
        </div>
      )}
    </>
  );
}

export default function App() {
  const checkAuth = useAuthStore((s: AuthState) => s.checkAuth);

  useEffect(() => {
    checkAuth();
    setupInterceptors(() => {
      useAuthStore.getState().logout();
    });
  }, [checkAuth]);

  return (
    <Routes>
      <Route element={<MainLayout />}>
        <Route path="/" element={<AppContent />} />
        <Route path="/list/:id" element={<AppContent />} />
      </Route>
    </Routes>
  );
}
