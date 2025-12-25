import { useEffect, useState } from "react";

/**
 * Хук для синхронизации состояния с localStorage.
 * * @param key Ключ, под которым данные будут храниться в браузере (например, "listo-data")
 * @param initialValue Начальное значение, если в хранилище пусто
 */
export function useLocalStorage<T>(key: string, initialValue: T) {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      if (typeof window === "undefined") {
        return initialValue;
      }
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(`Ошибка чтения ключа "${key}" из localStorage:`, error);
      return initialValue;
    }
  });

  useEffect(() => {
    try {
      if (typeof window !== "undefined") {
        window.localStorage.setItem(key, JSON.stringify(storedValue));
      }
    } catch (error) {
      console.error(`Ошибка записи ключа "${key}" в localStorage:`, error);
    }
  }, [key, storedValue]);

  return [storedValue, setStoredValue] as const;
}
