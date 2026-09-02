import { fetchTo } from '../utils/utils';

export async function procesarPago(formData, id_item, tipoItem) {
  const res = await fetchTo('/api/v1/pagos/procesar', 'POST', { ...formData, id_item: id_item, tipo_item: tipoItem });
  if (!res.ok) {
    throw new Error('pago-fallido');
  }
  return res.json();
}

/**
 * Pago simulado (rama demo): marca el item como pagado directamente en el
 * backend, sin pasar por Mercado Pago.
 */
export async function marcarPagoDemo(idItem, tipoItem) {
  const payload = {
    id_item: idItem,
    tipo_item: tipoItem,
    demo_secreto: import.meta.env.VITE_DEMO_PAGO_SECRET,
  };

  const res = await fetchTo('/api/v1/demo/marcar-pagado', 'POST', payload);

  if (!res.ok) {
    throw new Error('pago-demo-fallido');
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