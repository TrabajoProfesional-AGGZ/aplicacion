import { useEffect, useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { MapPin, Plus, Tag } from 'lucide-react';
import { getDisciplinasPorSocio, darDeBajaInscripcion } from '../../services/disciplinasService';
import { SkeletonRows } from '../../components/SkeletonRows/SkeletonRows';
import { ModalOverlay } from '../../components/createForm/ModalOverlay';
import { useBackToRoot } from '../../hooks/useBackToRoot';
import { PageHeader } from '../../components/PageHeader/PageHeader';
import { ScreenTransition } from '../../components/ScreenTransition/ScreenTransition';
import './InscripcionesPage.css';

const FILTROS = [
  { id: 'Todas', label: 'Todas' },
  { id: 'Arancelada', label: 'Aranceladas' },
  { id: 'Sin costo', label: 'Sin costo' },
  { id: 'En espera', label: 'En espera' },
];

function formatearMonto(monto) {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(monto);
}

/**
 * Lista de inscripciones a disciplinas del socio, con filtros y detalle de
 * cada una (incluyendo la baja de una inscripción activa).
 */
export function InscripcionesPage({ socio, onNuevaInscripcion = () => {} }) {
  const [inscripciones, setInscripciones] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [filtro, setFiltro] = useState('Todas');
  const [detalle, setDetalle] = useState(null);
  const [confirmarBaja, setConfirmarBaja] = useState(false);
  const [dandoBaja, setDandoBaja] = useState(false);
  const [errorBaja, setErrorBaja] = useState('');

  useBackToRoot(detalle, null, () => setDetalle(null));

  useEffect(() => {
    let cancelled = false;
    setCargando(true);
    setError(null);
    getDisciplinasPorSocio(socio.id)
      .then((data) => { if (!cancelled) setInscripciones(data); })
      .catch((err) => { if (!cancelled) setError(err.message); })
      .finally(() => { if (!cancelled) setCargando(false); });
    return () => { cancelled = true; };
  }, [socio.id]);

  const cantidadAranceladas = inscripciones.filter((i) => i.arancelada).length;
  const cantidadSinCosto = inscripciones.filter((i) => !i.arancelada).length;
  const cantidadEnEspera = inscripciones.filter((i) => i.estado_suscripcion === 'en_espera').length;

  const inscripcionesVisibles = inscripciones.filter((i) => {
    if (filtro === 'Arancelada') return i.arancelada;
    if (filtro === 'Sin costo') return !i.arancelada;
    if (filtro === 'En espera') return i.estado_suscripcion === 'en_espera';
    return true;
  });

  function abrirDetalle(inscripcion) {
    setErrorBaja('');
    setDetalle(inscripcion);
  }

  async function confirmarBajaInscripcion() {
    setDandoBaja(true);
    setErrorBaja('');
    try {
      await darDeBajaInscripcion(detalle.id, socio.id);
      setInscripciones((prev) => prev.filter((i) => i.id !== detalle.id));
      setConfirmarBaja(false);
      setDetalle(null);
    } catch {
      setErrorBaja('No se pudo dar de baja la inscripción. Intentá de nuevo.');
    } finally {
      setDandoBaja(false);
    }
  }

  const screenKey = detalle ? 'detalle' : 'lista';
  const direccion = detalle ? 1 : -1;

  if (detalle) {
    return (
      <ScreenTransition screenKey={screenKey} direction={direccion}>
      <div className="inscripciones-lista">
        <PageHeader
          accion={detalle.estado_suscripcion === 'en_espera' && (
            <span className="inscripcion-detalle-badge">En espera</span>
          )}
          titulo={detalle.nombre}
          stats={[
            { label: 'Categoría', value: detalle.categoria_socio?.nombre ?? 'Todas' },
            { label: 'Sede', value: detalle.sede.nombre },
            { label: 'Arancel por mes', value: detalle.arancelada ? formatearMonto(detalle.monto_mensual) : 'Sin costo' },
          ]}
        />

        {detalle.estado_suscripcion !== 'en_espera' && (
          <button
            type="button"
            className="inscripcion-baja-btn"
            onClick={() => { setErrorBaja(''); setConfirmarBaja(true); }}
          >
            Dar de Baja
          </button>
        )}

        <AnimatePresence>
          {confirmarBaja && (
            <ModalOverlay key="confirmar-baja" onClose={() => setConfirmarBaja(false)}>
              <div className="inscripcion-confirmar-card">
                <p>¿Seguro que querés darte de baja de {detalle.nombre}?</p>
                <p className="inscripcion-confirmar-aviso">
                  No se realizará el reintegro de la cuota paga de este mes.
                </p>
                {errorBaja && <p className="inscripciones-error">{errorBaja}</p>}
                <div className="inscripcion-confirmar-acciones">
                  <button
                    type="button"
                    className="inscripcion-confirmar-btn-no"
                    onClick={() => setConfirmarBaja(false)}
                    disabled={dandoBaja}
                  >
                    Volver
                  </button>
                  <button
                    type="button"
                    className="inscripcion-confirmar-btn-si"
                    onClick={confirmarBajaInscripcion}
                    disabled={dandoBaja}
                  >
                    {dandoBaja ? 'Dando de baja...' : 'Sí, dar de baja'}
                  </button>
                </div>
              </div>
            </ModalOverlay>
          )}
        </AnimatePresence>
      </div>
      </ScreenTransition>
    );
  }

  return (
    <ScreenTransition screenKey={screenKey} direction={direccion}>
      <section className="inscripciones-lista">
        <PageHeader
          eyebrow="Actividades del club"
          titulo="Mis inscripciones"
          accion={(
            <button type="button" className="inscripciones-nueva-btn" onClick={onNuevaInscripcion}>
              <Plus size={15} />
              Nueva inscripción
            </button>
          )}
          stats={[
            { label: 'Aranceladas', value: cargando ? '—' : cantidadAranceladas },
            { label: 'Sin costo', value: cargando ? '—' : cantidadSinCosto },
            { label: 'En espera', value: cargando ? '—' : cantidadEnEspera },
          ]}
        />

        <fieldset className="inscripciones-filtros" aria-label="Filtrar inscripciones">
          {FILTROS.map((f) => (
            <button
              key={f.id}
              type="button"
              className={`inscripciones-filtro-btn${filtro === f.id ? ' inscripciones-filtro-btn--activo' : ''}`}
              onClick={() => setFiltro(f.id)}
            >
              {f.label}
            </button>
          ))}
        </fieldset>

        {cargando && <SkeletonRows n={3} altura={72} />}

        {!cargando && error && <p className="inscripciones-error">No se pudieron cargar tus inscripciones.</p>}

        {!cargando && !error && inscripcionesVisibles.length === 0 && (
          <p className="inscripciones-empty">No tenés inscripciones en esta categoría.</p>
        )}

        {!cargando && !error && inscripcionesVisibles.map((i) => (
          <button type="button" className="inscripcion-card" key={i.id} onClick={() => abrirDetalle(i)}>
            <div className="inscripcion-info">
              <span className="inscripcion-nombre">{i.nombre}</span>
              <span className="inscripcion-meta">
                <Tag size={13} />
                {i.categoria_socio?.nombre ?? 'Todas las categorías'}
              </span>
              <span className="inscripcion-meta">
                <MapPin size={13} />
                {i.sede.nombre}
              </span>
            </div>
            <div className="inscripcion-tags">
              {i.estado_suscripcion === 'en_espera' && (
                <span className="inscripcion-tag inscripcion-tag--en-espera">En espera</span>
              )}
              <span className={`inscripcion-tag inscripcion-tag--${i.arancelada ? 'arancelada' : 'sin-costo'}`}>
                {i.arancelada ? formatearMonto(i.monto_mensual) : 'Sin costo'}
              </span>
            </div>
          </button>
        ))}
      </section>
    </ScreenTransition>
  );
}
