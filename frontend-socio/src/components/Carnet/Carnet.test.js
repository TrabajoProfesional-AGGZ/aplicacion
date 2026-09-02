import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
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

  test('sin socio.id no muestra el botón de recargar QR', () => {
    render(<Carnet socio={{ nombre: 'Lautaro Ghosn', nro_socio: '12345' }} />);
    expect(screen.queryByRole('button', { name: /recargar qr/i })).not.toBeInTheDocument();
  });

  describe('recargar QR', () => {
    const socioMock = { id: 'socio-1', nombre: 'Lautaro Ghosn', nro_socio: '12345' };

    beforeEach(() => {
      enrolarYGuardarSecreto.mockClear();
    });

    test('pide un secreto nuevo y remonta AccesoQR al tener éxito', async () => {
      enrolarYGuardarSecreto.mockResolvedValueOnce('SECRETO_NUEVO');

      render(<Carnet socio={socioMock} />);
      fireEvent.click(screen.getByRole('button', { name: /recargar qr/i }));

      expect(screen.getByRole('button', { name: /recargando/i })).toBeDisabled();

      await waitFor(() => {
        expect(enrolarYGuardarSecreto).toHaveBeenCalledWith(socioMock);
      });

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /recargar qr/i })).not.toBeDisabled();
      });
      expect(screen.queryByText(/no se pudo recargar/i)).not.toBeInTheDocument();
    });

    test('muestra un error si el servicio no devuelve un secreto válido', async () => {
      enrolarYGuardarSecreto.mockResolvedValueOnce(null);

      render(<Carnet socio={socioMock} />);
      fireEvent.click(screen.getByRole('button', { name: /recargar qr/i }));

      expect(await screen.findByText(/no se pudo recargar el qr/i)).toBeInTheDocument();
    });

    test('muestra un error si el pedido de enrolamiento falla', async () => {
      enrolarYGuardarSecreto.mockRejectedValueOnce(new Error('network error'));

      render(<Carnet socio={socioMock} />);
      fireEvent.click(screen.getByRole('button', { name: /recargar qr/i }));

      expect(await screen.findByText(/no se pudo recargar el qr/i)).toBeInTheDocument();
    });
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

    test('"Recargar QR" limpia un resultado ya mostrado', async () => {
      obtenerUltimoAcceso.mockResolvedValue({
        id: 1,
        aprobado: false,
        mensaje: 'Código QR inválido o expirado',
        creado_en: new Date(Date.now() + 1000).toISOString(),
      });
      enrolarYGuardarSecreto.mockResolvedValue('SECRETO_NUEVO');

      render(<Carnet socio={socioMock} />);

      await act(async () => {
        jest.advanceTimersByTime(2000);
        await Promise.resolve();
        await Promise.resolve();
      });

      expect(screen.getByText('Código QR inválido o expirado')).toBeInTheDocument();

      fireEvent.click(screen.getByRole('button', { name: /recargar qr/i }));

      await waitFor(() => {
        expect(screen.queryByText('Código QR inválido o expirado')).not.toBeInTheDocument();
      });
    });
  });
});