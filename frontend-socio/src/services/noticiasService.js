import { fetchTo } from '../utils/utils';

export async function getNoticiasVigentes() {
  const res = await fetchTo('/api/v1/noticias/vigentes', 'GET');
  if (!res.ok) throw new Error('Error al obtener noticias');
  return res.json();
}

export async function getNoticia(id) {
  const res = await fetchTo(`/api/v1/noticias/${id}`, 'GET');
  if (!res.ok) throw new Error('Error al obtener la noticia');
  return res.json();
}