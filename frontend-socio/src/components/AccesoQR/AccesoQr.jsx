import { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import * as OTPAuth from 'otpauth';

const AccesoQR = () => {
  const [qrData, setQrData] = useState('');

  useEffect(() => {
    const socioId = localStorage.getItem('socio_id');
    const secreto = localStorage.getItem('socio_totp_secret');

    if (!socioId || !secreto) return;

    try {
      const generadorTotp = new OTPAuth.TOTP({
        issuer: 'SocioUnido',
        label: 'AccesoSocio',
        algorithm: 'SHA1',
        digits: 6,
        period: 30,
        secret: OTPAuth.Secret.fromBase32(secreto)
      });

      const generarQR = () => {
        try {
          const token = generadorTotp.generate();
          setQrData(`${socioId}|${token}`);
        } catch (err) {
          console.error('Error al generar TOTP token:', err);
        }
      };

      generarQR();
      const intervalo = setInterval(generarQR, 1000);
      return () => clearInterval(intervalo);
    } catch (err) {
      console.error('Secreto TOTP inválido o corrupto:', err);
    }
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