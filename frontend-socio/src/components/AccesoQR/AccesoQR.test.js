import { render, screen, act } from '@testing-library/react';
import AccesoQR from './AccesoQr'; 
import { generateSecret } from 'otplib';

jest.mock('otplib', () => ({
  generateSecret: jest.fn(() => 'TOKEN123')
}));

jest.mock('qrcode.react', () => ({
  QRCodeSVG: ({ value }) => <div data-testid="qr-mock">{value}</div>
}));

describe('AccesoQR', () => {
  beforeEach(() => {
    localStorage.clear();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('muestra el skeleton si no hay datos en localStorage', () => {
    render(<AccesoQR />);
    
    expect(screen.getByText('Cargando pase seguro...')).toBeInTheDocument();
    expect(screen.queryByTestId('qr-mock')).not.toBeInTheDocument();
  });

  test('renderiza el QR con el formato "socioId|token" si hay datos locales', () => {
    localStorage.setItem('socio_id', '855c1d5e-8a3d');
    localStorage.setItem('socio_totp_secret', 'SECRETO_PRUEBA');

    render(<AccesoQR />);
    
    expect(screen.getByTestId('qr-mock')).toHaveTextContent('855c1d5e-8a3d|TOKEN123');
    expect(screen.queryByText('Cargando pase seguro...')).not.toBeInTheDocument();
  });

  test('actualiza el código QR usando generateSecret en cada intervalo', () => {
    localStorage.setItem('socio_id', '855c1d5e-8a3d');
    localStorage.setItem('socio_totp_secret', 'SECRETO_PRUEBA');

    render(<AccesoQR />);
    
    generateSecret.mockClear();

    act(() => {
      jest.advanceTimersByTime(1000);
    });

    expect(generateSecret).toHaveBeenCalledTimes(1);
  });
});