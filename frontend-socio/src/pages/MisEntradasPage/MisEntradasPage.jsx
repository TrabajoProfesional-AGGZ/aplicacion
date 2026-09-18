import { useEffect, useState } from 'react';
import { QrCode } from 'lucide-react';
import { getEntradasActivas, getEntradasHistoricas, getEntradasPendientes } from '../../services/eventosService';
import { SkeletonRows } from '../../components/SkeletonRows/SkeletonRows';
import { PageHeader } from '../../components/PageHeader/PageHeader';
import { SegmentedControl } from '../../components/SegmentedControl/SegmentedControl';
import './MisEntradasPage.css';

const VISTA_OPCIONES = [
  { id: 'activas', label: 'Activas' },
  { id: 'historicas', label: 'Históricas' },
];

const ESTADO_TAG = {
  Pagada: 'success',
  Pendiente: 'warning',
  Vencida: 'neutral',
  Cancelada: 'danger',
};

function formatearFecha(fechaIso) {
  return new Intl.DateTimeFormat('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(fechaIso));
}

/**
 * Entradas del socio, con toggle Activas/Históricas (históricas se cargan
 * recién al abrir esa pestaña por primera vez).
 */
export function MisEntradasPage({ socio, onPagarEntrada = () => {}, onVerCarnet = () => {} }) {
  const [vista, setVista] = useState('activas');
  const [entradas, setEntradas] = useState([]);
  const [historicas, setHistoricas] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setCargando(true);
    setError(false);
    Promise.all([getEntradasActivas(socio.id), getEntradasPendientes(socio.id)])
      .then(([activas, pendientes]) => { if (!cancelled) setEntradas([...pendientes, ...activas]); })
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

  const cargandoActivas = cargando && vista === 'activas';

  return (
    <>
      <section className="entradas-lista">
        <PageHeader variant="hero" eyebrow="Eventos del club" titulo="Mis Entradas" />

        <SegmentedControl
          opciones={VISTA_OPCIONES}
          valor={vista}
          onChange={setVista}
          ariaLabel="Alternar entradas activas o históricas"
        />

        {(cargandoActivas || cargandoHistoricas) && <SkeletonRows n={3} altura={76} />}

        {!cargandoActivas && error && (
          <p className="entradas-error">No se pudieron cargar tus entradas.</p>
        )}

        {!cargandoActivas && !cargandoHistoricas && !error && entradasVisibles.length === 0 && (
          <p className="entradas-empty">
            {vista === 'activas' ? 'No tenés entradas activas.' : 'No tenés entradas en tu historial.'}
          </p>
        )}

        {!cargandoActivas && !cargandoHistoricas && !error && entradasVisibles.map((entrada) => {
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
                {vista === 'activas' && entrada.estado === 'Pendiente' && (
                  <button
                    type="button"
                    className="entrada-pagar-btn"
                    onClick={() => onPagarEntrada(entrada)}
                  >
                    Ir a pagar
                  </button>
                )}
                {vista === 'activas' && entrada.estado === 'Pagada' && (
                  <button
                    type="button"
                    className="entrada-qr-btn"
                    onClick={onVerCarnet}
                    aria-label="Ver código QR de la entrada"
                  >
                    <QrCode size={22} />
                  </button>
                )}
              </div>
            );
        })}
      </section>
    </>
  );
}
