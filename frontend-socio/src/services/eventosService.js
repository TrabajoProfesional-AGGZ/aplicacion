import { fetchTo } from '../utils/utils';

export async function getEventos() {
  const res = await fetchTo('/api/v1/eventos', 'GET');
  if (res.status >= 500) throw new Error('servicio-no-disponible');
  if (!res.ok) throw new Error('Error al obtener eventos');
  return res.json();
}

async function manejarRespuestaCompra(res) {
  if (res.status >= 500) throw new Error('servicio-no-disponible');
  if (res.status === 404) throw new Error('evento-no-encontrado');
  if (res.status === 409) {
    const body = await res.json().catch(() => null);
    const tipo = body?.detail?.tipo;
    if (tipo === 'sin_cupo') throw new Error('sin-cupo');
    if (tipo === 'ya_tiene_entrada') throw new Error('ya-tiene-entrada');
    if (tipo === 'fuera_de_plazo') throw new Error('fuera-de-plazo');
    throw new Error('conflicto');
  }
  if (res.status === 403) {
    const body = await res.json().catch(() => null);
    const tipo = body?.detail?.tipo;
    if (tipo === 'moroso') throw new Error('moroso');
    if (tipo === 'suspendido') throw new Error('suspendido');
    throw new Error('no-autorizado');
  }
  if (!res.ok) throw new Error('Error al comprar la entrada');
  return res.json();
}

export async function comprarEntrada(idEvento, idSocio) {
  const res = await fetchTo('/api/v1/entradas', 'POST', { id_evento: idEvento, id_socio: idSocio });
  return manejarRespuestaCompra(res);
}

export async function getEntradasActivas(idSocio) {
  const res = await fetchTo(`/api/v1/entradas/por-socio/${encodeURIComponent(idSocio)}`, 'GET');
  if (res.status >= 500) throw new Error('servicio-no-disponible');
  if (!res.ok) throw new Error('Error al obtener tus entradas');
  return res.json();
}

export async function getEntradasHistoricas(idSocio) {
  const res = await fetchTo(`/api/v1/entradas/historicas/por-socio/${encodeURIComponent(idSocio)}`, 'GET');
  if (res.status >= 500) throw new Error('servicio-no-disponible');
  if (!res.ok) throw new Error('Error al obtener tu historial de entradas');
  return res.json();
}
