global.fetch = jest.fn();

import { getProductosDisponibles, getProducto, comprarProducto, getComprasPorSocio } from './tiendaService';

beforeEach(() => { global.fetch = jest.fn(); });

const COMPRA = {
  id: 'compra-1',
  cantidad: 2,
  monto: '200.00',
  estado: 'Iniciada',
  producto: { id: 'prod-1', nombre: 'Remera', precio: 100 },
};

describe('tiendaService', () => {
  test('getProductosDisponibles OK', async () => {
    fetch.mockResolvedValue({ ok: true, json: () => Promise.resolve([{ id: '1', nombre: 'Remera' }]) });
    const data = await getProductosDisponibles();
    expect(data).toHaveLength(1);
  });

  test('getProductosDisponibles error', async () => {
    fetch.mockResolvedValue({ ok: false });
    await expect(getProductosDisponibles()).rejects.toThrow();
  });

  test('getProducto OK', async () => {
    fetch.mockResolvedValue({ ok: true, json: () => Promise.resolve({ id: '1', nombre: 'Remera', precio: 5000 }) });
    const data = await getProducto('1');
    expect(data.nombre).toBe('Remera');
  });

  test('getProducto error', async () => {
    fetch.mockResolvedValue({ ok: false });
    await expect(getProducto('1')).rejects.toThrow();
  });

  describe('comprarProducto', () => {
    test('pide la compra al backend', async () => {
      fetch.mockResolvedValue({ ok: true, status: 201, json: () => Promise.resolve(COMPRA) });
      const resultado = await comprarProducto('prod-1', 'socio-1', 2);
      expect(resultado).toEqual(COMPRA);
    });

    test('lanza producto-no-encontrado en 404', async () => {
      fetch.mockResolvedValue({ ok: false, status: 404 });
      await expect(comprarProducto('prod-1', 'socio-1', 2)).rejects.toThrow('producto-no-encontrado');
    });

    test('lanza sin-stock en 409 con detail tipo sin_stock', async () => {
      fetch.mockResolvedValue({
        ok: false,
        status: 409,
        json: () => Promise.resolve({ detail: { tipo: 'sin_stock' } }),
      });
      await expect(comprarProducto('prod-1', 'socio-1', 2)).rejects.toThrow('sin-stock');
    });

    test('lanza producto-inactivo en 409 con detail tipo producto_inactivo', async () => {
      fetch.mockResolvedValue({
        ok: false,
        status: 409,
        json: () => Promise.resolve({ detail: { tipo: 'producto_inactivo' } }),
      });
      await expect(comprarProducto('prod-1', 'socio-1', 2)).rejects.toThrow('producto-inactivo');
    });

    test('lanza moroso en 403 con tipo moroso', async () => {
      fetch.mockResolvedValue({
        ok: false,
        status: 403,
        json: () => Promise.resolve({ detail: { tipo: 'moroso' } }),
      });
      await expect(comprarProducto('prod-1', 'socio-1', 2)).rejects.toThrow('moroso');
    });

    test('lanza suspendido en 403 con tipo suspendido', async () => {
      fetch.mockResolvedValue({
        ok: false,
        status: 403,
        json: () => Promise.resolve({ detail: { tipo: 'suspendido' } }),
      });
      await expect(comprarProducto('prod-1', 'socio-1', 2)).rejects.toThrow('suspendido');
    });

    test('lanza servicio-no-disponible en 500', async () => {
      fetch.mockResolvedValue({ ok: false, status: 500 });
      await expect(comprarProducto('prod-1', 'socio-1', 2)).rejects.toThrow('servicio-no-disponible');
    });
  });

  describe('getComprasPorSocio', () => {
    test('pide las compras pagadas del socio', async () => {
      fetch.mockResolvedValue({ ok: true, status: 200, json: () => Promise.resolve([COMPRA]) });
      const resultado = await getComprasPorSocio('socio-1');
      expect(resultado).toEqual([COMPRA]);
    });

    test('lanza servicio-no-disponible en 500', async () => {
      fetch.mockResolvedValue({ ok: false, status: 500 });
      await expect(getComprasPorSocio('socio-1')).rejects.toThrow('servicio-no-disponible');
    });
  });
});