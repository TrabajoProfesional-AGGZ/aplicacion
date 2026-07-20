import { fetchTo, fetchWithOutAuth } from '../utils/utils';

export async function validarSocio(nroSocio, dni) {
  const res = await fetchWithOutAuth('/api/v1/socios/validar', 'POST', { nro_socio: nroSocio, dni });
  if (res.status === 404) throw new Error('socio-no-encontrado');
  if (res.status === 409) throw new Error('cuenta-ya-registrada');
  if (!res.ok) throw new Error('Error al validar el socio');
  return res.json();
}

export async function reclamarCuentaSocio(dni) {
  const res = await fetchTo(`/api/v1/socios/por-dni/${dni}/reclamar`, 'POST');
  if (res.status === 409) throw new Error('cuenta-ya-registrada');
  if (res.status === 404) throw new Error('socio-no-encontrado');
  if (!res.ok) throw new Error('Error al reclamar la cuenta del socio');
  return res.json();
}

export async function subirFotoSocio(idSocio, imagenBase64) {
  const res = await fetchTo(`/api/v1/socios/${idSocio}/foto`, 'POST', { imagen_base64: imagenBase64 });
  if (res.status >= 500) throw new Error('servicio-no-disponible');
  if (!res.ok) throw new Error('Error al subir la foto');
  return res.json();
}

export async function getSocioByNroSocio(nroSocio) {
  const res = await fetchTo(`/api/v1/socios/por-nro-socio/${encodeURIComponent(nroSocio)}`, 'GET');
  if (res.status >= 500) throw new Error('servicio-no-disponible');
  if (res.status === 404) throw new Error('socio-no-encontrado');
  if (!res.ok) throw new Error('Error al buscar socio');
  return res.json();
}
