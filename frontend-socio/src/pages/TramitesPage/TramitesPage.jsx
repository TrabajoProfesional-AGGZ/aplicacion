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

  return (
    <>
      {cargando && <LoadingScreen />}

      {!cargando && error && <p className="tramites-error">No se pudieron cargar tus trámites.</p>}

      {!cargando && !error && (
        <section className="tramites-lista">
          <header className="tramites-page-header">
            <div className="tramites-eyebrow">
              <span className="tramites-eyebrow-icon" aria-hidden="true"><FileText size={13} /></span>
              Documentación del socio
            </div>
            <div className="tramites-page-header-row">
              <div className="tramites-page-header-text">
                <h2 className="tramites-title">Mis trámites</h2>
                <p className="tramites-subtitle">
                  Cargá certificados y hacé seguimiento del estado de cada uno.
                </p>
              </div>
              <button type="button" className="tramites-cargar-btn" onClick={() => setFormAbierto(true)}>
                <Plus size={16} />
                Cargar trámite
              </button>
            </div>
          </header>

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
