import { render, screen, fireEvent } from '@testing-library/react';
import { TiendaPage } from './TiendaPage';
import { getProductosDisponibles, getProducto, comprarProducto, getComprasPorSocio } from '../../services/tiendaService';

jest.mock('../../services/tiendaService', () => ({
  getProductosDisponibles: jest.fn(),
  getProducto: jest.fn(),
  comprarProducto: jest.fn(),
  getComprasPorSocio: jest.fn(),
}));

jest.mock('../../components/pagoCuota/PagoCuotaFlow', () => ({
  PagoCuotaFlow: ({ item, tipoItem }) => (
    <div data-testid="payment-brick">pago-flow-stub {tipoItem} {item.concepto} {item.monto}</div>
  ),
}));

const SOCIO = { id: 'socio-1', nombre: 'Ana', apellido: 'Gómez', email: 'ana@test.com' };

const productos = [
  { id: '1', nombre: 'Remera oficial', precio: 15000, stock: 5, imagen_url: null },
  { id: '2', nombre: 'Buzo campera', precio: 30000, stock: 0, imagen_url: null },
];

const detalleConStock = {
  id: '1',
  nombre: 'Remera oficial',
  precio: 15000,
  stock: 3,
  imagen_url: null,
  descripcion: 'Remera oficial del club.',
};

const detalleSinStock = {
  id: '2',
  nombre: 'Buzo campera',
  precio: 30000,
  stock: 0,
  imagen_url: null,
  descripcion: 'Buzo oficial del club.',
};

const COMPRA_INICIADA = {
  id: 'compra-1',
  cantidad: 1,
  monto: '15000.00',
  estado: 'Iniciada',
  producto: { id: '1', nombre: 'Remera oficial', imagen_url: null, precio: 15000 },
};

const COMPRA_PAGADA = {
  id: 'compra-2',
  cantidad: 2,
  monto: '30000.00',
  estado: 'Pagada',
  creado_en: '2026-01-01T00:00:00Z',
  pagado_en_caja: false,
  producto: { id: '2', nombre: 'Buzo campera', imagen_url: null, precio: 15000 },
};

describe('TiendaPage', () => {
  beforeEach(() => {
    getProductosDisponibles.mockReset().mockResolvedValue(productos);
    getProducto.mockReset();
    comprarProducto.mockReset();
    getComprasPorSocio.mockReset().mockResolvedValue([]);
  });

  test('en la lista, un producto sin stock muestra "Agotado" en vez de la cantidad disponible', async () => {
    render(<TiendaPage socio={SOCIO} />);

    expect(await screen.findByText('Remera oficial')).toBeInTheDocument();
    expect(screen.getByText('5 disponibles')).toBeInTheDocument();
    expect(screen.getByText('Agotado')).toBeInTheDocument();
    expect(screen.queryByText('0 disponibles')).not.toBeInTheDocument();
  });

  test('al entrar al detalle de un producto con stock, aparece el botón "Comprar"', async () => {
    getProducto.mockResolvedValue(detalleConStock);
    render(<TiendaPage socio={SOCIO} />);

    fireEvent.click(await screen.findByText('Remera oficial'));

    expect(await screen.findByText('Comprar')).toBeInTheDocument();
  });

  test('al tocar "Comprar" aparece el selector de cantidad y el botón pasa a "Confirmar compra", actualizando el total', async () => {
    getProducto.mockResolvedValue(detalleConStock);
    render(<TiendaPage socio={SOCIO} />);

    fireEvent.click(await screen.findByText('Remera oficial'));
    fireEvent.click(await screen.findByText('Comprar'));

    expect(screen.getByText('Confirmar compra')).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('Total: $15.000')).toBeInTheDocument();

    fireEvent.click(screen.getByLabelText('Sumar unidad'));
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('Total: $30.000')).toBeInTheDocument();

    fireEvent.click(screen.getByLabelText('Restar unidad'));
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('Total: $15.000')).toBeInTheDocument();
  });

  test('la cantidad no puede bajar de 1 ni superar el stock disponible', async () => {
    getProducto.mockResolvedValue(detalleConStock);
    render(<TiendaPage socio={SOCIO} />);

    fireEvent.click(await screen.findByText('Remera oficial'));
    fireEvent.click(await screen.findByText('Comprar'));

    expect(screen.getByLabelText('Restar unidad')).toBeDisabled();

    fireEvent.click(screen.getByLabelText('Sumar unidad'));
    fireEvent.click(screen.getByLabelText('Sumar unidad'));
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByLabelText('Sumar unidad')).toBeDisabled();
  });

  test('un producto sin stock no muestra el botón de comprar y sí muestra el badge "Agotado"', async () => {
    getProducto.mockResolvedValue(detalleSinStock);
    render(<TiendaPage socio={SOCIO} />);

    fireEvent.click(await screen.findByText('Buzo campera'));

    expect(await screen.findByText('Buzo oficial del club.')).toBeInTheDocument();
    expect(screen.queryByText('Comprar')).not.toBeInTheDocument();
    expect(screen.getByText('Agotado')).toBeInTheDocument();
  });

  test('al tocar "Confirmar compra" con éxito, pasa al flujo de pago con las props correctas', async () => {
    getProducto.mockResolvedValue(detalleConStock);
    comprarProducto.mockResolvedValue(COMPRA_INICIADA);
    render(<TiendaPage socio={SOCIO} />);

    fireEvent.click(await screen.findByText('Remera oficial'));
    fireEvent.click(await screen.findByText('Comprar'));
    fireEvent.click(screen.getByText('Confirmar compra'));

    expect(await screen.findByTestId('payment-brick')).toHaveTextContent('pago-flow-stub compra Remera oficial 15000.00');
    expect(comprarProducto).toHaveBeenCalledWith('1', 'socio-1', 1);
  });

  test('un error de compra se muestra inline sin avanzar al pago', async () => {
    getProducto.mockResolvedValue(detalleConStock);
    comprarProducto.mockRejectedValue(new Error('sin-stock'));
    render(<TiendaPage socio={SOCIO} />);

    fireEvent.click(await screen.findByText('Remera oficial'));
    fireEvent.click(await screen.findByText('Comprar'));
    fireEvent.click(screen.getByText('Confirmar compra'));

    expect(await screen.findByText('No queda stock suficiente de este producto.')).toBeInTheDocument();
    expect(screen.queryByTestId('payment-brick')).not.toBeInTheDocument();
  });

  test('un error moroso se muestra inline con el mensaje correspondiente', async () => {
    getProducto.mockResolvedValue(detalleConStock);
    comprarProducto.mockRejectedValue(new Error('moroso'));
    render(<TiendaPage socio={SOCIO} />);

    fireEvent.click(await screen.findByText('Remera oficial'));
    fireEvent.click(await screen.findByText('Comprar'));
    fireEvent.click(screen.getByText('Confirmar compra'));

    expect(await screen.findByText('Tenés pagos pendientes. Regularizá tu situación para poder comprar.')).toBeInTheDocument();
  });

  test('"Volver" desde el detalle muestra la lista de nuevo', async () => {
    getProducto.mockResolvedValue(detalleConStock);
    render(<TiendaPage socio={SOCIO} />);

    fireEvent.click(await screen.findByText('Remera oficial'));
    await screen.findByText('Comprar');

    fireEvent.click(screen.getByText('Volver'));

    expect(await screen.findByText('Buzo campera')).toBeInTheDocument();
  });

  test('"Mis compras" lista las compras pagadas del socio', async () => {
    getComprasPorSocio.mockResolvedValue([COMPRA_PAGADA]);
    render(<TiendaPage socio={SOCIO} />);

    await screen.findByText('Remera oficial');
    fireEvent.click(screen.getByText('Mis compras'));

    expect(await screen.findByText('Buzo campera')).toBeInTheDocument();
    expect(screen.getByText('Cantidad: 2')).toBeInTheDocument();
    expect(getComprasPorSocio).toHaveBeenCalledWith('socio-1');
  });

  test('"Mis compras" muestra un mensaje cuando el socio no tiene compras', async () => {
    getComprasPorSocio.mockResolvedValue([]);
    render(<TiendaPage socio={SOCIO} />);

    await screen.findByText('Remera oficial');
    fireEvent.click(screen.getByText('Mis compras'));

    expect(await screen.findByText('Todavía no tenés compras.')).toBeInTheDocument();
  });
});
