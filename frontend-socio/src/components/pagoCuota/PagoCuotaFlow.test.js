import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { PagoCuotaFlow } from './PagoCuotaFlow';
import { crearPreferenciaPago } from '../../services/pagosService';

// 1. Mock el servicio para que no haga llamadas reales
jest.mock('../../services/pagosService', () => ({
  crearPreferenciaPago: jest.fn(),
}));

// 2. Mock el SDK de Mercado Pago
jest.mock('@mercadopago/sdk-react', () => ({
  initMercadoPago: jest.fn(),
  Wallet: () => <div data-testid="wallet-brick">Botón de Checkout Pro</div>
}));

const mockItem = { id: 'item-1', monto: 15000, concepto: 'Cuota Social - 07/2026' };
const mockSocio = { id: 'socio-1', nombre: 'Ana', apellido: 'Pérez' };

describe('PagoCuotaFlow', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('muestra el concepto y carga el botón de Mercado Pago cuando obtiene la preferencia', async () => {
    crearPreferenciaPago.mockResolvedValue({ id_preferencia: 'pref-123' });
    
    render(<PagoCuotaFlow item={mockItem} tipoItem="cuota" socio={mockSocio} onVolver={jest.fn()} />);

    expect(screen.getByText(/Cuota Social - 07\/2026/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(crearPreferenciaPago).toHaveBeenCalledWith(mockItem, 'cuota');
    });

    expect(await screen.findByTestId('wallet-brick')).toBeInTheDocument();
  });

  test('muestra un mensaje de error si falla la creación de la preferencia', async () => {
    crearPreferenciaPago.mockRejectedValue(new Error('error-al-crear-preferencia'));
    
    render(<PagoCuotaFlow item={mockItem} tipoItem="cuota" socio={mockSocio} onVolver={jest.fn()} />);

    await waitFor(() => {
      expect(crearPreferenciaPago).toHaveBeenCalled();
    });

    expect(screen.queryByTestId('wallet-brick')).not.toBeInTheDocument();
  });

  test('el botón volver llama a la función onVolver', async () => {
    crearPreferenciaPago.mockReturnValue(new Promise(() => {}));
    
    const onVolverMock = jest.fn();
    render(<PagoCuotaFlow item={mockItem} tipoItem="cuota" socio={mockSocio} onVolver={onVolverMock} />);

    const btnVolver = screen.getByRole('button', { name: /volver/i });
    fireEvent.click(btnVolver);

    expect(onVolverMock).toHaveBeenCalledTimes(1);
  });
});