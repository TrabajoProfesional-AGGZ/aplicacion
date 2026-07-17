import { useState } from 'react';
import { Payment, StatusScreen } from '@mercadopago/sdk-react';
import { ArrowLeft } from 'lucide-react';
import { inicializarMercadoPago } from '../../utils/mercadopago';
import { procesarPago } from '../../services/pagosService';
import './PagoCuotaFlow.css';

inicializarMercadoPago();

const MENSAJES_ERROR = {
  rechazado: 'El pago fue rechazado. Podés intentar con otro medio de pago.',
  procesamiento: 'Hubo un problema al procesar el pago. Probá de nuevo.',
  brick: 'No pudimos cargar el formulario de pago. Probá de nuevo.',
};

function formatearMonto(monto) {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(monto);
}

export function PagoCuotaFlow({ cuota, socio, onVolver }) {
  const [paso, setPaso] = useState('pago');
  const [idPago, setIdPago] = useState(null);
  const [errorPago, setErrorPago] = useState(null);

  const onSubmitPago = async ({ formData }) => {
    setErrorPago(null);
    try {
      const data = await procesarPago(formData, cuota.id);
      if (data.estado === 'approved' || data.estado === 'in_process') {
        setIdPago(String(data.id_pago));
        setPaso('resultado');
        return;
      }
      console.error('Pago rechazado por MercadoPago:', data.estado, data.estado_detalle);
      setErrorPago('rechazado');
    } catch (err) {
      console.error('Error al procesar el pago:', err);
      setErrorPago('procesamiento');
    }
    return Promise.reject();
  };

  return (
    <div className="pago-flow">
      {paso === 'pago' && (
        <>
          <button type="button" className="pago-volver-btn" onClick={onVolver} aria-label="Volver">
            <ArrowLeft size={18} />
            Volver
          </button>

          <div className="pago-resumen-card">
            <span>{cuota.concepto}</span>
            <span className="pago-resumen-monto">{formatearMonto(cuota.monto)}</span>
          </div>

          {errorPago && (
            <p className="pago-error" role="alert">{MENSAJES_ERROR[errorPago]}</p>
          )}

          <Payment
            initialization={{ amount: Number(cuota.monto), payer: { email: socio.email } }}
            customization={{ paymentMethods: { creditCard: 'all', debitCard: 'all' } }}
            onSubmit={onSubmitPago}
            onError={() => setErrorPago('brick')}
          />
        </>
      )}

      {paso === 'resultado' && (
        <>
          <StatusScreen initialization={{ paymentId: idPago }} onError={console.error} />
          <button type="button" className="pago-finalizar-btn" onClick={onVolver}>
            Volver a mis cuotas
          </button>
        </>
      )}
    </div>
  );
}
