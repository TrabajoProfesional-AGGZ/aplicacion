import { CheckCircle2, XCircle, Clock } from 'lucide-react';
import { PageHeader } from '../PageHeader/PageHeader';
import './PagoResultado.css';

const CONFIG_RESULTADO = {
  approved: {
    clase: 'approved',
    tono: 'success',
    icon: CheckCircle2,
    titulo: '¡Pago aprobado!',
    desc: '¡Tu pago se acreditó correctamente!'
  },
  rejected: {
    clase: 'rejected',
    tono: 'danger',
    icon: XCircle,
    titulo: 'Pago rechazado',
    desc: 'Tuvimos un problema al procesar tu pago. Por favor, intentá con otro medio de pago.'
  },
  pending: {
    clase: 'pending',
    tono: 'warning',
    icon: Clock,
    titulo: 'Pago pendiente',
    desc: 'Tu pago está en revisión o a la espera de acreditación. Te avisaremos cuando se confirme.'
  },
  // Por si el usuario cancela y vuelve atrás sin pagar (estado null)
  default: {
    clase: 'rejected',
    tono: 'danger',
    icon: XCircle,
    titulo: 'Pago cancelado',
    desc: 'Cancelaste el proceso de pago antes de completarlo.'
  }
};

/** Pantalla de resultado de un pago (aprobado, rechazado, pendiente o cancelado). */
export function PagoResultado({ status, onVolver }) {
  // Evaluamos el estado que manda Mercado Pago. Si no es uno de los 3 oficiales, cae en default.
  const config = CONFIG_RESULTADO[status] || CONFIG_RESULTADO.default;
  const Icono = config.icon;

  return (
    <div className="pago-resultado-container">
      <PageHeader variant="hero" tono={config.tono}>
        <div className={`pago-resultado-card pago-resultado-card--${config.clase}`}>
          <div className="pago-resultado-content">
            <div className="pago-resultado-icon">
              <Icono size={32} strokeWidth={2.5} />
            </div>
            <h2 className="pago-resultado-title">{config.titulo}</h2>
            <p className="pago-resultado-desc">{config.desc}</p>
          </div>

          <button
            type="button"
            className="pago-resultado-btn"
            onClick={onVolver}
          >
            Volver al inicio
          </button>
        </div>
      </PageHeader>
    </div>
  );
}