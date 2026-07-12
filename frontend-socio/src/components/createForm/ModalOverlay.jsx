import PropTypes from 'prop-types';
import './CreateSocioForm.css';

export function ModalOverlay({ onClose, wrapperClass, children }) {
  return (
    <div
      className="csf-overlay"
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      onKeyDown={(e) => {
        if (e.target === e.currentTarget && (e.key === 'Escape' || e.key === 'Enter')) onClose();
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
