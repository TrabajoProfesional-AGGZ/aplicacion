import { PartyPopper } from 'lucide-react';
import './WelcomeCard.css';

const ESTADO_COLOR = {
  Activo: 'var(--status-success-border)',
  Moroso: 'var(--status-danger-border)',
  Inactivo: 'var(--status-warning-border)',
  Suspendido: 'var(--status-suspended-border)',
};

function esCumpleaniosHoy(fechaNacimiento) {
  if (!fechaNacimiento) return false;
  const nacimiento = new Date(fechaNacimiento);
  const hoy = new Date();
  return (
    nacimiento.getUTCMonth() === hoy.getMonth() &&
    nacimiento.getUTCDate() === hoy.getDate()
  );
}

export function WelcomeCard({ socio }) {
  const fechaFormateada = new Intl.DateTimeFormat('es-AR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date());

  const esCumpleanios = esCumpleaniosHoy(socio.fecha_nacimiento);

  return (
    <section className="welcome-card">
      <div className="welcome-card-texture" aria-hidden="true" />
      <div className="welcome-card-top">
        <p className="welcome-card-fecha">{fechaFormateada}</p>
        <p className="welcome-card-estado" style={{ color: ESTADO_COLOR[socio.estado?.nombre] }}>
          Estado: {socio.estado?.nombre}
        </p>
      </div>
      <h1 className="welcome-card-saludo">Bienvenido {socio.nombre} {socio.apellido}</h1>
      {esCumpleanios && (
        <p className="welcome-card-cumpleanios" role="status">
          <PartyPopper size={14} aria-hidden="true" />
          ¡Feliz cumpleaños, {socio.nombre}! Desde el club te deseamos un gran día
        </p>
      )}
      <p className="welcome-card-membresia">{socio.nro_socio} - {socio.categoria?.nombre}</p>
    </section>
  );
}
