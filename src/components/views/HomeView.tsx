import { Plus, ShoppingBag } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { TodoList } from "../../types";
import { EditListForm } from "../home/EditListForm";
import { SwipeableListCard } from "../home/SwipeableListCard";

interface HomeViewProps {
  lists: TodoList[];
  onCreateList: (title: string) => void;
  onSelectList: (id: string) => void;
  onDeleteList: (id: string) => void;
  onRenameList?: (id: string, newTitle: string) => void;
}

export default function HomeView({
  lists,
  onCreateList,
  onSelectList,
  onDeleteList,
  onRenameList,
}: HomeViewProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [newTitle, setNewTitle] = useState("");

  const [editingListId, setEditingListId] = useState<string | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTitle.trim()) {
      onCreateList(newTitle.trim());
      setNewTitle("");
      setIsCreating(false);
    }
  };

  useEffect(() => {
    if (isCreating && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isCreating]);

  const handleRename = (id: string, title: string) => {
    if (onRenameList && title.trim()) {
      onRenameList(id, title.trim());
    }
    setEditingListId(null);
  };

  return (
    <div className="max-w-7xl mx-auto min-h-screen flex flex-col relative h-full">
      <header className="px-6 py-8 pb-4">
        <div className="flex flex-col">
          <h1 className="text-4xl font-extrabold text-slate-800 tracking-tight flex items-baseline gap-2">
            Listo
            <span className="text-blue-500 text-lg font-bold">beta</span>
          </h1>
          <span className="text-xs text-slate-400 font-mono mt-1 opacity-60">
            v{typeof __APP_VERSION__ !== "undefined" ? __APP_VERSION__ : "dev"}
          </span>
        </div>
        <p className="text-slate-500 mt-2">Твои списки покупок</p>
      </header>

      <main className="flex-1 px-4 pb-24 overflow-y-auto overflow-x-hidden">
        {lists.length === 0 ? (
          <div className="text-center mt-20 opacity-40">
            <ShoppingBag className="w-16 h-16 mx-auto mb-4" />
            <p>
              Нет списков.
              <br />
              Создай первый!
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {lists.map((list) =>
              editingListId === list.id ? (
                <EditListForm
                  key={list.id}
                  list={list}
                  onSave={(title) => handleRename(list.id, title)}
                  onCancel={() => setEditingListId(null)}
                />
              ) : (
                <SwipeableListCard
                  key={list.id}
                  list={list}
                  onSelect={() => onSelectList(list.id)}
                  onDelete={() => onDeleteList(list.id)}
                  onRename={() => setEditingListId(list.id)}
                />
              )
            )}
          </div>
        )}
      </main>

      <div className="fixed bottom-6 right-6 left-6 max-w-7xl mx-auto flex justify-end pointer-events-none z-50">
        {isCreating ? (
          <form
            onSubmit={handleSubmit}
            className="w-full bg-white p-2 rounded-2xl shadow-xl border-blue-100 flex items-center gap-2 pointer-events-auto animate-in slide-in-from-bottom-5 fade-in duration-200"
          >
            <input
              ref={inputRef}
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Название списка..."
              className="flex-1 min-w-0 px-4 py-3 outline-none text-lg bg-transparent"
              onBlur={() => !newTitle && setIsCreating(false)}
            />
            <button
              type="submit"
              disabled={!newTitle.trim()}
              className="flex-shrink-0 bg-blue-600 text-white rounded-xl px-4 py-3 font-semibold disabled:opacity-50 whitespace-nowrap"
            >
              OK
            </button>
          </form>
        ) : (
          <button
            onClick={() => setIsCreating(true)}
            className="w-14 h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg flex items-center justify-center transition-transform active:scale-90 pointer-events-auto"
          >
            <Plus size={28} />
          </button>
        )}
      </div>
    </div>
  );
}
