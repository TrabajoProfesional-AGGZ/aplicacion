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

  test('un popstate estando lejos de la raíz llama a onBack', () => {
    const onBack = jest.fn();
    renderHook(() => useBackToRoot('perfil', 'inicio', onBack));

    window.dispatchEvent(new PopStateEvent('popstate'));
    expect(onBack).toHaveBeenCalledTimes(1);
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
