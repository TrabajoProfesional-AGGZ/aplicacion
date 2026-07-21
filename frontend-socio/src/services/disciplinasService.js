import { fetchTo } from '../utils/utils';

export async function getDisciplinasActivas() {
  const res = await fetchTo('/api/v1/disciplinas?solo_activas=true', 'GET');
  if (res.status >= 500) throw new Error('servicio-no-disponible');
  if (!res.ok) throw new Error('Error al obtener disciplinas');
  const data = await res.json();
  return data.disciplinas ?? data;
}

export async function getDisciplinaById(idDisciplina) {
  const res = await fetchTo(`/api/v1/disciplinas/${idDisciplina}`, 'GET');
  if (res.status >= 500) throw new Error('servicio-no-disponible');
  if (!res.ok) throw new Error('Error al obtener la disciplina');
  return res.json();
}

export async function getDisciplinasPorSocio(idSocio) {
  const res = await fetchTo(`/api/v1/disciplinas/por-socio/${idSocio}`, 'GET');
  if (res.status >= 500) throw new Error('servicio-no-disponible');
  if (!res.ok) throw new Error('Error al obtener tus inscripciones');
  const data = await res.json();
  return data.disciplinas ?? data;
}

async function manejarRespuestaInscripcion(res) {
  if (res.status >= 500) throw new Error('servicio-no-disponible');
  if (res.status === 404) throw new Error('no-encontrado');
  if (res.status === 409) {
    const body = await res.json().catch(() => null);
    const detail = body?.detail;
    if (detail && typeof detail === 'object' && detail.tipo === 'sin_cupo') {
      throw new Error('sin-cupo');
    }
    throw new Error('ya-inscripto');
  }
  if (res.status === 403) {
    const body = await res.json().catch(() => null);
    const tipo = body?.detail?.tipo;
    if (tipo === 'categoria_no_coincide') {
      const error = new Error('categoria-no-coincide');
      error.categoriaRequerida = body.detail.categoria_requerida;
      throw error;
    }
    if (tipo === 'apto_medico') throw new Error('apto-medico');
    if (tipo === 'moroso') throw new Error('moroso');
    throw new Error('no-autorizado');
  }
  if (!res.ok) throw new Error('Error al procesar la inscripción');
  return res.json();
}

export async function inscribirseADisciplina(idDisciplina, idSocio) {
  const res = await fetchTo(`/api/v1/disciplinas/${idDisciplina}/socios/${idSocio}`, 'POST');
  return manejarRespuestaInscripcion(res);
}

export async function sumarseAListaEspera(idDisciplina, idSocio) {
  const res = await fetchTo(`/api/v1/disciplinas/${idDisciplina}/socios/${idSocio}/lista-espera`, 'POST');
  return manejarRespuestaInscripcion(res);
}
