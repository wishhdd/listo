import { useEffect, useRef } from "react";

/**
 * Хук для обработки системной кнопки "Назад" в браузере (History API).
 * Добавляет запись в историю при монтировании и вызывает callback при возврате назад.
 * * @param onBack Функция, которая должна выполниться при нажатии "Назад"
 */
export function useBackNavigation(onBack: () => void) {
  const onBackRef = useRef(onBack);

  useEffect(() => {
    onBackRef.current = onBack;
  }, [onBack]);

  useEffect(() => {
    window.history.pushState({ view: "list" }, "", "");

    const handlePopState = () => {
      onBackRef.current();
    };

    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, []);

  const handleUiBack = () => {
    window.history.back();
  };

  return handleUiBack;
}
