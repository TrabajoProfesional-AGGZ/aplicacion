import './SkeletonRows.css';

/** Filas placeholder mientras carga una lista. `n` filas de `altura` px. */
export function SkeletonRows({ n = 3, altura = 64, label = 'Cargando' }) {
  return (
    <div className="skeleton-rows" role="status" aria-label={label}>
      {Array.from({ length: n }, (_, i) => (
        <div key={i} className="skeleton-row" style={{ height: altura }} />
      ))}
    </div>
  );
}
