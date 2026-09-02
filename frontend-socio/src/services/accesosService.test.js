import { enrolarYGuardarSecreto, obtenerUltimoAcceso } from './accesosService';
import { fetchTo } from '../utils/utils';

jest.mock('../utils/utils', () => ({
  fetchTo: jest.fn(),
}));

const socio = { id: 'socio-1', nombre: 'Ana', apellido: 'Pérez', nro_socio: '1000' };

describe('accesosService', () => {
  beforeEach(() => {
    localStorage.clear();
    fetchTo.mockClear();
  });

  test('enrolarYGuardarSecreto pide un secreto nuevo y lo guarda en localStorage', async () => {
    fetchTo.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ totp_secret: 'SECRETOVALIDO123' }),
    });

    const secreto = await enrolarYGuardarSecreto(socio);

    expect(fetchTo).toHaveBeenCalledWith('/api/v1/accesos/enrolar', 'POST', { socio_id: 'socio-1' });
    expect(secreto).toBe('SECRETOVALIDO123');
    expect(localStorage.getItem('socio_totp_secret')).toBe('SECRETOVALIDO123');
    expect(localStorage.getItem('socio_id')).toBe('socio-1');
    expect(localStorage.getItem('socio_nombre')).toBe('Ana');
    expect(localStorage.getItem('socio_apellido')).toBe('Pérez');
    expect(localStorage.getItem('socio_nro_socio')).toBe('1000');
  });

  test('devuelve null y no guarda nada si la respuesta no es ok', async () => {
    fetchTo.mockResolvedValueOnce({ ok: false });

    const secreto = await enrolarYGuardarSecreto(socio);

    expect(secreto).toBeNull();
    expect(localStorage.getItem('socio_totp_secret')).toBeNull();
  });

  test('devuelve null y no guarda nada si el secreto recibido tiene formato inválido', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    fetchTo.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ totp_secret: 'INVAL!DO-@@#' }),
    });

    const secreto = await enrolarYGuardarSecreto(socio);

    expect(secreto).toBeNull();
    expect(localStorage.getItem('socio_totp_secret')).toBeNull();
    expect(consoleSpy).toHaveBeenCalledWith('El secreto TOTP recibido del servidor no tiene un formato válido.');
    consoleSpy.mockRestore();
  });

test('intercepta secretos con formato inválido y registra un error seguro (sin log forging)', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const payloadMalicioso = 'x\n[ERROR] evento falso inyectado';
    
    fetchTo.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ totp_secret: payloadMalicioso }),
    });

    await enrolarYGuardarSecreto(socio);
    
    expect(consoleSpy).toHaveBeenCalled();
    
    expect(consoleSpy).toHaveBeenCalledWith('El secreto TOTP recibido del servidor no tiene un formato válido.');
    
    consoleSpy.mockRestore();
  });

  test('sobrescribe un secreto previo al pedir uno nuevo (recarga manual)', async () => {
    localStorage.setItem('socio_totp_secret', 'SECRETOVIEJO');
    fetchTo.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ totp_secret: 'SECRETONUEVO' }),
    });

    await enrolarYGuardarSecreto(socio);

    expect(localStorage.getItem('socio_totp_secret')).toBe('SECRETONUEVO');
  });
});

describe('obtenerUltimoAcceso', () => {
  beforeEach(() => {
    fetchTo.mockClear();
  });

  test('pide el último estado y devuelve el body si la respuesta es ok', async () => {
    const body = { id: 1, aprobado: true, mensaje: 'Acceso permitido. Molinete liberado.' };
    fetchTo.mockResolvedValueOnce({ ok: true, json: async () => body });

    const resultado = await obtenerUltimoAcceso('socio-1');

    expect(fetchTo).toHaveBeenCalledWith('/api/v1/accesos/ultimo-estado/socio-1', 'GET');
    expect(resultado).toEqual(body);
  });

  test('devuelve null si la respuesta no es ok', async () => {
    fetchTo.mockResolvedValueOnce({ ok: false });

    const resultado = await obtenerUltimoAcceso('socio-1');

    expect(resultado).toBeNull();
  });

  test('devuelve null si fetchTo lanza', async () => {
    fetchTo.mockRejectedValueOnce(new Error('network error'));

    const resultado = await obtenerUltimoAcceso('socio-1');

    expect(resultado).toBeNull();
  });

  test('devuelve null si el body es null (nunca fue escaneado)', async () => {
    fetchTo.mockResolvedValueOnce({ ok: true, json: async () => null });

    const resultado = await obtenerUltimoAcceso('socio-1');

    expect(resultado).toBeNull();
  });
});
