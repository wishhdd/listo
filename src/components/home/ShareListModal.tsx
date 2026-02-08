import { Search, UserMinus, X } from "lucide-react";
import { useState } from "react";
import { api } from "../../api/client";
import type { TodoList } from "../../types";
import { useAuth } from "../../hooks/useAuth";

interface ShareListModalProps {
  list: TodoList | null;
  onClose: () => void;
  onUpdateMembers: (listId: string, members: number[]) => void;
}

interface SearchUserResult {
  userId: number;
  userName: string;
}

export function ShareListModal({
  list,
  onClose,
  onUpdateMembers,
}: ShareListModalProps) {
  const { user } = useAuth();
  const [loginInput, setLoginInput] = useState("");
  const [searchError, setSearchError] = useState("");
  const [loading, setLoading] = useState(false);

  if (!list) return null;

  const members = list.members || [];
  const isOwner = user?.userId !== undefined && list.ownerId === user.userId;

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const login = loginInput.trim();
    if (!login) return;
    setSearchError("");
    setLoading(true);
    try {
      const res = await api.get<SearchUserResult>(
        `/api/users/search?login=${encodeURIComponent(login)}`
      );
      if (res.userId === user?.userId) {
        setSearchError("Нельзя добавить себя");
        return;
      }
      if (members.includes(res.userId)) {
        setSearchError("Уже в списке участников");
        return;
      }
      onUpdateMembers(list.id, [...members, res.userId]);
      setLoginInput("");
    } catch (err) {
      setSearchError(
        err instanceof Error ? err.message : "Пользователь не найден"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveMember = (memberId: number) => {
    onUpdateMembers(
      list.id,
      members.filter((id) => id !== memberId)
    );
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
      onClick={onClose}
      onKeyDown={(e) => e.key === "Escape" && onClose()}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="bg-white rounded-2xl shadow-xl max-w-md w-full max-h-[80vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-slate-100">
          <h3 className="font-bold text-lg text-slate-800">
            Участники: {list.title}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-lg transition-colors"
            aria-label="Закрыть"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-4 overflow-y-auto flex-1">
          {isOwner && (
            <form onSubmit={handleSearch} className="flex gap-2 mb-4">
              <input
                type="text"
                value={loginInput}
                onChange={(e) => {
                  setLoginInput(e.target.value);
                  setSearchError("");
                }}
                placeholder="Логин пользователя"
                className="flex-1 min-w-0 px-3 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={loading}
              />
              <button
                type="submit"
                disabled={loading || !loginInput.trim()}
                className="flex-shrink-0 p-2 bg-blue-600 text-white rounded-xl disabled:opacity-50 transition-opacity"
                title="Добавить по логину"
                aria-label="Добавить участника по логину"
              >
                <Search size={20} />
              </button>
            </form>
          )}

          {searchError && (
            <p className="text-sm text-red-500 mb-2">{searchError}</p>
          )}

          <div className="space-y-2">
            {members.length === 0 ? (
              <p className="text-slate-500 text-sm">Нет участников</p>
            ) : (
              members.map((memberId) => (
                <div
                  key={memberId}
                  className="flex items-center justify-between py-2 px-3 bg-slate-50 rounded-xl"
                >
                  <span className="text-slate-700">
                    ID: {memberId}
                    {memberId === user?.userId && " (вы)"}
                  </span>
                  {isOwner && memberId !== user?.userId && (
                    <button
                      type="button"
                      onClick={() => handleRemoveMember(memberId)}
                      className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      title="Убрать из списка"
                      aria-label="Убрать участника из списка"
                    >
                      <UserMinus size={18} />
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
