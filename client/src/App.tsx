import { useState } from 'react';
import { CatalogControls } from './components/CatalogControls/CatalogControls';
import { DetailsDialog } from './components/DetailsDialog/DetailsDialog';
import { Pagination } from './components/Pagination/Pagination';
import { PokemonCard } from './components/PokemonCard/PokemonCard';
import { useCatalogQuery } from './hooks/useCatalogQuery';
import { useFavorites } from './hooks/useFavorites';
import { usePokemonList } from './hooks/usePokemonList';
import type { PokemonSummary } from './types/pokemon';
import styles from './App.module.css';

export function App() {
  const { query, updateQuery } = useCatalogQuery();
  const { data, loading, error, retry } = usePokemonList(query);
  const { favorites, toggleFavorite, persistenceError } = useFavorites();
  const [selected, setSelected] = useState<PokemonSummary | null>(null);

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <a href="/" className={styles.brand} aria-label="DearDoc Pokédex home">
          <span className={styles.pokeball} aria-hidden="true" />
          <span>pokédex<span className={styles.brandDot}>.</span></span>
        </a>
        <span className={styles.navLabel}>THE POKÉMON FIELD GUIDE</span>
        <span className={styles.favoriteCount}>
          <span aria-hidden="true">♥</span> {favorites.length} <span>favorites</span>
        </span>
      </header>

      <main className={styles.main}>
        <section className={styles.hero} aria-labelledby="page-title">
          <div className={styles.eyebrow}><span /> YOUR NEXT DISCOVERY STARTS HERE</div>
          <h1 id="page-title">Small creatures.<br /><span>Endless discoveries.</span></h1>
          <p>
            Get to know every Pokémon. Find your favorites.<br />
            Build a little collection of your own.
          </p>
          <div className={styles.heroMark} aria-hidden="true">
            <span className={styles.spark}>✦</span>
            <span className={styles.largeBall} />
            <span className={styles.sparkSmall}>✧</span>
          </div>
        </section>

        <CatalogControls query={query} onChange={updateQuery} />
        <section aria-labelledby="catalog-title" aria-busy={loading}>
          <div className={styles.sectionHeading}>
            <h2 id="catalog-title">
              {query.search ? 'Search results' : 'Explore Pokémon'}
              <span className={styles.resultCount}>{data ? data.total.toLocaleString() : '…'}</span>
            </h2>
            <span className={styles.subtle}>Find a new favorite <span aria-hidden="true">✦</span></span>
          </div>

          {persistenceError && <p className={styles.warning} role="status">{persistenceError}</p>}

          {loading && (
            <>
              <p className={styles.loadingText} role="status">Discovering Pokémon…</p>
              <div className={styles.grid} aria-hidden="true">
                {Array.from({ length: Math.min(query.limit, 12) }, (_, index) => (
                  <div className={styles.skeleton} key={index} />
                ))}
              </div>
            </>
          )}
          {error && (
            <div className={styles.state} role="alert">
              <span aria-hidden="true">↯</span>
              <h3>A little trouble on the trail.</h3>
              <p>{error}</p>
              <button onClick={retry}>Try again</button>
            </div>
          )}
          {data && data.results.length === 0 && (
            <div className={styles.state}>
              <span aria-hidden="true">⌕</span>
              <h3>{data.total ? 'This page is out of range.' : 'No Pokémon found.'}</h3>
              <p>{data.total
                ? 'Return to the first page to keep exploring.'
                : 'Try another name. There’s a whole world to discover.'}
              </p>

              <button onClick={() => updateQuery(data.total ? { offset: 0 } : { search: '' })}>
                {data.total ? 'First page' : 'Explore all Pokémon'}
              </button>
            </div>
          )}
          {data && data.results.length > 0 && (
            <>
              <div className={styles.grid}>
                {data.results.map((pokemon) => (
                  <PokemonCard
                    key={pokemon.id}
                    pokemon={pokemon}
                    favorite={favorites.includes(pokemon.id)}
                    onToggleFavorite={toggleFavorite}
                    onSelect={setSelected}
                  />
                ))}
              </div>
              <div className={styles.range} role="status">
                Showing {query.offset + 1}–{query.offset + data.results.length} of {data.total.toLocaleString()} Pokémon
              </div>
              <Pagination
                total={data.total}
                limit={query.limit}
                offset={query.offset}
                onPage={(offset) => updateQuery({ offset })}
              />
            </>
          )}
        </section>
      </main>

      <footer className={styles.footer}>
        <span>Made for the curious.</span>
        <span>Pokémon data by PokéAPI · Artwork © Pokémon</span>
      </footer>

      {selected && (
        <DetailsDialog
          key={selected.id}
          pokemon={selected}
          favorite={favorites.includes(selected.id)}
          onToggleFavorite={toggleFavorite}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  );
}
