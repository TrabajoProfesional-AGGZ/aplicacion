import { render, screen, fireEvent, act } from '@testing-library/react';
import { Carnet } from './Carnet';
import { enrolarYGuardarSecreto, obtenerUltimoAcceso } from '../../services/accesosService';

jest.mock('../AccesoQR/AccesoQr', () => {
  return function MockAccesoQR() {
    return <div data-testid="mock-acceso-qr" />;
  };
});

jest.mock('../../services/accesosService', () => ({
  enrolarYGuardarSecreto: jest.fn(),
  obtenerUltimoAcceso: jest.fn(),
}));

describe('Carnet', () => {
  beforeEach(() => {
    obtenerUltimoAcceso.mockReset();
    obtenerUltimoAcceso.mockResolvedValue(null);
    enrolarYGuardarSecreto.mockReset();
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  test('renderiza la estructura básica de la credencial', () => {
    render(<Carnet socio={null} />);
    
    expect(screen.getByText('Mi Pase de Acceso')).toBeInTheDocument();
    expect(screen.getByText('Mostrá este código para ingresar')).toBeInTheDocument();
    expect(screen.getByText('SOCIOUNIDO')).toBeInTheDocument();
    expect(screen.getByTestId('mock-acceso-qr')).toBeInTheDocument();
  });

  test('muestra los datos del socio correctamente cuando están disponibles', () => {
    const socioMock = {
      nombre: 'Lautaro Ghosn',
      nro_socio: '12345'
    };

    render(<Carnet socio={socioMock} />);

    expect(screen.getByText('Lautaro Ghosn')).toBeInTheDocument();
    expect(screen.getByText('#12345')).toBeInTheDocument();
  });

  test('muestra nombre y apellido juntos, no solo el nombre', () => {
    const socioMock = {
      nombre: 'Lautaro',
      apellido: 'Ghosn',
      nro_socio: '12345'
    };

    render(<Carnet socio={socioMock} />);

    expect(screen.getByText('Lautaro Ghosn')).toBeInTheDocument();
  });

  test('muestra guiones ("---") como fallback si faltan los datos del socio', () => {
    render(<Carnet socio={{}} />);

    expect(screen.getByText('---')).toBeInTheDocument();

    expect(screen.getByText('#---')).toBeInTheDocument();
  });

  describe('feedback de acceso (polling)', () => {
    const socioMock = { id: 'socio-1', nombre: 'Lautaro Ghosn', nro_socio: '12345' };

    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    test('aparece overlay verde cuando el polling detecta un acceso aprobado', async () => {
      obtenerUltimoAcceso.mockResolvedValue({
        id: 1,
        aprobado: true,
        mensaje: 'Acceso permitido. Molinete liberado.',
        nombre: 'Lautaro Ghosn',
        creado_en: new Date(Date.now() + 1000).toISOString(),
      });
      enrolarYGuardarSecreto.mockResolvedValue('SECRETO_NUEVO');

      render(<Carnet socio={socioMock} />);

      await act(async () => {
        jest.advanceTimersByTime(2000);
        await Promise.resolve();
        await Promise.resolve();
      });

      expect(screen.getByText('Acceso permitido. Molinete liberado.')).toBeInTheDocument();
      expect(screen.getByRole('status')).toHaveClass('carnet-resultado-overlay--exito');
    });

    test('aparece overlay rojo cuando el polling detecta un acceso rechazado', async () => {
      obtenerUltimoAcceso.mockResolvedValue({
        id: 1,
        aprobado: false,
        mensaje: 'Código QR inválido o expirado',
        estado_financiero: 'Moroso',
        creado_en: new Date(Date.now() + 1000).toISOString(),
      });

      render(<Carnet socio={socioMock} />);

      await act(async () => {
        jest.advanceTimersByTime(2000);
        await Promise.resolve();
        await Promise.resolve();
      });

      expect(screen.getByText('Código QR inválido o expirado')).toBeInTheDocument();
      expect(screen.getByText('Estado financiero: Moroso')).toBeInTheDocument();
      expect(screen.getByRole('status')).toHaveClass('carnet-resultado-overlay--error');
    });

    test('"Ok" descarta el resultado y no reaparece con el mismo id', async () => {
      obtenerUltimoAcceso.mockResolvedValue({
        id: 1,
        aprobado: false,
        mensaje: 'Código QR inválido o expirado',
        creado_en: new Date(Date.now() + 1000).toISOString(),
      });

      render(<Carnet socio={socioMock} />);

      await act(async () => {
        jest.advanceTimersByTime(2000);
        await Promise.resolve();
        await Promise.resolve();
      });

      fireEvent.click(screen.getByRole('button', { name: /ok/i }));
      expect(screen.queryByText('Código QR inválido o expirado')).not.toBeInTheDocument();

      await act(async () => {
        jest.advanceTimersByTime(2000);
        await Promise.resolve();
        await Promise.resolve();
      });

      expect(screen.queryByText('Código QR inválido o expirado')).not.toBeInTheDocument();
    });

    test('ignora un resultado con creado_en anterior al momento de apertura', async () => {
      obtenerUltimoAcceso.mockResolvedValue({
        id: 1,
        aprobado: true,
        mensaje: 'Acceso permitido. Molinete liberado.',
        creado_en: new Date(Date.now() - 60000).toISOString(),
      });

      render(<Carnet socio={socioMock} />);

      await act(async () => {
        jest.advanceTimersByTime(2000);
        await Promise.resolve();
        await Promise.resolve();
      });

      expect(screen.queryByText('Acceso permitido. Molinete liberado.')).not.toBeInTheDocument();
    });

    test('no hace polling si el dispositivo está offline', async () => {
      Object.defineProperty(navigator, 'onLine', { configurable: true, value: false });

      render(<Carnet socio={socioMock} />);

      await act(async () => {
        jest.advanceTimersByTime(2000);
        await Promise.resolve();
      });

      expect(obtenerUltimoAcceso).not.toHaveBeenCalled();

      Object.defineProperty(navigator, 'onLine', { configurable: true, value: true });
    });
  });

  describe('reintento automático de enrolamiento', () => {
    const socioMock = { id: 'socio-1', nombre: 'Lautaro Ghosn', nro_socio: '12345' };

    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    test('sin secreto en localStorage, reintenta el enrolamiento a los 2 s y a los 4 s', async () => {
      enrolarYGuardarSecreto.mockResolvedValue(null);

      render(<Carnet socio={socioMock} />);

      await act(async () => {
        jest.advanceTimersByTime(2000);
        await Promise.resolve();
      });
      expect(enrolarYGuardarSecreto).toHaveBeenCalledTimes(1);

      await act(async () => {
        jest.advanceTimersByTime(4000);
        await Promise.resolve();
      });
      expect(enrolarYGuardarSecreto).toHaveBeenCalledTimes(2);
    });

    test('sin secreto y offline, no llama al servicio y muestra el aviso', async () => {
      Object.defineProperty(navigator, 'onLine', { configurable: true, value: false });

      render(<Carnet socio={socioMock} />);

      await act(async () => {
        jest.advanceTimersByTime(2000);
        await Promise.resolve();
      });

      expect(enrolarYGuardarSecreto).not.toHaveBeenCalled();
      expect(screen.getByText('Sin conexión. El pase se activará al reconectar.')).toBeInTheDocument();

      Object.defineProperty(navigator, 'onLine', { configurable: true, value: true });
    });

    test('con secreto presente, no reintenta', async () => {
      localStorage.setItem('socio_totp_secret', 'SECRETO_EXISTENTE');

      render(<Carnet socio={socioMock} />);

      await act(async () => {
        jest.advanceTimersByTime(10000);
        await Promise.resolve();
      });

      expect(enrolarYGuardarSecreto).not.toHaveBeenCalled();
      expect(screen.queryByText(/sin conexión/i)).not.toBeInTheDocument();
    });
  });
});