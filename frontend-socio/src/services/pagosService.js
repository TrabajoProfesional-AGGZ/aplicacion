import { fetchTo } from '../utils/utils';

export async function procesarPago(formData, id_item, tipoItem) {
  const res = await fetchTo('/api/v1/pagos/procesar', 'POST', { ...formData, id_item: id_item, tipo_item: tipoItem });
  if (!res.ok) {
    const detalle = await res.json().catch(() => null);
    console.error('procesarPago: respuesta no ok', res.status, detalle);
    throw new Error('pago-fallido');
  }
  return res.json();
}
