import { useEffect, useRef } from "react";

/**
 * Calls callback when the document becomes visible (tab focus / visibility change).
 */
export function useOnFocus(callback: () => void): void {
  const savedCallback = useRef(callback);

  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        savedCallback.current();
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, []);
}
