import { renderHook } from '@testing-library/react';
import { useEdgeSwipeBack } from './useEdgeSwipeBack';

function pointerEvent(type, { clientX, clientY }) {
  return new MouseEvent(type, { clientX, clientY });
}

function swipe(desde, hasta) {
  window.dispatchEvent(pointerEvent('pointerdown', desde));
  window.dispatchEvent(pointerEvent('pointermove', hasta));
}

describe('useEdgeSwipeBack', () => {
  let backSpy;

  beforeEach(() => {
    backSpy = jest.spyOn(window.history, 'back').mockImplementation(() => {});
  });

  afterEach(() => {
    backSpy.mockRestore();
  });

  test('deshabilitado (default, no iOS standalone) no escucha nada', () => {
    renderHook(() => useEdgeSwipeBack(false));
    window.history.replaceState({ id: 1 }, '');
    swipe({ clientX: 5, clientY: 100 }, { clientX: 100, clientY: 100 });
    expect(backSpy).not.toHaveBeenCalled();
  });

  test('swipe desde el borde izquierdo con historial pusheado llama a history.back', () => {
    renderHook(() => useEdgeSwipeBack(true));
    window.history.replaceState({ backToRoot: true, id: 3 }, '');

    swipe({ clientX: 5, clientY: 200 }, { clientX: 90, clientY: 200 });
    expect(backSpy).toHaveBeenCalledTimes(1);
  });

  test('swipe que no arranca en el borde no dispara', () => {
    renderHook(() => useEdgeSwipeBack(true));
    window.history.replaceState({ id: 3 }, '');

    swipe({ clientX: 120, clientY: 200 }, { clientX: 250, clientY: 200 });
    expect(backSpy).not.toHaveBeenCalled();
  });

  test('swipe mayormente vertical no dispara', () => {
    renderHook(() => useEdgeSwipeBack(true));
    window.history.replaceState({ id: 3 }, '');

    swipe({ clientX: 5, clientY: 100 }, { clientX: 40, clientY: 300 });
    expect(backSpy).not.toHaveBeenCalled();
  });

  test('sin ninguna entrada de historial propia (sin id numérico) no llama a history.back', () => {
    renderHook(() => useEdgeSwipeBack(true));
    window.history.replaceState(null, '');

    swipe({ clientX: 5, clientY: 200 }, { clientX: 90, clientY: 200 });
    expect(backSpy).not.toHaveBeenCalled();
  });

  test('desmontar deja de escuchar los eventos', () => {
    const { unmount } = renderHook(() => useEdgeSwipeBack(true));
    window.history.replaceState({ id: 3 }, '');
    unmount();

    swipe({ clientX: 5, clientY: 200 }, { clientX: 90, clientY: 200 });
    expect(backSpy).not.toHaveBeenCalled();
  });
});
