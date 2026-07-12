import { fetchWithOutAuth } from '../utils/utils';

export async function fetchValidarSocio(data) {
  const res = await fetchWithOutAuth('/api/v1/socio/validar', 'POST', data);
  if (res.status === 404) throw new Error('socio-no-encontrado');
  if (!res.ok) throw new Error('Error al obtener validación de socio');
  return res.json();
}

