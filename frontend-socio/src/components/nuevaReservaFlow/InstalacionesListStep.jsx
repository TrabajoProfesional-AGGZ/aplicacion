import { Users, ChevronRight, Dumbbell, Building2 } from 'lucide-react';
import { SkeletonRows } from '../SkeletonRows/SkeletonRows';
import { PageHeader } from '../PageHeader/PageHeader';
import './InstalacionesListStep.css';

const ICONO_POR_TIPO = [
  ['deportiva', Dumbbell],
  ['social', Users],
];

function iconoDeTipo(tipo) {
  const clave = (tipo || '').toLowerCase();
  const match = ICONO_POR_TIPO.find(([palabra]) => clave.includes(palabra));
  return match ? match[1] : Building2;
}

function formatearMonto(monto) {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(monto);
}

/** Grilla de instalaciones disponibles para reservar. */
export function InstalacionesListStep({ instalaciones, cargando, error, onSeleccionar }) {
  return (
    <section className="instalaciones-lista">
      <PageHeader eyebrow="Instalaciones del club" titulo="Realizá tu reserva" />

      {cargando && <SkeletonRows n={4} altura={76} />}

      {!cargando && error && (
        <p className="instalaciones-error">No se pudieron cargar las instalaciones.</p>
      )}

      {!cargando && !error && instalaciones.length === 0 && (
        <p className="instalaciones-empty">No hay instalaciones disponibles en este momento.</p>
      )}

      {!cargando && !error && instalaciones.length > 0 && (
        <div className="instalaciones-grid">
          {instalaciones.map((inst) => {
            const Icono = iconoDeTipo(inst.tipo);
            return (
              <button
                type="button"
                key={inst.id}
                className="instalacion-card"
                onClick={() => onSeleccionar(inst)}
              >
                <span className="instalacion-card-icono"><Icono size={22} /></span>
                <span className="instalacion-card-info">
                  <span className="instalacion-card-nombre">{inst.nombre}</span>
                  <span className="instalacion-card-tipo">{inst.tipo}</span>
                  <span className="instalacion-card-meta">
                    <span className="instalacion-card-meta-item">
                      <Users size={13} />
                      {inst.capacidad_maxima} personas
                    </span>
                    <span className="instalacion-card-meta-item instalacion-card-precio">
                      {formatearMonto(inst.valor_turno)}
                    </span>
                  </span>
                </span>
                <ChevronRight size={18} className="instalacion-card-chevron" />
              </button>
            );
          })}
        </div>
      )}
    </section>
  );
}
