import { useEffect, useState } from 'react';
import { ArrowLeft, ClipboardList, MapPin, Plus, Tag } from 'lucide-react';
import { getDisciplinasPorSocio, darDeBajaInscripcion } from '../../services/disciplinasService';
import { LoadingScreen } from '../../components/LoadingScreen/LoadingScreen';
import { ModalOverlay } from '../../components/createForm/ModalOverlay';
import { useBackToRoot } from '../../hooks/useBackToRoot';
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

  if (detalle) {
    return (
      <div className="inscripciones-lista">
        <button type="button" className="inscripciones-volver" onClick={() => setDetalle(null)}>
          <ArrowLeft size={20} /> Volver
        </button>

        <section className="inscripcion-detalle-banner">
          <div className="inscripcion-detalle-banner-texture" aria-hidden="true" />
          {detalle.estado_suscripcion === 'en_espera' && (
            <span className="inscripcion-detalle-banner-badge">En espera</span>
          )}
          <div className="inscripcion-detalle-banner-content">
            <h2 className="inscripcion-detalle-banner-title">{detalle.nombre}</h2>
            <div className="inscripcion-detalle-banner-stats">
              <div className="inscripcion-detalle-banner-stat">
                <span className="inscripcion-detalle-banner-stat-label">Categoría</span>
                <span className="inscripcion-detalle-banner-stat-valor">
                  {detalle.categoria_socio?.nombre ?? 'Todas'}
                </span>
              </div>
              <div className="inscripcion-detalle-banner-divider" aria-hidden="true" />
              <div className="inscripcion-detalle-banner-stat">
                <span className="inscripcion-detalle-banner-stat-label">Sede</span>
                <span className="inscripcion-detalle-banner-stat-valor">{detalle.sede.nombre}</span>
              </div>
              <div className="inscripcion-detalle-banner-divider" aria-hidden="true" />
              <div className="inscripcion-detalle-banner-stat">
                <span className="inscripcion-detalle-banner-stat-label">Arancel por mes</span>
                <span className="inscripcion-detalle-banner-stat-valor">
                  {detalle.arancelada ? formatearMonto(detalle.monto_mensual) : 'Sin costo'}
                </span>
              </div>
            </div>
          </div>
        </section>

        {detalle.estado_suscripcion !== 'en_espera' && (
          <button
            type="button"
            className="inscripcion-baja-btn"
            onClick={() => { setErrorBaja(''); setConfirmarBaja(true); }}
          >
            Dar de Baja
          </button>
        )}

        {confirmarBaja && (
          <ModalOverlay onClose={() => setConfirmarBaja(false)}>
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
      </div>
    );
  }

  return (
    <>
      {cargando && <LoadingScreen />}

      {!cargando && error && <p className="inscripciones-error">No se pudieron cargar tus inscripciones.</p>}

      {!cargando && !error && (
        <section className="inscripciones-lista">
          <section className="inscripciones-banner">
            <div className="inscripciones-banner-texture" aria-hidden="true" />
            <div className="inscripciones-banner-top">
              <span className="inscripciones-banner-eyebrow">
                <ClipboardList size={13} />
                Actividades del club
              </span>
              <button type="button" className="inscripciones-banner-nueva-btn" onClick={onNuevaInscripcion}>
                <Plus size={15} />
                Nueva Inscripcion
              </button>
            </div>
            <h2 className="inscripciones-banner-title">Mis inscripciones</h2>
            <div className="inscripciones-banner-stats">
              <div className="inscripciones-banner-stat" aria-label={`Inscripciones aranceladas: ${cantidadAranceladas}`}>
                <span className="inscripciones-banner-stat-value">{cantidadAranceladas}</span>
                <span className="inscripciones-banner-stat-label">Aranceladas</span>
              </div>
              <div className="inscripciones-banner-stat-divider" aria-hidden="true" />
              <div className="inscripciones-banner-stat" aria-label={`Inscripciones sin costo: ${cantidadSinCosto}`}>
                <span className="inscripciones-banner-stat-value">{cantidadSinCosto}</span>
                <span className="inscripciones-banner-stat-label">Sin costo</span>
              </div>
              <div className="inscripciones-banner-stat-divider" aria-hidden="true" />
              <div className="inscripciones-banner-stat" aria-label={`Inscripciones en espera: ${cantidadEnEspera}`}>
                <span className="inscripciones-banner-stat-value">{cantidadEnEspera}</span>
                <span className="inscripciones-banner-stat-label">En espera</span>
              </div>
            </div>
          </section>

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

          {inscripcionesVisibles.length === 0 && (
            <p className="inscripciones-empty">No tenés inscripciones en esta categoría.</p>
          )}

          {inscripcionesVisibles.map((i) => (
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
      )}
    </>
  );
}
