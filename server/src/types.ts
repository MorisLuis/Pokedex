export interface PokemonSummary {
  id: number;
  name: string;
  image: string;
}

export interface PokemonListResponse {
  results: PokemonSummary[];
  total: number;
  limit: number;
  offset: number;
}

export interface PokemonDetails extends PokemonSummary {
  types: string[];
  height: number;
  weight: number;
}

export interface HealthResponse { status: 'ok' }
export interface ErrorResponse { error: { code: string; message: string } }
