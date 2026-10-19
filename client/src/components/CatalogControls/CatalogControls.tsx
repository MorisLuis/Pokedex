import { useEffect, useState } from "react";
import type { PokemonListParams } from "../../types/pokemon";
import styles from "./CatalogControls.module.css";

export interface CatalogControlsProps {
  query: PokemonListParams;
  onChange: (changes: Partial<PokemonListParams>) => void;
}

export function CatalogControls({ query, onChange }: CatalogControlsProps) {
  const [search, setSearch] = useState(query.search);
  useEffect(() => setSearch(query.search), [query.search]);

  return (
    <div className={styles.controls}>
      <form
        className={styles.search}
        role="search"
        onSubmit={(event) => {
          event.preventDefault();
          onChange({ search });
        }}
      >
        <span aria-hidden="true" className={styles.searchIcon}>
          ⌕
        </span>
        <label className={styles.searchLabel} htmlFor="pokemon-search">
          Search Pokémon by name
        </label>
        <input
          id="pokemon-search"
          type="search"
          placeholder="Find your Pokémon by name…"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
        <button type="submit">
          Search <span aria-hidden="true">↗</span>
        </button>
      </form>
      <div className={styles.filters}>
        <span className={styles.caption}>A whole world to discover.</span>
        <div className={styles.selects}>
          <label>
            Sort by{" "}
            <select
              value={query.sortBy}
              onChange={(event) =>
                onChange({
                  sortBy: event.target.value === "name" ? "name" : "id",
                })
              }
            >
              <option value="id">Number</option>
              <option value="name">Name</option>
            </select>
  
          </label>
          <label>
            Order{" "}
            <select
              value={query.order}
              onChange={(event) =>
                onChange({
                  order: event.target.value === "desc" ? "desc" : "asc",
                })
              }
            >
              <option value="asc">Ascending</option>
              <option value="desc">Descending</option>
            </select>
          </label>
          <label>
            Per page{" "}
            <select
              value={query.limit}
              onChange={(event) =>
                onChange({ limit: Number(event.target.value) })
              }
            >
              {[...new Set([12, 20, 40, query.limit])]
                .sort((a, b) => a - b)
                .map((limit) => (
                  <option key={limit} value={limit}>
                    {limit}
                  </option>
                ))}
            </select>
          </label>
        </div>
      </div>
    </div>
  );
}
