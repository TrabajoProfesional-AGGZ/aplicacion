import { getDisciplinasActivas, getDisciplinaById, getDisciplinasPorSocio } from './disciplinasService';
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
});
