import { initMercadoPago } from '@mercadopago/sdk-react';

let inicializado = false;
export function inicializarMercadoPago() {
  if (inicializado) return;
  initMercadoPago(import.meta.env.VITE_MP_PUBLIC_KEY_TEST, { locale: 'es-AR' });
  inicializado = true;
}
