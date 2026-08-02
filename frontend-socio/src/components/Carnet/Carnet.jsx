import AccesoQR from '../AccesoQR/AccesoQr';
import { ShieldCheck } from 'lucide-react'; 
import './Carnet.css';

export function Carnet({ socio }) {
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
          <AccesoQR />
        </div>

        {/* Datos del Socio */}
        <div className="carnet-card-footer">
          <div className="socio-data">
            <span className="data-label">Socio</span>
            <span className="data-value">{socio?.nombre || '---'}</span>
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