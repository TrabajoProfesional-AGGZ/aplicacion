import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { FinanzasPage } from './FinanzasPage';
import { getEstadoFinanciero } from '../../services/finanzasService';

jest.mock('../../services/finanzasService', () => ({
  getEstadoFinanciero: jest.fn(),
}));

const socioFixture = { id: 'socio-1' };

describe('FinanzasPage', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test('muestra el logo animado de carga mientras llega la respuesta', () => {
    getEstadoFinanciero.mockReturnValue(new Promise(() => {}));
    render(<FinanzasPage socio={socioFixture} />);
    expect(screen.getByRole('status', { name: 'Cargando' })).toBeInTheDocument();
  });

  test('muestra el estado financiero, la deuda total y las cuotas', async () => {
    getEstadoFinanciero.mockResolvedValue({
      id_socio: 'socio-1',
      estado_financiero: 'Moroso',
      deuda_total: '1500.00',
      cuotas: [
        {
          id: 'c1',
          concepto: 'Cuota Social - 07/2026',
          monto: '1500.00',
          fecha_emision: '2026-07-13',
          fecha_vencimiento: '2026-07-23',
          estado: 'Vencida',
        },
      ],
    });

    render(<FinanzasPage socio={socioFixture} />);

    expect(await screen.findByText('En pagos vencidos.')).toBeInTheDocument();
    expect(screen.getByText('Moroso')).toBeInTheDocument();
    expect(screen.getByText('Cuota Social - 07/2026')).toBeInTheDocument();
    expect(screen.getByText('Vencida')).toBeInTheDocument();
  });

  test('muestra un botón "Pagar" por cada cuota no pagada, que abre el placeholder "Próximamente"', async () => {
    getEstadoFinanciero.mockResolvedValue({
      id_socio: 'socio-1',
      estado_financiero: 'Moroso',
      deuda_total: '1500.00',
      cuotas: [
        {
          id: 'c1',
          concepto: 'Cuota Social - 07/2026',
          monto: '1500.00',
          fecha_emision: '2026-07-13',
          fecha_vencimiento: '2026-07-23',
          estado: 'Vencida',
        },
      ],
    });

    render(<FinanzasPage socio={socioFixture} />);

    const boton = await screen.findByRole('button', { name: 'Pagar' });
    fireEvent.click(boton);

    expect(screen.getByText('Próximamente...')).toBeInTheDocument();
  });

  test('no muestra el botón "Pagar" para una cuota ya pagada', async () => {
    getEstadoFinanciero.mockResolvedValue({
      id_socio: 'socio-1',
      estado_financiero: 'Al día',
      deuda_total: '0.00',
      cuotas: [
        {
          id: 'c1',
          concepto: 'Cuota Social - 06/2026',
          monto: '1500.00',
          fecha_emision: '2026-06-13',
          fecha_vencimiento: '2026-06-23',
          estado: 'Pagada',
        },
      ],
    });

    render(<FinanzasPage socio={socioFixture} />);

    expect(await screen.findByText('Cuota Social - 06/2026')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Pagar' })).not.toBeInTheDocument();
  });

  test('muestra un mensaje de error si falla la carga', async () => {
    getEstadoFinanciero.mockRejectedValue(new Error('servicio-no-disponible'));

    render(<FinanzasPage socio={socioFixture} />);

    expect(await screen.findByText('No se pudo cargar tu estado financiero.')).toBeInTheDocument();
  });

  test('no actualiza el estado si el componente se desmonta antes de que resuelva el fetch', async () => {
    let resolverPromesa;
    getEstadoFinanciero.mockReturnValue(new Promise((resolve) => { resolverPromesa = resolve; }));

    const { unmount } = render(<FinanzasPage socio={socioFixture} />);
    unmount();
    resolverPromesa({ id_socio: 'socio-1', estado_financiero: 'Al día', deuda_total: 0, cuotas: [] });

    await waitFor(() => expect(getEstadoFinanciero).toHaveBeenCalled());
  });
});
