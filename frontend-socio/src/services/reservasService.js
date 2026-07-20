import { fetchTo } from '../utils/utils';

async function fetchReservas(url, errorMsg = 'Error al obtener reservas') {
  const res = await fetchTo(url, 'GET');
  if (res.status >= 500) throw new Error('servicio-no-disponible');
  if (!res.ok) throw new Error(errorMsg);
  const data = await res.json();
  return data.reservas ?? data;
}

export async function getReservasPorSocio(nroSocio) {
  return fetchReservas(`/api/v1/reservas/por-socio/${encodeURIComponent(nroSocio)}`);
}

export async function getReservasHistoricasPorSocio(nroSocio) {
  return fetchReservas(
    `/api/v1/reservas/historicas/por-socio/${encodeURIComponent(nroSocio)}`,
    'Error al obtener reservas históricas'
  );
}

export async function getTurnosDisponibles(idInstalacion, fecha) {
  const res = await fetchTo(
    `/api/v1/reservas/turnos-disponibles/${encodeURIComponent(idInstalacion)}?fecha=${encodeURIComponent(fecha)}`,
    'GET'
  );
  if (res.status >= 500) throw new Error('servicio-no-disponible');
  if (!res.ok) throw new Error('Error al obtener turnos disponibles');
  return res.json();
}

export async function createReserva(data) {
  const res = await fetchTo('/api/v1/reservas', 'POST', data);
  if (res.status >= 500) throw new Error('servicio-no-disponible');
  if (res.status === 409) throw new Error('superposicion');
  if (res.status === 403) {
    const body = await res.json().catch(() => null);
    const tipo = body?.detail?.tipo;
    if (tipo === 'apto_medico') throw new Error('apto-medico');
    throw new Error(tipo === 'suspendido' ? 'socio-suspendido' : 'socio-moroso');
  }
  if (!res.ok) throw new Error('Error al crear la reserva');
  return res.json();
}

export async function cancelReserva(idReserva) {
  const res = await fetchTo(`/api/v1/reservas/${encodeURIComponent(idReserva)}`, 'DELETE');
  if (res.status >= 500) throw new Error('servicio-no-disponible');
  if (res.status === 409) {
    const body = await res.json().catch(() => null);
    const error = new Error('fuera-de-tolerancia');
    error.tiempoMinimoCancelacion = body?.detail?.tiempo_minimo_cancelacion ?? null;
    throw error;
  }
  if (!res.ok) throw new Error('Error al cancelar la reserva');
  return res.json();
}
