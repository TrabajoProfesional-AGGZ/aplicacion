import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CalendarDays, ChevronRight } from 'lucide-react';
import { SPRING, slideVariants } from '../../styles/motion';
import { getReservasPorSocio } from '../../services/reservasService';
import { getEntradasActivas, getEntradasPendientes } from '../../services/eventosService';
import { getInstalaciones } from '../../services/instalacionesService';
import './HoyCard.css';

const AUTO_ROTAR_MS = 30000;
const UMBRAL_SWIPE_PX = 50;
const UMBRAL_SWIPE_VELOCIDAD = 400;
const MAX_ITEMS_VISIBLES = 3;

// cache para no remontar todo el arbol cada vez que se vuelve a inicio
const cacheHoy = new Map(); // socioId -> { reservasHoy, entradasHoy, instalaciones }

/** Solo para tests: limpia la caché en memoria entre casos. */
export function __resetCacheHoyParaTests() {
  cacheHoy.clear();
}

function fechaHoyISO() {
  const hoy = new Date();
  const mm = String(hoy.getMonth() + 1).padStart(2, '0');
  const dd = String(hoy.getDate()).padStart(2, '0');
  return `${hoy.getFullYear()}-${mm}-${dd}`;
}

const RESERVAS_ACTIVAS = new Set(['Confirmada', 'Pendiente']);

/**
 * Franja "Hoy" del Home: alterna entre las reservas y las entradas del socio
 * para el día de hoy. Si solo una de las dos tiene datos, se muestra fija sin
 * carrusel. No renderiza nada si no hay reservas ni entradas para hoy.
 */
export function HoyCard({ socio, onVerReservas, onVerEntradas }) {
  const cacheInicial = socio?.id ? cacheHoy.get(socio.id) : undefined;
  const [reservasHoy, setReservasHoy] = useState(() => cacheInicial?.reservasHoy ?? null);
  const [entradasHoy, setEntradasHoy] = useState(() => cacheInicial?.entradasHoy ?? null);
  const [instalaciones, setInstalaciones] = useState(() => cacheInicial?.instalaciones ?? []);
  const [indice, setIndice] = useState(0);
  const [direccion, setDireccion] = useState(1);

  useEffect(() => {
    if (!socio?.id) return undefined;
    let cancelled = false;
    const hoy = fechaHoyISO();

    Promise.all([
      getReservasPorSocio(socio.nro_socio).catch(() => []),
      getEntradasActivas(socio.id).catch(() => []),
      getEntradasPendientes(socio.id).catch(() => []),
      getInstalaciones().catch(() => []),
    ]).then(([reservas, activas, pendientes, instalacionesData]) => {
      if (cancelled) return;
      const reservasFiltradas = reservas.filter(
        (r) => r.fecha_reserva === hoy && RESERVAS_ACTIVAS.has(r.estado)
      );
      const entradasFiltradas = [...pendientes, ...activas].filter((e) => e.evento.dia === hoy);
      cacheHoy.set(socio.id, {
        reservasHoy: reservasFiltradas,
        entradasHoy: entradasFiltradas,
        instalaciones: instalacionesData,
      });
      setReservasHoy(reservasFiltradas);
      setEntradasHoy(entradasFiltradas);
      setInstalaciones(instalacionesData);
    });

    return () => { cancelled = true; };
  }, [socio?.id, socio?.nro_socio]);

  const vistas = [];
  if (reservasHoy?.length) {
    vistas.push({ id: 'reservas', label: 'Tus reservas para hoy', items: reservasHoy });
  }
  if (entradasHoy?.length) {
    vistas.push({ id: 'entradas', label: 'Tus entradas para hoy', items: entradasHoy });
  }

  function cambiarVista(dir) {
    setDireccion(dir);
    setIndice((i) => (i + dir + vistas.length) % vistas.length);
  }

  useEffect(() => {
    if (vistas.length < 2) return undefined;
    const id = setInterval(() => cambiarVista(1), AUTO_ROTAR_MS);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [indice, vistas.length]);

  if (reservasHoy === null || entradasHoy === null) return null;
  if (vistas.length === 0) return null;

  const vistaActual = vistas[indice] ?? vistas[0];
  const itemsVisibles = vistaActual.items.slice(0, MAX_ITEMS_VISIBLES);
  const hayMasItems = vistaActual.items.length > MAX_ITEMS_VISIBLES;
  const onVerTodas = vistaActual.id === 'reservas' ? onVerReservas : onVerEntradas;

  function nombreInstalacion(idInstalacion) {
    return instalaciones.find((i) => i.id === idInstalacion)?.nombre ?? 'Instalación';
  }

  function onDragEnd(_e, info) {
    if (vistas.length < 2) return;
    const { offset, velocity } = info;
    if (offset.x < -UMBRAL_SWIPE_PX || velocity.x < -UMBRAL_SWIPE_VELOCIDAD) {
      cambiarVista(1);
    } else if (offset.x > UMBRAL_SWIPE_PX || velocity.x > UMBRAL_SWIPE_VELOCIDAD) {
      cambiarVista(-1);
    }
  }

  // El botón "Ver todas" ya navega por su cuenta; sin este guard, un click ahí
  // también dispararía el onClick de la card entera (bubbling) y llamaría a
  // onVerTodas dos veces.
  function onClickCard(e) {
    if (!onVerTodas || e.target.closest('button')) return;
    onVerTodas();
  }

  function onKeyDownCard(e) {
    if (!onVerTodas || e.target.closest('button')) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onVerTodas();
    }
  }

  return (
    <section
      className={`hoy-card${onVerTodas ? ' hoy-card--clickable' : ''}`}
      aria-label="Hoy"
      role={onVerTodas ? 'button' : undefined}
      tabIndex={onVerTodas ? 0 : undefined}
      onClick={onClickCard}
      onKeyDown={onKeyDownCard}
    >
      <div className="hoy-card-header">
        <CalendarDays size={16} aria-hidden="true" />
        <span>{vistaActual.label}</span>
      </div>

      <AnimatePresence mode="popLayout" custom={direccion} initial={false}>
        <motion.div
          key={vistaActual.id}
          custom={direccion}
          variants={slideVariants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={SPRING.default}
          className="hoy-card-panel"
          drag={vistas.length > 1 ? 'x' : false}
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.15}
          onDragEnd={onDragEnd}
        >
          {vistaActual.id === 'reservas' && itemsVisibles.map((r) => (
            <div className="hoy-card-item" key={r.id}>
              <span className="hoy-card-item-nombre">{nombreInstalacion(r.id_instalacion)}</span>
              <span className="hoy-card-item-horario">
                {r.hora_inicio.slice(0, 5)} - {r.hora_fin.slice(0, 5)}
              </span>
            </div>
          ))}
          {vistaActual.id === 'entradas' && itemsVisibles.map((e) => (
            <div className="hoy-card-item" key={e.id}>
              <span className="hoy-card-item-nombre">{e.evento.nombre}</span>
              <span className="hoy-card-item-horario">
                {e.evento.hora_inicio.slice(0, 5)} - {e.evento.hora_fin.slice(0, 5)}
              </span>
            </div>
          ))}
        </motion.div>
      </AnimatePresence>

      {hayMasItems && onVerTodas && (
        <button type="button" className="hoy-card-ver-todas" onClick={onVerTodas}>
          Ver todas
          <ChevronRight size={16} aria-hidden="true" />
        </button>
      )}

      {vistas.length > 1 && (
        <div className="hoy-card-dots" aria-hidden="true">
          {vistas.map((v, i) => (
            <span
              key={v.id}
              className={`hoy-card-dot${i === indice ? ' hoy-card-dot--activo' : ''}`}
            />
          ))}
        </div>
      )}
    </section>
  );
}
