import { CheckCircle2, AlertCircle, UserRound } from 'lucide-react';
import { PageHeader } from '../PageHeader/PageHeader';
import './ResumenReservaStep.css';

function formatearMonto(monto) {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(monto);
}

function formatearFecha(fechaIso) {
  return new Intl.DateTimeFormat('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(fechaIso));
}

/** Resumen final de la reserva (instalación, turno y socios) con confirmación. */
export function ResumenReservaStep({
  instalacion,
  fecha,
  turno,
  socioTitular,
  sociosAgregados,
  onConfirmar,
  onCancelar,
  enviando,
  submitted,
  reservaConfirmada = false,
  submitError,
  sociosIncumplen = [],
  onVerReservas,
}) {
  if (submitted) {
    return (
      <section className="resumen-reserva resumen-reserva--exito">
        <CheckCircle2 size={40} color="var(--status-success-border)" />
        <h2 className="resumen-exito-titulo">
          {reservaConfirmada ? '¡Reserva confirmada!' : '¡Reserva registrada!'}
        </h2>
        <p className="resumen-exito-texto">
          {reservaConfirmada
            ? 'Esta instalación es gratuita, así que tu reserva ya quedó confirmada. No hace falta ningún pago.'
            : 'Tu reserva quedó pendiente hasta confirmar el pago.'}
        </p>
        {onVerReservas && (
          <button type="button" className="csf-btn-submit" onClick={onVerReservas}>
            Ver mis reservas
          </button>
        )}
      </section>
    );
  }

  const todosLosSocios = [socioTitular, ...sociosAgregados];

  return (
    <section className="resumen-reserva">

      <PageHeader
        variant="hero"
        eyebrow="Nueva reserva"
        titulo="Confirmá tu reserva"
        stats={[
          { label: 'Instalación', value: instalacion.nombre },
          { label: 'Turno', value: `${formatearFecha(fecha)} · ${turno.slice(0, 5)}` },
          { label: 'Valor del turno', value: formatearMonto(instalacion.valor_turno) },
        ]}
      />

      <h3 className="resumen-socios-titulo">Socios</h3>
      <ul className="resumen-socios-lista">
        {todosLosSocios.map((s, i) => (
          <li className="resumen-socios-item" key={s.id}>
            <span className="resumen-socios-item-icono"><UserRound size={16} /></span>
            <span className="resumen-socios-item-nombre">{s.nombre} {s.apellido}</span>
            {i === 0 && <span className="resumen-socios-item-badge">Titular</span>}
          </li>
        ))}
      </ul>

      {submitError && (
        <div className="resumen-error-box">
          <p className="resumen-error">
            <AlertCircle size={14} />
            {submitError}
          </p>
          {sociosIncumplen.length > 0 && (
            <ul className="resumen-error-socios-lista">
              {sociosIncumplen.map((nroSocio) => {
                const socio = todosLosSocios.find((s) => s.nro_socio === nroSocio);
                return (
                  <li className="resumen-error-socios-item" key={nroSocio}>
                    {socio ? `${socio.nombre} ${socio.apellido} (N° ${nroSocio})` : `Socio N° ${nroSocio}`}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}

      <div className="resumen-acciones">
        <button type="button" className="resumen-btn-cancelar" onClick={onCancelar} disabled={enviando}>
          Cancelar
        </button>
        <button type="button" className="resumen-btn-confirmar" onClick={onConfirmar} disabled={enviando}>
          {enviando ? 'Confirmando...' : 'Confirmar'}
        </button>
      </div>
    </section>
  );
}
