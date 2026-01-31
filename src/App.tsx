import { useCallback, useEffect, useMemo, useState } from "react";
import { api } from "./api/client";
import { InstallPrompt } from "./components/pwa/InstallPrompt";
import { InviteModal } from "./components/home/InviteModal";
import { ShareListModal } from "./components/home/ShareListModal";
import HomeView from "./components/views/HomeView";
import SingleListView from "./components/views/SingleListView";
import { AuthProvider } from "./context/AuthContext";
import { useAuth } from "./hooks/useAuth";
import { useAutoSync } from "./hooks/useAutoSync";
import { useLocalStorage } from "./hooks/useLocalStorage";
import { useSync } from "./hooks/useSync";
import {
  type InviteDeclineReason,
  type ListInvite,
  type TodoItem,
  type TodoList,
} from "./types";
import { generateId } from "./utils/generateId";
import { mergeItemsByNewer } from "./utils/mergeItemsByNewer";
import { getRandomColor } from "./utils/theme";

const initialData: TodoList[] = [];

function AppContent() {
  const { user } = useAuth();
  const [lists, setLists] = useLocalStorage<TodoList[]>("listo", initialData);
  const [activeListId, setActiveListId] = useState<string | null>(null);
  const [shareListId, setShareListId] = useState<string | null>(null);
  const [invites, setInvites] = useState<ListInvite[]>([]);
  const [showInviteModal, setShowInviteModal] = useState(false);

  const {
    syncLists,
    syncItems,
    pushItem,
    deleteItemRemote,
    pushList,
    deleteListRemote,
    leaveList,
  } = useSync();

  const handleSync = useCallback(
    async (listId?: string) => {
      if (!user) return;

      if (listId) {
        const currentList = lists.find((l) => l.id === listId);
        if (!currentList) return;
        const syncedItems = await syncItems(listId, currentList.items);
        setLists((prev) =>
          prev.map((l) =>
            l.id === listId
              ? { ...l, items: mergeItemsByNewer(l.items, syncedItems) }
              : l
          )
        );
      } else {
        const syncedLists = await syncLists(lists);
        const fullyLoadedLists = await Promise.all(
          syncedLists.map(async (list) => {
            const realItems = await syncItems(list.id, list.items);
            return { ...list, items: realItems };
          })
        );
        setLists((prev) => {
          const listIdsInPrev = new Set(prev.map((l) => l.id));
          const merged = prev.map((prevList) => {
            const syncedList = fullyLoadedLists.find(
              (s) => s.id === prevList.id
            );
            if (!syncedList) return prevList;
            return {
              ...syncedList,
              items: mergeItemsByNewer(prevList.items, syncedList.items),
            };
          });
          const onlyOnServer = fullyLoadedLists.filter(
            (s) => !listIdsInPrev.has(s.id)
          );
          return [...merged, ...onlyOnServer];
        });
      }
    },
    [user, lists, syncLists, syncItems, setLists]
  );

  useAutoSync(activeListId, handleSync);

  useEffect(() => {
    if (user) {
      handleSync();
    }
  }, [user, handleSync]);

  useEffect(() => {
    if (!user || activeListId !== null) return;
    let cancelled = false;
    api
      .get<ListInvite[]>("/api/listo/invites")
      .then((data) => {
        if (!cancelled) {
          setInvites(data);
          if (data.length > 0) setShowInviteModal(true);
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
      await handleSync();
    },
    [handleSync]
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

  const activeList = useMemo(
    () => lists.find((l) => l.id === activeListId),
    [lists, activeListId]
  );

  const createList = (title: string) => {
    const sortedLists = [...lists].sort((a, b) => {
      const posA = a.position ?? a.createdAt;
      const posB = b.position ?? b.createdAt;
      return posA - posB;
    });

    const firstList = sortedLists[0];
    const firstPos = firstList
      ? firstList.position ?? firstList.createdAt
      : Date.now();

    const newList: TodoList = {
      id: generateId(),
      title,
      items: [],
      themeColor: getRandomColor(),
      createdAt: Date.now(),
      updatedAt: Date.now(),
      position: firstPos - 1024,
      ownerId: user?.userId,
      members: user ? [] : undefined,
    };
    setLists([newList, ...lists]);
    setActiveListId(newList.id);
    pushList(newList);
  };

  const deleteList = (id: string) => {
    if (confirm("Удалить этот список?")) {
      setLists(lists.filter((l) => l.id !== id));
      if (activeListId === id) {
        setActiveListId(null);
      }
      deleteListRemote(id);
    }
  };

  const handleLeaveList = async (id: string) => {
    if (!confirm("Выйти из списка?")) return;
    try {
      await leaveList(id);
      setLists((prev) => prev.filter((l) => l.id !== id));
      if (activeListId === id) {
        setActiveListId(null);
      }
    } catch {
      // Error already logged in useSync
    }
  };

  const handleUpdateListMembers = (id: string, members: number[]) => {
    const list = lists.find((l) => l.id === id);
    if (!list) return;
    const updated = { ...list, members, updatedAt: Date.now() };
    setLists((prev) => prev.map((l) => (l.id === id ? updated : l)));
    pushList(updated);
  };

  const renameList = (id: string, newTitle: string) => {
    const updatedList = lists.find((l) => l.id === id);
    if (!updatedList) return;

    const newList = { ...updatedList, title: newTitle, updatedAt: Date.now() };
    setLists(lists.map((list) => (list.id === id ? newList : list)));
    pushList(newList);
  };

  const reorderLists = (sourceIndex: number, destinationIndex: number) => {
    const sortedLists = [...lists].sort((a, b) => {
      const posA = a.position ?? a.createdAt;
      const posB = b.position ?? b.createdAt;
      return posA - posB;
    });

    const reorderedList = Array.from(sortedLists);
    const [removed] = reorderedList.splice(sourceIndex, 1);
    reorderedList.splice(destinationIndex, 0, removed);

    let newPosition = 0;

    if (destinationIndex === 0) {
      const first = reorderedList[1];
      newPosition = (first?.position ?? first?.createdAt ?? 0) - 1024;
    } else if (destinationIndex === reorderedList.length - 1) {
      const last = reorderedList[destinationIndex - 1];
      newPosition = (last?.position ?? last?.createdAt ?? 0) + 1024;
    } else {
      const prev = reorderedList[destinationIndex - 1];
      const next = reorderedList[destinationIndex + 1];
      const prevPos = prev?.position ?? prev?.createdAt ?? 0;
      const nextPos = next?.position ?? next?.createdAt ?? 0;
      newPosition = (prevPos + nextPos) / 2;
    }

    const updatedList = {
      ...removed,
      position: newPosition,
      updatedAt: Date.now(),
    };

    setLists(
      lists.map((list) => (list.id === removed.id ? updatedList : list))
    );
    pushList(updatedList);
  };

  const handleAddItem = (text: string) => {
    if (!activeListId) return;

    const currentItems = lists.find((l) => l.id === activeListId)?.items || [];
    const minPosition =
      currentItems.length > 0
        ? Math.min(...currentItems.map((i) => i.position))
        : 0;

    const newItem: TodoItem = {
      id: generateId(),
      text,
      completed: false,
      position: minPosition - 1024,
      updatedAt: Date.now(),
    };

    setLists((prev) =>
      prev.map((list) => {
        if (list.id !== activeListId) return list;
        return {
          ...list,
          items: [newItem, ...list.items],
          updatedAt: Date.now(),
        };
      })
    );

    pushItem(activeListId, newItem);
  };

  const handleDeleteItem = (itemId: string) => {
    if (!activeListId) return;
    setLists((prev) =>
      prev.map((list) => {
        if (list.id !== activeListId) return list;
        return {
          ...list,
          items: list.items.filter((i) => i.id !== itemId),
          updatedAt: Date.now(),
        };
      })
    );
    deleteItemRemote(itemId);
  };

  const handleUpdateItem = (itemId: string, updates: Partial<TodoItem>) => {
    if (!activeListId) return;

    const currentList = lists.find((l) => l.id === activeListId);
    if (!currentList) return;

    const itemToUpdate = currentList.items.find((i) => i.id === itemId);
    if (!itemToUpdate) return;

    const updatedItemFull: TodoItem = {
      ...itemToUpdate,
      ...updates,
      updatedAt: Date.now(),
    };

    setLists((prev) =>
      prev.map((list) => {
        if (list.id !== activeListId) {
          return list;
        }
        const newItems = list.items.map((item) => {
          if (item.id !== itemId) return item;
          return updatedItemFull;
        });
        return { ...list, items: newItems, updatedAt: Date.now() };
      })
    );
    pushItem(activeListId, updatedItemFull);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans pb-safe overflow-hidden touch-pan-y">
      <div className="h-1 w-full bg-slate-50 sticky top-0 z-50"></div>

      {activeListId && activeList ? (
        <SingleListView
          list={activeList}
          onBack={() => setActiveListId(null)}
          onAddItem={handleAddItem}
          onDeleteItem={handleDeleteItem}
          onUpdateItem={handleUpdateItem}
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
          onSelectList={setActiveListId}
          onDeleteList={deleteList}
          onLeaveList={handleLeaveList}
          onRenameList={renameList}
          onOpenShare={setShareListId}
          onClearLists={() => {
            setLists([]);
            setActiveListId(null);
          }}
          onReorderLists={reorderLists}
        />
      )}

      <ShareListModal
        list={
          shareListId ? lists.find((l) => l.id === shareListId) ?? null : null
        }
        onClose={() => setShareListId(null)}
        onUpdateMembers={(id, members) => handleUpdateListMembers(id, members)}
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

      <InstallPrompt />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
