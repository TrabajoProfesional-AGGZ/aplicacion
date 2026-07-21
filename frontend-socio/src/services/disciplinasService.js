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
