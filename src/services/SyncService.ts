import { api } from "../api/client";
import type {
  ServerTodoItem,
  ServerTodoList,
  TodoItem,
  TodoList,
} from "../types";
import { mergeItemsByNewer } from "../utils/mergeItemsByNewer";
import { getRandomColor } from "../utils/theme";

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

export const SyncService = {
  async syncLists(
    localLists: TodoList[],
    userId: number,
  ): Promise<TodoList[]> {
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
      if (!lList.ownerId || lList.ownerId === userId) {
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

    return mergedLists;
  },
};
