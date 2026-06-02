import { useEffect, useMemo, useState } from "react";

// Simple client-side pagination over an in-memory array.
export function usePagination(items, pageSize = 10) {
  const [page, setPage] = useState(1);
  const pageCount = Math.max(1, Math.ceil(items.length / pageSize));

  // Keep the page in range when the underlying list shrinks (e.g. filtering).
  useEffect(() => {
    if (page > pageCount) setPage(pageCount);
  }, [page, pageCount]);

  const pageItems = useMemo(() => {
    const start = (page - 1) * pageSize;
    return items.slice(start, start + pageSize);
  }, [items, page, pageSize]);

  return { page, setPage, pageCount, pageItems };
}
