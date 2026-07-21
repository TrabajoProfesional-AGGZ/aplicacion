import { useEffect, useState } from 'react';
import { ClipboardList, MapPin, Plus, Tag } from 'lucide-react';
import { getDisciplinasPorSocio } from '../../services/disciplinasService';
import { LoadingScreen } from '../../components/LoadingScreen/LoadingScreen';
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

export function InscripcionesPage({ socio, onNuevaInscripcion = () => {} }) {
  const [inscripciones, setInscripciones] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [filtro, setFiltro] = useState('Todas');

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

          <div className="inscripciones-filtros" role="group" aria-label="Filtrar inscripciones">
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
          </div>

          {inscripcionesVisibles.length === 0 && (
            <p className="inscripciones-empty">No tenés inscripciones en esta categoría.</p>
          )}

          {inscripcionesVisibles.map((i) => (
            <div className="inscripcion-card" key={i.id}>
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
            </div>
          ))}
        </section>
      )}
    </>
  );
}
