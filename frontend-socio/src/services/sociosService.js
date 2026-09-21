import { fetchTo, fetchWithOutAuth } from '../utils/utils';
import { idDeClubActual } from './clubService';

/**
 * Valida nro de socio + DNI + mail contra el registro pre-cargado (sin sesión Firebase todavía).
 * Devuelve `{ ok, token }`: `token` es de un solo uso y hay que pasárselo después a
 * `reclamarCuentaSocio` (issue #249/A-01).
 *
 * El club va **en el path**: es una ruta pre-login, así que no hay token del que el gateway pueda
 * propagar el claim `club_id`. Es spoofeable por diseño —cualquiera puede probar con otro club— y
 * la mitigación es el rate limit por IP del gateway; el aislamiento no se relaja, porque del otro
 * lado el engine se resuelve igual contra el catálogo de clubes.
 * @throws {Error} 'socio-no-encontrado' | 'cuenta-ya-registrada' | 'demasiados-intentos' | 'club-desconocido' | 'servicio-no-disponible'
 */
export async function validarSocio(nroSocio, dni, mail) {
  const clubId = await idDeClubActual();
  const res = await fetchWithOutAuth(
    `/api/v1/clubes/${encodeURIComponent(clubId)}/socios/validar`,
    'POST',
    { nro_socio: nroSocio, dni, mail },
  );
  if (res.status === 404) throw new Error('socio-no-encontrado');
  if (res.status === 409) throw new Error('cuenta-ya-registrada');
  if (res.status === 429) throw new Error('demasiados-intentos');
  if (!res.ok) throw new Error('Error al validar el socio');
  return res.json();
}

/**
 * Marca la cuenta como reclamada. `token` es el que devolvió `validarSocio`: ata el reclamo a
 * esa validación puntual. Se manda siempre que exista; el backend todavía lo acepta ausente
 * mientras dure el rollout.
 * @throws {Error} 'cuenta-ya-registrada' | 'socio-no-encontrado' | 'validacion-vencida'
 */
export async function reclamarCuentaSocio(dni, token) {
  const cuerpo = token ? { token } : null;
  const res = await fetchTo(`/api/v1/socios/por-dni/${encodeURIComponent(dni)}/reclamar`, 'POST', cuerpo);
  if (res.status === 409) throw new Error('cuenta-ya-registrada');
  if (res.status === 404) throw new Error('socio-no-encontrado');
  if (res.status === 403) throw new Error('validacion-vencida');
  if (!res.ok) throw new Error('Error al reclamar la cuenta del socio');
  return res.json();
}

/**
 * Rama demo: auto-otorga el permiso `pago_simulado`
 * a la cuenta recién creada, para que los testers no necesiten una asignación
 * manual vía script antes de poder usar el pago simulado. No llamar desde `main`.
 *
 * Igual que `asignarTipoClaim`: es pre-claim (el token todavía no tiene `club_id`), así que el
 * club va en el path. Del otro lado el claim le gana al path si ya existiera.
 * @throws {Error} 'club-desconocido' | 'servicio-no-disponible'
 */
export async function asignarPagoSimuladoClaim(idToken) {
  const clubId = await idDeClubActual();
  const res = await fetchTo(
    `/api/v1/auth/clubes/${encodeURIComponent(clubId)}/claims/pago-simulado-demo`,
    'POST',
    { id_token: idToken },
  );
  if (!res.ok) throw new Error('Error al asignar el permiso de pago simulado');
  return res.json();
}

export async function subirFotoSocio(idSocio, imagenBase64) {
  const res = await fetchTo(`/api/v1/socios/${encodeURIComponent(idSocio)}/foto`, 'POST', { imagen_base64: imagenBase64 });
  if (res.status >= 500) throw new Error('servicio-no-disponible');
  if (!res.ok) throw new Error('Error al subir la foto');
  return res.json();
}

export async function getSocioPorEmail(email) {
  const res = await fetchTo(`/api/v1/socios/por-email/${encodeURIComponent(email)}`, 'GET');
  if (!res.ok) throw new Error('Error al obtener el perfil del socio');
  return res.json();
}

export async function getSocioByNroSocio(nroSocio) {
  const res = await fetchTo(`/api/v1/socios/por-nro-socio/${encodeURIComponent(nroSocio)}`, 'GET');
  if (res.status >= 500) throw new Error('servicio-no-disponible');
  if (res.status === 404) throw new Error('socio-no-encontrado');
  if (!res.ok) throw new Error('Error al buscar socio');
  return res.json();
}
