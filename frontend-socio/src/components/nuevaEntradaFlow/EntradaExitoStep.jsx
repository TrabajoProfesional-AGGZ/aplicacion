import { CheckCircle2 } from 'lucide-react';
import './EntradaExitoStep.css';

export function EntradaExitoStep({ nombreEvento }) {
  return (
    <section className="entrada-exito">
      <CheckCircle2 size={40} color="var(--status-success-border)" />
      <h2 className="entrada-exito-titulo">¡Entrada confirmada!</h2>
      <p className="entrada-exito-texto">
        Tu entrada para {nombreEvento} es gratuita y ya quedó confirmada. No hace falta ningún pago.
      </p>
    </section>
  );
}
