import { useCallback } from "react";
import { api } from "../api/client";
import type {
  ServerTodoItem,
  ServerTodoList,
  TodoItem,
  TodoList,
} from "../types";
import { getRandomColor } from "../utils/theme";
import { useAuth } from "./useAuth";

export function useSync() {
  const { user } = useAuth();

  const pushItem = useCallback(
    async (listId: string, item: TodoItem) => {
      if (!user) return;
      try {
        await api.post("/api/listo/item", {
          id: item.id,
          list_id: listId,
          text: item.text,
          position: item.position,
          is_completed: item.completed,
          updated_at: item.updatedAt,
        });
      } catch (e) {
        console.error("Push Item Error:", e);
      }
    },
    [user]
  );

  const pushList = useCallback(
    async (list: TodoList) => {
      if (!user) return;
      try {
        await api.post("/api/listo", {
          id: list.id,
          title: list.title,
          owner_id: list.ownerId,
          members: list.members,
          updated_at: list.updatedAt,
        });
      } catch (e) {
        console.error(e);
      }
    },
    [user]
  );

  const deleteItemRemote = useCallback(
    async (itemId: string) => {
      if (!user) return;
      try {
        await api.delete(`/api/listo/item/${itemId}`);
      } catch (e) {
        console.error(e);
      }
    },
    [user]
  );

  const deleteListRemote = useCallback(
    async (listId: string) => {
      if (!user) return;
      try {
        await api.delete(`/api/listo/${listId}`);
      } catch (e) {
        console.error(e);
      }
    },
    [user]
  );

  const syncLists = useCallback(
    async (localLists: TodoList[]) => {
      if (!user) return localLists;

      try {
        const serverRaw = await api.get<ServerTodoList[]>("/api/listo");

        const serverLists: TodoList[] = serverRaw.map((s) => ({
          id: s.id,
          title: s.title,
          themeColor: getRandomColor(),
          items: [],
          ownerId: s.owner_id,
          members: s.members || [],
          createdAt: s.created_at ? Number(s.created_at) : Date.now(),
          updatedAt: Number(s.updated_at) || 0,
        }));

        const mergedLists = [...localLists];

        for (const sList of serverLists) {
          const localIndex = mergedLists.findIndex((l) => l.id === sList.id);
          const localList = mergedLists[localIndex];

          const resolvedColor = localList?.themeColor || sList.themeColor;

          if (!localList) {
            mergedLists.push({ ...sList, themeColor: resolvedColor });
          } else {
            if (sList.updatedAt > localList.updatedAt) {
              mergedLists[localIndex] = {
                ...localList,
                ...sList,
                themeColor: resolvedColor,
                items: localList.items,
              };
            } else if (localList.updatedAt > sList.updatedAt) {
              await pushList(localList);
            }
          }
        }

        for (const lList of mergedLists) {
          const existsOnServer = serverLists.find((s) => s.id === lList.id);
          if (!existsOnServer) {
            if (!lList.ownerId || lList.ownerId === user.userId) {
              await pushList(lList);
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
    [user, pushList]
  );

  const syncItems = useCallback(
    async (listId: string, localItems: TodoItem[]) => {
      if (!user) return localItems;

      try {
        const serverRaw = await api.get<ServerTodoItem[]>(
          `/api/listo/${listId}/items`
        );

        const serverItems: TodoItem[] = serverRaw.map((s) => ({
          id: s.id,
          text: s.text,
          position: Number(s.position),
          completed: s.is_completed,
          updatedAt: Number(s.updated_at) || 0,
        }));

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
              await pushItem(listId, localItem);
            }
          }
        }

        for (const lItem of mergedItems) {
          const existsOnServer = serverItems.find((s) => s.id === lItem.id);
          if (!existsOnServer) {
            await pushItem(listId, lItem);
          }
        }

        return mergedItems;
      } catch (e) {
        console.error("Sync Items Error:", e);
        return localItems;
      }
    },
    [user, pushItem]
  );

  return {
    syncLists,
    syncItems,
    pushItem,
    deleteItemRemote,
    pushList,
    deleteListRemote,
  };
}
