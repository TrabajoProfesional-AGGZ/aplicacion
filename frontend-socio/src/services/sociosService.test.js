import { validarSocio, reclamarCuentaSocio, subirFotoSocio, getSocioByNroSocio, asignarPagoSimuladoClaim } from './sociosService';
import { fetchTo, fetchWithOutAuth } from '../utils/utils';

jest.mock('../utils/utils', () => ({
  fetchTo: jest.fn(),
  fetchWithOutAuth: jest.fn(),
}));

// La ruta pre-login lleva el club en el path y lo saca del resolutor, no de un parámetro.
jest.mock('./clubService', () => ({
  idDeClubActual: jest.fn(async () => 'club-uno'),
}));
import { idDeClubActual } from './clubService';

describe('sociosService', () => {
  beforeEach(() => {
    idDeClubActual.mockResolvedValue('club-uno');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('validarSocio', () => {
    test('devuelve los datos del socio cuando la validación es exitosa', async () => {
      const socio = { nro_socio: 1, dni: '12345678' };
      fetchWithOutAuth.mockResolvedValue({ ok: true, status: 200, json: () => Promise.resolve(socio) });

      const resultado = await validarSocio(1, '12345678');

      expect(fetchWithOutAuth).toHaveBeenCalledWith('/api/v1/clubes/club-uno/socios/validar', 'POST', {
        nro_socio: 1,
        dni: '12345678',
      });
      expect(resultado).toEqual(socio);
    });

    test('si el club no se puede resolver, no llega a pegarle al backend', async () => {
      idDeClubActual.mockRejectedValueOnce(new Error('club-desconocido'));

      await expect(validarSocio(1, '12345678')).rejects.toThrow('club-desconocido');
      expect(fetchWithOutAuth).not.toHaveBeenCalled();
    });

    test('lanza socio-no-encontrado en 404', async () => {
      fetchWithOutAuth.mockResolvedValue({ ok: false, status: 404 });
      await expect(validarSocio(1, '12345678')).rejects.toThrow('socio-no-encontrado');
    });

    test('lanza cuenta-ya-registrada en 409', async () => {
      fetchWithOutAuth.mockResolvedValue({ ok: false, status: 409 });
      await expect(validarSocio(1, '12345678')).rejects.toThrow('cuenta-ya-registrada');
    });

    test('lanza error genérico ante otras respuestas no exitosas', async () => {
      fetchWithOutAuth.mockResolvedValue({ ok: false, status: 400 });
      await expect(validarSocio(1, '12345678')).rejects.toThrow('Error al validar el socio');
    });
  });

  describe('reclamarCuentaSocio', () => {
    test('devuelve la respuesta cuando el reclamo es exitoso', async () => {
      const respuesta = { cuenta_reclamada: true };
      fetchTo.mockResolvedValue({ ok: true, status: 200, json: () => Promise.resolve(respuesta) });

      const resultado = await reclamarCuentaSocio('12345678');

      expect(fetchTo).toHaveBeenCalledWith('/api/v1/socios/por-dni/12345678/reclamar', 'POST', null);
      expect(resultado).toEqual(respuesta);
    });

    test('manda el token de validación cuando lo hay', async () => {
      fetchTo.mockResolvedValue({ ok: true, status: 200, json: () => Promise.resolve({}) });

      await reclamarCuentaSocio('12345678', 'tok-123');

      expect(fetchTo).toHaveBeenCalledWith('/api/v1/socios/por-dni/12345678/reclamar', 'POST', {
        token: 'tok-123',
      });
    });

    test('lanza "validacion-vencida" en 403', async () => {
      fetchTo.mockResolvedValue({ ok: false, status: 403 });

      await expect(reclamarCuentaSocio('12345678', 'tok-viejo')).rejects.toThrow('validacion-vencida');
    });

    test('lanza cuenta-ya-registrada en 409', async () => {
      fetchTo.mockResolvedValue({ ok: false, status: 409 });
      await expect(reclamarCuentaSocio('12345678')).rejects.toThrow('cuenta-ya-registrada');
    });

    test('lanza socio-no-encontrado en 404', async () => {
      fetchTo.mockResolvedValue({ ok: false, status: 404 });
      await expect(reclamarCuentaSocio('12345678')).rejects.toThrow('socio-no-encontrado');
    });

    test('lanza error genérico ante otras respuestas no exitosas', async () => {
      fetchTo.mockResolvedValue({ ok: false, status: 400 });
      await expect(reclamarCuentaSocio('12345678')).rejects.toThrow('Error al reclamar la cuenta del socio');
    });
  });

  describe('asignarPagoSimuladoClaim (rama demo)', () => {
    test('lleva el club en el path, porque el token todavía no tiene el claim club_id', async () => {
      fetchTo.mockResolvedValue({ ok: true, json: () => Promise.resolve({ ok: true }) });

      await asignarPagoSimuladoClaim('id-token');

      expect(fetchTo).toHaveBeenCalledWith(
        '/api/v1/auth/clubes/club-uno/claims/pago-simulado-demo',
        'POST',
        { id_token: 'id-token' },
      );
    });

    test('si el club no se puede resolver, no llega a pegarle al backend', async () => {
      idDeClubActual.mockRejectedValueOnce(new Error('club-desconocido'));

      await expect(asignarPagoSimuladoClaim('id-token')).rejects.toThrow('club-desconocido');
      expect(fetchTo).not.toHaveBeenCalled();
    });

    test('lanza un error si el backend rechaza la asignación', async () => {
      fetchTo.mockResolvedValue({ ok: false });

      await expect(asignarPagoSimuladoClaim('id-token')).rejects.toThrow('Error al asignar el permiso de pago simulado');
    });
  });

  describe('subirFotoSocio', () => {
    test('devuelve la respuesta cuando la subida es exitosa', async () => {
      const respuesta = { foto_url: 'https://res.cloudinary.com/demo/socios/1/foto.jpg' };
      fetchTo.mockResolvedValue({ ok: true, status: 200, json: () => Promise.resolve(respuesta) });

      const resultado = await subirFotoSocio(1, 'data:image/png;base64,AAAA');

      expect(fetchTo).toHaveBeenCalledWith('/api/v1/socios/1/foto', 'POST', {
        imagen_base64: 'data:image/png;base64,AAAA',
      });
      expect(resultado).toEqual(respuesta);
    });

    test('lanza servicio-no-disponible en 500', async () => {
      fetchTo.mockResolvedValue({ ok: false, status: 500 });
      await expect(subirFotoSocio(1, 'x')).rejects.toThrow('servicio-no-disponible');
    });

    test('lanza error genérico ante otras respuestas no exitosas', async () => {
      fetchTo.mockResolvedValue({ ok: false, status: 400 });
      await expect(subirFotoSocio(1, 'x')).rejects.toThrow('Error al subir la foto');
    });
  });

  describe('getSocioByNroSocio', () => {
    test('devuelve el socio cuando lo encuentra', async () => {
      const socio = { id: 'socio-2', nro_socio: '2000', nombre: 'Luis', apellido: 'Gómez' };
      fetchTo.mockResolvedValue({ ok: true, status: 200, json: () => Promise.resolve(socio) });

      const resultado = await getSocioByNroSocio('2000');

      expect(fetchTo).toHaveBeenCalledWith('/api/v1/socios/por-nro-socio/2000', 'GET');
      expect(resultado).toEqual(socio);
    });

    test('lanza socio-no-encontrado en 404', async () => {
      fetchTo.mockResolvedValue({ ok: false, status: 404 });
      await expect(getSocioByNroSocio('9999')).rejects.toThrow('socio-no-encontrado');
    });

    test('lanza servicio-no-disponible en 500', async () => {
      fetchTo.mockResolvedValue({ ok: false, status: 500 });
      await expect(getSocioByNroSocio('2000')).rejects.toThrow('servicio-no-disponible');
    });

    test('lanza error genérico ante otras respuestas no exitosas', async () => {
      fetchTo.mockResolvedValue({ ok: false, status: 400 });
      await expect(getSocioByNroSocio('2000')).rejects.toThrow('Error al buscar socio');
    });
  });
});
