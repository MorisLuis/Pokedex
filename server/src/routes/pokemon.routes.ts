import { Router } from 'express';
import { listQuerySchema, nameOrIdSchema } from '../schemas/pokemon.schema.js';
import type { PokemonService } from '../services/pokemon.service.js';
import type { PokemonDetails, PokemonListResponse } from '../types.js';

export function pokemonRoutes(service: PokemonService) {

  const router = Router();

  router.get<Record<string, never>, PokemonListResponse>('/', async (req, res) => {
    const query = listQuerySchema.parse(req.query);
    res.json(await service.list(query));
  });

  router.get<{ nameOrId: string }, PokemonDetails>('/:nameOrId', async (req, res) => {
    const nameOrId = nameOrIdSchema.parse(req.params.nameOrId);
    res.json(await service.details(nameOrId));
  });

  return router;
}
