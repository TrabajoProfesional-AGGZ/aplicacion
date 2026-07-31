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

// Caché en memoria (variable de módulo) de la última noticia vigente ya
// resuelta con su detalle completo (foto incluida). `getNoticiasVigentes`
// (barata, sin foto) se llama siempre para detectar si cambió la más
// reciente; `getNoticia` (con foto) solo se vuelve a llamar si su id
// cambió — así una noticia nueva se refleja al toque, sin esperar un TTL.
//
// Deliberadamente una variable de módulo, no `sessionStorage`: se resetea
// si se recarga la página/PWA (se evaluó `sessionStorage` para sobrevivir
// un refresh dentro de la misma sesión; ver `aplicacion/CLAUDE.md`, sección
// "Extensión Última Noticia", si en algún momento hace falta ese nivel de
// persistencia).
let cacheUltimaNoticia = null; // { id, detalle } | null

export async function getUltimaNoticia() {
  const vigentes = await getNoticiasVigentes();
  if (vigentes.length === 0) {
    cacheUltimaNoticia = null;
    return null;
  }

  const [masReciente] = [...vigentes].sort(
    (a, b) => new Date(b.fecha_publicacion) - new Date(a.fecha_publicacion),
  );

  if (cacheUltimaNoticia?.id === masReciente.id) {
    return cacheUltimaNoticia.detalle;
  }

  const detalle = await getNoticia(masReciente.id);
  cacheUltimaNoticia = { id: masReciente.id, detalle };
  return detalle;
}