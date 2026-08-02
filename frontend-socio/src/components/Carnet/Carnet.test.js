import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Carnet } from './Carnet';
import { enrolarYGuardarSecreto } from '../../services/accesosService';

jest.mock('../AccesoQR/AccesoQr', () => {
  return function MockAccesoQR() {
    return <div data-testid="mock-acceso-qr" />;
  };
});

jest.mock('../../services/accesosService', () => ({
  enrolarYGuardarSecreto: jest.fn(),
}));

describe('Carnet', () => {
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
});