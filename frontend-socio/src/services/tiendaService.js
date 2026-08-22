import { fetchTo } from '../utils/utils';

export async function getProductosDisponibles() {
  const res = await fetchTo('/api/v1/productos/disponibles', 'GET');
  if (!res.ok) throw new Error('Error al obtener productos');
  return res.json();
}

export async function getProducto(id) {
  const res = await fetchTo(`/api/v1/productos/${encodeURIComponent(id)}`, 'GET');
  if (!res.ok) throw new Error('Error al obtener el producto');
  return res.json();
}

/** Traduce la respuesta HTTP a errores de código corto (ej. `'sin-stock'`) que los componentes matchean por `e.message`. */
async function manejarRespuestaCompra(res) {
  if (res.status >= 500) throw new Error('servicio-no-disponible');
  if (res.status === 404) throw new Error('producto-no-encontrado');
  if (res.status === 409) {
    const body = await res.json().catch(() => null);
    const tipo = body?.detail?.tipo;
    if (tipo === 'sin_stock') throw new Error('sin-stock');
    if (tipo === 'producto_inactivo') throw new Error('producto-inactivo');
    throw new Error('conflicto');
  }
  if (res.status === 403) {
    const body = await res.json().catch(() => null);
    const tipo = body?.detail?.tipo;
    if (tipo === 'moroso') throw new Error('moroso');
    if (tipo === 'suspendido') throw new Error('suspendido');
    throw new Error('no-autorizado');
  }
  if (!res.ok) throw new Error('Error al comprar el producto');
  return res.json();
}

export async function comprarProducto(idProducto, idSocio, cantidad) {
  const res = await fetchTo('/api/v1/compras', 'POST', { id_producto: idProducto, id_socio: idSocio, cantidad });
  return manejarRespuestaCompra(res);
}

export async function getComprasPorSocio(idSocio) {
  const res = await fetchTo(`/api/v1/compras/socio/${encodeURIComponent(idSocio)}`, 'GET');
  if (res.status >= 500) throw new Error('servicio-no-disponible');
  if (!res.ok) throw new Error('Error al obtener tus compras');
  return res.json();
}