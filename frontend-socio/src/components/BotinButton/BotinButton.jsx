import { useState } from 'react';
import { ModalOverlay } from '../createForm/ModalOverlay';
import botinIcon from '../../assets/botin-icon.png';
import './BotinButton.css';

const TELEGRAM_BOT_URL = 'https://t.me/sociounido_bot';

export function BotinButton() {
  const [mostrarConfirmacion, setMostrarConfirmacion] = useState(false);

  const irAlChat = () => {
    window.open(TELEGRAM_BOT_URL, '_blank', 'noopener,noreferrer');
    setMostrarConfirmacion(false);
  };

  return (
    <>
      <button
        type="button"
        className="botin-fab"
        aria-label="Chatear con BotIn"
        onClick={() => setMostrarConfirmacion(true)}
      >
        <img src={botinIcon} alt="" />
      </button>

      {mostrarConfirmacion && (
        <ModalOverlay onClose={() => setMostrarConfirmacion(false)} wrapperClass="botin-wrapper">
          <div className="csf-outer-card botin-card">
            <div className="csf-header">
              <h1>Iniciar chat con BotIn?</h1>
            </div>
            <div className="csf-nav csf-nav--between">
              <button type="button" className="csf-btn-back" onClick={() => setMostrarConfirmacion(false)}>
                Cancelar
              </button>
              <button type="button" className="csf-btn-submit" onClick={irAlChat}>
                Ir al chat
              </button>
            </div>
          </div>
        </ModalOverlay>
      )}
    </>
  );
}
