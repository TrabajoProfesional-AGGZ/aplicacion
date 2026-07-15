import { useEffect, useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { getTramitesPendientes } from '../../services/tramitesService';
import './CertificadoVencidoBanner.css';

export function CertificadoVencidoBanner({ socio, onClick }) {
  const [pendientes, setPendientes] = useState(null);

  useEffect(() => {
    let cancelled = false;
    getTramitesPendientes(socio.id)
      .then((data) => { if (!cancelled) setPendientes(data); })
      .catch(() => { if (!cancelled) setPendientes(null); });
    return () => { cancelled = true; };
  }, [socio.id]);

  const severidad = pendientes?.vencidos?.length > 0
    ? 'danger'
    : pendientes?.por_vencer?.length > 0
      ? 'warning'
      : null;

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
