import { ChevronDown, X } from "lucide-react";
import { useState } from "react";
import type { ListInvite } from "../../types";
import type { InviteDeclineReason } from "../../types";

interface InviteModalProps {
  invite: ListInvite | null;
  onClose: () => void;
  onAccept: (inviteId: number) => Promise<void>;
  onDecline: (inviteId: number, reason: InviteDeclineReason) => Promise<void>;
  onRemindLater: () => void;
}

export function InviteModal({
  invite,
  onClose,
  onAccept,
  onDecline,
  onRemindLater,
}: InviteModalProps) {
  const [loading, setLoading] = useState(false);
  const [showMore, setShowMore] = useState(false);

  if (!invite) return null;

  const handleAccept = async () => {
    setLoading(true);
    try {
      await onAccept(invite.inviteId);
      onClose();
    } finally {
      setLoading(false);
    }
  };

  const handleDecline = async (reason: InviteDeclineReason) => {
    setLoading(true);
    try {
      await onDecline(invite.inviteId, reason);
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={onClose}
      onKeyDown={(e) => e.key === "Escape" && onClose()}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 p-2 text-slate-400 hover:text-slate-600 rounded-lg transition-colors"
          aria-label="Закрыть"
        >
          <X size={20} />
        </button>

        <h2 className="text-xl font-bold text-slate-800 pr-8 mb-3">
          Приглашение в список
        </h2>
        <p className="text-slate-600 mb-6">
          С вами пользователь <strong>{invite.sharerName}</strong> поделился
          списком <strong>«{invite.listTitle}»</strong>.
        </p>

        <div className="flex flex-col gap-3">
          <button
            type="button"
            onClick={handleAccept}
            disabled={loading}
            className="w-full bg-blue-600 text-white font-semibold py-3.5 rounded-xl hover:bg-blue-700 active:scale-[0.98] transition-all disabled:opacity-50"
          >
            Принять
          </button>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => handleDecline("this_time")}
              disabled={loading}
              className="flex-1 bg-slate-100 text-slate-700 font-medium py-3 rounded-xl hover:bg-slate-200 active:scale-[0.98] transition-all disabled:opacity-50"
            >
              Отказать в этот раз
            </button>
            <button
              type="button"
              onClick={onRemindLater}
              disabled={loading}
              className="flex-1 bg-slate-100 text-slate-700 font-medium py-3 rounded-xl hover:bg-slate-200 active:scale-[0.98] transition-all disabled:opacity-50"
            >
              Напомнить позже
            </button>
          </div>

          <div>
            <button
              type="button"
              onClick={() => setShowMore(!showMore)}
              className="flex items-center gap-1 text-slate-500 text-sm hover:text-slate-700 py-1"
            >
              <ChevronDown
                size={16}
                className={`transition-transform ${showMore ? "rotate-180" : ""}`}
              />
              Ещё варианты
            </button>
            {showMore && (
              <div className="flex flex-col gap-2 mt-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => handleDecline("forever_list")}
                  disabled={loading}
                  className="w-full text-amber-700 text-sm font-medium py-2.5 rounded-lg hover:bg-amber-50 active:scale-[0.98] transition-all disabled:opacity-50"
                >
                  Отказаться от этого списка навсегда
                </button>
                <button
                  type="button"
                  onClick={() => handleDecline("block_user")}
                  disabled={loading}
                  className="w-full text-red-600 text-sm font-medium py-2.5 rounded-lg hover:bg-red-50 active:scale-[0.98] transition-all disabled:opacity-50"
                >
                  Запретить {invite.sharerName} делиться со мной списками
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
