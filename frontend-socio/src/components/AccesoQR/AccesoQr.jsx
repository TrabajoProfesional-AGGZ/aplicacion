import { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import * as OTPAuth from 'otpauth';

/**
 * Genera un código QR de acceso al club a partir de un token TOTP, regenerado
 * cada segundo, enteramente client-side (funciona sin conexión).
 */
const AccesoQR = () => {
  const [qrData, setQrData] = useState('');

  useEffect(() => {
    // El secreto TOTP se guarda de forma asíncrona (recién al loguearse), así que
    // el chequeo va dentro de cada tick del intervalo en vez de una sola vez al
    // montar: si el socio entra antes de que el secreto exista, el próximo tick
    // lo toma solo, sin necesitar "Recargar QR".
    let generadorTotp = null;
    let socioIdActual = null;

    const generarQR = () => {
      if (!generadorTotp) {
        socioIdActual = localStorage.getItem('socio_id');
        const secreto = localStorage.getItem('socio_totp_secret');
        if (!socioIdActual || !secreto) return;

        try {
          generadorTotp = new OTPAuth.TOTP({
            issuer: 'SocioUnido',
            label: 'AccesoSocio',
            algorithm: 'SHA1',
            digits: 6,
            period: 30,
            secret: OTPAuth.Secret.fromBase32(secreto)
          });
        } catch (err) {
          console.error('Secreto TOTP inválido o corrupto:', err);
          generadorTotp = null;
          return;
        }
      }

      try {
        const token = generadorTotp.generate();
        setQrData(`${socioIdActual}|${token}`);
      } catch (err) {
        console.error('Error al generar TOTP token:', err);
      }
    };

    generarQR();
    const intervalo = setInterval(generarQR, 1000);
    return () => clearInterval(intervalo);
  }, []);

  if (!qrData) {
    return <div className="qr-skeleton">Cargando pase seguro...</div>;
  }

  return (
    <QRCodeSVG
      value={qrData}
      size={220}
      level="H"
      style={{ display: 'block' }}
      role="img"
      aria-label="Código QR de acceso al club"
    />
  );
};

export default AccesoQR;