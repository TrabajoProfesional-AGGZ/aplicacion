import { render, screen, act } from '@testing-library/react';
import AccesoQR from './AccesoQr'; 
// import * as OTPAuth from 'otpauth';

const mockGenerate = jest.fn(() => 'TOKEN123');

jest.mock('otpauth', () => ({
  TOTP: jest.fn().mockImplementation(() => ({
    generate: mockGenerate
  })),
  Secret: {
    fromBase32: jest.fn()
  }
}), { virtual: true });

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

  test('actualiza el código QR usando generate en cada intervalo', () => {
    localStorage.setItem('socio_id', '855c1d5e-8a3d');
    localStorage.setItem('socio_totp_secret', 'SECRETO_PRUEBA');

    render(<AccesoQR />);

    mockGenerate.mockClear();

    act(() => {
      jest.advanceTimersByTime(1000);
    });

    expect(mockGenerate).toHaveBeenCalledTimes(1);
  });

  test('no crashea si el secreto guardado es inválido/corrupto (Base32 malformado)', () => {
    const OTPAuth = jest.requireMock('otpauth');
    OTPAuth.Secret.fromBase32.mockImplementationOnce(() => {
      throw new Error('secreto invalido');
    });

    localStorage.setItem('socio_id', '855c1d5e-8a3d');
    localStorage.setItem('socio_totp_secret', 'NO-BASE32!!');

    expect(() => render(<AccesoQR />)).not.toThrow();
    expect(screen.getByText('Cargando pase seguro...')).toBeInTheDocument();
  });

  test('no crashea si generate() lanza una excepción en un tick', () => {
    localStorage.setItem('socio_id', '855c1d5e-8a3d');
    localStorage.setItem('socio_totp_secret', 'SECRETO_PRUEBA');

    render(<AccesoQR />);

    mockGenerate.mockImplementationOnce(() => {
      throw new Error('fallo de generación');
    });

    expect(() => act(() => {
      jest.advanceTimersByTime(1000);
    })).not.toThrow();
  });
});