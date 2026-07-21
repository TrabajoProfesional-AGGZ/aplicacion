import { ArrowLeft, Users, ChevronRight, MapPin, Tag } from 'lucide-react';
import { LoadingScreen } from '../LoadingScreen/LoadingScreen';
import './DisciplinasListStep.css';

function textoCupos(disciplina) {
  if (disciplina.cupo_maximo == null) return `${disciplina.cupos_ocupados} inscriptos · Sin límite`;
  return `${disciplina.cupos_ocupados}/${disciplina.cupo_maximo} cupos`;
}

export function DisciplinasListStep({ disciplinas, cargando, error, onSeleccionar, onVolver }) {
  return (
    <section className="disciplinas-lista">
      <section className="disciplinas-banner">
        <div className="disciplinas-banner-texture" aria-hidden="true" />
        <button type="button" className="disciplinas-banner-volver" onClick={onVolver} aria-label="Volver">
          <ArrowLeft size={18} />
        </button>
        <span className="disciplinas-banner-eyebrow">Actividades del club</span>
        <h2 className="disciplinas-banner-title">Inscribite a una actividad</h2>
      </section>

      {cargando && <LoadingScreen />}

      {!cargando && error && (
        <p className="disciplinas-error">No se pudieron cargar las disciplinas.</p>
      )}

      {!cargando && !error && disciplinas.length === 0 && (
        <p className="disciplinas-empty">No hay disciplinas disponibles en este momento.</p>
      )}

      {!cargando && !error && disciplinas.length > 0 && (
        <div className="disciplinas-grid">
          {disciplinas.map((disciplina) => (
            <button
              type="button"
              key={disciplina.id}
              className="disciplina-card"
              onClick={() => onSeleccionar(disciplina)}
            >
              <span className="disciplina-card-info">
                <span className="disciplina-card-nombre">{disciplina.nombre}</span>
                <span className="disciplina-card-meta">
                  <span className="disciplina-card-meta-item">
                    <Users size={13} />
                    {textoCupos(disciplina)}
                  </span>
                  <span className="disciplina-card-meta-item">
                    <Tag size={13} />
                    {disciplina.categoria_socio?.nombre ?? 'Todas las categorías'}
                  </span>
                  <span className="disciplina-card-meta-item">
                    <MapPin size={13} />
                    {disciplina.sede.nombre}
                  </span>
                </span>
              </span>
              <ChevronRight size={18} className="disciplina-card-chevron" />
            </button>
          ))}
        </div>
      )}
    </section>
  );
}
