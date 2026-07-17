import { getAlertasSocio } from './alertasService';
import { fetchTo } from '../utils/utils';

jest.mock('../utils/utils', () => ({
  fetchTo: jest.fn(),
}));

describe('alertasService', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test('devuelve las alertas del socio cuando la respuesta es exitosa', async () => {
    const alertas = [{ id: 'a1', mensaje: 'Hola', filtro_categoria: null, filtro_estado: null }];
    fetchTo.mockResolvedValue({ ok: true, status: 200, json: () => Promise.resolve(alertas) });

    const resultado = await getAlertasSocio('socio-1');

    expect(fetchTo).toHaveBeenCalledWith('/api/v1/alertas/por-socio/socio-1', 'GET');
    expect(resultado).toEqual(alertas);
  });

  test('lanza servicio-no-disponible ante un error 5xx', async () => {
    fetchTo.mockResolvedValue({ ok: false, status: 500 });

    await expect(getAlertasSocio('socio-1')).rejects.toThrow('servicio-no-disponible');
  });

  test('lanza un error genérico ante otras respuestas no exitosas', async () => {
    fetchTo.mockResolvedValue({ ok: false, status: 404 });

    await expect(getAlertasSocio('socio-1')).rejects.toThrow('Error al obtener las alertas');
  });
});
