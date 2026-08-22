import { ModalOverlay } from '../createForm/ModalOverlay';

/** Modal placeholder para funciones aún no implementadas. */
export function ProximamenteOverlay({ titulo, onClose }) {
  return (
    <ModalOverlay onClose={onClose} wrapperClass="proximamente-wrapper">
      <div className="proximamente-card">
        <p className="proximamente-titulo">{titulo}</p>
        <p className="proximamente-texto">Próximamente...</p>
        <button type="button" className="proximamente-cerrar" onClick={onClose}>Cerrar</button>
      </div>
    </ModalOverlay>
  );
}
