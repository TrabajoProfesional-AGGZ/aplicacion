import { getInstalaciones } from './instalacionesService';
import { fetchTo } from '../utils/utils';

jest.mock('../utils/utils', () => ({
  fetchTo: jest.fn(),
}));

const INSTALACION_ACTIVA = { id: 'inst-1', nombre: 'Cancha 1', tipo: 'Deportiva', activa: true };
const INSTALACION_INACTIVA = { id: 'inst-2', nombre: 'Cancha vieja', tipo: 'Deportiva', activa: false };

describe('instalacionesService', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getInstalaciones', () => {
    test('devuelve solo las instalaciones activas', async () => {
      fetchTo.mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve([INSTALACION_ACTIVA, INSTALACION_INACTIVA]),
      });
      const resultado = await getInstalaciones();
      expect(fetchTo).toHaveBeenCalledWith('/api/v1/instalaciones', 'GET');
      expect(resultado).toEqual([INSTALACION_ACTIVA]);
    });

    test('soporta una respuesta envuelta en { instalaciones }', async () => {
      fetchTo.mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ instalaciones: [INSTALACION_ACTIVA] }),
      });
      const resultado = await getInstalaciones();
      expect(resultado).toEqual([INSTALACION_ACTIVA]);
    });

    test('lanza servicio-no-disponible en 500', async () => {
      fetchTo.mockResolvedValue({ ok: false, status: 500 });
      await expect(getInstalaciones()).rejects.toThrow('servicio-no-disponible');
    });

    test('lanza error genérico ante otras respuestas no exitosas', async () => {
      fetchTo.mockResolvedValue({ ok: false, status: 400 });
      await expect(getInstalaciones()).rejects.toThrow('Error al obtener instalaciones');
    });
  });
});
