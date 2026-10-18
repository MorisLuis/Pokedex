export interface PokemonCache {
    getIndex(): Promise<readonly PokemonSummary[]>;
    getDetails(id: number): Promise<PokemonDetails>;
}

export interface createPokemonCacheOptions {
    fetcher?: typeof fetch;
    now?: () => number;
    timeoutMs?: number;
    logRefreshError?: (error: unknown) => void;
}