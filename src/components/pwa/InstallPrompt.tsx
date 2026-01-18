import { Download, Share, X } from "lucide-react";
import { useEffect, useState } from "react";
import { usePWAInstall } from "../../hooks/usePWAInstall";

export function InstallPrompt() {
  const { isInstallable, isIOS, isStandalone, installApp } = usePWAInstall();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isInstallable && !isStandalone) {
      const timer = setTimeout(() => setIsVisible(true), 3000);
      return () => clearTimeout(timer);
    }
  }, [isInstallable, isStandalone]);

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-6 left-4 right-4 z-50 animate-in slide-in-from-bottom-5 duration-500">
      <div className="bg-white rounded-2xl shadow-2xl p-4 border border-blue-100 relative max-w-md mx-auto">
        <button
          onClick={() => setIsVisible(false)}
          className="absolute right-2 top-2 p-1 text-slate-300 hover:text-slate-500 rounded-full"
        >
          <X size={20} />
        </button>

        <div className="flex gap-4 items-start pr-6">
          <div className="bg-blue-100 p-3 rounded-xl text-blue-600 flex-shrink-0">
            <Download size={24} />
          </div>

          <div className="flex-1">
            <h3 className="font-bold text-slate-800 text-lg leading-tight mb-1">
              Установить Listo
            </h3>

            {isIOS ? (
              <div className="text-sm text-slate-500 space-y-2">
                <p>Установите приложение на iPhone для быстрого доступа:</p>
                <ol className="list-decimal list-inside space-y-1 ml-1">
                  <li className="flex items-center gap-1">
                    Нажмите <Share size={14} className="text-blue-500 inline" />{" "}
                    "Поделиться"
                  </li>
                  <li>
                    Выберите <strong>"На экран «Домой»"</strong>
                  </li>
                </ol>
              </div>
            ) : (
              // Кнопка для Android
              <div className="text-sm text-slate-500">
                <p className="mb-3">
                  Добавьте приложение на главный экран, чтобы список всегда был
                  под рукой и работал без интернета.
                </p>
                <button
                  onClick={installApp}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-xl w-full transition-colors shadow-md shadow-blue-200"
                >
                  Установить
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
