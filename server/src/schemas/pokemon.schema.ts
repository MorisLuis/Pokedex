import { z } from 'zod';

const integerParameter = (min: number, max: number) => z.string()
  .regex(/^\d+$/)
  .transform(Number)
  .pipe(z.number().int().min(min).max(max));

export const listQuerySchema = z.object({
  search: z.string().trim().default(''),
  sortBy: z.enum(['id', 'name']).default('id'),
  order: z.enum(['asc', 'desc']).default('asc'),
  limit: integerParameter(1, 100).default(20),
  offset: integerParameter(0, Number.MAX_SAFE_INTEGER).default(0),
}).strict();

export const nameOrIdSchema = z.string().trim().toLowerCase().refine(
  (value) => /^\d+$/.test(value)
    ? Number.isSafeInteger(Number(value)) && Number(value) > 0
    : /^[a-z]+(?:-[a-z0-9]+)*$/.test(value),
  'Use a Pokémon name or positive integer ID',
).transform((value) => /^\d+$/.test(value) ? String(Number(value)) : value);

export type ListQuery = z.infer<typeof listQuerySchema>;
