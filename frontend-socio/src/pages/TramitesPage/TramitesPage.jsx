import { useEffect, useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { Plus } from 'lucide-react';
import { getTramitesPorSocio } from '../../services/tramitesService';
import { SubirTramiteForm } from '../../components/subirTramiteForm/SubirTramiteForm';
import { SkeletonRows } from '../../components/SkeletonRows/SkeletonRows';
import { PageHeader } from '../../components/PageHeader/PageHeader';
import './TramitesPage.css';

const ESTADO_TAG = {
  en_revision: 'warning',
  aprobado: 'success',
  rechazado: 'danger',
};

const ESTADO_LABEL = {
  en_revision: 'En revisión',
  aprobado: 'Aprobado',
  rechazado: 'Rechazado',
};

function formatearFecha(fechaIso) {
  return new Intl.DateTimeFormat('es-AR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(fechaIso));
}

/** Lista de trámites cargados por el socio, con acceso al formulario de carga. */
export function TramitesPage({ socio }) {
  const [tramites, setTramites] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [formAbierto, setFormAbierto] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setCargando(true);
    setError(null);
    getTramitesPorSocio(socio.id)
      .then((data) => { if (!cancelled) setTramites(data); })
      .catch((err) => { if (!cancelled) setError(err.message); })
      .finally(() => { if (!cancelled) setCargando(false); });
    return () => { cancelled = true; };
  }, [socio.id]);

  function handleCreado(nuevo) {
    setTramites((prev) => [nuevo, ...prev]);
  }

  const cantidadCargados = tramites.length;
  const cantidadAprobados = tramites.filter((t) => t.estado === 'aprobado').length;
  const cantidadEnRevision = tramites.filter((t) => t.estado === 'en_revision').length;
  const cantidadRechazados = tramites.filter((t) => t.estado === 'rechazado').length;

  return (
    <>
      <section className="tramites-lista">
        <PageHeader
          eyebrow="Documentación del socio"
          titulo="Mis trámites"
          accion={(
            <button type="button" className="tramites-cargar-btn" onClick={() => setFormAbierto(true)}>
              <Plus size={16} />
              Cargar trámite
            </button>
          )}
          stats={[
            { label: 'Cargados', value: cargando ? '—' : cantidadCargados },
            { label: 'Aprobados', value: cargando ? '—' : cantidadAprobados, tono: 'success' },
            { label: 'En revisión', value: cargando ? '—' : cantidadEnRevision, tono: 'warning' },
            { label: 'Rechazados', value: cargando ? '—' : cantidadRechazados, tono: 'danger' },
          ]}
        />

        {cargando && <SkeletonRows n={3} altura={72} />}

        {!cargando && error && <p className="tramites-error">No se pudieron cargar tus trámites.</p>}

        {!cargando && !error && tramites.length === 0 && (
          <p className="tramites-empty">No tenés trámites cargados.</p>
        )}

        {!cargando && !error && tramites.map((t) => {
          const tono = ESTADO_TAG[t.estado] ?? 'neutral';
          return (
            <div className={`tramite-card tramite-card--${tono}`} key={t.id}>
              <div className="tramite-info">
                <span className="tramite-tipo">{t.tipo_tramite.nombre}</span>
                <span className="tramite-fecha">Cargado el {formatearFecha(t.fecha_carga)}</span>
                {t.fecha_vencimiento && (
                  <span className="tramite-fecha">Vence: {formatearFecha(t.fecha_vencimiento)}</span>
                )}
                {t.observaciones && <span className="tramite-observaciones">{t.observaciones}</span>}
              </div>
              <span className={`tramite-tag tramite-tag--${tono}`}>
                {ESTADO_LABEL[t.estado] ?? t.estado}
              </span>
            </div>
          );
        })}
      </section>

      <AnimatePresence>
        {formAbierto && (
          <SubirTramiteForm
            key="subir-tramite"
            idSocio={socio.id}
            onClose={() => setFormAbierto(false)}
            onCreado={handleCreado}
          />
        )}
      </AnimatePresence>
    </>
  );
}
