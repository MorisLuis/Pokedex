import { useEffect, useRef } from "react";
import { usePokemonDetails } from "../../hooks/usePokemonDetails";
import type { PokemonSummary } from "../../types/pokemon";
import styles from "./DetailsDialog.module.css";

export interface DetailsDialogProps {
  pokemon: PokemonSummary;
  favorite: boolean;
  onToggleFavorite: (id: number) => void;
  onClose: () => void;
}
export function DetailsDialog({
  pokemon,
  favorite,
  onToggleFavorite,
  onClose,
}: DetailsDialogProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const { data, loading, error, retry } = usePokemonDetails({ id: pokemon.id });

  useEffect(() => {
    const dialog = ref.current;
    const active = document.activeElement;
    dialog?.showModal();
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      dialog?.close();
      document.body.style.overflow = overflow;
      if (active instanceof HTMLElement) active.focus();
    };
  }, []);

  return (
    <dialog
      ref={ref}
      className={styles.dialog}
      aria-labelledby="detail-title"
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className={styles.content}>
        <button
          className={styles.close}
          onClick={onClose}
          aria-label="Close Pokémon details"
        >
          ×
        </button>
        <div className={styles.art}>
          <img
            src={pokemon.image}
            alt={pokemon.name}
            onError={(event) => {
              event.currentTarget.hidden = true;
            }}
          />
        </div>
        <p className={styles.number}>
          POKÉMON #{String(pokemon.id).padStart(4, "0")}
        </p>
        <h2 id="detail-title">{pokemon.name}</h2>

        {loading && <p role="status">Loading Pokémon details…</p>}

        {error && (
          <div role="alert">
            <p>{error}</p>
            <button className={styles.retry} onClick={retry}>
              Try again
            </button>
          </div>
        )}

        {data && (
          <>
            <div className={styles.types}>
              {data.types.map((type) => (
                <span key={type}>{type}</span>
              ))}
            </div>
            <dl className={styles.stats}>
              <div>
                <dt>Height</dt>
                <dd>
                  {data.height} <small>m</small>
                </dd>
              </div>
              <div>
                <dt>Weight</dt>
                <dd>
                  {data.weight} <small>kg</small>
                </dd>
              </div>
            </dl>
          </>
        )}
        <button
          className={styles.save}
          aria-pressed={favorite}
          onClick={() => onToggleFavorite(pokemon.id)}
        >
          {favorite ? "♥ Saved to favorites" : "♡ Add to favorites"}
        </button>
      </div>
    </dialog>
  );
}
