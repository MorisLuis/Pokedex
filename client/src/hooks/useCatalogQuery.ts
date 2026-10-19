import { useEffect, useState } from "react";
import type { PokemonListParams } from "../types/pokemon";

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

export function readCatalogQuery(search: string): PokemonListParams {
  const query = new URLSearchParams(search);
  return {
    search: (query.get("search") ?? "").trim(),
    sortBy: query.get("sortBy") === "name" ? "name" : "id",
    order: query.get("order") === "desc" ? "desc" : "asc",
    limit: integer(query.get("limit"), 20, 1, 100),
    offset: integer(query.get("offset"), 0, 0, Number.MAX_SAFE_INTEGER),
  };
}

export interface UseCatalogQueryReturn {
  query: PokemonListParams;
  updateQuery: (changes: Partial<PokemonListParams>) => void;
}

/**
 * Uses URL parameters as catalog state and restores them on browser back/forward.
 * User changes push history entries; search/sort/page-size changes reset pagination.
 * @returns The normalized query and an updater that preserves unrelated URL parameters.
 */

export function useCatalogQuery(): UseCatalogQueryReturn {

  const [query, setQuery] = useState<PokemonListParams>(() =>
    readCatalogQuery(window.location.search),
  );

  useEffect(() => {
    const restore = () => setQuery(readCatalogQuery(window.location.search));
    window.addEventListener("popstate", restore);
    return () => window.removeEventListener("popstate", restore);
  }, []);

  function updateQuery(changes: Partial<PokemonListParams>): void {

    const current = readCatalogQuery(window.location.search);
    const next = { ...current, ...changes };

    if (
      changes.search !== undefined ||
      changes.sortBy !== undefined ||
      changes.order !== undefined ||
      changes.limit !== undefined
    ) next.offset = 0;

    next.search = next.search.trim();
    const url = new URL(window.location.href);

    for (const [key, value] of Object.entries(next))
      url.searchParams.set(key, String(value));

    window.history.pushState(null, "", url);
    setQuery(next);
  }

  return { query, updateQuery };
}
