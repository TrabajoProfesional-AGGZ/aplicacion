import { renderHook } from '@testing-library/react';
import { useBackToRoot } from './useBackToRoot';

describe('useBackToRoot', () => {
  let pushStateSpy;
  let backSpy;

  beforeEach(() => {
    pushStateSpy = jest.spyOn(window.history, 'pushState');
    backSpy = jest.spyOn(window.history, 'back').mockImplementation(() => {});
  });

  afterEach(() => {
    pushStateSpy.mockRestore();
    backSpy.mockRestore();
  });

  test('no empuja nada mientras el valor está en la raíz', () => {
    renderHook(() => useBackToRoot('inicio', 'inicio', jest.fn()));
    expect(pushStateSpy).not.toHaveBeenCalled();
  });

  test('empuja una sola entrada al alejarse de la raíz, sin acumular en transiciones no-raíz→no-raíz', () => {
    const { rerender } = renderHook(
      ({ vista }) => useBackToRoot(vista, 'inicio', jest.fn()),
      { initialProps: { vista: 'inicio' } }
    );

    rerender({ vista: 'perfil' });
    expect(pushStateSpy).toHaveBeenCalledTimes(1);

    rerender({ vista: 'pagos' });
    expect(pushStateSpy).toHaveBeenCalledTimes(1);
  });

  test('un popstate que aterriza en una entrada distinta a la propia (gesto real) llama a onBack', () => {
    const onBack = jest.fn();
    renderHook(() => useBackToRoot('perfil', 'inicio', onBack));

    // Simula dónde aterriza un back real: la posición del navegador ya no es
    // la entrada que este hook pusheó (a diferencia de un popstate "fantasma"
    // causado por un consumidor anidado, que aterriza de vuelta en ella).
    window.history.replaceState({ otraEntrada: true }, '');
    window.dispatchEvent(new PopStateEvent('popstate'));
    expect(onBack).toHaveBeenCalledTimes(1);
  });

  test('un popstate que aterriza de vuelta en la propia entrada (pop anidado, ej. un modal) no llama a onBack', () => {
    const onBack = jest.fn();
    renderHook(() => useBackToRoot('perfil', 'inicio', onBack));

    // window.history.state sigue siendo la entrada que este hook pusheó al
    // montar (pushStateSpy es un passthrough real sobre jsdom) — simula un
    // modal anidado que consumió su propia entrada por encima y devolvió al
    // navegador exactamente a esta posición, sin salir del segmento de este
    // hook.
    window.dispatchEvent(new PopStateEvent('popstate'));
    expect(onBack).not.toHaveBeenCalled();
  });

  test('un popstate estando en la raíz no llama a onBack', () => {
    const onBack = jest.fn();
    renderHook(() => useBackToRoot('inicio', 'inicio', onBack));

    window.dispatchEvent(new PopStateEvent('popstate'));
    expect(onBack).not.toHaveBeenCalled();
  });

  test('volver a la raíz por otra vía (no popstate) consume la entrada pusheada', () => {
    const { rerender } = renderHook(
      ({ vista }) => useBackToRoot(vista, 'inicio', jest.fn()),
      { initialProps: { vista: 'perfil' } }
    );

    rerender({ vista: 'inicio' });
    expect(backSpy).toHaveBeenCalledTimes(1);
  });

  test('si algo más ya navegó encima (history.state cambió), no llama a history.back', () => {
    const { rerender } = renderHook(
      ({ vista }) => useBackToRoot(vista, 'inicio', jest.fn()),
      { initialProps: { vista: 'perfil' } }
    );

    // simula una navegación ajena (ej. un router) que pushea otra entrada encima
    window.history.pushState({ otraCosa: true }, '');

    rerender({ vista: 'inicio' });
    expect(backSpy).not.toHaveBeenCalled();
  });
});
