import { X } from "lucide-react";

interface LogoutConfirmModalProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function LogoutConfirmModal({
  isOpen,
  onConfirm,
  onCancel,
}: LogoutConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl relative">
        <button
          onClick={onCancel}
          className="absolute right-4 top-4 text-slate-400 hover:text-slate-600"
        >
          <X size={24} />
        </button>

        <h2 className="text-2xl font-bold text-slate-800 mb-2">
          Выход из аккаунта
        </h2>
        <p className="text-slate-500 mb-6 text-sm">
          Оставить списки локально на этом устройстве?
        </p>

        <div className="flex gap-3">
          <button
            onClick={onConfirm}
            className="flex-1 bg-blue-600 text-white font-bold py-3.5 rounded-xl hover:bg-blue-700 active:scale-95 transition-all"
          >
            Да
          </button>
          <button
            onClick={onCancel}
            className="flex-1 bg-slate-200 text-slate-800 font-bold py-3.5 rounded-xl hover:bg-slate-300 active:scale-95 transition-all"
          >
            Нет
          </button>
        </div>
      </div>
    </div>
  );
}
