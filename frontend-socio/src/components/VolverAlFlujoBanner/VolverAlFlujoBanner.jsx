import { useEffect, useState } from 'react';
import { ArrowLeftCircle } from 'lucide-react';
import { leerProgreso } from '../../services/progresoRechazadoService';
import './VolverAlFlujoBanner.css';

const LABEL_POR_TIPO = {
  reserva: 'Volver a la reserva',
  inscripcion: 'Volver a la inscripción',
  entrada: 'Volver a la entrada',
  compra: 'Volver a la compra',
};

/**
 * Banner que ofrece retomar un flujo (reserva/inscripción/entrada/compra)
 * rechazado por morosidad propia, mientras el progreso guardado siga vigente
 * (5 min, ver `progresoRechazadoService.js`). Se muestra arriba de Finanzas
 * y de la pantalla de resultado de pago (vuelta de MercadoPago, que recarga
 * la página — por eso lee de `localStorage` y no de estado de React).
 */
export function VolverAlFlujoBanner({ socio, onVolver }) {
  const [progreso, setProgreso] = useState(() => (socio?.id ? leerProgreso(socio.id) : null));

  useEffect(() => {
    if (!progreso) return undefined;
    const msRestantes = progreso.expiraEn - Date.now();
    if (msRestantes <= 0) {
      setProgreso(null);
      return undefined;
    }
    const timer = setTimeout(() => setProgreso(null), msRestantes);
    return () => clearTimeout(timer);
  }, [progreso]);

  if (!progreso) return null;

  return (
    <button
      type="button"
      className="volver-flujo-banner"
      onClick={() => onVolver(progreso)}
    >
      <ArrowLeftCircle size={18} aria-hidden="true" />
      <span>{LABEL_POR_TIPO[progreso.tipo] || 'Volver'}</span>
    </button>
  );
}
