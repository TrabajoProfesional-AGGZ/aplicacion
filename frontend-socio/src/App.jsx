// src/App.jsx
import { useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { LoginSocio } from './pages/LoginPage/LoginSocio';
import { RegistroSocioForm } from './pages/Registropage/RegistroSocioForm';
import { HomePage } from './pages/HomePage/HomePage';
import './socio-theme.css';
import { useAuth } from './hooks/useAuth';

export default function App() {
  const [mostrarRegistro, setMostrarRegistro] = useState(false);
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

  return <HomePage socio={socio} cerrarSesion={cerrarSesion} />;
}
