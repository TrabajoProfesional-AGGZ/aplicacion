import { render, screen, fireEvent } from '@testing-library/react';
import { PagoCuotaFlow } from './PagoCuotaFlow';
import { procesarPago } from '../../services/pagosService';

jest.mock('@mercadopago/sdk-react', () => ({
  initMercadoPago: jest.fn(),
  Payment: ({ onSubmit }) => (
    <button onClick={() => onSubmit({ formData: { token: 'tok' } }).catch(() => {})}>Simular pago</button>
  ),
  StatusScreen: ({ initialization }) => <div>status-screen {initialization.paymentId}</div>,
}));
jest.mock('../../services/pagosService', () => ({ procesarPago: jest.fn() }));

const cuotaFixture = { id: 'cuota-1', concepto: 'Cuota Social - 07/2026', monto: '1500.00' };
const socioFixture = { id: 'socio-1', email: 'socio@test.com' };

describe('PagoCuotaFlow', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test('muestra el concepto y el monto de la cuota', () => {
    render(<PagoCuotaFlow cuota={cuotaFixture} socio={socioFixture} onVolver={jest.fn()} />);

    expect(screen.getByText('Cuota Social - 07/2026')).toBeInTheDocument();
    expect(screen.getByText('$ 1.500,00')).toBeInTheDocument();
  });

  test('pago aprobado avanza a la pantalla de resultado con el id_pago', async () => {
    procesarPago.mockResolvedValue({ id_pago: 42, estado: 'approved' });

    render(<PagoCuotaFlow cuota={cuotaFixture} socio={socioFixture} onVolver={jest.fn()} />);
    fireEvent.click(screen.getByText('Simular pago'));

    expect(await screen.findByText('status-screen 42')).toBeInTheDocument();
  });

  test('pago in_process avanza a la pantalla de resultado', async () => {
    procesarPago.mockResolvedValue({ id_pago: 43, estado: 'in_process' });

    render(<PagoCuotaFlow cuota={cuotaFixture} socio={socioFixture} onVolver={jest.fn()} />);
    fireEvent.click(screen.getByText('Simular pago'));

    expect(await screen.findByText('status-screen 43')).toBeInTheDocument();
  });

  test('pago rechazado muestra una alerta y se queda en el paso de pago', async () => {
    procesarPago.mockResolvedValue({ id_pago: 44, estado: 'rejected' });

    render(<PagoCuotaFlow cuota={cuotaFixture} socio={socioFixture} onVolver={jest.fn()} />);
    fireEvent.click(screen.getByText('Simular pago'));

    expect(await screen.findByRole('alert')).toBeInTheDocument();
    expect(screen.getByText('Simular pago')).toBeInTheDocument();
    expect(screen.queryByText(/status-screen/)).not.toBeInTheDocument();
  });

  test('fallo de red muestra una alerta de procesamiento sin StatusScreen', async () => {
    procesarPago.mockRejectedValue(new Error('pago-fallido'));

    render(<PagoCuotaFlow cuota={cuotaFixture} socio={socioFixture} onVolver={jest.fn()} />);
    fireEvent.click(screen.getByText('Simular pago'));

    expect(await screen.findByRole('alert')).toBeInTheDocument();
    expect(screen.queryByText(/status-screen/)).not.toBeInTheDocument();
  });

  test('el botón volver llama a onVolver', () => {
    const onVolver = jest.fn();
    render(<PagoCuotaFlow cuota={cuotaFixture} socio={socioFixture} onVolver={onVolver} />);

    fireEvent.click(screen.getByLabelText('Volver'));

    expect(onVolver).toHaveBeenCalled();
  });
});
