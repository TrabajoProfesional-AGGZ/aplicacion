// src/App.jsx
import { useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { Menu, QrCode, CreditCard, Calendar, User } from 'lucide-react';
import { LoginSocio } from './pages/LoginPage/LoginSocio';
import { RegistroSocioForm } from './pages/Registropage/RegistroSocioForm';
import './socio-theme.css';
import { useAuth } from './hooks/useAuth';

const SECCIONES_PROXIMAMENTE = [
  { id: 'qr', icon: QrCode, titulo: 'Mi Carnet Digital', desc: 'Generá tu código QR de acceso a las instalaciones.' },
  { id: 'pagos', icon: CreditCard, titulo: 'Cuotas y Pagos', desc: 'Aboná tu cuota social o servicios adicionales.' },
  { id: 'reservas', icon: Calendar, titulo: 'Reservas e Instalaciones', desc: 'Administrar reservas de espacios físicos.' },
  { id: 'perfil', icon: User, titulo: 'Mis Datos', desc: 'Consultar o modificar tu información personal.' },
];

export default function App() {
  const [mostrarRegistro, setMostrarRegistro] = useState(false);
  const [proximamente, setProximamente] = useState(null);
  // Gatea cuándo se muestra el dashboard: no basta con que `socio` sea verdadero,
  // hay que esperar a que LoginSocio termine su coreografía de salida (banda
  // cubriendo la pantalla + fade a blanco) para no cortarla a mitad de camino.
  const [vista, setVista] = useState('auth');

  const { socio, cargandoAuth, cerrarSesion } = useAuth();

  // Derivado (no estado propio): si `socio` se vuelve falsy (ej. logout) esto
  // vuelve a `false` solo, sin necesitar un efecto que llame a setState.
  const mostrarDashboard = vista === 'app' && Boolean(socio);

  if (cargandoAuth) {
    return (
      <div style={{ height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <p>Cargando tu carnet...</p>
      </div>
    );
  }

  if (!mostrarDashboard) {
    return (
      <AnimatePresence mode="wait">
        {mostrarRegistro ? (
          <RegistroSocioForm
            key="registro"
            onSuccess={() => { setMostrarRegistro(false); setVista('app'); }}
            onCancel={() => setMostrarRegistro(false)}
          />
        ) : (
          <LoginSocio
            key="login"
            irARegistro={() => setMostrarRegistro(true)}
            onIngresoCompleto={() => setVista('app')}
          />
        )}
      </AnimatePresence>
    );
  }

  return (
    <div>
      <header className="topbar">
        <button className="menu-btn"><Menu size={24} color="#111111" /></button>
        <div className="user-info">
          <span style={{ color: '#4A4A4A' }}>Socio {socio.nro_socio}</span>
          <button onClick={cerrarSesion} className="btn-cerrar-sesion">Cerrar sesión</button>
        </div>
      </header>

      <main className="dashboard-layout">
        <h1 className="dashboard-title">Panel principal</h1>
        <p className="dashboard-subtitle">
          Bienvenido, <b>{socio.nombre} {socio.apellido}</b>. Accedé rápidamente a las secciones del club.
        </p>

        <div className="cards-grid">
          {SECCIONES_PROXIMAMENTE.map(({ id, icon: Icon, titulo, desc }) => (
            <div key={id} className="su-card" onClick={() => setProximamente(titulo)}>
              <div className="card-icon"><Icon size={24} color="#111111" /></div>
              <h3 className="card-title">{titulo}</h3>
              <p className="card-desc">{desc}</p>
            </div>
          ))}
        </div>

        {proximamente && (
          <div className="proximamente-overlay" onClick={() => setProximamente(null)}>
            <div className="proximamente-card" onClick={(e) => e.stopPropagation()}>
              <p className="proximamente-titulo">{proximamente}</p>
              <p className="proximamente-texto">Próximamente...</p>
              <button className="proximamente-cerrar" onClick={() => setProximamente(null)}>Cerrar</button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
