import { createPokeApiService, POKEAPI_TIMEOUT_MS } from '../services/pokeapi.service.js';
import type { PokemonDetails, PokemonSummary } from '../types.js';
import type { createPokemonCacheOptions } from './types.js';

const TTL = 60 * 60 * 1000;

/**
 * Creates a Pokémon cache that wraps the PokéAPI service, providing in-memory caching for the Pokémon 
 * index and details with TTL-based refresh.
 */

export function createPokemonCache({
  fetcher = fetch,
  now = Date.now,
  timeoutMs = POKEAPI_TIMEOUT_MS,
  logRefreshError = (error: unknown) => console.error('Pokémon index refresh failed; keeping stale catalog', error),
}: createPokemonCacheOptions = {}) {

  const pokeapi = createPokeApiService({ fetcher, timeoutMs });

  let catalog: readonly PokemonSummary[] | null = null;
  let lastSuccess = 0;
  let indexInFlight: Promise<readonly PokemonSummary[]> | null = null;

  // Intentionally unbounded for this take-home: entries persist until process restart.
  // A long-running service should add an eviction policy if memory usage warrants it.
  const details = new Map<number, PokemonDetails>();
  const detailsInFlight = new Map<number, Promise<PokemonDetails>>();

  function refresh(): Promise<readonly PokemonSummary[]> {
    if (indexInFlight) return indexInFlight;

    indexInFlight = pokeapi.loadIndex().then((replacement) => {
      catalog = replacement;
      lastSuccess = now();
      return replacement;
    })
      .finally(() => { indexInFlight = null; });

    return indexInFlight;
  }

  /** Cold callers await one shared load. Stale callers get the last valid snapshot
   * immediately; only a fully validated refresh replaces it and advances its age. */
  async function getIndex(): Promise<readonly PokemonSummary[]> {
    if (!catalog) return refresh();
    if (now() - lastSuccess >= TTL && !indexInFlight) {
      void refresh().catch(logRefreshError);
    }
    return catalog;
  }

  async function getDetails(id: number): Promise<PokemonDetails> {
    const cached = details.get(id);
    if (cached) return cached;

    const pending = detailsInFlight.get(id);
    if (pending) return pending;

    const promise = pokeapi.loadDetails(id)
      .then((result) => {
        details.set(id, result);
        return result;
      })
      .finally(() => { detailsInFlight.delete(id); });

    detailsInFlight.set(id, promise);
    return promise;
  }

  return { getIndex, getDetails };
}

export type PokemonCache = ReturnType<typeof createPokemonCache>;
