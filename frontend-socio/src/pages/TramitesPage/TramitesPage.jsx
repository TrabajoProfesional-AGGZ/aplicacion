import { useEffect, useState } from 'react';
import { FileText, Plus } from 'lucide-react';
import { getTramitesPorSocio } from '../../services/tramitesService';
import { SubirTramiteForm } from '../../components/subirTramiteForm/SubirTramiteForm';
import { LoadingScreen } from '../../components/LoadingScreen/LoadingScreen';
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
      {cargando && <LoadingScreen />}

      {!cargando && error && <p className="tramites-error">No se pudieron cargar tus trámites.</p>}

      {!cargando && !error && (
        <section className="tramites-lista">
          <section className="tramites-banner">
            <div className="tramites-banner-texture" aria-hidden="true" />
            <div className="tramites-banner-top">
              <span className="tramites-banner-eyebrow">
                <FileText size={13} />
                Documentación del socio
              </span>
              <button type="button" className="tramites-banner-cargar-btn" onClick={() => setFormAbierto(true)}>
                <Plus size={16} />
                Cargar trámite
              </button>
            </div>
            <h2 className="tramites-banner-title">Mis trámites</h2>
            <div className="tramites-banner-stats">
              <div className="tramites-banner-stat" aria-label={`Trámites cargados: ${cantidadCargados}`}>
                <span className="tramites-banner-stat-value">{cantidadCargados}</span>
                <span className="tramites-banner-stat-label">Cargados</span>
              </div>
              <div className="tramites-banner-stat" aria-label={`Trámites aprobados: ${cantidadAprobados}`}>
                <span className="tramites-banner-stat-value tramites-banner-stat-value--success">{cantidadAprobados}</span>
                <span className="tramites-banner-stat-label">Aprobados</span>
              </div>
              <div className="tramites-banner-stat" aria-label={`Trámites en revisión: ${cantidadEnRevision}`}>
                <span className="tramites-banner-stat-value tramites-banner-stat-value--warning">{cantidadEnRevision}</span>
                <span className="tramites-banner-stat-label">En revisión</span>
              </div>
              <div className="tramites-banner-stat" aria-label={`Trámites rechazados: ${cantidadRechazados}`}>
                <span className="tramites-banner-stat-value tramites-banner-stat-value--danger">{cantidadRechazados}</span>
                <span className="tramites-banner-stat-label">Rechazados</span>
              </div>
            </div>
          </section>

          {tramites.length === 0 && <p className="tramites-empty">No tenés trámites cargados.</p>}

          {tramites.map((t) => {
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
      )}

      {formAbierto && (
        <SubirTramiteForm
          idSocio={socio.id}
          onClose={() => setFormAbierto(false)}
          onCreado={handleCreado}
        />
      )}
    </>
  );
}
