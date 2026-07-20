// src/App.jsx
import { useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { LoginSocio } from './pages/LoginPage/LoginSocio';
import { RegistroSocioForm } from './pages/Registropage/RegistroSocioForm';
import { HomePage } from './pages/HomePage/HomePage';
import './socio-theme.css';
import { useAuth } from './hooks/useAuth';
import { useBackToRoot } from './hooks/useBackToRoot';

export default function App() {
  const [mostrarRegistro, setMostrarRegistro] = useState(false);
  const [vista, setVista] = useState('auth');

  const { socio, cargandoAuth, cerrarSesion } = useAuth();

  useBackToRoot(mostrarRegistro, false, () => setMostrarRegistro(false));

  const mostrarDashboard = vista === 'app' && Boolean(socio);

  if (cargandoAuth) {
    return <div style={{ height: '100dvh', backgroundColor: '#111111' }} />;
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
