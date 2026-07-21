import { ArrowLeft, CheckCircle2, AlertCircle } from 'lucide-react';
import './DisciplinaDetalleStep.css';

function formatearMonto(monto) {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(monto);
}

function textoCupos(disciplina) {
  if (disciplina.cupo_maximo == null) return `${disciplina.cupos_ocupados} inscriptos`;
  return `${disciplina.cupos_ocupados}/${disciplina.cupo_maximo}`;
}

export function DisciplinaDetalleStep({
  disciplina,
  onInscribirme,
  onVolver,
  enviando = false,
  submitted = false,
  enEspera = false,
  sinCupo = false,
  submitError = '',
  onSumarseListaEspera = () => {},
  mostrarBotonTramites = false,
  onIrATramites = () => {},
}) {
  if (submitted || enEspera) {
    return (
      <section className="detalle-disciplina detalle-disciplina--exito">
        <CheckCircle2 size={40} color="var(--status-success-border)" />
        <h2 className="detalle-exito-titulo">
          {enEspera ? '¡Te sumaste a la lista de espera!' : '¡Inscripción confirmada!'}
        </h2>
        <p className="detalle-exito-texto">
          {enEspera
            ? 'Te avisaremos si se libera un cupo en esta disciplina.'
            : 'Ya podés disfrutar de esta disciplina.'}
        </p>
      </section>
    );
  }

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

      {submitError && (
        <div className="detalle-error-box">
          <p className="detalle-error" role="alert">
            <AlertCircle size={14} />
            {submitError}
          </p>
          {mostrarBotonTramites && (
            <button type="button" className="detalle-error-accion-btn" onClick={onIrATramites}>
              Actualizar apto médico
            </button>
          )}
        </div>
      )}

      {sinCupo ? (
        <>
          <p className="detalle-sin-cupo-texto" role="alert">
            Esta disciplina alcanzó su cupo máximo. Podés sumarte a la lista de espera.
          </p>
          <button
            type="button"
            className="disciplina-inscribirme-btn"
            onClick={onSumarseListaEspera}
            disabled={enviando}
          >
            {enviando ? 'Enviando...' : 'Sumarme a lista de espera'}
          </button>
        </>
      ) : (
        <button
          type="button"
          className="disciplina-inscribirme-btn"
          onClick={onInscribirme}
          disabled={enviando}
        >
          {enviando ? 'Inscribiendo...' : 'Inscribirme'}
        </button>
      )}
    </section>
  );
}
