import { useState, useEffect } from 'react';
import { auth } from '../firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { fetchTo } from '../utils/utils';
import { AuthContext } from './authContextObject';

export function AuthProvider({ children }) {
  const [socio, setSocio] = useState(null);
  const [cargandoAuth, setCargandoAuth] = useState(true);
  // Distingue "todavía no inició sesión" (authError null) de "Firebase aceptó las
  // credenciales pero no pudimos traer el perfil del socio" (ej. backend caído) —
  // sin esto, un fallo acá deja a LoginSocio sin ninguna señal de que algo salió mal.
  const [authError, setAuthError] = useState(null);

  // Este efecto "escucha" los cambios de sesión de Firebase
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const token = await firebaseUser.getIdToken();
          localStorage.setItem('socioToken', token); // Mantenemos tu token guardado
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
        // Si no hay usuario en Firebase, limpiamos todo
        localStorage.removeItem('socioToken');
        setSocio(null);
        setAuthError(null);
      }
      setCargandoAuth(false); // Terminamos de cargar
    });

    return () => unsubscribe(); // Limpieza del observador
  }, []);

  const cerrarSesion = async () => {
    await signOut(auth);
    setSocio(null);
  };

  return (
    <AuthContext.Provider value={{ socio, setSocio, cargandoAuth, authError, cerrarSesion }}>
      {children}
    </AuthContext.Provider>
  );
}