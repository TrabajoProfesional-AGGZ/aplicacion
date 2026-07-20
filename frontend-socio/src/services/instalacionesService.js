import { fetchTo } from '../utils/utils';

export async function getInstalaciones() {
  const res = await fetchTo('/api/v1/instalaciones', 'GET');
  if (res.status >= 500) throw new Error('servicio-no-disponible');
  if (!res.ok) throw new Error('Error al obtener instalaciones');
  const data = await res.json();
  const instalaciones = data.instalaciones ?? data;
  return instalaciones.filter((instalacion) => instalacion.activa);
}
