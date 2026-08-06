import { useState, useEffect, useMemo, useCallback } from 'react';
import { auth, messaging } from '../firebase';
import { getToken } from 'firebase/messaging';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { fetchTo } from '../utils/utils';
import { AuthContext } from './authContextObject';

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
        console.log("PWA Offline Boot: Rescatando sesión local directamente.");
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
          const token = await firebaseUser.getIdToken();
          localStorage.setItem('socioToken', token); 
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
          console.warn("Fallo la conexión con el backend:", error);
          
          const savedSecret = localStorage.getItem('socio_totp_secret');
          const savedSocioId = localStorage.getItem('socio_id');
          const savedSocioNombre = localStorage.getItem('socio_nombre');
          const savedSocioApellido = localStorage.getItem('socio_apellido');
          const savedSocioNro = localStorage.getItem('socio_nro_socio');

          if (savedSecret && savedSocioId) {
            console.log("Rescatando sesión local para renderizar el QR.");
            setSocio({ id: savedSocioId, modoOffline: true, nombre: savedSocioNombre, apellido: savedSocioApellido, nro_socio: savedSocioNro });
            setAuthError(null);
          } else {
            setSocio(null);
            setAuthError('No pudimos cargar tu perfil de socio. Probá de nuevo en unos segundos.');
          }
        }
      } else {
        localStorage.clear();
        setSocio(null);
        setAuthError(null);
      }
      setCargandoAuth(false); 
    });

    return () => unsubscribe(); 
  }, []);

  useEffect(() => {
    // Si no hay un socio cargado en el contexto, no hacemos nada
    if (!socio) return;

    const registrarPushToken = async () => {
      try {
        // Pedimos permiso al sistema operativo/navegador
        const permission = await Notification.requestPermission();

        if (permission === 'granted') {
          const currentToken = await getToken(messaging, {
            vapidKey: import.meta.env.VITE_APP_VAPID_KEY
          });
          if (currentToken) {
            await fetchTo('/api/v1/notificaciones/token', 'POST', {token: currentToken, plataforma: 'web', email: auth.currentUser?.email});
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