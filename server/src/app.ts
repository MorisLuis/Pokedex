import express from 'express';
import { createPokemonCache } from './cache/pokemon.cache.js';
import { createPokemonService } from './services/pokemon.service.js';
import { pokemonRoutes } from './routes/pokemon.routes.js';
import { errorMiddleware } from './middleware/error.middleware.js';
import { AppError } from './errors.js';
import type { HealthResponse } from './types.js';

export function createApp(cache = createPokemonCache()) {

  const app = express();

  app.get<Record<string, never>, HealthResponse>('/api/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  const pokemonService = createPokemonService(cache);
  const pokemonRouter = pokemonRoutes(pokemonService);

  app.use('/api/pokemon', pokemonRouter);
  app.use((_req, _res, next) => next(new AppError(404, 'NOT_FOUND', 'Endpoint not found')));
  app.use(errorMiddleware);

  return app;
}
