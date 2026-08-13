import { fetchTo } from '../utils/utils';

const FECHA_REGEX = /^\d{4}-\d{2}-\d{2}$/;

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
  if (!FECHA_REGEX.test(fecha)) throw new Error('Fecha inválida');
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
  if (res.status === 409) {
    const body = await res.json?.().catch(() => null);
    const tipo = body?.detail?.tipo;
    if (tipo === 'sin_cupo') {
      const error = new Error('sin-cupo');
      error.cuposDisponibles = body?.detail?.cupos_disponibles ?? null;
      throw error;
    }
    if (tipo === 'conflicto_temporal') throw new Error('conflicto-temporal');
    throw new Error('superposicion');
  }
  if (res.status === 403) {
    const body = await res.json().catch(() => null);
    const detail = body?.detail ?? {};
    const tipo = detail.tipo;
    let errorKey = 'socio-moroso';
    if (tipo === 'apto_medico') {
      errorKey = 'apto-medico';
    } else if (tipo === 'suspendido') {
      errorKey = 'socio-suspendido';
    }
    const sociosPorTipo = {
      'apto-medico': detail.socios_sin_apto_medico,
      'socio-suspendido': detail.socios_suspendido,
      'socio-moroso': detail.socios_moroso,
    };
    const error = new Error(errorKey);
    error.sociosIncumplen = sociosPorTipo[errorKey] ?? [];
    throw error;
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
