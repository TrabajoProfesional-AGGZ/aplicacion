import { fetchTo, fetchWithOutAuth } from './utils';
import { auth } from '../firebase';

jest.mock('../firebase', () => ({
  auth: { currentUser: null },
}));

describe('utils', () => {
  beforeEach(() => {
    global.fetch = jest.fn().mockResolvedValue({ ok: true });
    auth.currentUser = null;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('fetchTo', () => {
    test('adjunta el token del usuario actual en el header Authorization', async () => {
      auth.currentUser = { getIdToken: jest.fn().mockResolvedValue('token-123') };

      await fetchTo('/api/v1/socios', 'GET');

      expect(global.fetch).toHaveBeenCalledWith('http://localhost:8080/api/v1/socios', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer token-123',
        },
        body: null,
      });
    });

    test('serializa el body cuando se pasa uno', async () => {
      auth.currentUser = { getIdToken: jest.fn().mockResolvedValue('token-123') };

      await fetchTo('/api/v1/socios/1', 'PATCH', { nombre: 'Ana' });

      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:8080/api/v1/socios/1',
        expect.objectContaining({ body: JSON.stringify({ nombre: 'Ana' }) })
      );
    });

    test('sin usuario logueado, el token queda undefined', async () => {
      await fetchTo('/api/v1/socios', 'GET');

      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:8080/api/v1/socios',
        expect.objectContaining({ headers: expect.objectContaining({ Authorization: 'Bearer undefined' }) })
      );
    });

    test.each([
      ['con esquema absoluto', 'https://evil.com/api/v1/socios'],
      ['protocol-relative', '//evil.com/api/v1/socios'],
      ['que no empieza con /', 'api/v1/socios'],
      ['con esquema embebido más adelante', '/api/v1/socios?next=javascript://evil.com'],
      ['no string', null],
    ])('rechaza un path %s sin llegar a llamar a fetch', async (_desc, path) => {
      await expect(fetchTo(path, 'GET')).rejects.toThrow('Ruta de API inválida');
      expect(global.fetch).not.toHaveBeenCalled();
    });
  });

  describe('fetchWithOutAuth', () => {
    test('no incluye header Authorization', async () => {
      await fetchWithOutAuth('/api/v1/socios/validar', 'POST', { nro_socio: 1, dni: '12345678' });

      expect(global.fetch).toHaveBeenCalledWith('http://localhost:8080/api/v1/socios/validar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nro_socio: 1, dni: '12345678' }),
      });
    });

    test('envía body null cuando no se pasa uno', async () => {
      await fetchWithOutAuth('/api/v1/algo', 'GET');

      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:8080/api/v1/algo',
        expect.objectContaining({ body: null })
      );
    });

    test('rechaza un path protocol-relative sin llegar a llamar a fetch', async () => {
      await expect(fetchWithOutAuth('//evil.com/api/v1/socios', 'GET')).rejects.toThrow('Ruta de API inválida');
      expect(global.fetch).not.toHaveBeenCalled();
    });
  });
});
