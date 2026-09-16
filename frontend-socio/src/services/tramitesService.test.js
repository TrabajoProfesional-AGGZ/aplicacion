import { getTiposTramite, getTramitesPorSocio, getTramitesPendientes, crearTramite } from './tramitesService';
import { fetchTo } from '../utils/utils';

jest.mock('../utils/utils', () => ({
  fetchTo: jest.fn(),
}));

const TIPO_MOCK = { id: 1, nombre: 'Apto médico', requiere_vencimiento: true };
const TRAMITE_MOCK = {
  id: 't-1',
  id_socio: 'socio-1',
  tipo_tramite: TIPO_MOCK,
  archivo_url: 'https://res.cloudinary.com/demo/tramites/socio-1/archivo.pdf',
  estado: 'en_revision',
  fecha_carga: '2026-07-10T00:00:00Z',
  fecha_vencimiento: '2027-07-10',
  observaciones: null,
  revisado_en: null,
};

describe('tramitesService', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getTiposTramite', () => {
    test('devuelve los tipos cuando la respuesta es exitosa', async () => {
      fetchTo.mockResolvedValue({ ok: true, status: 200, json: () => Promise.resolve([TIPO_MOCK]) });
      const resultado = await getTiposTramite();
      expect(fetchTo).toHaveBeenCalledWith('/api/v1/tramites/tipos', 'GET');
      expect(resultado).toEqual([TIPO_MOCK]);
    });

    test('lanza servicio-no-disponible en 500', async () => {
      fetchTo.mockResolvedValue({ ok: false, status: 500 });
      await expect(getTiposTramite()).rejects.toThrow('servicio-no-disponible');
    });

    test('lanza error genérico ante otras respuestas no exitosas', async () => {
      fetchTo.mockResolvedValue({ ok: false, status: 400 });
      await expect(getTiposTramite()).rejects.toThrow('Error al obtener los tipos de trámite');
    });
  });

  describe('getTramitesPorSocio', () => {
    test('devuelve los trámites del socio', async () => {
      fetchTo.mockResolvedValue({ ok: true, status: 200, json: () => Promise.resolve([TRAMITE_MOCK]) });
      const resultado = await getTramitesPorSocio('socio-1');
      expect(fetchTo).toHaveBeenCalledWith('/api/v1/tramites/por-socio/socio-1', 'GET');
      expect(resultado).toEqual([TRAMITE_MOCK]);
    });

    test('lanza servicio-no-disponible en 500', async () => {
      fetchTo.mockResolvedValue({ ok: false, status: 500 });
      await expect(getTramitesPorSocio('socio-1')).rejects.toThrow('servicio-no-disponible');
    });

    test('lanza error genérico ante otras respuestas no exitosas', async () => {
      fetchTo.mockResolvedValue({ ok: false, status: 404 });
      await expect(getTramitesPorSocio('socio-1')).rejects.toThrow('Error al obtener los trámites');
    });
  });

  describe('getTramitesPendientes', () => {
    test('devuelve vencidos/por_vencer/total', async () => {
      const pendientes = { vencidos: [TRAMITE_MOCK], por_vencer: [], total: 1 };
      fetchTo.mockResolvedValue({ ok: true, status: 200, json: () => Promise.resolve(pendientes) });
      const resultado = await getTramitesPendientes('socio-1');
      expect(fetchTo).toHaveBeenCalledWith('/api/v1/tramites/pendientes/socio-1', 'GET');
      expect(resultado).toEqual(pendientes);
    });

    test('lanza servicio-no-disponible en 500', async () => {
      fetchTo.mockResolvedValue({ ok: false, status: 500 });
      await expect(getTramitesPendientes('socio-1')).rejects.toThrow('servicio-no-disponible');
    });
  });

  describe('crearTramite', () => {
    test('llama a POST con el body correcto', async () => {
      fetchTo.mockResolvedValue({ ok: true, status: 201, json: () => Promise.resolve(TRAMITE_MOCK) });
      const resultado = await crearTramite('socio-1', {
        id_tipo_tramite: 1,
        archivo_base64: 'data:application/pdf;base64,AAAA',
        fecha_vencimiento: '2027-07-10',
      });
      expect(fetchTo).toHaveBeenCalledWith('/api/v1/tramites/socio-1', 'POST', {
        id_tipo_tramite: 1,
        archivo_base64: 'data:application/pdf;base64,AAAA',
        fecha_vencimiento: '2027-07-10',
      });
      expect(resultado).toEqual(TRAMITE_MOCK);
    });

    test('envía fecha_vencimiento null si no se pasa', async () => {
      fetchTo.mockResolvedValue({ ok: true, status: 201, json: () => Promise.resolve(TRAMITE_MOCK) });
      await crearTramite('socio-1', { id_tipo_tramite: 2, archivo_base64: 'data:image/jpeg;base64,AAAA' });
      expect(fetchTo).toHaveBeenCalledWith('/api/v1/tramites/socio-1', 'POST', {
        id_tipo_tramite: 2,
        archivo_base64: 'data:image/jpeg;base64,AAAA',
        fecha_vencimiento: null,
      });
    });

    test('lanza archivo-muy-grande en 413', async () => {
      fetchTo.mockResolvedValue({ ok: false, status: 413 });
      await expect(crearTramite('socio-1', { id_tipo_tramite: 1, archivo_base64: 'x' })).rejects.toThrow('archivo-muy-grande');
    });

    test('lanza servicio-no-disponible en 500', async () => {
      fetchTo.mockResolvedValue({ ok: false, status: 500 });
      await expect(crearTramite('socio-1', { id_tipo_tramite: 1, archivo_base64: 'x' })).rejects.toThrow('servicio-no-disponible');
    });

    test('lanza error genérico ante otras respuestas no exitosas', async () => {
      fetchTo.mockResolvedValue({ ok: false, status: 400 });
      await expect(crearTramite('socio-1', { id_tipo_tramite: 1, archivo_base64: 'x' })).rejects.toThrow('Error al subir el trámite');
    });
  });
});
