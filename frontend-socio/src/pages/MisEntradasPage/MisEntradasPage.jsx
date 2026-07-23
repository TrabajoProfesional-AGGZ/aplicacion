import { useEffect, useState } from 'react';
import { QrCode, Calendar } from 'lucide-react';
import { getEntradasActivas, getEntradasHistoricas } from '../../services/eventosService';
import { LoadingScreen } from '../../components/LoadingScreen/LoadingScreen';
import { ProximamenteOverlay } from '../../components/ProximamenteOverlay/ProximamenteOverlay';
import './MisEntradasPage.css';

const ESTADO_TAG = {
  Pagada: 'success',
  Vencida: 'neutral',
  Cancelada: 'danger',
};

function formatearFecha(fechaIso) {
  return new Intl.DateTimeFormat('es-AR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(fechaIso));
}

export function MisEntradasPage({ socio }) {
  const [vista, setVista] = useState('activas');
  const [entradas, setEntradas] = useState([]);
  const [historicas, setHistoricas] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(false);
  const [entradaQr, setEntradaQr] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setCargando(true);
    setError(false);
    getEntradasActivas(socio.id)
      .then((data) => { if (!cancelled) setEntradas(data); })
      .catch(() => { if (!cancelled) setError(true); })
      .finally(() => { if (!cancelled) setCargando(false); });
    return () => { cancelled = true; };
  }, [socio.id]);

  useEffect(() => {
    if (vista !== 'historicas' || historicas !== null) return;
    let cancelled = false;
    setCargando(true);
    getEntradasHistoricas(socio.id)
      .then((data) => { if (!cancelled) setHistoricas(data); })
      .catch(() => { if (!cancelled) setHistoricas([]); })
      .finally(() => { if (!cancelled) setCargando(false); });
    return () => { cancelled = true; };
  }, [vista, historicas, socio.id]);

  const entradasVisibles = vista === 'activas' ? entradas : (historicas ?? []);
  const cargandoHistoricas = vista === 'historicas' && historicas === null && cargando;

  return (
    <>
      {cargando && vista === 'activas' && <LoadingScreen />}

      {!(cargando && vista === 'activas') && error && (
        <p className="entradas-error">No se pudieron cargar tus entradas.</p>
      )}

      {!(cargando && vista === 'activas') && !error && (
        <section className="entradas-lista">
          <section className="entradas-banner">
            <div className="entradas-banner-texture" aria-hidden="true" />
            <span className="entradas-banner-eyebrow">
              <Calendar size={13} />
              Eventos del club
            </span>
            <h2 className="entradas-banner-title">Mis Entradas</h2>
          </section>

          <div className="entradas-toggle" role="group" aria-label="Alternar entradas activas o históricas">
            <button
              type="button"
              className={`entradas-toggle-btn${vista === 'activas' ? ' entradas-toggle-btn--activo' : ''}`}
              onClick={() => setVista('activas')}
            >
              Activas
            </button>
            <button
              type="button"
              className={`entradas-toggle-btn${vista === 'historicas' ? ' entradas-toggle-btn--activo' : ''}`}
              onClick={() => setVista('historicas')}
            >
              Históricas
            </button>
          </div>

          {cargandoHistoricas && <p className="entradas-empty">Cargando historial...</p>}

          {!cargandoHistoricas && entradasVisibles.length === 0 && (
            <p className="entradas-empty">
              {vista === 'activas' ? 'No tenés entradas activas.' : 'No tenés entradas en tu historial.'}
            </p>
          )}

          {!cargandoHistoricas && entradasVisibles.map((entrada) => {
            const tono = ESTADO_TAG[entrada.estado] ?? 'neutral';
            return (
              <div className={`entrada-card entrada-card--${tono}`} key={entrada.id}>
                <div className="entrada-info">
                  <span className="entrada-evento-nombre">{entrada.evento.nombre}</span>
                  <span className="entrada-fecha">{formatearFecha(entrada.evento.dia)}</span>
                  <span className="entrada-horario">
                    {entrada.evento.hora_inicio.slice(0, 5)} - {entrada.evento.hora_fin.slice(0, 5)}
                  </span>
                  <span className={`entrada-tag entrada-tag--${tono}`}>{entrada.estado}</span>
                </div>
                {vista === 'activas' && (
                  <button
                    type="button"
                    className="entrada-qr-btn"
                    onClick={() => setEntradaQr(entrada)}
                    aria-label="Ver código QR de la entrada"
                  >
                    <QrCode size={22} />
                  </button>
                )}
              </div>
            );
          })}
        </section>
      )}

      {entradaQr && (
        <ProximamenteOverlay titulo="Código QR" onClose={() => setEntradaQr(null)} />
      )}
    </>
  );
}
