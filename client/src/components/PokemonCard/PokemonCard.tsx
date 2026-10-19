import { useState } from 'react';
import type { PokemonSummary } from '../../types/pokemon';
import styles from './PokemonCard.module.css';

export interface PokemonCardProps {
  pokemon: PokemonSummary;
  favorite: boolean;
  onToggleFavorite: (id: number) => void;
  onSelect: (pokemon: PokemonSummary) => void;
}

export function PokemonCard({ pokemon, favorite, onToggleFavorite, onSelect }: PokemonCardProps) {
  const [imageFailed, setImageFailed] = useState(false);
  return (
    <article className={`${styles.card} ${styles[`color${pokemon.id % 6}`]}`}>
      <button className={styles.open} onClick={() => onSelect(pokemon)} aria-label={`View ${pokemon.name} details`}>
        <span className={styles.number}>#{String(pokemon.id).padStart(4, '0')}</span>
        <span className={styles.name}>{pokemon.name}</span>
        <span className={styles.hint}>Meet Pokémon <span aria-hidden="true">↗</span></span>
        {imageFailed ? <span className={styles.fallback}>Artwork unavailable</span> :
          <img src={pokemon.image} alt="" loading="lazy" onError={() => setImageFailed(true)} />}
      </button>
      <button className={styles.favorite} aria-label={`${favorite ? 'Remove' : 'Add'} ${pokemon.name} ${favorite ? 'from' : 'to'} favorites`}
        aria-pressed={favorite} onClick={() => onToggleFavorite(pokemon.id)}>
        <span aria-hidden="true">{favorite ? '♥' : '♡'}</span>
      </button>
    </article>
  );
}
