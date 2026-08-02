import { useState } from 'react';
import AccesoQR from '../AccesoQR/AccesoQr';
import { ShieldCheck, RefreshCw } from 'lucide-react';
import { enrolarYGuardarSecreto } from '../../services/accesosService';
import './Carnet.css';

function nombreCompleto(socio) {
  return [socio?.nombre, socio?.apellido].filter(Boolean).join(' ') || '---';
}

export function Carnet({ socio }) {
  const [refreshKey, setRefreshKey] = useState(0);
  const [recargando, setRecargando] = useState(false);
  const [errorRecarga, setErrorRecarga] = useState(false);

  const handleRecargar = async () => {
    setRecargando(true);
    setErrorRecarga(false);
    try {
      const secreto = await enrolarYGuardarSecreto(socio);
      if (secreto) {
        // Nuevo secreto guardado: remontamos AccesoQR para que lo relea de localStorage.
        setRefreshKey((k) => k + 1);
      } else {
        setErrorRecarga(true);
      }
    } catch {
      setErrorRecarga(true);
    } finally {
      setRecargando(false);
    }
  };

  return (
    <div className="carnet-view">
      <div className="carnet-header-mobile">
        <h2>Mi Pase de Acceso</h2>
        <p>Mostrá este código para ingresar</p>
      </div>

      <div className="carnet-card">
        {/* Encabezado de la tarjeta */}
        <div className="carnet-card-header">
          <div className="carnet-brand">
            <ShieldCheck size={28} className="brand-icon" />
            <span>SOCIOUNIDO</span>
          </div>
        </div>

        {/* Contenedor del QR con zona blanca de seguridad (Quiet Zone) */}
        <div className="carnet-qr-container">
          <AccesoQR key={refreshKey} />
        </div>

        {socio?.id && (
          <div className="carnet-recargar-container">
            <button
              type="button"
              className="carnet-recargar-btn"
              onClick={handleRecargar}
              disabled={recargando}
            >
              <RefreshCw size={15} className={recargando ? 'carnet-recargar-icono--girando' : ''} />
              {recargando ? 'Recargando...' : 'Recargar QR'}
            </button>
            {errorRecarga && (
              <p className="carnet-recargar-error">No se pudo recargar el QR. Probá de nuevo.</p>
            )}
          </div>
        )}

        {/* Datos del Socio */}
        <div className="carnet-card-footer">
          <div className="socio-data">
            <span className="data-label">Socio</span>
            <span className="data-value">{nombreCompleto(socio)}</span>
          </div>
          <div className="socio-data align-right">
            <span className="data-label">Nº de Socio</span>
            <span className="data-value">#{socio?.nro_socio || '---'}</span>
          </div>
        </div>

        {/* Indicador de actualización */}
        <div className="carnet-timer-bar">
          <div className="timer-progress"></div>
        </div>
      </div>
    </div>
  );
}