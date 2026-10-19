import type {
  ApiErrorResponse,
  PokemonDetails,
  PokemonListParams,
  PokemonListResponse,
} from "../types/pokemon";

async function responseError(response: Response): Promise<Error> {
  let message = `Request failed (${response.status}). Please try again.`;

  try {
    const body: unknown = await response.json();
    if (
      typeof body === "object" &&
      body !== null &&
      "error" in body &&
      typeof body.error === "object" &&
      body.error !== null &&
      "message" in body.error &&
      typeof body.error.message === "string" &&
      "code" in body.error &&
      typeof body.error.code === "string"
    ) {
      message = (body as ApiErrorResponse).error.message;
    }
  } catch {
    /* A proxy may return an empty or HTML error response. */
  }

  return new Error(message);
}

/** Requests a backend catalog page; cancellation propagates to the caller and
 * non-success responses surface the API's centralized error message. */
export async function getPokemonList(
  params: PokemonListParams,
  signal?: AbortSignal,
): Promise<PokemonListResponse> {

  const query = new URLSearchParams({
    search: params.search,
    sortBy: params.sortBy,
    order: params.order,
    limit: String(params.limit),
    offset: String(params.offset),
  });

  const response = await fetch(
    `/api/pokemon?${query}`,
    signal ? { signal } : {},
  );

  if (!response.ok) throw await responseError(response);
  return (await response.json()) as PokemonListResponse;
}

export interface PokemonDetailsParams {
  nameOrId: string | number;
}

/** Loads details on demand through our API, never directly from PokéAPI. */
export async function getPokemonDetails(
  params: PokemonDetailsParams,
  signal?: AbortSignal,
): Promise<PokemonDetails> {
  const response = await fetch(
    `/api/pokemon/${encodeURIComponent(params.nameOrId)}`,
    signal ? { signal } : {},
  );
  if (!response.ok) throw await responseError(response);
  return (await response.json()) as PokemonDetails;
}
