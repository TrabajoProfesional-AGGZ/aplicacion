import { fetchTo } from '../utils/utils';

export async function getAlertasSocio(idSocio) {
  const res = await fetchTo(`/api/v1/alertas/por-socio/${idSocio}`, 'GET');
  if (res.status >= 500) throw new Error('servicio-no-disponible');
  if (!res.ok) throw new Error('Error al obtener las alertas');
  return res.json();
}
