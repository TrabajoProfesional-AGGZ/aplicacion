import { createContext } from 'react';

// Default seguro para consumidores renderizados fuera de un AuthProvider (ej. tests unitarios
// de componentes que no envuelven con el provider) — evita que useAuth() devuelva undefined.
export const AuthContext = createContext({
  socio: null,
  setSocio: () => {},
  cargandoAuth: true,
  authError: null,
  cerrarSesion: async () => {},
});
