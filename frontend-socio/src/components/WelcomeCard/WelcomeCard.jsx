import { PartyPopper } from 'lucide-react';
import './WelcomeCard.css';

// RGB (no hex) para variar la opacidad de texto/borde/glow del pill de estado
// con una sola fuente por color (rgb(var(--estado-rgb) / alpha)). Usa los
// tonos claros --status-*-bg en vez de los oscuros --status-*-border, que
// sobre el gradiente casi negro de la card no se leían bien.
const ESTADO_RGB = {
  Activo: '167 218 167',
  Moroso: '244 190 190',
  Inactivo: '245 233 178',
  Suspendido: '255 189 152',
};

function esCumpleaniosHoy(fechaNacimiento) {
  if (!fechaNacimiento) return false;
  const [, month, day] = fechaNacimiento.split('T')[0].split('-').map(Number);
  if (!month || !day) return false;
  const hoy = new Date();
  return hoy.getMonth() + 1 === month && hoy.getDate() === day;
}

/** Tarjeta de bienvenida del Home: fecha, estado, saludo y datos de membresía. */
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
        <p className="welcome-card-estado" style={{ '--estado-rgb': ESTADO_RGB[socio.estado?.nombre] }}>
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
