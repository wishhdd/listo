import { useCallback } from "react";
import { api } from "../api/client";
import type { TodoItem, TodoList } from "../types";
import { useAuth } from "./useAuth";

export function useSync() {
  const { user } = useAuth();

  const syncLists = useCallback(
    async (localLists: TodoList[]) => {
      if (!user) return localLists;

      try {
        const serverLists = await api.get<TodoList[]>("/api/listo");
        const mergedLists = [...localLists];

        for (const sList of serverLists) {
          const localIndex = mergedLists.findIndex((l) => l.id === sList.id);
          const localList = mergedLists[localIndex];

          if (!localList) {
            mergedLists.push({ ...sList, items: [] });
          } else {
            if (sList.updatedAt > localList.updatedAt) {
              mergedLists[localIndex] = {
                ...localList,
                title: sList.title,
                themeColor: sList.themeColor,
                ownerId: sList.ownerId,
                members: sList.members,
                updatedAt: sList.updatedAt,
              };
            } else if (localList.updatedAt > sList.updatedAt) {
              await api.post("/api/listo", localList);
            }
          }
        }
        for (const lList of mergedLists) {
          const existsOnServer = serverLists.find((s) => s.id === lList.id);
          if (!existsOnServer) {
            if (!lList.ownerId || lList.ownerId === user.userId) {
              await api.post("/api/listo", lList);
            } else {
              const idx = mergedLists.indexOf(lList);
              if (idx > -1) mergedLists.splice(idx, 1);
            }
          }
        }
        return mergedLists;
      } catch (e) {
        console.error("Sync Lists Error:", e);
        return localLists;
      }
    },
    [user]
  );

  const syncItems = useCallback(
    async (listId: string, localItems: TodoItem[]) => {
      if (!user) return localItems;

      try {
        const serverItems = await api.get<TodoItem[]>(
          `/api/listo/${listId}/items`
        );
        const mergedItems = [...localItems];

        for (const sItem of serverItems) {
          const localIndex = mergedItems.findIndex((i) => i.id === sItem.id);
          const localItem = mergedItems[localIndex];

          if (!localItem) {
            mergedItems.push(sItem);
          } else {
            if (sItem.updatedAt > (localItem.updatedAt || 0)) {
              mergedItems[localIndex] = sItem;
            } else if ((localItem.updatedAt || 0) > sItem.updatedAt) {
              await api.post("/api/listo/item", {
                ...localItem,
                list_id: listId,
              });
            }
          }
        }

        for (const lItem of mergedItems) {
          const existsOnServer = serverItems.find((s) => s.id === lItem.id);
          if (!existsOnServer) {
            await api.post("/api/listo/item", {
              ...lItem,
              list_id: listId,
            });
          }
        }

        return mergedItems;
      } catch (e) {
        console.error("Sync Items Error:", e);
        return localItems;
      }
    },
    [user]
  );

  const pushItem = async (listId: string, item: TodoItem) => {
    if (!user) return;
    try {
      await api.post("/api/listo/item", { ...item, list_id: listId });
    } catch (e) {
      console.error("Push Item Error:", e);
    }
  };

  const deleteItemRemote = async (itemId: string) => {
    if (!user) return;
    try {
      await api.delete(`/api/listo/item/${itemId}`);
    } catch (e) {
      console.error(e);
    }
  };

  const pushList = async (list: TodoList) => {
    if (!user) return;
    try {
      await api.post("/api/listo", list);
    } catch (e) {
      console.error(e);
    }
  };

  const deleteListRemote = async (listId: string) => {
    if (!user) return;
    try {
      await api.delete(`/api/listo/${listId}`);
    } catch (e) {
      console.error(e);
    }
  };

  return {
    syncLists,
    syncItems,
    pushItem,
    deleteItemRemote,
    pushList,
    deleteListRemote,
  };
}
