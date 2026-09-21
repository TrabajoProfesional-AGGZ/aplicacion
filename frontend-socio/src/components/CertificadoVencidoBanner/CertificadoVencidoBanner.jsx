import { useEffect, useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { getTramitesPendientes, getTramitesPorSocio } from '../../services/tramitesService';
import { quitarPendientesRenovados } from '../../utils/tramitesVigencia';
import './CertificadoVencidoBanner.css';

// `ScreenTransition` remonta todo el subárbol de Home en cada cambio de
// `vista` (key={screenKey} en el AnimatePresence, ver HomePage.jsx), así que
// sin esta caché el estado arranca en `null` de nuevo cada vez que se vuelve
// a Inicio y el banner parpadea (desaparece hasta que el fetch resuelve).
// Por socio, para no mostrarle a uno los trámites cacheados de otro si
// `cerrarSesion` no recarga la página. Mismo patrón que `DeudaBanner`/`HoyCard`.
const cachePendientes = new Map(); // socioId -> { vencidos, por_vencer, total }

/** Solo para tests: limpia la caché en memoria entre casos. */
export function __resetCachePendientesParaTests() {
  cachePendientes.clear();
}

/**
 * Banner persistente en el Home que avisa si el socio tiene trámites vencidos
 * (severidad "danger") o por vencer (severidad "warning"); no renderiza nada
 * si no tiene ninguno pendiente. Un trámite vencido/por vencer no cuenta si el
 * socio ya cargó y le aprobaron otro del mismo tipo que sigue vigente.
 */
export function CertificadoVencidoBanner({ socio, onClick }) {
  const [pendientes, setPendientes] = useState(
    () => (socio?.id ? cachePendientes.get(socio.id) ?? null : null)
  );

  useEffect(() => {
    if (!socio?.id) return;
    let cancelled = false;
    // Si falla el listado completo no se puede saber si hubo renovación:
    // se muestra el aviso tal cual lo devolvió el backend.
    Promise.all([
      getTramitesPendientes(socio.id),
      getTramitesPorSocio(socio.id).catch(() => null),
    ])
      .then(([pend, todos]) => {
        const data = todos ? quitarPendientesRenovados(pend, todos) : pend;
        if (cancelled) return;
        cachePendientes.set(socio.id, data);
        setPendientes(data);
      })
      .catch(() => { if (!cancelled) setPendientes(null); });
    return () => { cancelled = true; };
  }, [socio?.id]);

  let severidad = null;
  if (pendientes?.vencidos?.length > 0) {
    severidad = 'danger';
  } else if (pendientes?.por_vencer?.length > 0) {
    severidad = 'warning';
  }

  if (!severidad) return null;

  const mensaje = severidad === 'danger'
    ? 'Tenés un trámite vencido. Tocá para gestionarlo.'
    : 'Tenés un trámite por vencer pronto. Tocá para gestionarlo.';

  return (
    <button
      type="button"
      className={`certificado-banner certificado-banner--${severidad}`}
      onClick={onClick}
    >
      <AlertTriangle size={18} aria-hidden="true" />
      <span>{mensaje}</span>
    </button>
  );
}
