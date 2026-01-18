import { useMemo, useState } from "react";
import { InstallPrompt } from "./components/pwa/InstallPrompt";
import HomeView from "./components/views/HomeView";
import SingleListView from "./components/views/SingleListView";
import { AuthProvider } from "./context/AuthContext";
import { useAutoSync } from "./hooks/useAutoSync";
import { useLocalStorage } from "./hooks/useLocalStorage";
import { useSync } from "./hooks/useSync";
import { type TodoItem, type TodoList } from "./types";
import { generateId } from "./utils/generateId";

const THEME_COLORS = [
  "bg-blue-500",
  "bg-sky-500",
  "bg-cyan-500",
  "bg-teal-500",
  "bg-emerald-500",
  "bg-lime-600",
  "bg-amber-500",
  "bg-orange-500",
  "bg-red-500",
  "bg-rose-500",
  "bg-pink-500",
  "bg-fuchsia-500",
  "bg-purple-500",
  "bg-violet-500",
  "bg-indigo-500",
  "bg-slate-500",
];

const getRandomColor = () =>
  THEME_COLORS[Math.floor(Math.random() * THEME_COLORS.length)];

const initialData: TodoList[] = [];

function AppContent() {
  const [lists, setLists] = useLocalStorage<TodoList[]>(
    "todo-lists",
    initialData
  );
  const [activeListId, setActiveListId] = useState<string | null>(null);

  // Подключаем хук синхронизации
  const {
    syncLists,
    syncItems,
    pushItem,
    deleteItemRemote,
    pushList,
    deleteListRemote,
  } = useSync();

  // 1. Авто-синхронизация (фоновая)
  const handleSync = async (listId?: string) => {
    if (listId) {
      // Обновляем конкретный список с сервера
      const currentList = lists.find((l) => l.id === listId);
      if (!currentList) return;

      const syncedItems = await syncItems(listId, currentList.items);

      // Сливаем изменения
      setLists((prev) =>
        prev.map((l) => (l.id === listId ? { ...l, items: syncedItems } : l))
      );
    } else {
      // Обновляем список списков
      const syncedLists = await syncLists(lists);
      setLists(syncedLists);
    }
  };

  useAutoSync(activeListId, handleSync);

  const activeList = useMemo(
    () => lists.find((l) => l.id === activeListId),
    [lists, activeListId]
  );

  // --- CRUD ОПЕРАЦИИ СПИСКОВ ---

  const createList = (title: string) => {
    const newList: TodoList = {
      id: generateId(),
      title,
      items: [],
      themeColor: getRandomColor(),
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    setLists([newList, ...lists]);
    setActiveListId(newList.id);

    // Сервер
    pushList(newList);
  };

  const deleteList = (id: string) => {
    if (confirm("Удалить этот список?")) {
      setLists(lists.filter((l) => l.id !== id));
      if (activeListId === id) {
        setActiveListId(null);
      }
      // Сервер
      deleteListRemote(id);
    }
  };

  const renameList = (id: string, newTitle: string) => {
    const updatedList = lists.find((l) => l.id === id);
    if (!updatedList) return;

    const newList = { ...updatedList, title: newTitle, updatedAt: Date.now() };
    setLists(lists.map((list) => (list.id === id ? newList : list)));

    // Сервер
    pushList(newList);
  };

  // --- CRUD ОПЕРАЦИИ ТОВАРОВ (АТОМАРНЫЕ) ---
  // Это решает проблему "зомби": мы явно шлем запрос DELETE

  const handleAddItem = (text: string) => {
    if (!activeListId) return;

    const newItem: TodoItem = {
      id: generateId(),
      text,
      completed: false,
      position: 0,
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

    // Сервер: Создать
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

    // Сервер: Удалить
    deleteItemRemote(itemId);
  };

  const handleUpdateItem = (itemId: string, updates: Partial<TodoItem>) => {
    if (!activeListId) return;

    let updatedItemFull: TodoItem | null = null;

    setLists((prev) =>
      prev.map((list) => {
        if (list.id !== activeListId) return list;

        const newItems = list.items.map((item) => {
          if (item.id !== itemId) return item;
          updatedItemFull = { ...item, ...updates, updatedAt: Date.now() };
          return updatedItemFull;
        });

        return { ...list, items: newItems, updatedAt: Date.now() };
      })
    );

    // Сервер: Обновить
    if (updatedItemFull) {
      pushItem(activeListId, updatedItemFull);
    }
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
        />
      ) : (
        <HomeView
          lists={lists}
          onCreateList={createList}
          onSelectList={setActiveListId}
          onDeleteList={deleteList}
          onRenameList={renameList}
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
