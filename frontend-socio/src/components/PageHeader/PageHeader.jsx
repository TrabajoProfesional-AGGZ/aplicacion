import './PageHeader.css';

/**
 * Encabezado de página. `variant="title"` (claro, por defecto) para listas y
 * flujos; `variant="hero"` (oscuro, gradiente + grano) solo para momentos de
 * identidad: WelcomeCard, Carnet, resumen de Finanzas.
 */
export function PageHeader({
  variant = 'title',
  tono = null,
  eyebrow,
  titulo,
  subtitulo = null,
  stats = [],
  accion = null,
  children = null,
}) {
  const claseTono = variant === 'hero' && tono ? ` page-header--${tono}` : '';

  return (
    <header className={`page-header page-header--${variant}${claseTono}`}>
      {variant === 'hero' && <div className="page-header-texture" aria-hidden="true" />}
      <div className="page-header-inner">
        {eyebrow && <span className="page-header-eyebrow">{eyebrow}</span>}
        {titulo && <h2 className="page-header-titulo">{titulo}</h2>}
        {subtitulo && <p className="page-header-subtitulo">{subtitulo}</p>}
        {stats.length > 0 && (
          <div className="page-header-stats">
            {stats.map((s) => (
              <div className="page-header-stat" key={`stat-${s.label}`} aria-label={`${s.label}: ${s.value}`}>
                <span className="page-header-stat-label">{s.label}</span>
                <span className={`page-header-stat-value${s.tono ? ` page-header-stat-value--${s.tono}` : ''}`}>
                  {s.value}
                </span>
              </div>
            ))}
          </div>
        )}
        {accion && <div className="page-header-accion">{accion}</div>}
        {children}
      </div>
    </header>
  );
}
