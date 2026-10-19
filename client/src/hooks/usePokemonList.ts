import { useEffect, useState } from "react";
import { getPokemonList } from "../services/pokemon.service";
import type { PokemonListParams, PokemonListResponse } from "../types/pokemon";

export interface UsePokemonListReturn {
  data: PokemonListResponse | null;
  loading: boolean;
  error: string | null;
  retry: () => void;
}

/**
 * Loads a backend catalog page when its query changes. Cleanup aborts obsolete
 * requests; aborted results cannot replace the current page or display errors.
 * @param params Catalog filters, optional favorite IDs, sort order, and pagination.
 * @returns Page data, loading/error state, and a retry action.
 */
export function usePokemonList(
  params: PokemonListParams,
): UsePokemonListReturn {
  const [state, setState] = useState<Omit<UsePokemonListReturn, "retry">>({
    data: null,
    loading: true,
    error: null,
  });
  const [attempt, setAttempt] = useState(0);
  const { search, sortBy, order, limit, offset, ids } = params;

  useEffect(() => {
    const controller = new AbortController();
    setState({ data: null, loading: true, error: null });
    void getPokemonList(
      { search, sortBy, order, limit, offset, ...(ids !== undefined ? { ids } : {}) },
      controller.signal,
    )
      .then((data) => {
        if (!controller.signal.aborted)
          setState({ data, loading: false, error: null });
      })
      .catch((error: unknown) => {
        if (!controller.signal.aborted)
          setState({
            data: null,
            loading: false,
            error:
              error instanceof Error
                ? error.message
                : "Unable to load Pokémon.",
          });
      });
    return () => controller.abort();
  }, [search, sortBy, order, limit, offset, ids, attempt]);

  return { ...state, retry: () => setAttempt((value) => value + 1) };
}
