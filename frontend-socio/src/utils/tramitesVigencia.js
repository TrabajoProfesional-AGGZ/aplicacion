function hoyIso() {
  const d = new Date();
  const mes = String(d.getMonth() + 1).padStart(2, '0');
  const dia = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${mes}-${dia}`;
}

/**
 * Un trámite está vencido si fue aprobado y su `fecha_vencimiento` ya pasó
 * (misma regla que `listar_vencidos` en ms-club: `fecha_vencimiento < hoy`).
 */
export function estaVencido(tramite) {
  return tramite?.estado === 'aprobado'
    && Boolean(tramite.fecha_vencimiento)
    && tramite.fecha_vencimiento.slice(0, 10) < hoyIso();
}

/**
 * Descarta de `pendientes` (`{vencidos, por_vencer}`) los trámites cuyo tipo ya
 * tiene otro trámite aprobado y vigente (ni vencido ni por vencer): el socio ya
 * lo renovó, así que no hay nada que gestionar. "Vigente" es un aprobado que
 * el backend no incluyó en `vencidos` ni en `por_vencer`.
 */
export function quitarPendientesRenovados(pendientes, tramites) {
  const idsPendientes = new Set(
    [...pendientes.vencidos, ...pendientes.por_vencer].map((t) => t.id)
  );
  const tiposVigentes = new Set(
    tramites
      .filter((t) => t.estado === 'aprobado' && !idsPendientes.has(t.id))
      .map((t) => t.tipo_tramite?.id)
      .filter((id) => id !== undefined)
  );
  const sigue = (t) => !tiposVigentes.has(t.tipo_tramite?.id);
  const vencidos = pendientes.vencidos.filter(sigue);
  const por_vencer = pendientes.por_vencer.filter(sigue);
  return { vencidos, por_vencer, total: vencidos.length + por_vencer.length };
}
