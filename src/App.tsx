import { useEffect, useRef, useState } from "react";
import { Routes, Route, useParams, useNavigate } from "react-router-dom";
import { ConfirmModal } from "./components/auth/ConfirmModal";
import { InstallPrompt } from "./components/pwa/InstallPrompt";
import { InviteModal } from "./components/home/InviteModal";
import { ShareListModal } from "./components/home/ShareListModal";
import HomeView from "./components/views/HomeView";
import SingleListView from "./components/views/SingleListView";
import { AuthProvider } from "./context/AuthContext";
import { useAuth } from "./hooks/useAuth";
import { useAutoSync } from "./hooks/useAutoSync";
import { useInvites } from "./hooks/useInvites";
import { useLists } from "./hooks/useLists";
import { setOnError, setOnUnauthorized } from "./utils/notify";

type ConfirmState =
  | { type: "deleteList"; id: string }
  | { type: "leaveList"; id: string }
  | { type: "clearCompleted" }
  | null;

function AppContent() {
  const { user, logout } = useAuth();
  const { id: listIdFromUrl } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const [shareListId, setShareListId] = useState<string | null>(null);
  const [confirmState, setConfirmState] = useState<ConfirmState>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const toastTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setOnUnauthorized(() => logout());
    setOnError((msg) => {
      if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
      setToastMessage(msg);
      toastTimeoutRef.current = setTimeout(() => setToastMessage(null), 3000);
    });
    return () => {
      setOnUnauthorized(null);
      setOnError(() => {});
      if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    };
  }, [logout]);

  const {
    lists,
    activeListId,
    setActiveListId,
    activeList,
    handleSync,
    createList,
    deleteList,
    handleLeaveList,
    handleUpdateListMembers,
    renameList,
    reorderLists,
    handleAddItem,
    handleDeleteItem,
    handleUpdateItem,
    handleClearCompleted,
    clearLists,
  } = useLists();

  useEffect(() => {
    setActiveListId(listIdFromUrl ?? null);
  }, [listIdFromUrl, setActiveListId]);

  useAutoSync(activeListId, handleSync);

  useEffect(() => {
    if (user) {
      handleSync();
    }
  }, [user, handleSync]);

  const {
    invites,
    showInviteModal,
    setShowInviteModal,
    handleInviteAccept,
    handleInviteDecline,
  } = useInvites(user, activeListId, handleSync);

  const handleDeleteListWithConfirm = (id: string) => {
    setConfirmState({ type: "deleteList", id });
  };

  const handleLeaveListWithConfirm = (id: string) => {
    setConfirmState({ type: "leaveList", id });
  };

  const handleSelectList = (id: string) => {
    setActiveListId(id);
    navigate(`/list/${id}`);
  };

  const handleBackFromList = () => {
    setActiveListId(null);
    navigate("/");
  };

  const handleConfirmModalConfirm = () => {
    if (!confirmState) return;
    if (confirmState.type === "deleteList") {
      deleteList(confirmState.id);
      navigate("/");
    } else if (confirmState.type === "leaveList") {
      void handleLeaveList(confirmState.id).then(() => navigate("/"));
    } else if (confirmState.type === "clearCompleted") {
      handleClearCompleted();
    }
    setConfirmState(null);
  };

  const confirmModalConfig =
    confirmState?.type === "deleteList"
      ? { title: "Удалить список?", message: "Удалить этот список?" }
      : confirmState?.type === "leaveList"
        ? { title: "Выйти из списка?", message: "Выйти из списка?" }
        : confirmState?.type === "clearCompleted"
          ? {
              title: "Очистить завершённые",
              message: "Удалить все завершенные товары?",
            }
          : null;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans pb-safe overflow-hidden touch-pan-y">
      <div className="h-1 w-full bg-slate-50 sticky top-0 z-50"></div>

      {activeListId && activeList ? (
        <SingleListView
          list={activeList}
          onBack={handleBackFromList}
          onAddItem={handleAddItem}
          onDeleteItem={handleDeleteItem}
          onUpdateItem={handleUpdateItem}
          onRequestClearCompleted={() => setConfirmState({ type: "clearCompleted" })}
          onShare={
            user && activeList.ownerId === user.userId
              ? () => setShareListId(activeListId)
              : undefined
          }
        />
      ) : (
        <HomeView
          lists={lists}
          onCreateList={createList}
          onSelectList={handleSelectList}
          onDeleteList={handleDeleteListWithConfirm}
          onLeaveList={handleLeaveListWithConfirm}
          onRenameList={renameList}
          onOpenShare={setShareListId}
          onClearLists={clearLists}
          onReorderLists={reorderLists}
        />
      )}

      <ShareListModal
        list={
          shareListId ? lists.find((l) => l.id === shareListId) ?? null : null
        }
        onClose={() => setShareListId(null)}
        onUpdateMembers={handleUpdateListMembers}
      />

      {showInviteModal && invites[0] && (
        <InviteModal
          invite={invites[0]}
          onClose={() => setShowInviteModal(false)}
          onAccept={handleInviteAccept}
          onDecline={handleInviteDecline}
          onRemindLater={() => setShowInviteModal(false)}
        />
      )}

      {confirmState && confirmModalConfig && (
        <ConfirmModal
          isOpen
          title={confirmModalConfig.title}
          message={confirmModalConfig.message}
          confirmLabel="Да"
          cancelLabel="Отмена"
          onConfirm={handleConfirmModalConfirm}
          onCancel={() => setConfirmState(null)}
        />
      )}

      {toastMessage && (
        <div
          className="fixed bottom-6 left-4 right-4 max-w-md mx-auto bg-slate-800 text-white py-3 px-4 rounded-xl shadow-lg z-[110] animate-in fade-in slide-in-from-bottom-2 duration-200"
          role="alert"
        >
          {toastMessage}
        </div>
      )}

      <InstallPrompt />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<AppContent />} />
        <Route path="/list/:id" element={<AppContent />} />
      </Routes>
    </AuthProvider>
  );
}
