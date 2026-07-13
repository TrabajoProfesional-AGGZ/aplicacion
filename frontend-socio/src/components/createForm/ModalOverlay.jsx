import { useEffect } from 'react';
import PropTypes from 'prop-types';
import './ModalOverlay.css';

export function ModalOverlay({ onClose, wrapperClass, children }) {
  // Un <div> sin tabIndex nunca es el elemento con foco, así que un onKeyDown
  // en él jamás recibe una tecla Escape real del usuario (el evento nace en
  // el elemento enfocado, no acá). Por eso Escape se escucha a nivel document,
  // con cleanup al desmontar para no acumular listeners entre modales.
  useEffect(() => {
    const manejarTecla = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', manejarTecla);
    return () => document.removeEventListener('keydown', manejarTecla);
  }, [onClose]);

  return (
    <div
      className="csf-overlay"
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className={`csf-wrapper${wrapperClass ? ` ${wrapperClass}` : ''}`}>
        {children}
      </div>
    </div>
  );
}

ModalOverlay.propTypes = {
  onClose: PropTypes.func.isRequired,
  wrapperClass: PropTypes.string,
  children: PropTypes.node.isRequired,
};
