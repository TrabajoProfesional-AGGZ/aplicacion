import { ArrowLeft, Users, Calendar, ChevronRight } from 'lucide-react';
import { LoadingScreen } from '../LoadingScreen/LoadingScreen';
import './EventosListStep.css';

function formatearFecha(fechaIso) {
  return new Intl.DateTimeFormat('es-AR', { day: 'numeric', month: 'long', timeZone: 'UTC' }).format(new Date(fechaIso));
}

function formatearMonto(monto) {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(monto);
}

export function EventosListStep({ eventos, cargando, error, onSeleccionar, onVolver }) {
  return (
    <section className="eventos-lista">
      <section className="eventos-banner">
        <div className="eventos-banner-texture" aria-hidden="true" />
        <button type="button" className="eventos-banner-volver" onClick={onVolver} aria-label="Volver">
          <ArrowLeft size={18} />
        </button>
        <span className="eventos-banner-eyebrow">Eventos del club</span>
        <h2 className="eventos-banner-title">Comprá tu entrada</h2>
      </section>

      {cargando && <LoadingScreen />}

      {!cargando && error && (
        <p className="eventos-error">No se pudieron cargar los eventos.</p>
      )}

      {!cargando && !error && eventos.length === 0 && (
        <p className="eventos-empty">No hay eventos disponibles en este momento.</p>
      )}

      {!cargando && !error && eventos.length > 0 && (
        <div className="eventos-grid">
          {eventos.map((evento) => (
            <button
              type="button"
              key={evento.id}
              className="evento-card"
              onClick={() => onSeleccionar(evento)}
            >
              <span className="evento-card-info">
                <span className="evento-card-nombre">{evento.nombre}</span>
                <span className="evento-card-meta">
                  <span className="evento-card-meta-item">
                    <Calendar size={13} />
                    {formatearFecha(evento.dia)} · {evento.hora_inicio.slice(0, 5)}
                  </span>
                  <span className="evento-card-meta-item">
                    <Users size={13} />
                    {evento.entradas_vendidas}/{evento.capacidad_maxima}
                  </span>
                </span>
                <span className="evento-card-valor">{formatearMonto(evento.valor_entrada)}</span>
              </span>
              <ChevronRight size={18} className="evento-card-chevron" />
            </button>
          ))}
        </div>
      )}
    </section>
  );
}
