import { Users, Calendar, ChevronRight } from 'lucide-react';
import { SkeletonRows } from '../SkeletonRows/SkeletonRows';
import { PageHeader } from '../PageHeader/PageHeader';
import './EventosListStep.css';

function formatearFecha(fechaIso) {
  return new Intl.DateTimeFormat('es-AR', { day: '2-digit', month: '2-digit', timeZone: 'UTC' }).format(new Date(fechaIso));
}

function formatearMonto(monto) {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(monto);
}

/** Grilla de eventos disponibles para comprar entrada. */
export function EventosListStep({ eventos, cargando, error, onSeleccionar }) {
  return (
    <section className="eventos-lista">
      <PageHeader variant="hero" eyebrow="Eventos del club" titulo="Comprá tu entrada" />

      {cargando && <SkeletonRows n={4} altura={76} />}

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
