import { useState, useEffect, useMemo, useCallback } from 'react';
import { auth } from '../firebase';
import { messaging } from '../firebase';
import { getToken } from 'firebase/messaging';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { fetchTo } from '../utils/utils';
import { AuthContext } from './authContextObject';
import { useInactivityLogout } from '../hooks/useInactivityLogout';

const TIEMPO_INACTIVIDAD_MS = 10 * 60 * 1000;

export function AuthProvider({ children }) {
  const [socio, setSocio] = useState(null);
  const [cargandoAuth, setCargandoAuth] = useState(true);
  const [authError, setAuthError] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const token = await firebaseUser.getIdToken();
          localStorage.setItem('socioToken', token); 
          await new Promise(resolve => setTimeout(resolve, 3000));
          let res = await fetchTo(`/api/v1/socios/por-email/${encodeURIComponent(firebaseUser.email)}`, 'GET');

          if (res.ok) {
            const data = await res.json();
            setSocio(data);
            setAuthError(null);
          } else {
            setSocio(null);
            setAuthError('No pudimos cargar tu perfil de socio. Probá de nuevo en unos segundos.');
          }
        } catch (error) {
          console.error("Error al recuperar el perfil del socio:", error);
          setSocio(null);
          setAuthError('No pudimos cargar tu perfil de socio. Probá de nuevo en unos segundos.');
        }
      } else {
        localStorage.removeItem('socioToken');
        setSocio(null);
        setAuthError(null);
      }
      setCargandoAuth(false); 
    });

    return () => unsubscribe(); 
  }, []);

  useEffect(() => {
    console.log('intento de notif ', socio)
    // Si no hay un socio cargado en el contexto, no hacemos nada
    if (!socio) return;

    const registrarPushToken = async () => {
      try {
        // Pedimos permiso al sistema operativo/navegador
        const permission = await Notification.requestPermission();
        console.log(permission)
        
        if (permission === 'granted') {
          // Generamos el token de Firebase usando tu VAPID Key
          const currentToken = await getToken(messaging, { 
            vapidKey: 'BFym3vvw3wJ9zIT2jdASxMNHKKaXATa9tnwoHIUEpmsUPsezXU8VjA3tABIc1XdaooM0MiYYsp60290b98A6lhM'
          });
          console.log(currentToken)
          if (currentToken) {
            await new Promise(resolve => setTimeout(resolve, 3000));
            await fetchTo('/api/v1/notificaciones/token', 'POST', {token: currentToken,plataforma: 'web'});
            console.log('Token de notificaciones registrado exitosamente.');
          } else {
            console.warn('No se pudo generar el token de Firebase.');
          }
        }
      } catch (error) {
        console.error('Error al registrar dispositivo para notificaciones:', error);
      }
    };

    registrarPushToken();
  }, [socio]); // Solo se ejecuta cuando el estado "socio" cambia

  const cerrarSesion = useCallback(async () => {
    await signOut(auth);
    setSocio(null);
  }, []);

  useInactivityLogout(Boolean(socio), TIEMPO_INACTIVIDAD_MS, cerrarSesion);

  const value = useMemo(
    () => ({ socio, setSocio, cargandoAuth, authError, cerrarSesion }),
    [socio, cargandoAuth, authError, cerrarSesion]
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}