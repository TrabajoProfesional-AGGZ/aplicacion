import { CheckCircle2, AlertCircle } from 'lucide-react';
import { PageHeader } from '../PageHeader/PageHeader';
import './DisciplinaDetalleStep.css';

function formatearMonto(monto) {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(monto);
}

function textoCupos(disciplina) {
  if (disciplina.cupo_maximo == null) return `${disciplina.cupos_ocupados} inscriptos`;
  return `${disciplina.cupos_ocupados}/${disciplina.cupo_maximo}`;
}

/**
 * Detalle de una disciplina: banner con cupos/categoría/arancel y la acción de
 * inscribirse (o sumarse a lista de espera si no hay cupo), con sus pantallas
 * de éxito y error inline.
 */
export function DisciplinaDetalleStep({
  disciplina,
  yaInscripto = false,
  onInscribirme,
  enviando = false,
  submitted = false,
  enEspera = false,
  sinCupo = false,
  submitError = '',
  onSumarseListaEspera = () => {},
  mostrarBotonTramites = false,
  onIrATramites = () => {},
  onVerInscripciones,
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
        {onVerInscripciones && (
          <button type="button" className="csf-btn-submit" onClick={onVerInscripciones}>
            Ver mis inscripciones
          </button>
        )}
      </section>
    );
  }

  return (
    <section className="detalle-disciplina">
      <PageHeader
        accion={yaInscripto && (
          <span className="disciplina-banner-badge">Ya estás inscripto a esta disciplina</span>
        )}
        titulo={disciplina.nombre}
        stats={[
          { label: 'Cupos', value: textoCupos(disciplina) },
          { label: 'Categoría de socio', value: disciplina.categoria_socio?.nombre ?? 'Todas' },
          { label: 'Sede', value: disciplina.sede.nombre },
          { label: 'Arancel por mes', value: disciplina.arancelada ? formatearMonto(disciplina.monto_mensual) : 'Sin costo' },
        ]}
      />

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

      {!yaInscripto && (
        sinCupo ? (
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
        )
      )}
    </section>
  );
}
