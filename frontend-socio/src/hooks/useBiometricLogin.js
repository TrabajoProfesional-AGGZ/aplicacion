import { useCallback, useEffect, useState } from 'react';
import { login } from '../utils/authService';
import {
  enroll,
  hasEnrolledCredential,
  isPlatformAuthenticatorAvailable,
  unenroll,
  unlock,
} from '../utils/webauthnService';

/**
 * Envuelve `webauthnService.js` + `authService.login` para que los
 * componentes no llamen directamente a `navigator.credentials`/`crypto.subtle`.
 */
export function useBiometricLogin() {
  const [soportado, setSoportado] = useState(false);
  const [enrolado, setEnrolado] = useState(() => hasEnrolledCredential());
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    isPlatformAuthenticatorAvailable().then((disponible) => {
      if (!cancelled) setSoportado(disponible);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const ofrecerEnrolamiento = useCallback(async (email, password) => {
    setCargando(true);
    setError(null);
    try {
      await enroll(email, password);
      setEnrolado(true);
    } catch (err) {
      setError(err.message || 'biometria-enrolamiento-cancelado');
      throw err;
    } finally {
      setCargando(false);
    }
  }, []);

  const desenrolar = useCallback(async () => {
    await unenroll();
    setEnrolado(false);
  }, []);

  const iniciarSesionBiometrico = useCallback(async () => {
    setCargando(true);
    setError(null);
    try {
      const { email, password } = await unlock();
      await login(email, password);
    } catch (err) {
      setError(err.message || 'biometria-cancelada');
      throw err;
    } finally {
      setCargando(false);
    }
  }, []);

  return {
    soportado,
    enrolado,
    cargando,
    error,
    ofrecerEnrolamiento,
    desenrolar,
    iniciarSesionBiometrico,
  };
}
