import { initMercadoPago } from '@mercadopago/sdk-react';

let inicializado = false;
/** Inicializa el SDK de Mercado Pago una sola vez por carga de página. */
export function inicializarMercadoPago() {
  if (inicializado) return;
  const publicKey = import.meta.env.VITE_MP_PUBLIC_KEY || import.meta.env.VITE_MP_PUBLIC_KEY_TEST;
  initMercadoPago(publicKey, { locale: 'es-AR' });
  inicializado = true;
}
