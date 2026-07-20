import { ArrowLeft, CheckCircle2, AlertCircle, UserRound } from 'lucide-react';
import './ResumenReservaStep.css';

function formatearMonto(monto) {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(monto);
}

function formatearFecha(fechaIso) {
  return new Intl.DateTimeFormat('es-AR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(fechaIso));
}

export function ResumenReservaStep({
  instalacion,
  fecha,
  turno,
  socioTitular,
  sociosAgregados,
  onConfirmar,
  onCancelar,
  onVolver,
  enviando,
  submitted,
  submitError,
  sociosIncumplen = [],
}) {
  if (submitted) {
    return (
      <section className="resumen-reserva resumen-reserva--exito">
        <CheckCircle2 size={40} color="var(--status-success-border)" />
        <h2 className="resumen-exito-titulo">¡Reserva registrada!</h2>
        <p className="resumen-exito-texto">Tu reserva quedó pendiente hasta confirmar el pago.</p>
      </section>
    );
  }

  const todosLosSocios = [socioTitular, ...sociosAgregados];

  return (
    <section className="resumen-reserva">
      <button type="button" className="resumen-volver-btn" onClick={onVolver}>
        <ArrowLeft size={18} />
        Volver
      </button>

      <section className="resumen-banner">
        <div className="resumen-banner-texture" aria-hidden="true" />
        <div className="resumen-banner-content">
          <span className="resumen-banner-eyebrow">Nueva reserva</span>
          <h2 className="resumen-banner-title">Confirmá tu reserva</h2>

          <div className="resumen-banner-stats">
            <div className="resumen-banner-stat">
              <span className="resumen-banner-stat-label">Instalación</span>
              <span className="resumen-banner-stat-valor">{instalacion.nombre}</span>
            </div>
            <div className="resumen-banner-divider" aria-hidden="true" />
            <div className="resumen-banner-stat">
              <span className="resumen-banner-stat-label">Turno</span>
              <span className="resumen-banner-stat-valor">{formatearFecha(fecha)} · {turno.slice(0, 5)}</span>
            </div>
            <div className="resumen-banner-divider" aria-hidden="true" />
            <div className="resumen-banner-stat">
              <span className="resumen-banner-stat-label">Valor del turno</span>
              <span className="resumen-banner-stat-valor">{formatearMonto(instalacion.valor_turno)}</span>
            </div>
          </div>
        </div>
      </section>

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
