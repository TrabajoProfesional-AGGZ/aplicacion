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