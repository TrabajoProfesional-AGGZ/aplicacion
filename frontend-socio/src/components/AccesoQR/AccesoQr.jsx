import { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { generateSecret } from 'otplib';


const AccesoQR = () => {
  const [qrData, setQrData] = useState('');

  useEffect(() => {
    const socioId = localStorage.getItem('socio_id');
    const secreto = localStorage.getItem('socio_totp_secret');

    if (!socioId || !secreto) return;

    const generarQR = () => {
      const token = generateSecret(secreto);
      setQrData(`${socioId}|${token}`);
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
    />
  );
};

export default AccesoQR;