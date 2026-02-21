import { create } from "zustand";
import { persist } from "zustand/middleware";
import { api } from "../api/client";
import type {
  ServerTodoItem,
  ServerTodoList,
  TodoItem,
  TodoList,
} from "../types";
import { POSITION_GAP } from "../utils/constants";
import { generateId } from "../utils/generateId";
import { mergeItemsByNewer } from "../utils/mergeItemsByNewer";
import { sortListsByPosition } from "../utils/sortListsByPosition";
import { getRandomColor } from "../utils/theme";
import { useAuthStore } from "./authStore";
import { useUIStore } from "./uiStore";

type SyncStatus = "idle" | "syncing" | "error";

export interface ListState {
  lists: TodoList[];
  status: SyncStatus;
  lastSyncedAt: number | null;
  createList: (title: string) => void;
  deleteList: (id: string) => void;
  renameList: (id: string, newTitle: string) => void;
  reorderLists: (sourceIndex: number, destinationIndex: number) => void;
  addItem: (listId: string, text: string) => void;
  updateItem: (
    listId: string,
    itemId: string,
    updates: Partial<TodoItem>,
  ) => void;
  deleteItem: (listId: string, itemId: string) => void;
  updateListMembers: (
    listId: string,
    members: number[],
  ) => void | Promise<void>;
  leaveList: (listId: string) => Promise<void>;
  clearCompleted: (listId: string) => void;
  clearLists: () => void;
  acceptInvite: (inviteId: number) => Promise<void>;
  syncWithServer: () => Promise<void>;
}

function mapServerListToLocal(
  s: ServerTodoList,
  themeColor?: string,
): TodoList {
  return {
    id: s.id,
    title: s.title,
    themeColor: themeColor ?? getRandomColor(),
    items: [],
    ownerId: s.owner_id,
    ownerName: s.owner_user_name ?? undefined,
    members: s.members ?? [],
    createdAt: s.created_at ? Number(s.created_at) : Date.now(),
    updatedAt: Number(s.updated_at) || 0,
  };
}

function mapServerItemToLocal(s: ServerTodoItem): TodoItem {
  return {
    id: s.id,
    text: s.text,
    position: Number(s.position),
    completed: s.is_completed,
    updatedAt: Number(s.updated_at) || 0,
  };
}

export const useListStore = create<ListState>()(
  persist(
    (set, get) => ({
      lists: [],
      status: "idle",
      lastSyncedAt: null,

      createList: (title: string) => {
        const { lists } = get();
        const user = useAuthStore.getState().user;
        const sorted = sortListsByPosition(lists);
        const first = sorted[0];
        const firstPos = first
          ? (first.position ?? first.createdAt)
          : Date.now();
        const newList: TodoList = {
          id: generateId(),
          title,
          items: [],
          themeColor: getRandomColor(),
          createdAt: Date.now(),
          updatedAt: Date.now(),
          position: firstPos - POSITION_GAP,
          ownerId: user?.userId,
          members: user ? [] : undefined,
        };
        set({ lists: [newList, ...lists] });
        if (user) {
          api
            .post("/api/listo", {
              id: newList.id,
              title: newList.title,
              owner_id: newList.ownerId,
              members: newList.members ?? [],
              updated_at: newList.updatedAt,
            })
            .catch((e) => console.error(e));
        }
      },

      deleteList: (id: string) => {
        set((s) => ({ lists: s.lists.filter((l) => l.id !== id) }));
        const user = useAuthStore.getState().user;
        if (user) {
          api.delete(`/api/listo/${id}`).catch((e) => console.error(e));
        }
      },

      renameList: (id: string, newTitle: string) => {
        const { lists } = get();
        const list = lists.find((l) => l.id === id);
        if (!list) return;
        const updated = { ...list, title: newTitle, updatedAt: Date.now() };
        set({
          lists: lists.map((l) => (l.id === id ? updated : l)),
        });
        const user = useAuthStore.getState().user;
        if (user) {
          api
            .post("/api/listo", {
              id: updated.id,
              title: updated.title,
              owner_id: updated.ownerId,
              members: updated.members ?? [],
              updated_at: updated.updatedAt,
            })
            .catch((e) => console.error(e));
        }
      },

      reorderLists: (sourceIndex: number, destinationIndex: number) => {
        const { lists } = get();
        const sorted = sortListsByPosition(lists);
        const reordered = Array.from(sorted);
        const [removed] = reordered.splice(sourceIndex, 1);
        reordered.splice(destinationIndex, 0, removed);
        let newPosition = 0;
        if (destinationIndex === 0) {
          const first = reordered[1];
          newPosition =
            (first?.position ?? first?.createdAt ?? 0) - POSITION_GAP;
        } else if (destinationIndex === reordered.length - 1) {
          const last = reordered[destinationIndex - 1];
          newPosition = (last?.position ?? last?.createdAt ?? 0) + POSITION_GAP;
        } else {
          const prev = reordered[destinationIndex - 1];
          const next = reordered[destinationIndex + 1];
          newPosition =
            ((prev?.position ?? prev?.createdAt ?? 0) +
              (next?.position ?? next?.createdAt ?? 0)) /
            2;
        }
        const updated = {
          ...removed,
          position: newPosition,
          updatedAt: Date.now(),
        };
        set({
          lists: lists.map((l) => (l.id === removed.id ? updated : l)),
        });
        const user = useAuthStore.getState().user;
        if (user) {
          api
            .post("/api/listo", {
              id: updated.id,
              title: updated.title,
              owner_id: updated.ownerId,
              members: updated.members ?? [],
              updated_at: updated.updatedAt,
            })
            .catch((e) => console.error(e));
        }
      },

      addItem: (listId: string, text: string) => {
        const { lists } = get();
        const list = lists.find((l) => l.id === listId);
        if (!list) return;
        const items = list.items || [];
        const minPos =
          items.length > 0 ? Math.min(...items.map((i) => i.position)) : 0;
        const newItem: TodoItem = {
          id: generateId(),
          text,
          completed: false,
          position: minPos - POSITION_GAP,
          updatedAt: Date.now(),
        };
        const updatedList = {
          ...list,
          items: [newItem, ...items],
          updatedAt: Date.now(),
        };
        set({
          lists: lists.map((l) => (l.id === listId ? updatedList : l)),
        });
        const user = useAuthStore.getState().user;
        if (user) {
          api
            .post("/api/listo/item", {
              id: newItem.id,
              list_id: listId,
              text: newItem.text,
              position: newItem.position,
              is_completed: newItem.completed,
              updated_at: newItem.updatedAt,
            })
            .catch((e) => console.error(e));
        }
      },

      updateItem: (
        listId: string,
        itemId: string,
        updates: Partial<TodoItem>,
      ) => {
        const { lists } = get();
        const list = lists.find((l) => l.id === listId);
        if (!list) return;
        const item = list.items.find((i) => i.id === itemId);
        if (!item) return;
        const updatedItem = {
          ...item,
          ...updates,
          updatedAt: Date.now(),
        };
        const newItems = list.items.map((i) =>
          i.id === itemId ? updatedItem : i,
        );
        const updatedList = {
          ...list,
          items: newItems,
          updatedAt: Date.now(),
        };
        set({
          lists: lists.map((l) => (l.id === listId ? updatedList : l)),
        });
        const user = useAuthStore.getState().user;
        if (user) {
          api
            .post("/api/listo/item", {
              id: updatedItem.id,
              list_id: listId,
              text: updatedItem.text,
              position: updatedItem.position,
              is_completed: updatedItem.completed,
              updated_at: updatedItem.updatedAt,
            })
            .catch((e) => console.error(e));
        }
      },

      deleteItem: (listId: string, itemId: string) => {
        const { lists } = get();
        const list = lists.find((l) => l.id === listId);
        if (!list) return;
        const updatedList = {
          ...list,
          items: list.items.filter((i) => i.id !== itemId),
          updatedAt: Date.now(),
        };
        set({
          lists: lists.map((l) => (l.id === listId ? updatedList : l)),
        });
        const user = useAuthStore.getState().user;
        if (user) {
          api
            .delete(`/api/listo/item/${itemId}`)
            .catch((e) => console.error(e));
        }
      },

      updateListMembers: async (listId: string, members: number[]) => {
        const { lists } = get();
        const list = lists.find((l) => l.id === listId);
        if (!list) return;
        const prevMembers = list.members ?? [];
        const updated = { ...list, members, updatedAt: Date.now() };
        set({
          lists: lists.map((l) => (l.id === listId ? updated : l)),
        });
        const user = useAuthStore.getState().user;
        if (!user) return;
        try {
          await api.post("/api/listo", {
            id: updated.id,
            title: updated.title,
            owner_id: updated.ownerId,
            members: updated.members ?? [],
            updated_at: updated.updatedAt,
          });
        } catch (e) {
          console.error(e);
          set((s) => ({
            lists: s.lists.map((l) =>
              l.id === listId ? { ...l, members: prevMembers } : l,
            ),
          }));
          useUIStore
            .getState()
            .actions.showToast("Не удалось обновить участников", "error");
        }
      },

      leaveList: async (listId: string) => {
        const user = useAuthStore.getState().user;
        if (!user) return;
        try {
          await api.post(`/api/listo/${listId}/leave`, {});
          set((s) => ({ lists: s.lists.filter((l) => l.id !== listId) }));
        } catch (e) {
          console.error("Leave list error:", e);
          throw e;
        }
      },

      clearCompleted: (listId: string) => {
        const { lists } = get();
        const list = lists.find((l) => l.id === listId);
        if (!list) return;
        const toDelete = list.items.filter((i) => i.completed);
        const next = lists.map((l) =>
          l.id !== listId
            ? l
            : {
                ...l,
                items: l.items.filter((i) => !i.completed),
                updatedAt: Date.now(),
              },
        );
        set({ lists: next });
        const user = useAuthStore.getState().user;
        if (user) {
          toDelete.forEach((item) => {
            api
              .delete(`/api/listo/item/${item.id}`)
              .catch((e) => console.error(e));
          });
        }
      },

      clearLists: () => set({ lists: [] }),

      acceptInvite: async (inviteId: number) => {
        await api.post(`/api/listo/invites/${inviteId}/accept`, {});
        await get().syncWithServer();
      },

      syncWithServer: async () => {
        const user = useAuthStore.getState().user;
        if (!user) return;
        set({ status: "syncing" });
        try {
          const localLists = get().lists;
          const serverRaw = await api.get<ServerTodoList[]>("/api/listo");
          const serverLists: TodoList[] = serverRaw.map((s) =>
            mapServerListToLocal(s),
          );

          const mergedLists: TodoList[] = [];
          const serverIds = new Set(serverLists.map((s) => s.id));

          for (const sList of serverLists) {
            const lList = localLists.find((l) => l.id === sList.id);
            const themeColor = lList?.themeColor ?? sList.themeColor;
            const baseList = mapServerListToLocal(
              serverRaw.find((s) => s.id === sList.id)!,
              themeColor,
            );
            let serverItems: TodoItem[] = [];
            try {
              const itemsRaw = await api.get<ServerTodoItem[]>(
                `/api/listo/${sList.id}/items`,
              );
              serverItems = itemsRaw.map(mapServerItemToLocal);
            } catch {
              // keep empty
            }
            const localItems = lList?.items ?? [];
            const mergedItems = mergeItemsByNewer(localItems, serverItems);
            if (!lList) {
              mergedLists.push({ ...baseList, items: mergedItems });
              continue;
            }
            const listNewer = lList.updatedAt > baseList.updatedAt;
            const resolvedList = listNewer
              ? { ...lList, items: mergedItems, themeColor }
              : { ...baseList, items: mergedItems, themeColor };
            mergedLists.push(resolvedList);
            if (listNewer) {
              api
                .post("/api/listo", {
                  id: lList.id,
                  title: lList.title,
                  owner_id: lList.ownerId,
                  members: lList.members ?? [],
                  updated_at: lList.updatedAt,
                })
                .catch((e) => console.error(e));
            }
            for (const item of mergedItems) {
              const onServer = serverItems.some((s) => s.id === item.id);
              const localItem = localItems.find((i) => i.id === item.id);
              const serverItem = serverItems.find((s) => s.id === item.id);
              const shouldPush =
                !onServer ||
                (localItem &&
                  serverItem &&
                  localItem.updatedAt > serverItem.updatedAt);
              if (shouldPush) {
                api
                  .post("/api/listo/item", {
                    id: item.id,
                    list_id: sList.id,
                    text: item.text,
                    position: item.position,
                    is_completed: item.completed,
                    updated_at: item.updatedAt,
                  })
                  .catch((e) => console.error(e));
              }
            }
          }

          for (const lList of localLists) {
            if (serverIds.has(lList.id)) continue;
            if (!lList.ownerId || lList.ownerId === user.userId) {
              try {
                await api.post("/api/listo", {
                  id: lList.id,
                  title: lList.title,
                  owner_id: lList.ownerId,
                  members: lList.members ?? [],
                  updated_at: lList.updatedAt,
                });
                let serverItems: TodoItem[] = [];
                try {
                  const itemsRaw = await api.get<ServerTodoItem[]>(
                    `/api/listo/${lList.id}/items`,
                  );
                  serverItems = itemsRaw.map(mapServerItemToLocal);
                } catch {
                  // keep empty
                }
                const mergedItems = mergeItemsByNewer(lList.items, serverItems);
                mergedLists.push({ ...lList, items: mergedItems });
                for (const item of mergedItems) {
                  const onServer = serverItems.some((s) => s.id === item.id);
                  if (!onServer) {
                    await api.post("/api/listo/item", {
                      id: item.id,
                      list_id: lList.id,
                      text: item.text,
                      position: item.position,
                      is_completed: item.completed,
                      updated_at: item.updatedAt,
                    });
                  }
                }
              } catch (e) {
                console.error("Push list error:", e);
              }
            }
          }

          set({
            lists: mergedLists,
            status: "idle",
            lastSyncedAt: Date.now(),
          });
        } catch (e) {
          console.error("Sync error:", e);
          set({ status: "error" });
          useUIStore
            .getState()
            .actions.showToast("Не удалось синхронизировать", "error");
        }
      },
    }),
    { name: "listo" },
  ),
);
