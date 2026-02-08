import type { TodoList } from "../types";

export function sortListsByPosition(lists: TodoList[]): TodoList[] {
  return [...lists].sort((a, b) => {
    const posA = a.position ?? a.createdAt;
    const posB = b.position ?? b.createdAt;
    return posA - posB;
  });
}
