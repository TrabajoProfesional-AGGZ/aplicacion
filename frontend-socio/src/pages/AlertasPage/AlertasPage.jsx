import { useEffect, useState } from 'react';
import { Bell, BellOff } from 'lucide-react';
import { getAlertasSocio } from '../../services/alertasService';
import { LoadingScreen } from '../../components/LoadingScreen/LoadingScreen';
import './AlertasPage.css';

function formatearFecha(fechaIso) {
  const fecha = new Date(fechaIso);
  const ahora = new Date();
  const diffDias = Math.floor((ahora - fecha) / 86_400_000);

  if (diffDias <= 0) return 'Hoy';
  if (diffDias === 1) return 'Ayer';
  if (diffDias < 7) return `Hace ${diffDias} días`;

  return new Intl.DateTimeFormat('es-AR', {
    day: 'numeric',
    month: 'long',
    year: fecha.getFullYear() !== ahora.getFullYear() ? 'numeric' : undefined,
    timeZone: 'UTC',
  }).format(fecha);
}

export function AlertasPage({ socio }) {
  const [alertas, setAlertas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setCargando(true);
    setError(null);
    getAlertasSocio(socio.id)
      .then((data) => { if (!cancelled) setAlertas(data); })
      .catch((err) => { if (!cancelled) setError(err.message); })
      .finally(() => { if (!cancelled) setCargando(false); });
    return () => { cancelled = true; };
  }, [socio.id]);

  return (
    <>
      {cargando && <LoadingScreen />}

      {!cargando && error && (
        <p className="alertas-error">No se pudieron cargar tus alertas.</p>
      )}

      {!cargando && !error && (
        <section className="alertas-lista">
          <header className="alertas-page-header">
            <span className="alertas-header-icon" aria-hidden="true"><Bell size={20} /></span>
            <div className="alertas-header-text">
              <h2 className="alertas-title">Mis alertas</h2>
              <p className="alertas-subtitle">
                {alertas.length > 0
                  ? `${alertas.length} novedad${alertas.length === 1 ? '' : 'es'} del club para vos.`
                  : 'Acá vas a ver las novedades que el club envíe para vos.'}
              </p>
            </div>
          </header>

          {alertas.length === 0 && (
            <div className="alertas-vacio">
              <span className="alertas-vacio-icon" aria-hidden="true"><BellOff size={22} /></span>
              <p className="alertas-empty">No tenés alertas por el momento.</p>
            </div>
          )}

          {alertas.length > 0 && (
            <div className="alertas-grupo">
              {alertas.map((a, i) => (
                <div className="alerta-row" key={a.id} style={{ animationDelay: `${Math.min(i, 6) * 45}ms` }}>
                  <span className="alerta-row-icon" aria-hidden="true"><Bell size={16} /></span>
                  <div className="alerta-row-text">
                    <p className="alerta-mensaje">{a.mensaje}</p>
                    <span className="alerta-meta">
                      {formatearFecha(a.creado_en)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}
    </>
  );
}
