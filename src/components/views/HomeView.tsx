import {
  DragDropContext,
  Draggable,
  Droppable,
  type DropResult,
} from "@hello-pangea/dnd";
import { Github, LogOut, Plus, ShoppingBag, User } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useShallow } from "zustand/react/shallow";
import { useAuthStore } from "../../store/authStore";
import { useListStore } from "../../store/listStore";
import { useUIStore } from "../../store/uiStore";
import { sortListsByPosition } from "../../utils/sortListsByPosition";
import { AuthModal } from "../auth/AuthModal";
import { LogoutConfirmModal } from "../auth/LogoutConfirmModal";
import { EditListForm } from "../home/EditListForm";
import { SwipeableListCard } from "../home/SwipeableListCard";

export default function HomeView() {
  const navigate = useNavigate();
  const [isCreating, setIsCreating] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [editingListId, setEditingListId] = useState<string | null>(null);
  const [isAuthModalOpen, setAuthModalOpen] = useState(false);
  const [isLogoutConfirmOpen, setLogoutConfirmOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const { user, logout } = useAuthStore(
    useShallow((s) => ({ user: s.user, logout: s.logout }))
  );

  const { lists, createList, updateListDetails, reorderLists, clearLists } =
    useListStore(
      useShallow((s) => ({
        lists: s.lists,
        createList: s.createList,
        updateListDetails: s.updateListDetails,
        reorderLists: s.reorderLists,
        clearLists: s.clearLists,
      }))
    );

  const { openConfirm, setShareListId } = useUIStore(
    useShallow((s) => ({
      openConfirm: s.actions.openConfirm,
      setShareListId: s.actions.setShareListId,
    }))
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTitle.trim()) {
      createList(newTitle.trim());
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
    if (!isLogoutConfirmOpen) return;
    const handleBeforeUnload = () => {
      localStorage.removeItem("listo");
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isLogoutConfirmOpen]);

  const handleRename = (id: string, title: string, color: string) => {
    if (title.trim()) {
      updateListDetails(id, title.trim(), color);
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
    clearLists();
    await logout();
  };

  const sortedLists = useMemo(
    () => sortListsByPosition(lists),
    [lists]
  );

  const handleSelectList = (id: string) => {
    navigate(`/list/${id}`);
  };

  const handleDeleteListWithConfirm = (id: string) => {
    openConfirm("DELETE_LIST", { listId: id });
  };

  const handleLeaveListWithConfirm = (id: string) => {
    openConfirm("LEAVE_LIST", { listId: id });
  };

  const handleDragEnd = (result: DropResult) => {
    const { destination, source } = result;
    if (!destination) return;
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }
    reorderLists(source.index, destination.index);
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
              aria-label={user ? "Выйти из аккаунта" : "Войти в аккаунт"}
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

      <DragDropContext onDragEnd={handleDragEnd}>
        <main className="flex-1 px-4 pb-24 overflow-y-auto overflow-x-hidden">
          {sortedLists.length === 0 ? (
            <div className="text-center mt-20 opacity-40">
              <ShoppingBag className="w-16 h-16 mx-auto mb-4" />
              <p>
                Нет списков.
                <br />
                Создай первый!
              </p>
            </div>
          ) : (
            <Droppable droppableId="lists">
              {(provided) => (
                <div
                  {...provided.droppableProps}
                  ref={provided.innerRef}
                  className="space-y-3"
                >
                  {sortedLists.map((list, index) =>
                    editingListId === list.id ? (
                      <EditListForm
                        key={list.id}
                        list={list}
                        onSave={(title, color) =>
                          handleRename(list.id, title, color)
                        }
                        onCancel={() => setEditingListId(null)}
                      />
                    ) : (
                      <Draggable
                        key={list.id}
                        draggableId={list.id}
                        index={index}
                        isDragDisabled={isCreating}
                      >
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            className={
                              snapshot.isDragging
                                ? "opacity-90 scale-[1.02] z-50"
                                : ""
                            }
                          >
                            <SwipeableListCard
                              list={list}
                              onSelect={() => handleSelectList(list.id)}
                              onDelete={() => handleDeleteListWithConfirm(list.id)}
                              onRename={() => setEditingListId(list.id)}
                              onLeave={
                                user && list.ownerId !== user.userId
                                  ? () => handleLeaveListWithConfirm(list.id)
                                  : undefined
                              }
                              onShare={
                                user &&
                                list.ownerId === user.userId
                                  ? () => setShareListId(list.id)
                                  : undefined
                              }
                              isOwner={
                                !user ||
                                list.ownerId === undefined ||
                                list.ownerId === user.userId
                              }
                              dragHandleProps={provided.dragHandleProps}
                              isDragging={snapshot.isDragging}
                            />
                          </div>
                        )}
                      </Draggable>
                    )
                  )}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          )}
        </main>
      </DragDropContext>

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
            aria-label="Создать список"
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
