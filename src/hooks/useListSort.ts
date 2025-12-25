import { useMemo } from "react";
import { type TodoItem } from "../types";

/**
 * Хук для умной сортировки списка задач.
 * * Приоритеты сортировки:
 * 1. Совпадение с поиском (если введено > 2 символов)
 * 2. Статус выполнения (активные выше завершенных)
 * 3. Дата создания (новые выше старых)
 */
export function useListSort(items: TodoItem[], searchTerm: string = "") {
  const processedItems = useMemo(() => {
    const sortedItems = [...items];

    const isSearching = searchTerm.length > 2;
    const lowerQuery = searchTerm.toLowerCase();

    sortedItems.sort((a, b) => {
      if (isSearching) {
        const aMatch = a.text.toLowerCase().includes(lowerQuery);
        const bMatch = b.text.toLowerCase().includes(lowerQuery);
        if (aMatch && !bMatch) {
          return -1;
        }
        if (!aMatch && bMatch) {
          return 1;
        }
      }
      if (a.completed !== b.completed) {
        return a.completed ? 1 : -1;
      }
      return b.createdAt - a.createdAt;
    });

    return sortedItems;
  }, [items, searchTerm]);

  return processedItems;
}
