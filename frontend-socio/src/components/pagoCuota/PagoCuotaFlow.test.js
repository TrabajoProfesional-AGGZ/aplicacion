import { render, screen, waitFor, fireEvent, act } from '@testing-library/react';
import { PagoCuotaFlow } from './PagoCuotaFlow';
import { marcarPagoDemo } from '../../services/pagosService';

// Rama demo: PagoCuotaFlow ya no crea una preferencia de Mercado Pago, marca
// el pago directo contra el backend (ver pagosService.js::marcarPagoDemo).
jest.mock('../../services/pagosService', () => ({
  marcarPagoDemo: jest.fn(),
}));

const mockItem = { id: 'item-1', monto: 15000, concepto: 'Cuota Social - 07/2026' };
const mockSocio = { id: 'socio-1', nombre: 'Ana', apellido: 'Pérez' };

describe('PagoCuotaFlow (pago simulado, rama demo)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('muestra el concepto y el botón de pago', () => {
    render(<PagoCuotaFlow item={mockItem} tipoItem="cuota" socio={mockSocio} onVolver={jest.fn()} />);

    expect(screen.getByText(/Cuota Social - 07\/2026/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^pagar$/i })).toBeInTheDocument();
  });

  test('al pagar, llama a marcarPagoDemo y muestra éxito antes de volver', async () => {
    marcarPagoDemo.mockResolvedValue({ estado: 'Pagada' });
    const onVolverMock = jest.fn();

    render(<PagoCuotaFlow item={mockItem} tipoItem="cuota" socio={mockSocio} onVolver={onVolverMock} />);

    fireEvent.click(screen.getByRole('button', { name: /^pagar$/i }));

    await waitFor(() => {
      expect(marcarPagoDemo).toHaveBeenCalledWith('item-1', 'cuota');
    });

    expect(await screen.findByText(/pago registrado/i)).toBeInTheDocument();
    expect(onVolverMock).not.toHaveBeenCalled();

    act(() => {
      jest.advanceTimersByTime(1500);
    });

    expect(onVolverMock).toHaveBeenCalledTimes(1);
  });

  test('muestra un mensaje de error si falla el pago simulado', async () => {
    marcarPagoDemo.mockRejectedValue(new Error('pago-demo-fallido'));

    render(<PagoCuotaFlow item={mockItem} tipoItem="cuota" socio={mockSocio} onVolver={jest.fn()} />);

    fireEvent.click(screen.getByRole('button', { name: /^pagar$/i }));

    expect(await screen.findByText(/no pudimos registrar el pago de prueba/i)).toBeInTheDocument();
  });

  test('el botón volver llama a la función onVolver', () => {
    const onVolverMock = jest.fn();
    render(<PagoCuotaFlow item={mockItem} tipoItem="cuota" socio={mockSocio} onVolver={onVolverMock} />);

    const btnVolver = screen.getByRole('button', { name: /volver/i });
    fireEvent.click(btnVolver);

    expect(onVolverMock).toHaveBeenCalledTimes(1);
  });
});
