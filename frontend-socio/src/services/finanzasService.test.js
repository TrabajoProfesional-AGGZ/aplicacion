import { getEstadoFinanciero } from './finanzasService';
import { fetchTo } from '../utils/utils';

jest.mock('../utils/utils', () => ({
  fetchTo: jest.fn(),
}));

describe('finanzasService', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test('devuelve el resumen financiero cuando la respuesta es exitosa', async () => {
    const resumen = { id_socio: 'socio-1', estado_financiero: 'Al día', deuda_total: 0, cuotas: [] };
    fetchTo.mockResolvedValue({ ok: true, status: 200, json: () => Promise.resolve(resumen) });

    const resultado = await getEstadoFinanciero('socio-1');

    expect(fetchTo).toHaveBeenCalledWith('/api/v1/finanzas/socio-1', 'GET');
    expect(resultado).toEqual(resumen);
  });

  test('lanza socio-no-encontrado si la respuesta es 404', async () => {
    fetchTo.mockResolvedValue({ ok: false, status: 404 });

    await expect(getEstadoFinanciero('socio-1')).rejects.toThrow('socio-no-encontrado');
  });

  test('lanza un error genérico ante otras respuestas no exitosas', async () => {
    fetchTo.mockResolvedValue({ ok: false, status: 500 });

    await expect(getEstadoFinanciero('socio-1')).rejects.toThrow('Error al obtener el estado financiero');
  });
});
