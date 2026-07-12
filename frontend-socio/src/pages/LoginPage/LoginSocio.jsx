import { useState, useEffect } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { login } from '../../utils/authService'; // Asegurate de que esta ruta sea correcta
import logoSocioAlt from '../../assets/logo_socio_alt.png';
import logoConTexto from '../../assets/logo_con_texto.png';
import '../../socio-theme.css';

// 1. Orquestador de animaciones del contenedor
const formContainerVariants = {
  hidden: {},
  // "staggerChildren" hace que los elementos aparezcan uno tras otro (efecto cascada)
  visible: { transition: { staggerChildren: 0.1, delayChildren: 0.8 } },
  exiting: { transition: { staggerChildren: 0.05, staggerDirection: -1 } },
};

// 2. Animación individual de cada elemento (Logo, inputs, botón)
const formItemVariants = {
  hidden: { y: 30, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } },
  exiting: { y: -20, opacity: 0, transition: { duration: 0.3, ease: 'easeIn' } },
};

export function LoginSocio({ irARegistro }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');

  // Estados para controlar el flujo visual
  const [animStarted, setAnimStarted] = useState(false);
  const [exiting, setExiting] = useState(false);
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    if (shouldReduceMotion) return;
    const timer = setTimeout(() => setAnimStarted(true), 400);
    return () => clearTimeout(timer);
  }, [shouldReduceMotion]);

  const manejarLogin = async (e) => {
    e.preventDefault();
    setCargando(true);
    setError('');

    try {
      await login(email, password);

      if (!shouldReduceMotion) {
         setExiting(true);
      }

    } catch (err) {
      if (err.code === 'auth/invalid-credential') {
        setError('Email o contraseña incorrectos.');
      } else {
        setError(err.message || 'Ocurrió un error al iniciar sesión.');
      }
      setCargando(false); // Solo cortamos la carga si hay error
    }
  };

  return (
    <div className="login-container" style={{ position: 'relative', overflow: 'hidden' }}>

      {/* =========================================
          CAPA 1: SPLASH SCREEN MÓVIL
          ========================================= */}
      {!shouldReduceMotion && (
        <motion.div
          initial={{ y: '0%' }}
          animate={{ y: animStarted ? '-100%' : '0%' }} // Se desliza hacia arriba
          transition={{ duration: 0.8, ease: [0.76, 0, 0.24, 1], delay: 0.4 }}
          style={{
            position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'var(--primary-color)',
            display: 'flex', justifyContent: 'center', alignItems: 'center',
            zIndex: 50
          }}
          aria-hidden="true"
        >
          {/* Logo invertido latiendo levemente al entrar */}
          <motion.img
            src={logoSocioAlt}
            alt="Logo"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            style={{ width: '120px' }}
          />
        </motion.div>
      )}

      {/* =========================================
          CAPA 2: FORMULARIO MINIMALISTA
          ========================================= */}
      <motion.div
        variants={formContainerVariants}
        initial="hidden"
        animate={exiting ? 'exiting' : (animStarted || shouldReduceMotion ? 'visible' : 'hidden')}
        style={{ width: '100%', maxWidth: '400px', margin: '0 auto', display: 'flex', flexDirection: 'column', zIndex: 10 }}
      >
        {/* Logo superior */}
        <motion.div variants={formItemVariants} style={{ textAlign: 'center', marginBottom: '1rem' }}>
          <img src={logoConTexto} alt="SocioUnido" style={{ height: '50px', objectFit: 'contain' }} />
        </motion.div>

        <motion.h2 variants={formItemVariants} className="login-slogan">
          Porque el club es de los socios, y la gestión es de <b>SocioUnido</b>
        </motion.h2>

        <motion.form onSubmit={manejarLogin} variants={formItemVariants}>
          <div className="input-group">
            <label className="input-label">Email</label>
            <input
              type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
              className="su-input"
            />
          </div>

          <div className="input-group">
            <label className="input-label">Contraseña</label>
            <input
              type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
              className="su-input"
            />
          </div>

          {error && <p style={{ color: '#ef4444', fontSize: '0.85rem', margin: '0 0 1rem 0', textAlign: 'center' }}>{error}</p>}

          <button type="submit" disabled={cargando} className="su-button" style={{ marginTop: '0.5rem' }}>
            {cargando ? 'Ingresando...' : 'Ingresar'}
          </button>
        </motion.form>

        <motion.div variants={formItemVariants} style={{ textAlign: 'center', marginTop: '2rem', fontSize: '0.9rem' }}>
          <button type="button" onClick={irARegistro} style={{ background: 'none', border: 'none', color: '#6b7280', textDecoration: 'underline', cursor: 'pointer' }}>
            ¿Es tu primera vez? Configurar mi cuenta
          </button>
        </motion.div>

      </motion.div>
    </div>
  );
}