global.fetch = jest.fn();

import { getProductosDisponibles, getProducto } from './tiendaService';

beforeEach(() => { global.fetch = jest.fn(); });

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
});