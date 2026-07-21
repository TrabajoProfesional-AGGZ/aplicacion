import {
  getDisciplinasActivas,
  getDisciplinaById,
  getDisciplinasPorSocio,
  inscribirseADisciplina,
  sumarseAListaEspera,
} from './disciplinasService';
import { fetchTo } from '../utils/utils';

jest.mock('../utils/utils', () => ({
  fetchTo: jest.fn(),
}));

const DISCIPLINA = { id: 'disc-1', nombre: 'Natación', cupo_maximo: 20, cupos_ocupados: 5 };

describe('disciplinasService', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getDisciplinasActivas', () => {
    test('pide las disciplinas activas al backend', async () => {
      fetchTo.mockResolvedValue({ ok: true, status: 200, json: () => Promise.resolve([DISCIPLINA]) });
      const resultado = await getDisciplinasActivas();
      expect(fetchTo).toHaveBeenCalledWith('/api/v1/disciplinas?solo_activas=true', 'GET');
      expect(resultado).toEqual([DISCIPLINA]);
    });

    test('soporta una respuesta envuelta en { disciplinas }', async () => {
      fetchTo.mockResolvedValue({ ok: true, status: 200, json: () => Promise.resolve({ disciplinas: [DISCIPLINA] }) });
      const resultado = await getDisciplinasActivas();
      expect(resultado).toEqual([DISCIPLINA]);
    });

    test('lanza servicio-no-disponible en 500', async () => {
      fetchTo.mockResolvedValue({ ok: false, status: 500 });
      await expect(getDisciplinasActivas()).rejects.toThrow('servicio-no-disponible');
    });

    test('lanza error genérico ante otras respuestas no exitosas', async () => {
      fetchTo.mockResolvedValue({ ok: false, status: 400 });
      await expect(getDisciplinasActivas()).rejects.toThrow('Error al obtener disciplinas');
    });
  });

  describe('getDisciplinaById', () => {
    test('pide el detalle de la disciplina', async () => {
      fetchTo.mockResolvedValue({ ok: true, status: 200, json: () => Promise.resolve(DISCIPLINA) });
      const resultado = await getDisciplinaById('disc-1');
      expect(fetchTo).toHaveBeenCalledWith('/api/v1/disciplinas/disc-1', 'GET');
      expect(resultado).toEqual(DISCIPLINA);
    });

    test('lanza error si no se encuentra', async () => {
      fetchTo.mockResolvedValue({ ok: false, status: 404 });
      await expect(getDisciplinaById('disc-1')).rejects.toThrow('Error al obtener la disciplina');
    });
  });

  describe('getDisciplinasPorSocio', () => {
    test('pide las inscripciones del socio', async () => {
      fetchTo.mockResolvedValue({ ok: true, status: 200, json: () => Promise.resolve([DISCIPLINA]) });
      const resultado = await getDisciplinasPorSocio('socio-1');
      expect(fetchTo).toHaveBeenCalledWith('/api/v1/disciplinas/por-socio/socio-1', 'GET');
      expect(resultado).toEqual([DISCIPLINA]);
    });

    test('soporta una respuesta envuelta en { disciplinas }', async () => {
      fetchTo.mockResolvedValue({ ok: true, status: 200, json: () => Promise.resolve({ disciplinas: [DISCIPLINA] }) });
      const resultado = await getDisciplinasPorSocio('socio-1');
      expect(resultado).toEqual([DISCIPLINA]);
    });

    test('lanza servicio-no-disponible en 500', async () => {
      fetchTo.mockResolvedValue({ ok: false, status: 500 });
      await expect(getDisciplinasPorSocio('socio-1')).rejects.toThrow('servicio-no-disponible');
    });
  });

  describe('inscribirseADisciplina', () => {
    test('pide el alta al backend', async () => {
      fetchTo.mockResolvedValue({
        ok: true,
        status: 201,
        json: () => Promise.resolve({ id_socio: 'socio-1', id_disciplina: 'disc-1', estado_suscripcion: 'activa' }),
      });
      const resultado = await inscribirseADisciplina('disc-1', 'socio-1');
      expect(fetchTo).toHaveBeenCalledWith('/api/v1/disciplinas/disc-1/socios/socio-1', 'POST');
      expect(resultado.estado_suscripcion).toBe('activa');
    });

    test('lanza no-encontrado en 404', async () => {
      fetchTo.mockResolvedValue({ ok: false, status: 404 });
      await expect(inscribirseADisciplina('disc-1', 'socio-1')).rejects.toThrow('no-encontrado');
    });

    test('lanza sin-cupo en 409 con detail tipo sin_cupo', async () => {
      fetchTo.mockResolvedValue({
        ok: false,
        status: 409,
        json: () => Promise.resolve({ detail: { tipo: 'sin_cupo', mensaje: 'La disciplina alcanzó su cupo.' } }),
      });
      await expect(inscribirseADisciplina('disc-1', 'socio-1')).rejects.toThrow('sin-cupo');
    });

    test('lanza ya-inscripto en 409 con detail de texto plano', async () => {
      fetchTo.mockResolvedValue({
        ok: false,
        status: 409,
        json: () => Promise.resolve({ detail: 'El socio ya está inscripto a esta disciplina.' }),
      });
      await expect(inscribirseADisciplina('disc-1', 'socio-1')).rejects.toThrow('ya-inscripto');
    });

    test('lanza apto-medico en 403 con tipo apto_medico', async () => {
      fetchTo.mockResolvedValue({
        ok: false,
        status: 403,
        json: () => Promise.resolve({ detail: { tipo: 'apto_medico', socio: '1000' } }),
      });
      await expect(inscribirseADisciplina('disc-1', 'socio-1')).rejects.toThrow('apto-medico');
    });

    test('lanza moroso en 403 con tipo moroso', async () => {
      fetchTo.mockResolvedValue({
        ok: false,
        status: 403,
        json: () => Promise.resolve({ detail: { tipo: 'moroso', socio: '1000' } }),
      });
      await expect(inscribirseADisciplina('disc-1', 'socio-1')).rejects.toThrow('moroso');
    });

    test('lanza categoria-no-coincide en 403 con tipo categoria_no_coincide', async () => {
      fetchTo.mockResolvedValue({
        ok: false,
        status: 403,
        json: () => Promise.resolve({ detail: { tipo: 'categoria_no_coincide', categoria_requerida: 'Infantil' } }),
      });
      await expect(inscribirseADisciplina('disc-1', 'socio-1')).rejects.toThrow('categoria-no-coincide');
    });

    test('lanza servicio-no-disponible en 500', async () => {
      fetchTo.mockResolvedValue({ ok: false, status: 500 });
      await expect(inscribirseADisciplina('disc-1', 'socio-1')).rejects.toThrow('servicio-no-disponible');
    });
  });

  describe('sumarseAListaEspera', () => {
    test('pide sumarse a la lista de espera al backend', async () => {
      fetchTo.mockResolvedValue({
        ok: true,
        status: 201,
        json: () => Promise.resolve({ id_socio: 'socio-1', id_disciplina: 'disc-1', estado_suscripcion: 'en_espera' }),
      });
      const resultado = await sumarseAListaEspera('disc-1', 'socio-1');
      expect(fetchTo).toHaveBeenCalledWith('/api/v1/disciplinas/disc-1/socios/socio-1/lista-espera', 'POST');
      expect(resultado.estado_suscripcion).toBe('en_espera');
    });

    test('lanza ya-inscripto si ya está en la lista de espera', async () => {
      fetchTo.mockResolvedValue({
        ok: false,
        status: 409,
        json: () => Promise.resolve({ detail: 'El socio ya está en la lista de espera de esta disciplina.' }),
      });
      await expect(sumarseAListaEspera('disc-1', 'socio-1')).rejects.toThrow('ya-inscripto');
    });
  });
});
