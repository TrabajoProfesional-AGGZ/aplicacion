import { useEffect } from 'react';
import PropTypes from 'prop-types';
import { useModalHistory } from '../../hooks/useModalHistory';
import './ModalOverlay.css';

export function ModalOverlay({ onClose, wrapperClass, children }) {
  useModalHistory(onClose);

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
      <div className={['csf-wrapper', wrapperClass].filter(Boolean).join(' ')}>
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
