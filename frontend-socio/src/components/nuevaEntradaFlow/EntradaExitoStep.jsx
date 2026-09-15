import { CheckCircle2 } from 'lucide-react';
import './EntradaExitoStep.css';

/** Pantalla de confirmación para la compra de una entrada gratuita (sin paso de pago). */
export function EntradaExitoStep({ nombreEvento, onVerEntradas }) {
  return (
    <section className="entrada-exito">
      <CheckCircle2 size={40} color="var(--status-success-border)" />
      <h2 className="entrada-exito-titulo">¡Entrada confirmada!</h2>
      <p className="entrada-exito-texto">
        Tu entrada para {nombreEvento} es gratuita y ya quedó confirmada. No hace falta ningún pago.
      </p>
      {onVerEntradas && (
        <button type="button" className="csf-btn-submit" onClick={onVerEntradas}>
          Ver mis entradas
        </button>
      )}
    </section>
  );
}
