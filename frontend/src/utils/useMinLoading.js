// Keep the loading UI visible for at least `minMs` so fast local API
// responses don't flash past unnoticed.
import { useEffect, useRef, useState } from "react";

export function useMinLoading(isLoading, minMs = 400) {
  const [visible, setVisible] = useState(isLoading);
  const startedAt = useRef(0);

  useEffect(() => {
    if (isLoading) {
      startedAt.current = Date.now();
      setVisible(true);
      return undefined;
    }

    const elapsed = Date.now() - startedAt.current;
    const remaining = Math.max(0, minMs - elapsed);
    const timer = setTimeout(() => setVisible(false), remaining);
    return () => clearTimeout(timer);
  }, [isLoading, minMs]);

  return visible;
}
