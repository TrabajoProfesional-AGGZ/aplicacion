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
const cacheDeuda = new Map(); // socioId -> { vencidas, pendientes }

/** Solo para tests: limpia la caché en memoria entre casos. */
export function __resetCacheDeudaParaTests() {
  cacheDeuda.clear();
}

/**
 * Banner persistente en el Home que avisa si el socio tiene cuotas vencidas
 * (mismo patrón que `CertificadoVencidoBanner`); no renderiza nada si no
 * tiene ninguna cuota vencida (una pendiente sin vencer todavía no amerita
 * el aviso).
 */
export function DeudaBanner({ socio, onClick }) {
  const [conteo, setConteo] = useState(
    () => (socio?.id ? cacheDeuda.get(socio.id) ?? null : null)
  );

  useEffect(() => {
    if (!socio?.id) return;
    let cancelled = false;
    getEstadoFinanciero(socio.id)
      .then((data) => {
        if (cancelled) return;
        const cuotas = data.cuotas ?? [];
        const nuevoConteo = {
          vencidas: cuotas.filter((c) => c.estado === 'Vencida').length,
          pendientes: cuotas.filter((c) => c.estado === 'Pendiente').length,
        };
        cacheDeuda.set(socio.id, nuevoConteo);
        setConteo(nuevoConteo);
      })
      .catch(() => { if (!cancelled) setConteo(null); });
    return () => { cancelled = true; };
  }, [socio?.id]);

  if (!conteo || conteo.vencidas === 0) return null;

  const { vencidas, pendientes } = conteo;
  const mensaje = pendientes === 0
    ? (vencidas === 1
      ? 'Debés 1 cuota, tocá acá para ponerte al día.'
      : `Debés ${vencidas} cuotas, tocá acá para ponerte al día.`)
    : `Tenés ${vencidas + pendientes} cuotas vencidas y/o pendientes, tocá acá para ponerte al día.`;

  return (
    <button type="button" className="deuda-banner" onClick={onClick}>
      <AlertTriangle size={18} aria-hidden="true" />
      <span>{mensaje}</span>
    </button>
  );
}
