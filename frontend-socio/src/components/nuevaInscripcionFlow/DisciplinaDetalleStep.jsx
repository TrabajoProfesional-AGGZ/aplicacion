import { ArrowLeft } from 'lucide-react';
import './DisciplinaDetalleStep.css';

function formatearMonto(monto) {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(monto);
}

function textoCupos(disciplina) {
  if (disciplina.cupo_maximo == null) return `${disciplina.cupos_ocupados} inscriptos`;
  return `${disciplina.cupos_ocupados}/${disciplina.cupo_maximo}`;
}

export function DisciplinaDetalleStep({ disciplina, onInscribirme, onVolver }) {
  return (
    <section className="detalle-disciplina">
      <button type="button" className="detalle-volver-btn" onClick={onVolver}>
        <ArrowLeft size={18} />
        Volver
      </button>

      <section className="disciplina-banner">
        <div className="disciplina-banner-texture" aria-hidden="true" />
        <div className="disciplina-banner-content">
          <h2 className="disciplina-banner-nombre">{disciplina.nombre}</h2>

          <div className="disciplina-banner-stats">
            <div className="disciplina-banner-stat">
              <span className="disciplina-banner-stat-label">Cupos</span>
              <span className="disciplina-banner-stat-valor">{textoCupos(disciplina)}</span>
            </div>
            <div className="disciplina-banner-divider" aria-hidden="true" />
            <div className="disciplina-banner-stat">
              <span className="disciplina-banner-stat-label">Categoría de socio</span>
              <span className="disciplina-banner-stat-valor">{disciplina.categoria_socio?.nombre ?? 'Todas'}</span>
            </div>
            <div className="disciplina-banner-divider" aria-hidden="true" />
            <div className="disciplina-banner-stat">
              <span className="disciplina-banner-stat-label">Sede</span>
              <span className="disciplina-banner-stat-valor">{disciplina.sede.nombre}</span>
            </div>
            <div className="disciplina-banner-divider" aria-hidden="true" />
            <div className="disciplina-banner-stat">
              <span className="disciplina-banner-stat-label">Arancel por mes</span>
              <span className="disciplina-banner-stat-valor">
                {disciplina.arancelada ? formatearMonto(disciplina.monto_mensual) : 'Sin costo'}
              </span>
            </div>
          </div>
        </div>
      </section>

      <button type="button" className="disciplina-inscribirme-btn" onClick={onInscribirme}>
        Inscribirme
      </button>
    </section>
  );
}
