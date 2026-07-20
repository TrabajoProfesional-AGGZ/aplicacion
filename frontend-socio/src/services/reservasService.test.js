import {
  getReservasPorSocio,
  getReservasHistoricasPorSocio,
  getTurnosDisponibles,
  createReserva,
  cancelReserva,
} from './reservasService';
import { fetchTo } from '../utils/utils';

jest.mock('../utils/utils', () => ({
  fetchTo: jest.fn(),
}));

const RESERVA_MOCK = {
  id: 'reserva-1',
  id_instalacion: 'inst-1',
  fecha_reserva: '2027-01-10',
  hora_inicio: '10:00:00',
  hora_fin: '11:00:00',
  estado: 'Pendiente',
  socios: [],
};

describe('reservasService', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getReservasPorSocio', () => {
    test('devuelve las reservas del socio', async () => {
      fetchTo.mockResolvedValue({ ok: true, status: 200, json: () => Promise.resolve([RESERVA_MOCK]) });
      const resultado = await getReservasPorSocio('1000');
      expect(fetchTo).toHaveBeenCalledWith('/api/v1/reservas/por-socio/1000', 'GET');
      expect(resultado).toEqual([RESERVA_MOCK]);
    });

    test('soporta una respuesta envuelta en { reservas }', async () => {
      fetchTo.mockResolvedValue({ ok: true, status: 200, json: () => Promise.resolve({ reservas: [RESERVA_MOCK] }) });
      const resultado = await getReservasPorSocio('1000');
      expect(resultado).toEqual([RESERVA_MOCK]);
    });

    test('lanza servicio-no-disponible en 500', async () => {
      fetchTo.mockResolvedValue({ ok: false, status: 500 });
      await expect(getReservasPorSocio('1000')).rejects.toThrow('servicio-no-disponible');
    });

    test('lanza error genérico ante otras respuestas no exitosas', async () => {
      fetchTo.mockResolvedValue({ ok: false, status: 404 });
      await expect(getReservasPorSocio('1000')).rejects.toThrow('Error al obtener reservas');
    });
  });

  describe('getReservasHistoricasPorSocio', () => {
    test('devuelve las reservas históricas del socio', async () => {
      fetchTo.mockResolvedValue({ ok: true, status: 200, json: () => Promise.resolve([RESERVA_MOCK]) });
      const resultado = await getReservasHistoricasPorSocio('1000');
      expect(fetchTo).toHaveBeenCalledWith('/api/v1/reservas/historicas/por-socio/1000', 'GET');
      expect(resultado).toEqual([RESERVA_MOCK]);
    });
  });

  describe('getTurnosDisponibles', () => {
    test('arma la URL con instalación y fecha', async () => {
      fetchTo.mockResolvedValue({ ok: true, status: 200, json: () => Promise.resolve(['09:00:00']) });
      const resultado = await getTurnosDisponibles('inst-1', '2027-01-10');
      expect(fetchTo).toHaveBeenCalledWith('/api/v1/reservas/turnos-disponibles/inst-1?fecha=2027-01-10', 'GET');
      expect(resultado).toEqual(['09:00:00']);
    });

    test('lanza servicio-no-disponible en 500', async () => {
      fetchTo.mockResolvedValue({ ok: false, status: 500 });
      await expect(getTurnosDisponibles('inst-1', '2027-01-10')).rejects.toThrow('servicio-no-disponible');
    });

    test('lanza error genérico ante otras respuestas no exitosas', async () => {
      fetchTo.mockResolvedValue({ ok: false, status: 404 });
      await expect(getTurnosDisponibles('inst-1', '2027-01-10')).rejects.toThrow('Error al obtener turnos disponibles');
    });
  });

  describe('createReserva', () => {
    test('crea la reserva correctamente', async () => {
      fetchTo.mockResolvedValue({ ok: true, status: 201, json: () => Promise.resolve(RESERVA_MOCK) });
      const payload = { ids_socios: ['socio-1'], id_instalacion: 'inst-1', fecha_reserva: '2027-01-10', hora_inicio: '10:00:00' };
      const resultado = await createReserva(payload);
      expect(fetchTo).toHaveBeenCalledWith('/api/v1/reservas', 'POST', payload);
      expect(resultado).toEqual(RESERVA_MOCK);
    });

    test('lanza superposicion en 409', async () => {
      fetchTo.mockResolvedValue({ ok: false, status: 409 });
      await expect(createReserva({})).rejects.toThrow('superposicion');
    });

    test('lanza apto-medico en 403 con tipo apto_medico', async () => {
      fetchTo.mockResolvedValue({
        ok: false,
        status: 403,
        json: () => Promise.resolve({ detail: { tipo: 'apto_medico', socios_sin_apto_medico: ['1000'] } }),
      });
      await expect(createReserva({})).rejects.toThrow('apto-medico');
    });

    test('lanza socio-moroso en 403 con tipo moroso', async () => {
      fetchTo.mockResolvedValue({
        ok: false,
        status: 403,
        json: () => Promise.resolve({ detail: { tipo: 'moroso' } }),
      });
      await expect(createReserva({})).rejects.toThrow('socio-moroso');
    });

    test('lanza socio-suspendido en 403 con tipo suspendido', async () => {
      fetchTo.mockResolvedValue({
        ok: false,
        status: 403,
        json: () => Promise.resolve({ detail: { tipo: 'suspendido' } }),
      });
      await expect(createReserva({})).rejects.toThrow('socio-suspendido');
    });

    test('lanza servicio-no-disponible en 500', async () => {
      fetchTo.mockResolvedValue({ ok: false, status: 500 });
      await expect(createReserva({})).rejects.toThrow('servicio-no-disponible');
    });

    test('lanza error genérico ante otras respuestas no exitosas', async () => {
      fetchTo.mockResolvedValue({ ok: false, status: 400 });
      await expect(createReserva({})).rejects.toThrow('Error al crear la reserva');
    });
  });

  describe('cancelReserva', () => {
    test('cancela la reserva correctamente', async () => {
      const reservaCancelada = { ...RESERVA_MOCK, estado: 'Cancelada' };
      fetchTo.mockResolvedValue({ ok: true, status: 200, json: () => Promise.resolve(reservaCancelada) });
      const resultado = await cancelReserva('reserva-1');
      expect(fetchTo).toHaveBeenCalledWith('/api/v1/reservas/reserva-1', 'DELETE');
      expect(resultado).toEqual(reservaCancelada);
    });

    test('lanza fuera-de-tolerancia en 409 con el tiempo mínimo devuelto', async () => {
      fetchTo.mockResolvedValue({
        ok: false,
        status: 409,
        json: () => Promise.resolve({ detail: { tipo: 'fuera_de_tolerancia', tiempo_minimo_cancelacion: 60 } }),
      });
      try {
        await cancelReserva('reserva-1');
        throw new Error('no debería llegar acá');
      } catch (e) {
        expect(e.message).toBe('fuera-de-tolerancia');
        expect(e.tiempoMinimoCancelacion).toBe(60);
      }
    });

    test('lanza servicio-no-disponible en 500', async () => {
      fetchTo.mockResolvedValue({ ok: false, status: 500 });
      await expect(cancelReserva('reserva-1')).rejects.toThrow('servicio-no-disponible');
    });

    test('lanza error genérico ante otras respuestas no exitosas', async () => {
      fetchTo.mockResolvedValue({ ok: false, status: 400 });
      await expect(cancelReserva('reserva-1')).rejects.toThrow('Error al cancelar la reserva');
    });
  });
});
