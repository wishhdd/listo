import { useCallback, useMemo, useState } from "react";
import type { TodoItem, TodoList } from "../types";
import { generateId } from "../utils/generateId";
import { mergeItemsByNewer } from "../utils/mergeItemsByNewer";
import { sortListsByPosition } from "../utils/sortListsByPosition";
import { getRandomColor } from "../utils/theme";
import { useAuth } from "./useAuth";
import { useLocalStorage } from "./useLocalStorage";
import { useSync } from "./useSync";

const initialData: TodoList[] = [];

export function useLists() {
  const { user } = useAuth();
  const [lists, setLists] = useLocalStorage<TodoList[]>("listo", initialData);
  const [activeListId, setActiveListId] = useState<string | null>(null);

  const {
    syncLists,
    syncItems,
    pushItem,
    deleteItemRemote,
    pushList,
    deleteListRemote,
    leaveList: leaveListRemote,
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

  const activeList = useMemo(
    () => lists.find((l) => l.id === activeListId),
    [lists, activeListId]
  );

  const createList = useCallback(
    (title: string) => {
      const sortedLists = sortListsByPosition(lists);
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
    },
    [lists, user, setLists, pushList]
  );

  const deleteList = useCallback(
    (id: string) => {
      setLists((prev) => prev.filter((l) => l.id !== id));
      setActiveListId((prev) => (prev === id ? null : prev));
      deleteListRemote(id);
    },
    [setLists, deleteListRemote]
  );

  const handleLeaveList = useCallback(
    async (id: string) => {
      try {
        await leaveListRemote(id);
        setLists((prev) => prev.filter((l) => l.id !== id));
        setActiveListId((prev) => (prev === id ? null : prev));
      } catch {
        // Error already logged in useSync
      }
    },
    [leaveListRemote, setLists]
  );

  const handleUpdateListMembers = useCallback(
    (id: string, members: number[]) => {
      const list = lists.find((l) => l.id === id);
      if (!list) return;
      const updated = { ...list, members, updatedAt: Date.now() };
      setLists((prev) => prev.map((l) => (l.id === id ? updated : l)));
      pushList(updated);
    },
    [lists, setLists, pushList]
  );

  const renameList = useCallback(
    (id: string, newTitle: string) => {
      const updatedList = lists.find((l) => l.id === id);
      if (!updatedList) return;
      const newList = { ...updatedList, title: newTitle, updatedAt: Date.now() };
      setLists((prev) => prev.map((list) => (list.id === id ? newList : list)));
      pushList(newList);
    },
    [lists, setLists, pushList]
  );

  const reorderLists = useCallback(
    (sourceIndex: number, destinationIndex: number) => {
      const sortedLists = sortListsByPosition(lists);
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
      setLists((prev) =>
        prev.map((list) => (list.id === removed.id ? updatedList : list))
      );
      pushList(updatedList);
    },
    [lists, setLists, pushList]
  );

  const handleAddItem = useCallback(
    (text: string) => {
      if (!activeListId) return;
      const currentItems =
        lists.find((l) => l.id === activeListId)?.items || [];
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
    },
    [activeListId, lists, setLists, pushItem]
  );

  const handleDeleteItem = useCallback(
    (itemId: string) => {
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
    },
    [activeListId, setLists, deleteItemRemote]
  );

  const handleUpdateItem = useCallback(
    (itemId: string, updates: Partial<TodoItem>) => {
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
          if (list.id !== activeListId) return list;
          const newItems = list.items.map((item) =>
            item.id !== itemId ? item : updatedItemFull
          );
          return { ...list, items: newItems, updatedAt: Date.now() };
        })
      );
      pushItem(activeListId, updatedItemFull);
    },
    [activeListId, lists, setLists, pushItem]
  );

  const clearLists = useCallback(() => {
    setLists([]);
    setActiveListId(null);
  }, [setLists]);

  const handleClearCompleted = useCallback(() => {
    if (!activeListId) return;
    const list = lists.find((l) => l.id === activeListId);
    if (!list) return;
    list.items
      .filter((i) => i.completed)
      .forEach((i) => handleDeleteItem(i.id));
  }, [activeListId, lists, handleDeleteItem]);

  return {
    lists,
    setLists,
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
  };
}
