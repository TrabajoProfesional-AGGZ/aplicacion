import { motion } from 'framer-motion';
import { SPRING } from '../../styles/motion';
import './SegmentedControl.css';

/**
 * Control segmentado accesible (radiogroup) con indicador animado que se
 * desplaza entre opciones vía `layoutId` compartido.
 */
export function SegmentedControl({ opciones, valor, onChange, ariaLabel, denso = false }) {
  return (
    <div
      className={`segmented-control${denso ? ' segmented-control--denso' : ''}`}
      role="radiogroup"
      aria-label={ariaLabel}
    >
      {opciones.map((opcion) => {
        const activo = opcion.id === valor;
        return (
          <button
            key={opcion.id}
            type="button"
            role="radio"
            aria-checked={activo}
            className={`segmented-control-opcion${activo ? ' segmented-control-opcion--activa' : ''}`}
            onClick={() => onChange(opcion.id)}
          >
            {activo && (
              <motion.span
                layoutId={`${ariaLabel}-indicador`}
                className="segmented-control-indicador"
                transition={SPRING.quick}
              />
            )}
            <span className="segmented-control-label">{opcion.label}</span>
          </button>
        );
      })}
    </div>
  );
}
