import { create } from "zustand";
import { persist } from "zustand/middleware";
import { api } from "../api/client";
import type { TodoItem, TodoList } from "../types";
import { POSITION_GAP } from "../utils/constants";
import { generateId } from "../utils/generateId";
import { sortListsByPosition } from "../utils/sortListsByPosition";
import { SyncService } from "../services/SyncService";
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
  updateListDetails: (id: string, newTitle: string, newColor: string) => void;
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

      updateListDetails: (id: string, newTitle: string, newColor: string) => {
        const { lists } = get();
        const list = lists.find((l) => l.id === id);
        if (!list) return;
        const titleChanged = list.title !== newTitle;
        const updated = {
          ...list,
          title: newTitle,
          themeColor: newColor,
          updatedAt: titleChanged ? Date.now() : list.updatedAt,
        };
        set({
          lists: lists.map((l) => (l.id === id ? updated : l)),
        });
        if (titleChanged) {
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
          const mergedLists = await SyncService.syncLists(
            get().lists,
            user.userId,
          );
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
