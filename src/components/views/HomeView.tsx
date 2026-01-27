import { Github, LogOut, Plus, ShoppingBag, User } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "../../hooks/useAuth";
import type { TodoList } from "../../types";
import { AuthModal } from "../auth/AuthModal";
import { LogoutConfirmModal } from "../auth/LogoutConfirmModal";
import { EditListForm } from "../home/EditListForm";
import { SwipeableListCard } from "../home/SwipeableListCard";

interface HomeViewProps {
  lists: TodoList[];
  onCreateList: (title: string) => void;
  onSelectList: (id: string) => void;
  onDeleteList: (id: string) => void;
  onRenameList?: (id: string, newTitle: string) => void;
  onClearLists: () => void;
}

export default function HomeView({
  lists,
  onCreateList,
  onSelectList,
  onDeleteList,
  onRenameList,
  onClearLists,
}: HomeViewProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [editingListId, setEditingListId] = useState<string | null>(null);

  const { user, logout } = useAuth();
  const [isAuthModalOpen, setAuthModalOpen] = useState(false);
  const [isLogoutConfirmOpen, setLogoutConfirmOpen] = useState(false);

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

  useEffect(() => {
    const handleBeforeUnload = () => {
      if (isLogoutConfirmOpen) {
        localStorage.removeItem("listo");
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [isLogoutConfirmOpen]);

  const handleRename = (id: string, title: string) => {
    if (onRenameList && title.trim()) {
      onRenameList(id, title.trim());
    }
    setEditingListId(null);
  };

  const handleLogoutClick = () => {
    if (user) {
      setLogoutConfirmOpen(true);
    } else {
      setAuthModalOpen(true);
    }
  };

  const handleLogoutConfirm = async () => {
    setLogoutConfirmOpen(false);
    await logout();
  };

  const handleLogoutCancel = async () => {
    setLogoutConfirmOpen(false);
    localStorage.removeItem("listo");
    onClearLists();
    await logout();
  };

  return (
    <div className="max-w-7xl mx-auto min-h-screen flex flex-col relative h-full">
      <header className="px-4 py-0 pb-4">
        <div className="flex flex-col">
          <div className=" flex items-baseline justify-between gap-2">
            <div className=" flex items-baseline gap-2">
              <h1 className="text-4xl font-extrabold text-slate-800 tracking-tight">
                Listo
              </h1>
              <span className="text-blue-500 text-lg font-bold">beta</span>
            </div>
            <button
              onClick={handleLogoutClick}
              className={` transition-colors ${
                user
                  ? "text-slate-300 hover:text-slate-600"
                  : "text-blue-500 hover:text-blue-700"
              }`}
              title={user ? `Выйти (${user.userName})` : "Войти"}
            >
              {user ? <LogOut size={28} /> : <User size={28} />}
            </button>
          </div>
          <div className="flex items-center justify-between gap-2 text-slate-300 hover:text-slate-600 transition-colors">
            <a
              href="https://github.com/wishhdd/listo"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-slate-300 hover:text-slate-600 transition-colors"
              title="Исходный код проекта"
            >
              <Github size={16} />
              <span className="text-xs text-slate-400 font-mono opacity-60 leading-none">
                v
                {typeof __APP_VERSION__ !== "undefined"
                  ? __APP_VERSION__
                  : "dev"}
              </span>{" "}
            </a>
            <p className="text-slate-900">
              {user
                ? `Привет${user.userName ? ", " + user.userName : ""}.`
                : "Твои списки"}
            </p>
          </div>
        </div>
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

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setAuthModalOpen(false)}
      />

      <LogoutConfirmModal
        isOpen={isLogoutConfirmOpen}
        onConfirm={handleLogoutConfirm}
        onCancel={handleLogoutCancel}
      />
    </div>
  );
}
