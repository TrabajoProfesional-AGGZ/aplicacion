import { useEffect, useState } from 'react';
import { Calendar, Plus, MapPin } from 'lucide-react';
import { getReservasPorSocio, getReservasHistoricasPorSocio, cancelReserva } from '../../services/reservasService';
import { getInstalaciones } from '../../services/instalacionesService';
import { CrearReservaFlow } from '../../components/crearReservaFlow/CrearReservaFlow';
import { LoadingScreen } from '../../components/LoadingScreen/LoadingScreen';
import './ReservasPage.css';

const FILTROS = [
  { id: 'Pendiente', label: 'Pendientes' },
  { id: 'Confirmada', label: 'Confirmadas' },
  { id: 'Cancelada', label: 'Canceladas' },
  { id: 'Finalizada', label: 'Finalizadas' },
  { id: 'Todas', label: 'Todas' },
];

const ESTADO_TAG = {
  Confirmada: 'success',
  Pendiente: 'warning',
  Cancelada: 'danger',
  Finalizada: 'neutral',
};

const CANCELABLES = new Set(['Confirmada', 'Pendiente']);

function formatearFecha(fechaIso) {
  return new Intl.DateTimeFormat('es-AR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(fechaIso));
}

export function ReservasPage({ socio }) {
  const [reservas, setReservas] = useState([]);
  const [historicas, setHistoricas] = useState(null);
  const [instalaciones, setInstalaciones] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [cargandoHistoricas, setCargandoHistoricas] = useState(false);
  const [filtro, setFiltro] = useState('Pendiente');
  const [formAbierto, setFormAbierto] = useState(false);
  const [reservaAConfirmarCancelacion, setReservaAConfirmarCancelacion] = useState(null);
  const [cancelandoId, setCancelandoId] = useState(null);
  const [errorCancelacion, setErrorCancelacion] = useState('');
  const [recarga, setRecarga] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setCargando(true);
    setError(null);
    Promise.all([getReservasPorSocio(socio.nro_socio), getInstalaciones()])
      .then(([reservasData, instalacionesData]) => {
        if (cancelled) return;
        setReservas(reservasData);
        setInstalaciones(instalacionesData);
      })
      .catch((err) => { if (!cancelled) setError(err.message); })
      .finally(() => { if (!cancelled) setCargando(false); });
    return () => { cancelled = true; };
  }, [socio.nro_socio, recarga]);

  useEffect(() => {
    if (filtro !== 'Finalizada' && filtro !== 'Todas') return;
    if (historicas !== null) return;
    let cancelled = false;
    setCargandoHistoricas(true);
    getReservasHistoricasPorSocio(socio.nro_socio)
      .then((data) => { if (!cancelled) setHistoricas(data); })
      .catch(() => { if (!cancelled) setHistoricas([]); })
      .finally(() => { if (!cancelled) setCargandoHistoricas(false); });
    return () => { cancelled = true; };
  }, [filtro, historicas, socio.nro_socio]);

  function nombreInstalacion(idInstalacion) {
    return instalaciones.find((i) => i.id === idInstalacion)?.nombre ?? 'Instalación';
  }

  function handleCreada() {
    setHistoricas(null);
    setFiltro('Pendiente');
    setRecarga((r) => r + 1);
  }

  async function confirmarCancelacion(reserva) {
    setCancelandoId(reserva.id);
    setErrorCancelacion('');
    try {
      const actualizada = await cancelReserva(reserva.id);
      setReservas((prev) => prev.map((r) => (r.id === reserva.id ? actualizada : r)));
      setHistoricas(null);
      setReservaAConfirmarCancelacion(null);
    } catch (e) {
      if (e.message === 'fuera-de-tolerancia') {
        setErrorCancelacion(
          e.tiempoMinimoCancelacion
            ? `No podés cancelar esta reserva a menos de ${e.tiempoMinimoCancelacion} minutos del turno.`
            : 'No podés cancelar esta reserva: está fuera del tiempo de tolerancia permitido.'
        );
      } else {
        setErrorCancelacion('No se pudo cancelar la reserva. Intentá de nuevo.');
      }
    } finally {
      setCancelandoId(null);
    }
  }

  const fuente = filtro === 'Todas' || filtro === 'Finalizada' ? historicas : reservas;
  const reservasVisibles = filtro === 'Todas'
    ? (fuente ?? [])
    : (fuente ?? []).filter((r) => r.estado === filtro);

  const cantidadPendientes = reservas.filter((r) => r.estado === 'Pendiente').length;
  const cantidadConfirmadas = reservas.filter((r) => r.estado === 'Confirmada').length;

  return (
    <>
      {cargando && <LoadingScreen />}

      {!cargando && error && <p className="reservas-error">No se pudieron cargar tus reservas.</p>}

      {!cargando && !error && (
        <section className="reservas-lista">
          <section className="reservas-banner">
            <div className="reservas-banner-texture" aria-hidden="true" />
            <div className="reservas-banner-top">
              <span className="reservas-banner-eyebrow">
                <Calendar size={13} />
                Instalaciones del club
              </span>
              <button type="button" className="reservas-banner-nueva-btn" onClick={() => setFormAbierto(true)}>
                <Plus size={16} />
                Nueva reserva
              </button>
            </div>
            <h2 className="reservas-banner-title">Mis Reservas</h2>
            <div className="reservas-banner-stats">
              <div className="reservas-banner-stat" aria-label={`Reservas confirmadas: ${cantidadConfirmadas}`}>
                <span className="reservas-banner-stat-value reservas-banner-stat-value--success">{cantidadConfirmadas}</span>
                <span className="reservas-banner-stat-label">Confirmadas</span>
              </div>
              <div className="reservas-banner-stat-divider" aria-hidden="true" />
              <div className="reservas-banner-stat" aria-label={`Reservas pendientes: ${cantidadPendientes}`}>
                <span className="reservas-banner-stat-value reservas-banner-stat-value--warning">{cantidadPendientes}</span>
                <span className="reservas-banner-stat-label">Pendientes</span>
              </div>
            </div>
          </section>

          <div className="reservas-filtros" role="group" aria-label="Filtrar reservas por estado">
            {FILTROS.map((f) => (
              <button
                key={f.id}
                type="button"
                className={`reservas-filtro-btn${filtro === f.id ? ' reservas-filtro-btn--activo' : ''}`}
                onClick={() => setFiltro(f.id)}
              >
                {f.label}
              </button>
            ))}
          </div>

          {(filtro === 'Todas' || filtro === 'Finalizada') && cargandoHistoricas && (
            <p className="reservas-empty">Cargando historial...</p>
          )}

          {!((filtro === 'Todas' || filtro === 'Finalizada') && cargandoHistoricas) && reservasVisibles.length === 0 && (
            <p className="reservas-empty">No tenés reservas en este estado.</p>
          )}

          {!((filtro === 'Todas' || filtro === 'Finalizada') && cargandoHistoricas) && reservasVisibles.map((r) => {
            const tono = ESTADO_TAG[r.estado] ?? 'neutral';
            return (
              <div className={`reserva-card reserva-card--${tono}`} key={r.id}>
                <div className="reserva-info">
                  <span className="reserva-instalacion">
                    <MapPin size={14} />
                    {nombreInstalacion(r.id_instalacion)}
                  </span>
                  <span className="reserva-fecha">{formatearFecha(r.fecha_reserva)}</span>
                  <span className="reserva-horario">{r.hora_inicio.slice(0, 5)} - {r.hora_fin.slice(0, 5)}</span>
                </div>
                <div className="reserva-acciones">
                  <span className={`reserva-tag reserva-tag--${tono}`}>{r.estado}</span>
                  {CANCELABLES.has(r.estado) && (
                    <button
                      type="button"
                      className="reserva-cancelar-btn"
                      onClick={() => { setReservaAConfirmarCancelacion(r); setErrorCancelacion(''); }}
                    >
                      Cancelar
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </section>
      )}

      {formAbierto && (
        <CrearReservaFlow
          socio={socio}
          instalaciones={instalaciones}
          onSuccess={() => { setFormAbierto(false); handleCreada(); }}
          onCancel={() => setFormAbierto(false)}
        />
      )}

      {reservaAConfirmarCancelacion && (
        <div className="reserva-confirmar-overlay" role="dialog" aria-label="Confirmar cancelación">
          <div className="reserva-confirmar-card">
            <p>¿Seguro que querés cancelar esta reserva?</p>
            {errorCancelacion && <p className="reservas-error">{errorCancelacion}</p>}
            <div className="reserva-confirmar-acciones">
              <button
                type="button"
                className="reserva-confirmar-btn-no"
                onClick={() => setReservaAConfirmarCancelacion(null)}
                disabled={cancelandoId === reservaAConfirmarCancelacion.id}
              >
                Volver
              </button>
              <button
                type="button"
                className="reserva-confirmar-btn-si"
                onClick={() => confirmarCancelacion(reservaAConfirmarCancelacion)}
                disabled={cancelandoId === reservaAConfirmarCancelacion.id}
              >
                {cancelandoId === reservaAConfirmarCancelacion.id ? 'Cancelando...' : 'Sí, cancelar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
