import { useState, useEffect, useRef } from 'react';
import { AnimatePresence } from 'framer-motion';
import { LoginSocio } from './pages/LoginPage/LoginSocio';
import { RegistroSocioForm } from './pages/Registropage/RegistroSocioForm';
import { HomePage } from './pages/HomePage/HomePage';
import './socio-theme.css';
import { useAuth } from './hooks/useAuth';
import { useBackToRoot } from './hooks/useBackToRoot';
import { useEdgeSwipeBack } from './hooks/useEdgeSwipeBack';

// sessionStorage sobrevive a un refresh o ida-y-vuelta a MercadoPago, pero se
// limpia al cerrar la pestaña: permite distinguir esos casos de una apertura real.
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
  useEdgeSwipeBack();

  // Si ya había sesión y la intro ya se mostró en esta pestaña, saltamos directo al
  // dashboard. Si no, LoginSocio monta y su animación de salida hace de intro.
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
  // Mientras LoginSocio anima su salida, el dashboard real ya se monta debajo
  // (LoginSocio es un overlay fixed que se desvanece), en vez de cortar a un
  // HomePage recién montado.
  const mostrarDashboardDebajoDelLogin = vista === 'auth' && Boolean(socio) && !mostrarRegistro;

  if (cargandoAuth) {
    return <div style={{ height: '100dvh', backgroundColor: '#111111' }} />;
  }

  if (mostrarDashboard) {
    return (
      <HomePage
        socio={socio}
        cerrarSesion={cerrarSesion}
      />
    );
  }

  return (
    <>
      {mostrarDashboardDebajoDelLogin && (
        <HomePage
          socio={socio}
          cerrarSesion={cerrarSesion}
        />
      )}
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
    </>
  );
}
