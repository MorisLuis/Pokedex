export interface PokemonSummary {
  id: number;
  name: string;
  image: string;
}

export interface PokemonDetails extends PokemonSummary {
  types: string[];
  height: number;
  weight: number;
}

export interface PokemonListParams {
  search: string;
  sortBy: 'id' | 'name';
  order: 'asc' | 'desc';
  limit: number;
  offset: number;
}

export interface PokemonListResponse {
  results: PokemonSummary[];
  total: number;
  limit: number;
  offset: number;
}

export interface ApiErrorResponse {
  error: { code: string; message: string };
}
