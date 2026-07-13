import './WelcomeCard.css';

export function WelcomeCard({ socio }) {
  const fechaFormateada = new Intl.DateTimeFormat('es-AR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date());

  return (
    <section className="welcome-card">
      <div className="welcome-card-texture" aria-hidden="true" />
      <div className="welcome-card-top">
        <p className="welcome-card-fecha">{fechaFormateada}</p>
        <p className="welcome-card-estado">Estado: {socio.estado?.nombre}</p>
      </div>
      <h1 className="welcome-card-saludo">Bienvenido {socio.nombre} {socio.apellido}</h1>
      <p className="welcome-card-membresia">{socio.nro_socio} - {socio.categoria?.nombre}</p>
    </section>
  );
}
