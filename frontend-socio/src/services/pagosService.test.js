import { procesarPago } from './pagosService';
import { fetchTo } from '../utils/utils';

jest.mock('../utils/utils', () => ({
  fetchTo: jest.fn(),
}));

describe('pagosService', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test('llama a fetchTo con la ruta, el formData y el id_cuota, y devuelve el JSON', async () => {
    const formData = { token: 'tok', transaction_amount: 1500 };
    const respuesta = { id_pago: 'pago-1', estado: 'approved', estado_detalle: 'accredited' };
    fetchTo.mockResolvedValue({ ok: true, json: () => Promise.resolve(respuesta) });

    const resultado = await procesarPago(formData, 'cuota-1', 'cuota'); 

    expect(fetchTo).toHaveBeenCalledWith('/api/v1/pagos/procesar', 'POST', { 
      ...formData, 
      id_item: 'cuota-1', 
      tipo_item: 'cuota' 
    });
    expect(resultado).toEqual(respuesta);
  });

  test('lanza pago-fallido si la respuesta no es ok', async () => {
    fetchTo.mockResolvedValue({ ok: false, status: 400, json: () => Promise.resolve({ detail: 'MP rechazó la petición' }) });

    await expect(procesarPago({ token: 'tok' }, 'cuota-1', 'cuota')).rejects.toThrow('pago-fallido');
  });
});
