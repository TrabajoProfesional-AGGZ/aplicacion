import { ArrowLeft, Users, ChevronRight, Dumbbell, Building2 } from 'lucide-react';
import { LoadingScreen } from '../LoadingScreen/LoadingScreen';
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

export function InstalacionesListStep({ instalaciones, cargando, error, onSeleccionar, onVolver }) {
  return (
    <section className="instalaciones-lista">
      <section className="instalaciones-banner">
        <div className="instalaciones-banner-texture" aria-hidden="true" />
        <button type="button" className="instalaciones-banner-volver" onClick={onVolver} aria-label="Volver">
          <ArrowLeft size={18} />
        </button>
        <span className="instalaciones-banner-eyebrow">Instalaciones del club</span>
        <h2 className="instalaciones-banner-title">Realizá tu reserva</h2>
      </section>

      {cargando && <LoadingScreen />}

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
