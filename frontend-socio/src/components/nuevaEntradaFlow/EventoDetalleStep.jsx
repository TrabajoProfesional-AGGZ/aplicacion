import { ArrowLeft, AlertCircle } from 'lucide-react';
import './EventoDetalleStep.css';

function formatearFecha(fechaIso) {
  return new Intl.DateTimeFormat('es-AR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(fechaIso));
}

function formatearMonto(monto) {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(monto);
}

export function EventoDetalleStep({
  evento,
  yaTieneEntrada = false,
  onPagarEntrada,
  onVolver,
  enviando = false,
  submitError = '',
}) {
  return (
    <section className="detalle-evento">
      <button type="button" className="detalle-volver-btn" onClick={onVolver}>
        <ArrowLeft size={18} />
        Volver
      </button>

      <section className="evento-banner">
        <div className="evento-banner-texture" aria-hidden="true" />
        {yaTieneEntrada && (
          <span className="evento-banner-badge">Ya tenés una entrada para este evento</span>
        )}
        <div className="evento-banner-content">
          <h2 className="evento-banner-nombre">{evento.nombre}</h2>

          <div className="evento-banner-stats">
            <div className="evento-banner-stat">
              <span className="evento-banner-stat-label">Día</span>
              <span className="evento-banner-stat-valor">{formatearFecha(evento.dia)}</span>
            </div>
            <div className="evento-banner-divider" aria-hidden="true" />
            <div className="evento-banner-stat">
              <span className="evento-banner-stat-label">Horario</span>
              <span className="evento-banner-stat-valor">
                {evento.hora_inicio.slice(0, 5)} - {evento.hora_fin.slice(0, 5)}
              </span>
            </div>
            <div className="evento-banner-divider" aria-hidden="true" />
            <div className="evento-banner-stat">
              <span className="evento-banner-stat-label">Cupo</span>
              <span className="evento-banner-stat-valor">{evento.entradas_vendidas}/{evento.capacidad_maxima}</span>
            </div>
            <div className="evento-banner-divider" aria-hidden="true" />
            <div className="evento-banner-stat">
              <span className="evento-banner-stat-label">Valor</span>
              <span className="evento-banner-stat-valor">{formatearMonto(evento.valor_entrada)}</span>
            </div>
          </div>
        </div>
      </section>

      {evento.foto_url && (
        <img
          src={evento.foto_url}
          alt={`Foto del evento ${evento.nombre}`}
          className="evento-detalle-foto"
          referrerPolicy="no-referrer"
        />
      )}

      {evento.descripcion && (
        <div className="evento-descripcion-box">
          <span className="evento-descripcion-label">Descripción</span>
          <p className="evento-descripcion-texto">{evento.descripcion}</p>
        </div>
      )}

      {submitError && (
        <div className="detalle-error-box">
          <p className="detalle-error" role="alert">
            <AlertCircle size={14} />
            {submitError}
          </p>
        </div>
      )}

      {!yaTieneEntrada && (
        <button
          type="button"
          className="evento-pagar-btn"
          onClick={onPagarEntrada}
          disabled={enviando}
        >
          {enviando ? 'Procesando...' : 'Reserva tu entrada'}
        </button>
      )}
    </section>
  );
}
