import { fetchTo } from '../utils/utils';

export async function getTiposTramite() {
  const res = await fetchTo('/api/v1/tramites/tipos', 'GET');
  if (res.status >= 500) throw new Error('servicio-no-disponible');
  if (!res.ok) throw new Error('Error al obtener los tipos de trámite');
  return res.json();
}

export async function getTramitesPorSocio(idSocio) {
  const res = await fetchTo(`/api/v1/tramites/por-socio/${idSocio}`, 'GET');
  if (res.status >= 500) throw new Error('servicio-no-disponible');
  if (!res.ok) throw new Error('Error al obtener los trámites');
  return res.json();
}

export async function getTramitesPendientes(idSocio) {
  const res = await fetchTo(`/api/v1/tramites/pendientes/${idSocio}`, 'GET');
  if (res.status >= 500) throw new Error('servicio-no-disponible');
  if (!res.ok) throw new Error('Error al obtener los trámites pendientes');
  return res.json();
}

export async function crearTramite(idSocio, { id_tipo_tramite, archivo_base64, fecha_vencimiento }) {
  const res = await fetchTo(`/api/v1/tramites/${idSocio}`, 'POST', {
    id_tipo_tramite,
    archivo_base64,
    fecha_vencimiento: fecha_vencimiento || null,
  });
  if (res.status === 413) throw new Error('archivo-muy-grande');
  if (res.status >= 500) throw new Error('servicio-no-disponible');
  if (!res.ok) throw new Error('Error al subir el trámite');
  return res.json();
}
