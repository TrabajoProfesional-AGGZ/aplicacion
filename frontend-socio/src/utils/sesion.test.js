import {
  DURACION_MAXIMA_SESION_MS,
  inicioDeSesion,
  sellarInicioDeSesion,
  msRestantesDeSesion,
  sesionExpirada,
} from './sesion';

describe('sesion', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  test('el tope es de tres días', () => {
    expect(DURACION_MAXIMA_SESION_MS).toBe(3 * 24 * 60 * 60 * 1000);
  });

  test('sella el inicio con el último login de Firebase, no con la hora de arranque', () => {
    // Redondeado al segundo porque `toUTCString()` no lleva milisegundos.
    const haceDosDias = Math.floor((Date.now() - 2 * 24 * 60 * 60 * 1000) / 1000) * 1000;

    const inicio = sellarInicioDeSesion({
      metadata: { lastSignInTime: new Date(haceDosDias).toUTCString() },
    });

    expect(inicio).toBe(haceDosDias);
    expect(inicioDeSesion()).toBe(inicio);
    expect(sesionExpirada(inicio)).toBe(false);
  });

  test('un login de hace más de tres días queda expirado', () => {
    const haceCuatroDias = new Date(Date.now() - 4 * 24 * 60 * 60 * 1000);

    const inicio = sellarInicioDeSesion({
      metadata: { lastSignInTime: haceCuatroDias.toUTCString() },
    });

    expect(sesionExpirada(inicio)).toBe(true);
    expect(msRestantesDeSesion(inicio)).toBeLessThan(0);
  });

  test('sin metadata de Firebase conserva el sello anterior en vez de renovar el plazo', () => {
    const haceCuatroDias = Date.now() - 4 * 24 * 60 * 60 * 1000;
    localStorage.setItem('sesion_iniciada_en', String(haceCuatroDias));

    expect(sellarInicioDeSesion({})).toBe(haceCuatroDias);
    expect(sesionExpirada(haceCuatroDias)).toBe(true);
  });

  test('sin metadata y sin sello previo sella ahora', () => {
    const inicio = sellarInicioDeSesion(null);

    expect(inicio).toBeGreaterThan(Date.now() - 5000);
    expect(sesionExpirada(inicio)).toBe(false);
  });

  test('sin sello no expira: no hay de dónde deducir la antigüedad', () => {
    expect(inicioDeSesion()).toBeNull();
    expect(sesionExpirada(null)).toBe(false);
  });

  test('ignora un sello corrupto en localStorage', () => {
    localStorage.setItem('sesion_iniciada_en', 'cualquier cosa');

    expect(inicioDeSesion()).toBeNull();
  });
});
