import { useState, useEffect, useRef } from 'react';
import { AnimatePresence } from 'framer-motion';
import { LoginSocio } from './pages/LoginPage/LoginSocio';
import { RegistroSocioForm } from './pages/Registropage/RegistroSocioForm';
import { HomePage } from './pages/HomePage/HomePage';
import './socio-theme.css';
import { useAuth } from './hooks/useAuth';
import { useBackToRoot } from './hooks/useBackToRoot';

// sessionStorage (a diferencia de localStorage) se limpia al cerrar la pestaña/app pero
// sobrevive a un refresh o a una redirección externa y vuelta (MercadoPago) — permite
// distinguir una apertura real de la app de esos otros dos casos.
const INTRO_MOSTRADA_KEY = 'su_intro_mostrada';

/**
 * Vista raíz: alterna entre las pantallas de autenticación (login/registro) y el dashboard,
 * retrasando el dashboard hasta que la animación de ingreso de LoginSocio termina.
 */
export default function App() {
  const [mostrarRegistro, setMostrarRegistro] = useState(false);
  const [vista, setVista] = useState('auth');
  const vistaInicializadaRef = useRef(false);

  const { socio, cargandoAuth, cerrarSesion } = useAuth();

  useBackToRoot(mostrarRegistro, false, () => setMostrarRegistro(false));

  // Si ya había sesión activa y la animación ya se mostró en esta pestaña (refresh o
  // vuelta de MercadoPago), saltamos directo al dashboard sin montar LoginSocio. Si es
  // la primera resolución de auth en esta pestaña, LoginSocio monta igual y su animación
  // de salida hace de intro antes de pasar al dashboard.
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
