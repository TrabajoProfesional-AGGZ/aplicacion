import { render, screen, waitFor, fireEvent } from '@testing-library/react';
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
  });

  test('muestra el concepto y el botón de pago', () => {
    render(<PagoCuotaFlow item={mockItem} tipoItem="cuota" socio={mockSocio} />);

    expect(screen.getByText(/Cuota Social - 07\/2026/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^pagar$/i })).toBeInTheDocument();
  });

  test('al pagar, llama a marcarPagoDemo y muestra éxito', async () => {
    marcarPagoDemo.mockResolvedValue({ estado: 'Pagada' });

    render(<PagoCuotaFlow item={mockItem} tipoItem="cuota" socio={mockSocio} />);

    fireEvent.click(screen.getByRole('button', { name: /^pagar$/i }));

    await waitFor(() => {
      expect(marcarPagoDemo).toHaveBeenCalledWith('item-1', 'cuota');
    });

    expect(await screen.findByText(/pago registrado/i)).toBeInTheDocument();
  });

  test('muestra un mensaje de error si falla el pago simulado', async () => {
    marcarPagoDemo.mockRejectedValue(new Error('pago-demo-fallido'));

    render(<PagoCuotaFlow item={mockItem} tipoItem="cuota" socio={mockSocio} />);

    fireEvent.click(screen.getByRole('button', { name: /^pagar$/i }));

    expect(await screen.findByText(/no pudimos registrar el pago de prueba/i)).toBeInTheDocument();
  });
});
