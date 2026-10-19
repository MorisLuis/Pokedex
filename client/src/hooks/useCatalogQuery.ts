import { useCallback, useEffect, useState } from "react";
import type { CatalogQuery } from "../types/pokemon";

function integer(
  value: string | null,
  fallback: number,
  min: number,
  max: number,
): number {
  if (!value || !/^\d+$/.test(value)) return fallback;
  const number = Number(value);
  return Number.isSafeInteger(number) && number >= min && number <= max
    ? number
    : fallback;
}

export function readCatalogQuery(search: string): CatalogQuery {
  const query = new URLSearchParams(search);
  return {
    search: (query.get("search") ?? "").trim(),
    favoritesOnly: query.get("favoritesOnly") === "true",
    sortBy: query.get("sortBy") === "name" ? "name" : "id",
    order: query.get("order") === "desc" ? "desc" : "asc",
    limit: integer(query.get("limit"), 20, 1, 100),
    offset: integer(query.get("offset"), 0, 0, Number.MAX_SAFE_INTEGER),
  };
}

/** Keeps the current filters while returning to the first page when the result set changes. */
export function applyCatalogQueryChanges(current: CatalogQuery, changes: Partial<CatalogQuery>): CatalogQuery {
  const next = { ...current, ...changes };
  if (changes.search !== undefined || changes.sortBy !== undefined ||
      changes.order !== undefined || changes.limit !== undefined ||
      changes.favoritesOnly !== undefined) next.offset = 0;
  next.search = next.search.trim();
  return next;
}

export interface UseCatalogQueryReturn {
  query: CatalogQuery;
  updateQuery: (changes: Partial<CatalogQuery>) => void;
}

/**
 * Uses URL parameters as catalog state and restores them on browser back/forward.
 * User changes push history entries; search/sort/page-size/favorites-filter changes reset pagination.
 * @returns The normalized query and an updater that preserves unrelated URL parameters.
 */

export function useCatalogQuery(): UseCatalogQueryReturn {

  const [query, setQuery] = useState<CatalogQuery>(() =>
    readCatalogQuery(window.location.search),
  );

  useEffect(() => {
    const restore = () => setQuery(readCatalogQuery(window.location.search));
    window.addEventListener("popstate", restore);
    return () => window.removeEventListener("popstate", restore);
  }, []);

  const updateQuery = useCallback((changes: Partial<CatalogQuery>): void => {
    const current = readCatalogQuery(window.location.search);
    const next = applyCatalogQueryChanges(current, changes);
    const url = new URL(window.location.href);

    for (const [key, value] of Object.entries(next)) {
      if (key === "favoritesOnly" && !value) url.searchParams.delete(key);
      else url.searchParams.set(key, String(value));
    }

    window.history.pushState(null, "", url);
    setQuery(next);
  }, []);

  return { query, updateQuery };
}
