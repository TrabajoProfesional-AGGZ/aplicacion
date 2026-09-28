import { CheckCircle2 } from 'lucide-react';
import './PageHeader.css';

/**
 * Encabezado de página. `variant="hero"` (oscuro, gradiente + grano) es el
 * banner estándar — se usa en todas las páginas/pasos de flujo, no solo en
 * momentos de identidad. `variant="title"` (claro, default del prop) queda
 * disponible pero sin uso actual en la app.
 */
export function PageHeader({
  variant = 'title',
  tono = null,
  eyebrow,
  titulo,
  subtitulo = null,
  stats = [],
  accion = null,
  aviso = null,
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
        {aviso && (
          <div className="page-header-aviso">
            <CheckCircle2 size={22} className="page-header-aviso-icon" aria-hidden="true" />
            <div className="page-header-aviso-texto">
              <p className="page-header-aviso-titulo">{aviso.titulo}</p>
              <p className="page-header-aviso-descripcion">{aviso.texto}</p>
              {aviso.accion && (
                <button type="button" className="page-header-aviso-btn" onClick={aviso.accion.onClick}>
                  {aviso.accion.label}
                </button>
              )}
            </div>
          </div>
        )}
        {children}
      </div>
    </header>
  );
}
