import './RechazoAcciones.css';

/**
 * Botón de acción directa dentro de una caja de error de rechazo (reserva,
 * inscripción, entrada, compra): "Ir a pagar" si el rechazo fue por
 * morosidad propia, "Ir a mis trámites" si fue por falta de un trámite
 * (ej. apto médico). Si `motivo` es `null` (rechazo por otro socio en una
 * reserva compartida, o un motivo sin acción directa) no renderiza nada.
 */
export function RechazoAcciones({ motivo, onIrAPagar, onIrATramites }) {
  if (motivo === 'moroso' && onIrAPagar) {
    return (
      <button type="button" className="rechazo-acciones-btn" onClick={onIrAPagar}>
        Ir a pagar
      </button>
    );
  }
  if (motivo === 'tramite' && onIrATramites) {
    return (
      <button type="button" className="rechazo-acciones-btn" onClick={onIrATramites}>
        Ir a mis trámites
      </button>
    );
  }
  return null;
}
