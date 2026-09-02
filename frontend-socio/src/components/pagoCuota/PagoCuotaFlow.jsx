import { useState } from 'react';
import { ArrowLeft, CheckCircle2 } from 'lucide-react';
import { marcarPagoDemo } from '../../services/pagosService';
import './PagoCuotaFlow.css';

// --- Implementación real de Mercado Pago (comentada en la rama `demo`) ---
// esta rama reemplaza el botón de pago real por uno que marca el item como
// pagado directo contra el backend (POST /api/v1/demo/marcar-pagado), para
// poder testear con usuarios reales sin pasarles credenciales de Mercado Pago.
// No borrar — descomentar + revertir el componente de abajo al mergear a main.
//
// import { useEffect } from 'react';
// import { Wallet } from '@mercadopago/sdk-react';
// import { inicializarMercadoPago } from '../../utils/mercadopago';
// import { crearPreferenciaPago } from '../../services/pagosService';

function formatearPrecio(monto) {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(monto);
}

/**
 * Flujo de pago genérico (cuota, reserva, entrada o compra).
 *
 * Rama `demo`: en vez de crear una preferencia de Mercado Pago y renderizar
 * el Wallet Brick, el botón "Pagar" marca el item como pagado directamente
 * vía `marcarPagoDemo` (ver pagosService.js) — no hay pasarela de pago real.
 */
export function PagoCuotaFlow({ item, tipoItem, socio, onVolver }) {
  const [estado, setEstado] = useState('idle'); // idle | procesando | exito | error
  const [error, setError] = useState('');

  /* --- Implementación real de Mercado Pago (comentada, rama demo) ---
  const [preferenceId, setPreferenceId] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    inicializarMercadoPago();

    let cancelled = false;
    setLoading(true);
    setError('');

    crearPreferenciaPago(item, tipoItem)
      .then((data) => {
        if (!cancelled) {
          setPreferenceId(data.id_preferencia);
        }
      })
      .catch((err) => {
        if (!cancelled) setError('No pudimos conectar con Mercado Pago. Intentá de nuevo más tarde.');
        console.error("Error al crear preferencia:", err);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [item, tipoItem]);
  */

  const handlePagar = () => {
    setEstado('procesando');
    setError('');
    marcarPagoDemo(item.id, tipoItem)
      .then(() => {
        setEstado('exito');
        setTimeout(onVolver, 1500);
      })
      .catch(() => {
        setEstado('error');
        setError('No pudimos registrar el pago de prueba. Intentá de nuevo.');
      });
  };

  return (
    <div className="pago-flow-container">
      <div className="pago-flow-header">
        <button
          type="button"
          className="pago-flow-volver-btn"
          onClick={onVolver}
          aria-label="Volver atrás"
        >
          <ArrowLeft size={20} /> Volver
        </button>
      </div>

      <div className="pago-flow-resumen">
        <h2 className="pago-flow-titulo">Abonar {item.concepto}</h2>
        <p className="pago-flow-monto">
          Total a pagar: <span>{formatearPrecio(item.monto)}</span>
        </p>
      </div>

      <div className="pago-flow-wallet-wrapper">
        {estado === 'error' && <p className="pago-flow-error">{error}</p>}

        {estado === 'exito' ? (
          <p className="pago-flow-exito">
            <CheckCircle2 size={20} /> ¡Pago registrado!
          </p>
        ) : (
          <button
            type="button"
            className="pago-flow-pagar-demo-btn"
            onClick={handlePagar}
            disabled={estado === 'procesando'}
          >
            {estado === 'procesando' ? 'Procesando...' : 'Pagar'}
          </button>
        )}
      </div>
    </div>
  );
}
