import type { TodoItem } from "../types";

/**
 * Merges local and synced item arrays by keeping the version with the greater
 * updatedAt per id; preserves items only in one source. Result sorted by position.
 */
export function mergeItemsByNewer(
  local: TodoItem[],
  synced: TodoItem[]
): TodoItem[] {
  const byId = new Map<string, TodoItem>();
  for (const item of local) byId.set(item.id, item);
  for (const item of synced) {
    const existing = byId.get(item.id);
    if (!existing || item.updatedAt >= existing.updatedAt) {
      byId.set(item.id, item);
    }
  }
  return [...byId.values()].sort((a, b) => a.position - b.position);
}
