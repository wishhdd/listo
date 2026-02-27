import { RefreshCw, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useRegisterSW } from "virtual:pwa-register/react";

export function PWAUpdatePrompt() {
  const [showPrompt, setShowPrompt] = useState(false);

  const {
    needRefresh: [, updateServiceWorker],
    updateServiceWorker: updateSW,
  } = useRegisterSW({
    onNeedRefresh() {
      setShowPrompt(true);
    },
  });

  // Проверка обновлений при возврате на вкладку
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        // Проверяем наличие нового SW при возврате на вкладку
        updateSW();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () =>
      document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [updateSW]);

  const close = () => setShowPrompt(false);

  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-6 left-4 right-4 z-50 animate-in slide-in-from-bottom-2 duration-300">
      <div className="bg-slate-800 text-white rounded-2xl shadow-2xl p-4 max-w-md mx-auto border border-slate-700">
        <div className="flex items-start gap-3">
          <RefreshCw className="text-blue-400 size-5 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold text-sm mb-0.5">
              Доступна новая версия
            </p>
            <p className="text-xs text-slate-300">
              Перезагрузите страницу для применения обновлений
            </p>
          </div>
          <button
            onClick={close}
            className="text-slate-400 hover:text-white flex-shrink-0"
            aria-label="Закрыть"
          >
            <X size={18} />
          </button>
        </div>
        <button
          onClick={() => updateServiceWorker(true)}
          className="mt-3 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold py-2 px-4 rounded-xl w-full transition-colors"
        >
          Обновить и перезагрузить
        </button>
      </div>
    </div>
  );
}
