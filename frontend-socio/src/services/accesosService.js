import { fetchTo } from '../utils/utils';

const SECRETO_VALIDO_REGEX = /^[a-zA-Z0-9]+$/;

/**
 * Pide un secreto TOTP nuevo a ms-acceso y lo guarda en localStorage junto
 * con los datos del socio que necesita el pase offline (mismas keys que
 * lee AccesoQr.jsx/el arranque en modo offline de AuthContext).
 * Devuelve el secreto guardado, o null si la respuesta no fue ok o el
 * secreto no pasó la validación de formato — nunca lanza por esos dos casos,
 * solo por errores de red (fetchTo/AbortError).
 */
export async function enrolarYGuardarSecreto(socio) {
  const res = await fetchTo('/api/v1/accesos/enrolar', 'POST', { socio_id: socio.id });

  if (!res.ok) return null;

  const data = await res.json();
  const secreto = data.totp_secret;

  if (typeof secreto !== 'string' || !SECRETO_VALIDO_REGEX.test(secreto)) {
    console.error('El secreto TOTP recibido del servidor no tiene un formato válido.');
    return null;
  }

  localStorage.setItem('socio_totp_secret', secreto);
  localStorage.setItem('socio_id', String(socio.id));
  localStorage.setItem('socio_nombre', String(socio.nombre));
  localStorage.setItem('socio_apellido', String(socio.apellido));
  localStorage.setItem('socio_nro_socio', String(socio.nro_socio));

  return secreto;
}

/**
 * Pide el último resultado de escaneo registrado para este socio (usado por
 * el polling de "Mi Carnet" para mostrar feedback de acceso concedido/rechazado).
 * Nunca lanza — cualquier error de red o respuesta no-ok se degrada a null,
 * igual criterio que el resto de este servicio.
 */
export async function obtenerUltimoAcceso(socioId) {
  try {
    const res = await fetchTo(`/api/v1/accesos/ultimo-estado/${encodeURIComponent(socioId)}`, 'GET');
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}
