import { useState, useEffect, useMemo, useCallback } from 'react';
import { auth } from '../firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { fetchTo } from '../utils/utils';
import { AuthContext } from './authContextObject';

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