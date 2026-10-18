import type { PokemonCache } from '../cache/pokemon.cache.js';
import { AppError } from '../errors.js';
import type { ListQuery } from '../schemas/pokemon.schema.js';
import type { PokemonDetails, PokemonListResponse } from '../types.js';


/**
 * Coordinates already-validated route inputs with the cache. Cache freshness and
 * upstream error handling remain the responsibility of the cache and PokéAPI service.
 */
export function createPokemonService(cache: PokemonCache) {

  return {

    /**
     * Searches the entire catalog before sorting and paginating. Filtering creates a
     * separate array so sorting cannot reorder the shared cache; total counts all
     * matches before pagination. An unmatched search returns an empty successful page.
     */
    async list(query: ListQuery): Promise<PokemonListResponse> {
      const catalog = await cache.getIndex();

      const search = query.search.toLowerCase();
      const matches = catalog.filter(({ name }) => name.toLowerCase().includes(search));
      const direction = query.order === 'asc' ? 1 : -1;

      matches.sort((a, b) => direction *
        (
          query.sortBy === 'id'
            ? a.id - b.id : a.name.localeCompare(b.name, 'en')
        )
      );

      return {
        results: matches.slice(query.offset, query.offset + query.limit),
        total: matches.length, 
        limit: query.limit, 
        offset: query.offset,
      };
    },

    /**
     * Expects a normalized name or canonical numeric ID from route validation. Names
     * resolve through the possibly stale catalog so both forms share the ID-keyed
     * details cache. Numeric IDs bypass the index and rely on the detail lookup's 404.
     *
     * @throws {AppError} With 404 when a name is absent from the current catalog snapshot.
     */
    async details(nameOrId: string): Promise<PokemonDetails> {
      const numeric = /^\d+$/.test(nameOrId);
      let id = Number(nameOrId);

      if (!numeric) {
        const catalog = await cache.getIndex();
        const entry = catalog.find(({ name }) => name === nameOrId);
        if (!entry) throw new AppError(404, 'POKEMON_NOT_FOUND', 'Pokémon not found');
        id = entry.id;
      }
  
      return cache.getDetails(id);
    },
  };

}

export type PokemonService = ReturnType<typeof createPokemonService>;
