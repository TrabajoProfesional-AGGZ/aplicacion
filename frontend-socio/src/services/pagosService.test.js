import { crearPreferenciaPago } from './pagosService';
import { fetchTo } from '../utils/utils';

jest.mock('../utils/utils', () => ({
  fetchTo: jest.fn(),
}));

describe('pagosService', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test('crearPreferenciaPago arma el payload desde el ítem y devuelve el JSON', async () => {
    const respuesta = { id_preferencia: 'pref-1', init_point: 'https://mp/checkout' };
    fetchTo.mockResolvedValue({ ok: true, json: () => Promise.resolve(respuesta) });

    const resultado = await crearPreferenciaPago({ id: 'cuota-1', concepto: 'Cuota marzo', monto: '1500' }, 'cuota');

    expect(fetchTo).toHaveBeenCalledWith('/api/v1/pagos/preferencia', 'POST', {
      id_item: 'cuota-1',
      tipo_item: 'cuota',
      titulo: 'Cuota marzo',
      precio_unitario: 1500,
      cantidad: 1,
    });
    expect(resultado).toEqual(respuesta);
  });

  test('crearPreferenciaPago lanza error-al-crear-preferencia si la respuesta no es ok', async () => {
    fetchTo.mockResolvedValue({ ok: false, status: 400 });

    await expect(crearPreferenciaPago({ id: 'cuota-1', concepto: 'Cuota', monto: 10 }, 'cuota'))
      .rejects.toThrow('error-al-crear-preferencia');
  });
});
