import { z } from 'zod';

const resourceSchema = z.object({
  name: z.string().min(1),
  url: z.string().regex(/^https:\/\/pokeapi\.co\/api\/v2\/pokemon\/[1-9]\d*\/$/),
});

export const pageSchema = z.object({
  count: z.number().int().positive(),
  next: z.string().nullable(),
  results: z.array(resourceSchema).min(1),
});

export const detailsSchema = z.object({
  id: z.number().int().positive(),
  name: z.string().min(1),
  height: z.number().nonnegative(),
  weight: z.number().nonnegative(),
  types: z.array(z.object({
    slot: z.number().int().positive(),
    type: z.object({ name: z.string().min(1) }),
  })).min(1),
});