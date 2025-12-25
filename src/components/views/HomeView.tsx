import { Plus, ShoppingBag, Trash2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { TodoList } from "../../types";

export function HomeView({
  lists,
  onCreateList,
  onSelectList,
  onDeleteList,
}: {
  lists: TodoList[];
  onCreateList: (t: string) => void;
  onSelectList: (id: string) => void;
  onDeleteList: (id: string) => void;
}) {
  const [isCreating, setIsCreating] = useState(false);
  const [newTitle, setNewTitle] = useState("");
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

  return (
    <div className="max-w-md mx-auto min-h-screen flex flex-col relative h-full">
      <header className="px-6 py-8 pb-4">
        <h1 className="text-4xl font-extrabold text-slate-800 tracking-tight flex items-center gap-2">
          Listo <span className="text-blue-500 text-lg align-top">beta</span>
        </h1>
        <p className="text-slate-500 mt-2">Твои списки покупок</p>
      </header>

      <main className="flex-1 px-4 pb-24 overflow-y-auto">
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
            {lists.map((list) => (
              <div
                key={list.id}
                onClick={() => onSelectList(list.id)}
                className="group relative bg-white p-5 rounded-2xl shadow-sm border border-slate-100 active:scale-[0.98] transition-all cursor-pointer flex items-center justify-between overflow-hidden select-none"
              >
                <div
                  className={`absolute left-0 top-0 bottom-0 w-1.5 ${list.themeColor}`}
                />
                <div className="pl-2">
                  <h3 className="font-bold text-lg text-slate-800">
                    {list.title}
                  </h3>
                  <p className="text-sm text-slate-400 mt-1">
                    {list.items.filter((i) => !i.completed).length} активных •{" "}
                    {list.items.length} всего
                  </p>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteList(list.id);
                  }}
                  className="p-2 text-slate-300 hover:text-red-500 transition-colors"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            ))}
          </div>
        )}
      </main>

      <div className="fixed bottom-6 right-6 left-6 max-w-md mx-auto flex justify-end pointer-events-none z-50">
        {isCreating ? (
          <form
            onSubmit={handleSubmit}
            className="w-full bg-white p-2 rounded-2xl shadow-xl border border-blue-100 flex gap-2 pointer-events-auto animate-in slide-in-from-bottom-5 fade-in duration-200"
          >
            <input
              ref={inputRef}
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Название списка..."
              className="flex-1 px-4 py-3 outline-none text-lg bg-transparent"
              onBlur={() => !newTitle && setIsCreating(false)}
            />
            <button
              type="submit"
              disabled={!newTitle.trim()}
              className="bg-blue-600 text-white rounded-xl px-4 font-semibold disabled:opacity-50"
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
