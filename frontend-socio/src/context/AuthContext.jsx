import { useState, useEffect, useMemo, useCallback } from 'react';
import { auth, messaging } from '../firebase';
import { getToken } from 'firebase/messaging';
import { onAuthStateChanged, signOut, getIdTokenResult } from 'firebase/auth';
import { fetchTo } from '../utils/utils';
import { getSocioPorEmail } from '../services/sociosService';
import { clubEnMemoria, recordarClub, idDeClubActual } from '../services/clubService';
import { AuthContext } from './authContextObject';
import { logger } from '../utils/logger';

/**
 * Compara el claim `club_id` del token contra el club de este dominio (resuelto por hostname).
 * Sin este chequeo, loguearse con la cuenta de un socio de otro club dejaría operando sobre los
 * datos reales de ESE club mientras la pantalla muestra la marca de este dominio: el club que
 * resuelve `ClubContext` es puramente cosmético.
 *
 * Devuelve `true` también cuando el club de este dominio no se pudo resolver (sin red, catálogo
 * caído): no hay nada contra qué comparar, y bloquear el login ahí sería más agresivo que lo que
 * hace `ClubProvider`, que tampoco frena el render en ese caso.
 */
async function clubDelTokenCoincide(firebaseUser) {
  let clubDelDominio;
  try {
    clubDelDominio = await idDeClubActual();
  } catch {
    return true;
  }
  const { claims } = await getIdTokenResult(firebaseUser);
  return !claims.club_id || claims.club_id === clubDelDominio;
}

/**
 * Provee la sesión del socio (estado Firebase + perfil de backend) a toda la
 * app. Si no hay conexión, o si el fetch del perfil falla en medio de una
 * sesión ya iniciada, reconstruye una sesión mínima desde los datos cacheados
 * en localStorage en vez de deslogear al socio.
 */
export function AuthProvider({ children }) {
  const [socio, setSocio] = useState(null);
  const [cargandoAuth, setCargandoAuth] = useState(true);
  const [authError, setAuthError] = useState(null);

  useEffect(() => {
    if (!navigator.onLine) {
      const savedSecret = localStorage.getItem('socio_totp_secret');
      const savedSocioId = localStorage.getItem('socio_id');
      const savedSocioNombre = localStorage.getItem('socio_nombre');
      const savedSocioApellido = localStorage.getItem('socio_apellido');
      const savedSocioNro = localStorage.getItem('socio_nro_socio');

      if (savedSecret && savedSocioId) {
        logger.log("PWA Offline Boot: Rescatando sesión local directamente.");
        setTimeout(() => {
          setSocio({
            id: savedSocioId,
            modoOffline: true,
            nombre: savedSocioNombre,
            apellido: savedSocioApellido,
            nro_socio: savedSocioNro
          });
          setCargandoAuth(false);
        }, 0);
        return;
      }
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          if (!(await clubDelTokenCoincide(firebaseUser))) {
            setSocio(null);
            setAuthError('Credenciales invalidas');
            setCargandoAuth(false);
            return;
          }

          const token = await firebaseUser.getIdToken();
          localStorage.setItem('socioToken', token);
          let res = await fetchTo(`/api/v1/socios/por-email/${encodeURIComponent(firebaseUser.email)}`, 'GET');

          if (res.ok) {
            const data = await res.json();
            setSocio(data);
            setAuthError(null);
          } else {
            setSocio(null);
            setAuthError('Servicio no disponible');
          }
        } catch (error) {
          logger.warn("Fallo la conexión con el backend:", error);

          // Sesión de Firebase válida pero el backend no respondió: rescata la
          // misma sesión cacheada en vez de deslogear al socio.
          const savedSecret = localStorage.getItem('socio_totp_secret');
          const savedSocioId = localStorage.getItem('socio_id');
          const savedSocioNombre = localStorage.getItem('socio_nombre');
          const savedSocioApellido = localStorage.getItem('socio_apellido');
          const savedSocioNro = localStorage.getItem('socio_nro_socio');

          if (savedSecret && savedSocioId) {
            logger.log("Rescatando sesión local para renderizar el QR.");
            setSocio({ id: savedSocioId, modoOffline: true, nombre: savedSocioNombre, apellido: savedSocioApellido, nro_socio: savedSocioNro });
            setAuthError(null);
          } else {
            setSocio(null);
            setAuthError('Servicio no disponible');
          }
        }
      } else {
        // El `clear()` es a propósito amplio: se va toda la sesión cacheada del socio, incluido
        // el secreto TOTP del carnet. El club no es dato de sesión sino del dominio, así que se
        // preserva: sin él, un arranque offline después de cerrar sesión se quedaría sin marca
        // blanca y sin poder resolver ninguna ruta pre-login.
        const clubCacheado = clubEnMemoria();
        localStorage.clear();
        if (clubCacheado) recordarClub(clubCacheado);

        setSocio(null);
        setAuthError(null);
      }
      setCargandoAuth(false); 
    });

    return () => unsubscribe(); 
  }, []);

  useEffect(() => {
    if (!socio) return;

    const registrarPushToken = async () => {
      try {
        const permission = await Notification.requestPermission();

        if (permission === 'granted') {
          const currentToken = await getToken(messaging, {
            vapidKey: import.meta.env.VITE_APP_VAPID_KEY
          });
          if (currentToken) {
            await fetchTo('/api/v1/notificaciones/token', 'POST', {token: currentToken, plataforma: 'web', email: auth.currentUser?.email});
            logger.log('Token de notificaciones registrado exitosamente.');
          } else {
            logger.warn('No se pudo generar el token de Firebase.');
          }
        }
      } catch (error) {
        logger.error('Error al registrar dispositivo para notificaciones:', error);
      }
    };

    registrarPushToken();
  }, [socio]);

  const cerrarSesion = useCallback(async () => {
    await signOut(auth);
    setSocio(null);
  }, []);

  // Vuelve a pedir el perfil del socio al backend. `socio.estado` (usado por WelcomeCard/PerfilPage
  // para el badge de estado financiero) solo se persiste como efecto secundario de GET /finanzas o
  // de marcar una cuota pagada — sin este refetch, el badge queda con el valor de cuando se logueó.
  const refrescarSocio = useCallback(async () => {
    if (!auth.currentUser) return;
    try {
      const data = await getSocioPorEmail(auth.currentUser.email);
      setSocio((prev) => (prev?.modoOffline ? prev : data));
    } catch (error) {
      logger.warn('No se pudo refrescar el perfil del socio:', error);
    }
  }, []);

  const value = useMemo(
    () => ({ socio, setSocio, cargandoAuth, authError, cerrarSesion, refrescarSocio }),
    [socio, cargandoAuth, authError, cerrarSesion, refrescarSocio]
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}