import { useEffect, useState } from "react";
import { getPokemonDetails } from "../services/pokemon.service";
import type { PokemonDetails } from "../types/pokemon";

export interface UsePokemonDetailsParams {
  id: number;
}
export interface UsePokemonDetailsReturn {
  data: PokemonDetails | null;
  loading: boolean;
  error: string | null;
  retry: () => void;
}

/**
 * Fetches details only while a selected Pokémon's dialog is mounted. Closing or
 * changing the selection aborts the request and prevents stale state updates.
 * @param params The selected Pokémon's canonical ID.
 * @returns Details, loading/error state, and a retry action.
 */
export function usePokemonDetails({
  id,
}: UsePokemonDetailsParams): UsePokemonDetailsReturn {
  const [state, setState] = useState<Omit<UsePokemonDetailsReturn, "retry">>({
    data: null,
    loading: true,
    error: null,
  });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setState({ data: null, loading: true, error: null });

    void getPokemonDetails({ nameOrId: id }, controller.signal)
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
                : "Unable to load details.",
          });
      });

    return () => controller.abort();
  }, [id, attempt]);

  return { ...state, retry: () => setAttempt((value) => value + 1) };
}
