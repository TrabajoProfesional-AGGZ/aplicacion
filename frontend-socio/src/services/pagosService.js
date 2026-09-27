import { fetchTo } from '../utils/utils';

export async function procesarPago(formData, id_item, tipoItem) {
  const res = await fetchTo('/api/v1/pagos/procesar', 'POST', { ...formData, id_item: id_item, tipo_item: tipoItem });
  if (!res.ok) {
    throw new Error('pago-fallido');
  }
  return res.json();
}

export async function crearPreferenciaPago(item, tipoItem) {
  const payload = {
    id_item: item.id,
    tipo_item: tipoItem,
    titulo: item.concepto,
    precio_unitario: Number(item.monto),
    cantidad: item.cantidad || 1
  };

  const res = await fetchTo('/api/v1/pagos/preferencia', 'POST', payload);
  
  if (!res.ok) {
    throw new Error('error-al-crear-preferencia');
  }
  
  return res.json();
}