import { fetchTo } from '../utils/utils';

export async function getEstadoFinanciero(idSocio) {
  const res = await fetchTo(`/api/v1/finanzas/${idSocio}`, 'GET');
  if (res.status === 404) throw new Error('socio-no-encontrado');
  if (!res.ok) throw new Error('Error al obtener el estado financiero');
  return res.json();
}
