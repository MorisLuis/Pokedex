import styles from "./Pagination.module.css";
export interface PaginationProps {
  total: number;
  limit: number;
  offset: number;
  onPage: (offset: number) => void;
}

export function Pagination({ total, limit, offset, onPage }: PaginationProps) {

  const page = Math.floor(offset / limit) + 1;
  const pages = Math.max(1, Math.ceil(total / limit));
  const start = Math.max(1, Math.min(page - 2, pages - 4));
  const numbers = Array.from(
    { length: Math.min(5, pages) },
    (_, index) => start + index,
  );

  return (
    <nav className={styles.pagination} aria-label="Pokémon pages">

      <button
        aria-label="Previous page"
        disabled={offset === 0}
        onClick={() => onPage(Math.max(0, offset - limit))}
      >
        ← <span>Previous</span>
      </button>

      <div>
        {numbers.map((number) => (
          <button
            key={number}
            aria-label={`Page ${number}`}
            aria-current={page === number ? "page" : undefined}
            onClick={() => onPage((number - 1) * limit)}
          >
            {number}
          </button>
        ))}
      </div>

      <button
        aria-label="Next page"
        disabled={offset + limit >= total}
        onClick={() => onPage(offset + limit)}
      >
        <span>Next</span> →
      </button>
    </nav>
  );
}
