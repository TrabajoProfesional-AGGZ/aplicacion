import { useState } from 'react';
import { changePassword } from '../utils/authService';
import { unenroll } from '../utils/webauthnService';
import { validarFortalezaPassword } from '../utils/formValidators';

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
      // La contraseña guardada para el desbloqueo biométrico quedó vieja:
      // reintentarla en silencio siempre fallaría contra Firebase, así que
      // se limpia y el usuario reactiva manualmente con la nueva.
      await unenroll();
      await cerrarSesion();
    } catch {
      setError('Contraseña actual incorrecta o error al cambiar la contraseña');
      setLoading(false);
    }
  }

  return { actual, setActual, nueva, setNueva, confirmar, setConfirmar, error, loading, handleSubmit };
}
