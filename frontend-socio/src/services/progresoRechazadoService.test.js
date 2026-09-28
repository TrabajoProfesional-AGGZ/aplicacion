import { guardarProgreso, leerProgreso, limpiarProgreso } from './progresoRechazadoService';

describe('progresoRechazadoService', () => {
  beforeEach(() => {
    localStorage.clear();
    jest.useFakeTimers({ doNotFake: ['queueMicrotask'] });
    jest.setSystemTime(new Date('2026-01-01T12:00:00Z'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('guarda y lee el progreso del mismo socio', () => {
    guardarProgreso('reserva', 'socio-1', { instalacion: 'Pileta' });
    const leido = leerProgreso('socio-1');
    expect(leido).toMatchObject({ tipo: 'reserva', socioId: 'socio-1', datos: { instalacion: 'Pileta' } });
  });

  test('devuelve null si el progreso es de otro socio', () => {
    guardarProgreso('reserva', 'socio-1', { instalacion: 'Pileta' });
    expect(leerProgreso('socio-2')).toBeNull();
  });

  test('devuelve null y borra el registro si ya expiró (pasaron más de 5 minutos)', () => {
    guardarProgreso('inscripcion', 'socio-1', { disciplina: 'Natación' });
    jest.advanceTimersByTime(5 * 60 * 1000 + 1);
    expect(leerProgreso('socio-1')).toBeNull();
    expect(localStorage.getItem('su_progreso_rechazado')).toBeNull();
  });

  test('todavía está disponible justo antes de los 5 minutos', () => {
    guardarProgreso('entrada', 'socio-1', { evento: 'e1' });
    jest.advanceTimersByTime(5 * 60 * 1000 - 1000);
    expect(leerProgreso('socio-1')).not.toBeNull();
  });

  test('devuelve null si el valor guardado está corrupto', () => {
    localStorage.setItem('su_progreso_rechazado', 'no-es-json{{{');
    expect(leerProgreso('socio-1')).toBeNull();
  });

  test('limpiarProgreso borra el registro', () => {
    guardarProgreso('compra', 'socio-1', { productoId: 'p1', cantidad: 2 });
    limpiarProgreso();
    expect(leerProgreso('socio-1')).toBeNull();
  });
});
