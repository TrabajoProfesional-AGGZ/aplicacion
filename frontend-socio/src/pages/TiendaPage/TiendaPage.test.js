import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { TiendaPage } from './TiendaPage';
import { getProductosDisponibles, getProducto } from '../../services/tiendaService';

jest.mock('../../services/tiendaService', () => ({
  getProductosDisponibles: jest.fn(),
  getProducto: jest.fn(),
}));

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

describe('TiendaPage', () => {
  beforeEach(() => {
    getProductosDisponibles.mockReset().mockResolvedValue(productos);
    getProducto.mockReset();
  });

  test('en la lista, un producto sin stock muestra "Agotado" en vez de la cantidad disponible', async () => {
    render(<TiendaPage />);

    expect(await screen.findByText('Remera oficial')).toBeInTheDocument();
    expect(screen.getByText('5 disponibles')).toBeInTheDocument();
    expect(screen.getByText('Agotado')).toBeInTheDocument();
    expect(screen.queryByText('0 disponibles')).not.toBeInTheDocument();
  });

  test('al entrar al detalle de un producto con stock, aparece el botón "Comprar"', async () => {
    getProducto.mockResolvedValue(detalleConStock);
    render(<TiendaPage />);

    fireEvent.click(await screen.findByText('Remera oficial'));

    expect(await screen.findByText('Comprar')).toBeInTheDocument();
  });

  test('al tocar "Comprar" aparece el selector de cantidad y el botón pasa a "Confirmar compra", actualizando el total', async () => {
    getProducto.mockResolvedValue(detalleConStock);
    render(<TiendaPage />);

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
    render(<TiendaPage />);

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
    render(<TiendaPage />);

    fireEvent.click(await screen.findByText('Buzo campera'));

    await waitFor(() => expect(screen.getByText('Buzo oficial del club.')).toBeInTheDocument());
    expect(screen.queryByText('Comprar')).not.toBeInTheDocument();
    expect(screen.getByText('Agotado')).toBeInTheDocument();
  });

  test('al tocar "Confirmar compra" aparece el placeholder de "Próximamente"', async () => {
    getProducto.mockResolvedValue(detalleConStock);
    render(<TiendaPage />);

    fireEvent.click(await screen.findByText('Remera oficial'));
    fireEvent.click(await screen.findByText('Comprar'));
    fireEvent.click(screen.getByText('Confirmar compra'));

    expect(await screen.findByText('Próximamente...')).toBeInTheDocument();
  });

  test('"Volver" desde el detalle muestra la lista de nuevo', async () => {
    getProducto.mockResolvedValue(detalleConStock);
    render(<TiendaPage />);

    fireEvent.click(await screen.findByText('Remera oficial'));
    await screen.findByText('Comprar');

    fireEvent.click(screen.getByText('Volver'));

    await waitFor(() => expect(screen.getByText('Buzo campera')).toBeInTheDocument());
  });
});
