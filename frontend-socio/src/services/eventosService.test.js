import {
  getEventos,
  comprarEntrada,
  getEntradasActivas,
  getEntradasHistoricas,
} from './eventosService';
import { fetchTo } from '../utils/utils';

jest.mock('../utils/utils', () => ({
  fetchTo: jest.fn(),
}));

const EVENTO = { id: 'ev-1', nombre: 'Fiesta', capacidad_maxima: 100, entradas_vendidas: 10 };
const ENTRADA = { id: 'ent-1', estado: 'Pendiente', monto: '500.00', evento: EVENTO };

describe('eventosService', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getEventos', () => {
    test('pide los eventos al backend', async () => {
      fetchTo.mockResolvedValue({ ok: true, status: 200, json: () => Promise.resolve([EVENTO]) });
      const resultado = await getEventos();
      expect(fetchTo).toHaveBeenCalledWith('/api/v1/eventos', 'GET');
      expect(resultado).toEqual([EVENTO]);
    });

    test('lanza servicio-no-disponible en 500', async () => {
      fetchTo.mockResolvedValue({ ok: false, status: 500 });
      await expect(getEventos()).rejects.toThrow('servicio-no-disponible');
    });

    test('lanza error genérico ante otras respuestas no exitosas', async () => {
      fetchTo.mockResolvedValue({ ok: false, status: 400 });
      await expect(getEventos()).rejects.toThrow('Error al obtener eventos');
    });
  });

  describe('comprarEntrada', () => {
    test('pide la compra al backend', async () => {
      fetchTo.mockResolvedValue({ ok: true, status: 201, json: () => Promise.resolve(ENTRADA) });
      const resultado = await comprarEntrada('ev-1', 'socio-1');
      expect(fetchTo).toHaveBeenCalledWith('/api/v1/entradas', 'POST', { id_evento: 'ev-1', id_socio: 'socio-1' });
      expect(resultado).toEqual(ENTRADA);
    });

    test('lanza evento-no-encontrado en 404', async () => {
      fetchTo.mockResolvedValue({ ok: false, status: 404 });
      await expect(comprarEntrada('ev-1', 'socio-1')).rejects.toThrow('evento-no-encontrado');
    });

    test('lanza sin-cupo en 409 con detail tipo sin_cupo', async () => {
      fetchTo.mockResolvedValue({
        ok: false,
        status: 409,
        json: () => Promise.resolve({ detail: { tipo: 'sin_cupo' } }),
      });
      await expect(comprarEntrada('ev-1', 'socio-1')).rejects.toThrow('sin-cupo');
    });

    test('lanza ya-tiene-entrada en 409 con detail tipo ya_tiene_entrada', async () => {
      fetchTo.mockResolvedValue({
        ok: false,
        status: 409,
        json: () => Promise.resolve({ detail: { tipo: 'ya_tiene_entrada' } }),
      });
      await expect(comprarEntrada('ev-1', 'socio-1')).rejects.toThrow('ya-tiene-entrada');
    });

    test('lanza fuera-de-plazo en 409 con detail tipo fuera_de_plazo', async () => {
      fetchTo.mockResolvedValue({
        ok: false,
        status: 409,
        json: () => Promise.resolve({ detail: { tipo: 'fuera_de_plazo' } }),
      });
      await expect(comprarEntrada('ev-1', 'socio-1')).rejects.toThrow('fuera-de-plazo');
    });

    test('lanza moroso en 403 con tipo moroso', async () => {
      fetchTo.mockResolvedValue({
        ok: false,
        status: 403,
        json: () => Promise.resolve({ detail: { tipo: 'moroso' } }),
      });
      await expect(comprarEntrada('ev-1', 'socio-1')).rejects.toThrow('moroso');
    });

    test('lanza suspendido en 403 con tipo suspendido', async () => {
      fetchTo.mockResolvedValue({
        ok: false,
        status: 403,
        json: () => Promise.resolve({ detail: { tipo: 'suspendido' } }),
      });
      await expect(comprarEntrada('ev-1', 'socio-1')).rejects.toThrow('suspendido');
    });

    test('lanza servicio-no-disponible en 500', async () => {
      fetchTo.mockResolvedValue({ ok: false, status: 500 });
      await expect(comprarEntrada('ev-1', 'socio-1')).rejects.toThrow('servicio-no-disponible');
    });
  });

  describe('getEntradasActivas', () => {
    test('pide las entradas activas del socio', async () => {
      fetchTo.mockResolvedValue({ ok: true, status: 200, json: () => Promise.resolve([ENTRADA]) });
      const resultado = await getEntradasActivas('socio-1');
      expect(fetchTo).toHaveBeenCalledWith('/api/v1/entradas/por-socio/socio-1', 'GET');
      expect(resultado).toEqual([ENTRADA]);
    });

    test('lanza servicio-no-disponible en 500', async () => {
      fetchTo.mockResolvedValue({ ok: false, status: 500 });
      await expect(getEntradasActivas('socio-1')).rejects.toThrow('servicio-no-disponible');
    });
  });

  describe('getEntradasHistoricas', () => {
    test('pide el historial de entradas del socio', async () => {
      fetchTo.mockResolvedValue({ ok: true, status: 200, json: () => Promise.resolve([ENTRADA]) });
      const resultado = await getEntradasHistoricas('socio-1');
      expect(fetchTo).toHaveBeenCalledWith('/api/v1/entradas/historicas/por-socio/socio-1', 'GET');
      expect(resultado).toEqual([ENTRADA]);
    });

    test('lanza servicio-no-disponible en 500', async () => {
      fetchTo.mockResolvedValue({ ok: false, status: 500 });
      await expect(getEntradasHistoricas('socio-1')).rejects.toThrow('servicio-no-disponible');
    });
  });
});
