import { Check, Edit2, Plus, ShoppingBag, Trash2, X } from "lucide-react";
import React, { useEffect, useRef, useState } from "react";
import type { TodoList } from "../../types";

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
    <div className="max-w-md mx-auto min-h-screen flex flex-col relative h-full">
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

      <div className="fixed bottom-6 right-6 left-6 max-w-md mx-auto flex justify-end pointer-events-none z-50">
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

function SwipeableListCard({
  list,
  onSelect,
  onDelete,
  onRename,
}: {
  list: TodoList;
  onSelect: () => void;
  onDelete: () => void;
  onRename: () => void;
}) {
  const [offset, setOffset] = useState(0);
  const startX = useRef<number | null>(null);
  const [prevList, setPrevList] = useState(list);

  if (list !== prevList) {
    setPrevList(list);
    setOffset(0);
  }

  const handleTouchStart = (e: React.TouchEvent) => {
    startX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!startX.current) return;
    const currentX = e.touches[0].clientX;
    const diff = currentX - startX.current;
    if (diff > -120 && diff < 120) {
      setOffset(diff);
    }
  };

  const handleTouchEnd = () => {
    if (!startX.current) return;
    if (offset < -50) setOffset(-80);
    else if (offset > 50) setOffset(80);
    else setOffset(0);
    startX.current = null;
  };

  return (
    <div className="relative h-24 mb-3 select-none">
      <div className="absolute inset-0 rounded-2xl flex justify-between items-center overflow-hidden">
        <div
          className={`w-1/2 h-full bg-blue-500 flex items-center justify-start pl-6 transition-opacity ${
            offset > 0 ? "opacity-100" : "opacity-0"
          }`}
        >
          <Edit2 className="text-white" size={24} />
        </div>
        <div
          className={`w-1/2 h-full bg-red-500 flex items-center justify-end pr-6 transition-opacity ${
            offset < 0 ? "opacity-100" : "opacity-0"
          }`}
        >
          <Trash2 className="text-white" size={24} />
        </div>
      </div>

      <div
        className="relative z-10 overflow-hidden h-full bg-white p-5 rounded-2xl shadow-lg border-slate-100 active:scale-[0.98] transition-transform duration-200 ease-out cursor-pointer flex items-center justify-between group"
        style={{ transform: `translateX(${offset}px)` }}
        onClick={() => {
          if (offset === 0) onSelect();
          else setOffset(0);
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div
          className={`absolute left-0 top-0 bottom-0 w-2 rounded-l-2xl ${list.themeColor}`}
        />

        <button
          onClick={(e) => {
            e.stopPropagation();
            onRename();
          }}
          className="hidden sm:flex opacity-0 group-hover:opacity-100 -ml-2 p-2 text-slate-300 hover:text-blue-500 transition-all items-center justify-center"
        >
          <Edit2 size={18} />
        </button>

        <div className="pl-2 flex-1 min-w-0">
          <h3 className="font-bold text-lg text-slate-800 truncate">
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
            onDelete();
          }}
          className="hidden sm:block opacity-0 group-hover:opacity-100 p-2 text-slate-300 hover:text-red-500 transition-all"
        >
          <Trash2 size={18} />
        </button>

        {offset > 50 && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRename();
              setOffset(0);
            }}
            className="absolute inset-y-0 left-[-80px] w-[80px] z-20"
          />
        )}
        {offset < -50 && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="absolute inset-y-0 right-[-80px] w-[80px] z-20"
          />
        )}
      </div>
    </div>
  );
}

function EditListForm({
  list,
  onSave,
  onCancel,
}: {
  list: TodoList;
  onSave: (val: string) => void;
  onCancel: () => void;
}) {
  const [val, setVal] = useState(list.title);
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    ref.current?.focus();
  }, []);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSave(val);
      }}
      className="h-24 mb-3 bg-white p-4 rounded-2xl shadow-md border-2 border-blue-100 flex items-center gap-2"
    >
      <input
        ref={ref}
        type="text"
        value={val}
        onChange={(e) => setVal(e.target.value)}
        className="flex-1 text-lg font-bold text-slate-800 outline-none bg-transparent"
        placeholder="Название..."
      />
      <button
        type="submit"
        className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200"
      >
        <Check size={20} />
      </button>
      <button
        type="button"
        onClick={onCancel}
        className="p-2 text-slate-400 hover:bg-slate-100 rounded-lg"
      >
        <X size={20} />
      </button>
    </form>
  );
}
