import { createContext, useContext, useState, useEffect } from 'react';
import { auth } from '../firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { fetchTo } from '../utils/utils';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [socio, setSocio] = useState(null);
  const [cargandoAuth, setCargandoAuth] = useState(true);

  // Este efecto "escucha" los cambios de sesión de Firebase
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const token = await firebaseUser.getIdToken();
          localStorage.setItem('socioToken', token); // Mantenemos tu token guardado
          let res = await fetchTo(`/api/v1/socios/por-email/${firebaseUser.email}`, 'GET');
          

          if (res.ok) {
            const data = await res.json();
            setSocio(data);
          } else {
            setSocio(null);
          }
        } catch (error) {
          console.error("Error al recuperar el perfil del socio:", error);
          setSocio(null);
        }
      } else {
        // Si no hay usuario en Firebase, limpiamos todo
        localStorage.removeItem('socioToken');
        setSocio(null);
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
    <AuthContext.Provider value={{ socio, setSocio, cargandoAuth, cerrarSesion }}>
      {children}
    </AuthContext.Provider>
  );
}