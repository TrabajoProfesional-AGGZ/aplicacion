import { useState } from 'react';
import { ModalOverlay } from '../../components/createForm/ModalOverlay';
import { resetPassword } from '../../utils/authService';
import { MAX_LEN, validarCredencialSegura } from '../../utils/formValidators';
import logoSocio from '../../assets/logo_socio.png';

export function RecuperarContraseniaModal({ onClose }) {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);

  const manejarSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const emailLimpio = email.trim();
    const errorEmail = validarCredencialSegura(emailLimpio, MAX_LEN.EMAIL);
    if (errorEmail) {
      setError(errorEmail);
      return;
    }

    setEnviando(true);
    try {
      await resetPassword(emailLimpio);
    } catch {

    } finally {
      setEnviando(false);
      setEnviado(true);
    }
  };

  return (
    <ModalOverlay onClose={onClose}>
      <div className="csf-outer-card">
        <div className="csf-header">
          <div className="csf-success-logo-circle" style={{ margin: '0 auto 12px' }}>
            <img src={logoSocio} alt="SocioUnido" className="csf-success-logo" />
          </div>
          <h1>Recuperar contraseña</h1>
          {!enviado && <p>Ingresá tu email y te enviamos un mail para restablecerla.</p>}
        </div>

        <div className="csf-card">
          {enviado ? (
            <div className="csf-success">
              <p style={{ fontSize: '1.15rem' }}>
                Si el email ingresado tiene una cuenta, te enviamos un mail para restablecer tu
                contraseña. Si no lo encontrás, revisá la casilla de SPAM.
              </p>
              <div className="csf-nav csf-nav--end">
                <button type="button" className="csf-btn-submit" onClick={onClose}>
                  Cerrar
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={manejarSubmit}>
              <div className="csf-fields">
                <div className="csf-field">
                  <label className="csf-label" htmlFor="recuperar-email">Email</label>
                  <input
                    id="recuperar-email"
                    type="email"
                    className={`csf-input${error ? ' csf-input--error' : ''}`}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    maxLength={MAX_LEN.EMAIL}
                    required
                  />
                  {error && <p className="csf-error">{error}</p>}
                </div>
              </div>

              <div className="csf-nav csf-nav--between">
                <button type="button" className="csf-btn-back" onClick={onClose}>
                  Cancelar
                </button>
                <button type="submit" className="csf-btn-submit" disabled={enviando}>
                  {enviando ? 'Enviando...' : 'Recuperar contraseña'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </ModalOverlay>
  );
}
