import { renderHook } from '@testing-library/react';
import { useStepHistory } from './useStepHistory';

const STEPS = ['lista', 'detalle', 'socios', 'resumen'];

describe('useStepHistory', () => {
  let pushStateSpy;
  let goSpy;

  beforeEach(() => {
    pushStateSpy = jest.spyOn(window.history, 'pushState');
    goSpy = jest.spyOn(window.history, 'go').mockImplementation(() => {});
  });

  afterEach(() => {
    pushStateSpy.mockRestore();
    goSpy.mockRestore();
  });

  test('no empuja nada al montar en el primer paso', () => {
    renderHook(() => useStepHistory('lista', STEPS, jest.fn()));
    expect(pushStateSpy).not.toHaveBeenCalled();
  });

  test('empuja una entrada por cada paso que avanza', () => {
    const { rerender } = renderHook(
      ({ step }) => useStepHistory(step, STEPS, jest.fn()),
      { initialProps: { step: 'lista' } }
    );

    rerender({ step: 'detalle' });
    expect(pushStateSpy).toHaveBeenCalledTimes(1);

    rerender({ step: 'socios' });
    expect(pushStateSpy).toHaveBeenCalledTimes(2);
  });

  test('un salto explícito hacia atrás (ej. Cancelar) consume varias entradas con un solo go(-n)', () => {
    const { rerender } = renderHook(
      ({ step }) => useStepHistory(step, STEPS, jest.fn()),
      { initialProps: { step: 'lista' } }
    );

    rerender({ step: 'detalle' });
    rerender({ step: 'socios' });
    rerender({ step: 'resumen' });
    expect(pushStateSpy).toHaveBeenCalledTimes(3);

    rerender({ step: 'lista' });
    expect(goSpy).toHaveBeenCalledTimes(1);
    expect(goSpy).toHaveBeenCalledWith(-3);
  });

  test('un gesto de atrás físico en profundidad 0 no hace nada (deja pasar al consumidor externo)', () => {
    const onBack = jest.fn();
    renderHook(() => useStepHistory('lista', STEPS, onBack));

    window.dispatchEvent(new PopStateEvent('popstate'));
    expect(onBack).not.toHaveBeenCalled();
  });

  test('un gesto de atrás físico en profundidad > 0 consume una sola entrada y llama a onBack con el paso anterior', () => {
    const onBack = jest.fn();
    const { rerender } = renderHook(
      ({ step }) => useStepHistory(step, STEPS, onBack),
      { initialProps: { step: 'lista' } }
    );

    rerender({ step: 'detalle' });
    rerender({ step: 'socios' });

    // Simula dónde aterriza un back físico real: la posición del navegador
    // ya no es la última entrada pusheada por este hook.
    window.history.replaceState({ otraEntrada: true }, '');
    window.dispatchEvent(new PopStateEvent('popstate'));

    expect(onBack).toHaveBeenCalledTimes(1);
    expect(onBack).toHaveBeenCalledWith('detalle');
  });

  test('un popstate que aterriza de vuelta en la propia entrada (pop anidado) no llama a onBack', () => {
    const onBack = jest.fn();
    const { rerender } = renderHook(
      ({ step }) => useStepHistory(step, STEPS, onBack),
      { initialProps: { step: 'lista' } }
    );

    rerender({ step: 'detalle' });

    // window.history.state sigue siendo la entrada que este hook pusheó
    // (pushState es un passthrough real sobre jsdom acá) — simula un
    // consumidor anidado que consumió su propia entrada por encima.
    window.dispatchEvent(new PopStateEvent('popstate'));
    expect(onBack).not.toHaveBeenCalled();
  });

  test('después de un back físico, el siguiente avance vuelve a empujar sin desincronizar la profundidad', () => {
    const onBack = jest.fn();
    const { rerender } = renderHook(
      ({ step }) => useStepHistory(step, STEPS, onBack),
      { initialProps: { step: 'lista' } }
    );

    rerender({ step: 'detalle' });
    rerender({ step: 'socios' });
    expect(pushStateSpy).toHaveBeenCalledTimes(2);

    // Back físico: socios(2) -> detalle(1), consume una sola entrada.
    window.history.replaceState({ otraEntrada: true }, '');
    window.dispatchEvent(new PopStateEvent('popstate'));
    rerender({ step: 'detalle' });
    expect(onBack).toHaveBeenCalledWith('detalle');

    // Avanzar de nuevo debe volver a empujar una entrada (profundidad 1 -> 2).
    rerender({ step: 'socios' });
    expect(pushStateSpy).toHaveBeenCalledTimes(3);
  });
});
