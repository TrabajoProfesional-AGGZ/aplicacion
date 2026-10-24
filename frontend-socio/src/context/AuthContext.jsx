import { useState, useEffect, useMemo, useCallback } from 'react';
import { auth, messaging } from '../firebase';
import { getToken } from 'firebase/messaging';
import { onAuthStateChanged, signOut, getIdTokenResult } from 'firebase/auth';
import { fetchTo } from '../utils/utils';
import { getSocioPorEmail } from '../services/sociosService';
import { clubEnMemoria, recordarClub, idDeClubActual } from '../services/clubService';
import { AuthContext } from './authContextObject';
import { logger } from '../utils/logger';
import {
  inicioDeSesion,
  sellarInicioDeSesion,
  sesionExpirada,
  msRestantesDeSesion,
} from '../utils/sesion';

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
 *
 * La sesión tiene un tope de `DURACION_MAXIMA_SESION_MS` (tres días) desde el último login, que
 * se aplica acá y no en `firebase.js`: la persistencia local es la que hace que el carnet ande
 * offline, así que no se cambia, y Firebase renueva el token indefinidamente mientras esté. Ver
 * `utils/sesion.js`.
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

      // Una sesión vencida no se rescata: se deja caer al flujo normal, que la cierra. El
      // vencimiento vale igual sin red, porque se mide contra el sello del login, no contra el
      // backend.
      if (savedSecret && savedSocioId && !sesionExpirada(inicioDeSesion())) {
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
        // Antes que nada y fuera del `try`: el vencimiento no necesita red, y si el signOut
        // fallara no hay que caer en el rescate de sesión cacheada del `catch`.
        if (sesionExpirada(sellarInicioDeSesion(firebaseUser))) {
          logger.log('Sesión vencida (más de tres días desde el login): se cierra.');
          setSocio(null);
          setAuthError(null);
          setCargandoAuth(false);
          // El signOut vuelve a entrar por este mismo callback con `firebaseUser` null, y es ese
          // pase el que limpia el cache de la sesión.
          try {
            await signOut(auth);
          } catch (error) {
            logger.warn('No se pudo cerrar la sesión vencida:', error);
          }
          return;
        }

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

  // El chequeo del arranque no alcanza: una PWA instalada puede quedar días abierta sin volver a
  // montar el provider. El timer cierra la sesión en el momento justo, y el `visibilitychange`
  // está porque el browser frena los timers de una pestaña en segundo plano: al volver al frente,
  // el plazo puede haber pasado hace rato sin que el setTimeout haya corrido.
  useEffect(() => {
    if (!socio) return;
    const inicio = inicioDeSesion();
    if (inicio === null) return;

    const revisar = () => { if (sesionExpirada(inicio)) cerrarSesion(); };
    const id = setTimeout(revisar, Math.max(msRestantesDeSesion(inicio), 0));
    document.addEventListener('visibilitychange', revisar);

    return () => {
      clearTimeout(id);
      document.removeEventListener('visibilitychange', revisar);
    };
  }, [socio, cerrarSesion]);

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