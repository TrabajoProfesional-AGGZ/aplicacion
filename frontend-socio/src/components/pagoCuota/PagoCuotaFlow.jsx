import { useState, useEffect } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Wallet } from '@mercadopago/sdk-react';
import { inicializarMercadoPago } from '../../utils/mercadopago';
import { crearPreferenciaPago } from '../../services/pagosService';
import './PagoCuotaFlow.css';

function formatearPrecio(monto) {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(monto);
}

/**
 * Flujo de pago genérico (cuota, reserva, entrada o compra): crea la
 * preferencia de pago en el backend y renderiza el botón de Mercado Pago (Wallet Brick).
 */
export function PagoCuotaFlow({ item, tipoItem, socio, onVolver }) {
  const [preferenceId, setPreferenceId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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
        {loading && <p className="pago-flow-loading">Cargando pasarela de pago segura...</p>}
        {error && <p className="pago-flow-error">{error}</p>}

        {preferenceId && (
          <Wallet 
            initialization={{ 
              preferenceId: preferenceId,
              // 'self' redirige en la misma pestaña. Para móviles es más nativo.
              redirectMode: 'self' 
            }} 
            customization={{ 
              texts: { valueProp: 'smart_option' } // "Paga con Mercado Pago"
            }} 
          />
        )}
      </div>
    </div>
  );
}