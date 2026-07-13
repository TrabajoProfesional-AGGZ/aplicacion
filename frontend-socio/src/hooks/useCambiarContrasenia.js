import { useState } from 'react';
import { changePassword } from '../utils/authService';
import { validarFortalezaPassword } from '../utils/formValidators';

// Análogo a WebApp/src/hooks/useChangePassword.js: valida fortaleza de la
// contraseña nueva, llama a Firebase (reautenticación + updatePassword) y,
// a diferencia de WebApp (que navega a "/"), cierra la sesión vía el
// `cerrarSesion` de AuthContext — sin router acá, App.jsx ya vuelve solo a
// la pantalla de login en cuanto `socio` se vuelve null.
export function useCambiarContrasenia(cerrarSesion) {
  const [actual, setActual] = useState('');
  const [nueva, setNueva] = useState('');
  const [confirmar, setConfirmar] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    const errorFortaleza = validarFortalezaPassword(nueva);
    if (errorFortaleza) {
      setError(errorFortaleza);
      return;
    }
    if (nueva !== confirmar) {
      setError('Las contraseñas nuevas no coinciden');
      return;
    }

    setLoading(true);
    try {
      await changePassword(actual, nueva);
      await cerrarSesion();
    } catch {
      setError('Contraseña actual incorrecta o error al cambiar la contraseña');
      setLoading(false);
    }
  }

  return { actual, setActual, nueva, setNueva, confirmar, setConfirmar, error, loading, handleSubmit };
}
