import { useEffect, useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { getEstadoFinanciero } from '../../services/finanzasService';
import './DeudaBanner.css';

// `ScreenTransition` remonta todo el subárbol de Home en cada cambio de
// `vista` (key={screenKey} en el AnimatePresence, ver HomePage.jsx), así que
// sin esta caché el estado arranca en `null` de nuevo cada vez que se vuelve
// a Inicio y el banner parpadea (desaparece hasta que el fetch resuelve).
// Por socio, para no mostrarle a uno la deuda cacheada de otro si
// `cerrarSesion` no recarga la página.
const cacheDeuda = new Map(); // socioId -> cantidadPendientes

/** Solo para tests: limpia la caché en memoria entre casos. */
export function __resetCacheDeudaParaTests() {
  cacheDeuda.clear();
}

/**
 * Banner persistente en el Home que avisa si el socio tiene cuotas sin pagar
 * (mismo patrón que `CertificadoVencidoBanner`); no renderiza nada si no debe
 * ninguna.
 */
export function DeudaBanner({ socio, onClick }) {
  const [cantidadPendientes, setCantidadPendientes] = useState(
    () => (socio?.id ? cacheDeuda.get(socio.id) ?? null : null)
  );

  useEffect(() => {
    if (!socio?.id) return;
    let cancelled = false;
    getEstadoFinanciero(socio.id)
      .then((data) => {
        if (cancelled) return;
        const pendientes = (data.cuotas ?? []).filter((c) => c.estado !== 'Pagada');
        cacheDeuda.set(socio.id, pendientes.length);
        setCantidadPendientes(pendientes.length);
      })
      .catch(() => { if (!cancelled) setCantidadPendientes(null); });
    return () => { cancelled = true; };
  }, [socio?.id]);

  if (!cantidadPendientes) return null;

  const mensaje = cantidadPendientes === 1
    ? 'Debés 1 cuota, tocá acá para ponerte al día.'
    : `Debés ${cantidadPendientes} cuotas, tocá acá para ponerte al día.`;

  return (
    <button type="button" className="deuda-banner" onClick={onClick}>
      <AlertTriangle size={18} aria-hidden="true" />
      <span>{mensaje}</span>
    </button>
  );
}
