import { useContext } from 'react';
import { AuthContext } from '../context/authContextObject';

/** Acceso al contexto de autenticación (`AuthContext`): socio, estado de carga y acciones de sesión. */
export function useAuth() {
  return useContext(AuthContext);
}
