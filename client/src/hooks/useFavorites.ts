import { useEffect, useState } from "react";

const KEY = "deardoc-pokedex-favorites";

export function parseFavorites(value: string | null): number[] {
  try {
    const parsed: unknown = JSON.parse(value ?? "[]");
    return Array.isArray(parsed)
      ? [
        ...new Set(
          parsed.filter(
            (id: unknown): id is number =>
              typeof id === "number" && Number.isSafeInteger(id) && id > 0,
          ),
        ),
      ]
      : [];
  } catch {
    return [];
  }
}

function readFavorites(): number[] {
  try {
    return parseFavorites(window.localStorage.getItem(KEY));
  } catch {
    return [];
  }
}

export interface UseFavoritesReturn {
  favorites: readonly number[];
  toggleFavorite: (id: number) => void;
  persistenceError: string | null;
}

/**
 * Persists favorite IDs in localStorage and listens for changes from other tabs.
 * Malformed storage is ignored. If storage is unavailable, favorites remain usable
 * in memory and a warning explains that changes may not survive a reload.
 * @returns Favorite IDs, a toggle action, and any persistence warning.
 */
export function useFavorites(): UseFavoritesReturn {
  const [favorites, setFavorites] = useState<number[]>(readFavorites);
  const [persistenceError, setPersistenceError] = useState<string | null>(null);

  useEffect(() => {
    const sync = (event: StorageEvent) => {
      if (event.key === KEY || event.key === null)
        setFavorites(readFavorites());
    };
    window.addEventListener("storage", sync);
    return () => window.removeEventListener("storage", sync);
  }, []);

  function toggleFavorite(id: number): void {
    const next = favorites.includes(id)
      ? favorites.filter((value) => value !== id)
      : [...favorites, id];

    setFavorites(next);

    try {
      window.localStorage.setItem(KEY, JSON.stringify(next));
      setPersistenceError(null);
    } catch {
      setPersistenceError(
        "Favorites are available this session, but could not be saved on this device.",
      );
    }
  }

  return { favorites, toggleFavorite, persistenceError };
}
