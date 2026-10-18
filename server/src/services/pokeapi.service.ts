import { AppError } from '../errors.js';
import { detailsSchema, pageSchema } from '../schemas/pokeapi.schema.js';
import type { PokemonDetails, PokemonSummary } from '../types.js';

const API = 'https://pokeapi.co/api/v2/pokemon/';
export const POKEAPI_TIMEOUT_MS = 5000;

function artwork(id: number): string {
  return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${id}.png`;
}

/**
 * Keeps upstream I/O and validation separate from cache ownership. Fetch and timeout
 * overrides let tests exercise failures without contacting PokéAPI.
 */
export function createPokeApiService({ fetcher = fetch, timeoutMs = POKEAPI_TIMEOUT_MS } = {}) {

  /**
   * Applies a timeout to both fetching and reading JSON. Only detail requests treat
   * an upstream 404 as a missing Pokémon; other failures retain upstream error semantics.
   * Network and JSON failures become 502, unavailable responses 503, and timeouts 504.
   */
  async function request(url: string, allowNotFound = false): Promise<unknown> {

    const signal = AbortSignal.timeout(timeoutMs);

    try {
      const response = await fetcher(url, { signal });

      if (allowNotFound && response.status === 404) {
        throw new AppError(404, 'POKEMON_NOT_FOUND', 'Pokémon not found');
      }

      if (!response.ok) {
        const unavailable = [429, 503].includes(response.status);
        throw new AppError(unavailable ? 503 : 502,
          unavailable ? 'UPSTREAM_UNAVAILABLE' : 'UPSTREAM_ERROR',
          unavailable ? 'Pokémon data is temporarily unavailable' : 'Unable to retrieve Pokémon data',
          { cause: new Error(`PokéAPI HTTP ${response.status}`) });
      }

      return await response.json() as unknown;

    } catch (error) {

      if (error instanceof AppError) throw error;

      if (signal.aborted) {
        throw new AppError(504, 'UPSTREAM_TIMEOUT', 'Pokémon data request timed out', { cause: error });
      }

      throw new AppError(502, 'UPSTREAM_ERROR', 'Unable to retrieve valid Pokémon data', { cause: error });
    }
  }

  /**
   * Discovers the current count before requesting the full catalog, without loading
   * individual details. Count changes, incomplete pages, and duplicate entries reject
   * the snapshot so the caller can preserve its last valid cache. Returned data is frozen.
   *
   * @throws {AppError} If fetching fails or the catalog cannot be validated.
   */
  async function loadIndex(): Promise<readonly PokemonSummary[]> {
    try {
      const first = pageSchema.parse(await request(`${API}?limit=1`));
      const page = pageSchema.parse(await request(`${API}?limit=${first.count}`));

      if (page.count !== first.count || page.next !== null || page.results.length !== page.count) {
        throw new Error('Incomplete PokéAPI catalog');
      }

      const result = page.results.map(({ name, url }) => {
        const id = Number(url.split('/').at(-2));
        if (!Number.isSafeInteger(id)) throw new Error('Invalid Pokémon resource ID');
        return Object.freeze({ id, name, image: artwork(id) });
      });

      if (new Set(result.map(({ id }) => id)).size !== page.count ||
        new Set(result.map(({ name }) => name)).size !== page.count) {
        throw new Error('Duplicate PokéAPI catalog entries');
      }

      return Object.freeze(result);
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError(502, 'INVALID_UPSTREAM_DATA', 'Unable to retrieve valid Pokémon catalog', { cause: error });
    }
  }

  /**
   * Validates the requested ID against the response and maps only UI fields. Types
   * follow their upstream slot order; height and weight become meters and kilograms.
   *
   * @throws {AppError} For a missing Pokémon (404), invalid data (502), or upstream failure.
   */
  async function loadDetails(id: number): Promise<PokemonDetails> {
    try {
      const data = detailsSchema.parse(await request(`${API}${id}/`, true));
      if (data.id !== id) throw new Error('PokéAPI returned a different Pokémon');

      const result: PokemonDetails = {
        id: data.id,
        name: data.name,
        image: artwork(data.id),
        types: [...data.types].sort((a, b) => a.slot - b.slot).map(({ type }) => type.name),
        height: data.height / 10,
        weight: data.weight / 10,
      };

      return result;
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError(502, 'INVALID_UPSTREAM_DATA', 'Unable to retrieve valid Pokémon details', { cause: error });
    }
  }

  return { loadIndex, loadDetails };
}
