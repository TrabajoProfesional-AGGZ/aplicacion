// src/App.jsx
import { useState, useEffect, useRef } from 'react';
import { AnimatePresence } from 'framer-motion';
import { LoginSocio } from './pages/LoginPage/LoginSocio';
import { RegistroSocioForm } from './pages/Registropage/RegistroSocioForm';
import { HomePage } from './pages/HomePage/HomePage';
import './socio-theme.css';
import { useAuth } from './hooks/useAuth';
import { useBackToRoot } from './hooks/useBackToRoot';

// sessionStorage (a diferencia de localStorage) se limpia al cerrar la pestaña/app pero
// sobrevive tanto a un refresh como a una redirección externa y vuelta (ida y vuelta a la
// pasarela de MercadoPago) dentro de la misma pestaña — por eso sirve para distinguir
// "se volvió a abrir la app" (debe verse la animación) de esos otros dos casos (no debe).
const INTRO_MOSTRADA_KEY = 'su_intro_mostrada';

export default function App() {
  const [mostrarRegistro, setMostrarRegistro] = useState(false);
  const [vista, setVista] = useState('auth');
  const vistaInicializadaRef = useRef(false);

  const { socio, cargandoAuth, cerrarSesion } = useAuth();

  useBackToRoot(mostrarRegistro, false, () => setMostrarRegistro(false));

  // Si al resolver la autenticación ya había una sesión activa Y la animación de
  // login ya se mostró antes en esta misma pestaña (refresh, o vuelta de la pasarela
  // de MercadoPago), saltamos directo al dashboard sin montar LoginSocio. Si en cambio
  // es la primera vez que se resuelve la auth en esta pestaña (app recién abierta),
  // dejamos que LoginSocio monte igual con socio ya presente: su animación de salida
  // hace de "intro" antes de pasar al dashboard.
  useEffect(() => {
    if (!cargandoAuth && !vistaInicializadaRef.current) {
      vistaInicializadaRef.current = true;
      const introYaMostrada = sessionStorage.getItem(INTRO_MOSTRADA_KEY) === '1';
      if (socio && introYaMostrada) {
        setVista('app');
      }
      sessionStorage.setItem(INTRO_MOSTRADA_KEY, '1');
    }
  }, [cargandoAuth, socio]);

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

  return (
    <HomePage
      socio={socio}
      cerrarSesion={cerrarSesion}
    />
  );
}
