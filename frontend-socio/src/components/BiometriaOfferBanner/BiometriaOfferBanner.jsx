import { useState } from 'react';
import { Fingerprint } from 'lucide-react';
import { useBiometricLogin } from '../../hooks/useBiometricLogin';
import './BiometriaOfferBanner.css';

/**
 * Ofrece activar el login biométrico justo después de un login manual
 * exitoso, mientras el email/password recién tipeados todavía están
 * disponibles (`credencial`). Se muestra solo si el dispositivo soporta un
 * platform authenticator y todavía no hay una credencial enrolada.
 */
export function BiometriaOfferBanner({ credencial, onDescartar }) {
  const { soportado, enrolado, ofrecerEnrolamiento } = useBiometricLogin();
  const [error, setError] = useState('');

  if (!credencial || !soportado || enrolado) return null;

  const activar = async () => {
    setError('');
    try {
      await ofrecerEnrolamiento(credencial.email, credencial.password);
      onDescartar();
    } catch {
      setError('No se pudo activar la biometría. Podés intentarlo de nuevo desde tu perfil.');
    }
  };

  return (
    <div className="biometria-offer-banner">
      <Fingerprint size={20} aria-hidden="true" />
      <div className="biometria-offer-texto">
        <p>¿Querés activar el inicio de sesión con huella o Face ID en este dispositivo?</p>
        {error && <p className="biometria-offer-error">{error}</p>}
      </div>
      <div className="biometria-offer-acciones">
        <button type="button" onClick={activar} className="biometria-offer-btn biometria-offer-btn--activar">
          Activar
        </button>
        <button type="button" onClick={onDescartar} className="biometria-offer-btn biometria-offer-btn--descartar">
          Ahora no
        </button>
      </div>
    </div>
  );
}
