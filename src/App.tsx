import { useCallback, useMemo, useState } from "react";
import HomeView from "./components/views/HomeView";
import SingleListView from "./components/views/SingleListView";
import { useLocalStorage } from "./hooks/useLocalStorage";
import { type TodoItem, type TodoList } from "./types";
import { generateId } from "./utils/generateId";

const THEME_COLORS = [
  "bg-blue-500",
  "bg-emerald-500",
  "bg-indigo-500",
  "bg-rose-500",
  "bg-amber-500",
  "bg-purple-500",
];

const getRandomColor = () =>
  THEME_COLORS[Math.floor(Math.random() * THEME_COLORS.length)];

export default function App() {
  const [lists, setLists] = useLocalStorage<TodoList[]>("listo-data", []);

  const [activeListId, setActiveListId] = useState<string | null>(null);

  const createList = useCallback(
    (title: string) => {
      const newList: TodoList = {
        id: generateId(),
        title,
        items: [],
        createdAt: Date.now(),
        themeColor: getRandomColor(),
      };
      setLists((prevLists) => [newList, ...prevLists]);
      setActiveListId(newList.id);
    },
    [setLists]
  );

  const deleteList = (id: string) => {
    if (confirm("Удалить этот список навсегда?")) {
      setLists(lists.filter((l) => l.id !== id));
      if (activeListId === id) setActiveListId(null);
    }
  };

  const renameList = (id: string, newTitle: string) => {
    setLists(
      lists.map((list) =>
        list.id === id ? { ...list, title: newTitle } : list
      )
    );
  };

  const updateListItems = (listId: string, newItems: TodoItem[]) => {
    setLists(
      lists.map((list) =>
        list.id === listId ? { ...list, items: newItems } : list
      )
    );
  };

  const activeList = useMemo(
    () => lists.find((l) => l.id === activeListId),
    [lists, activeListId]
  );

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans pb-safe overflow-hidden touch-pan-y">
      <div className="h-1 w-full bg-slate-50 fixed top-0 z-50" />

      {activeList ? (
        <SingleListView
          list={activeList}
          onBack={() => setActiveListId(null)}
          onUpdateItems={(items) => updateListItems(activeList.id, items)}
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
    </div>
  );
}
