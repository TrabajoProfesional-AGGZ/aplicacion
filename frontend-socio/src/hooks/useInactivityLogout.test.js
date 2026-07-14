import { renderHook, act } from '@testing-library/react';
import { useInactivityLogout } from './useInactivityLogout';

describe('useInactivityLogout', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('llama a onTimeout tras el tiempo de inactividad configurado', () => {
    const onTimeout = jest.fn();
    renderHook(() => useInactivityLogout(true, 10 * 60 * 1000, onTimeout));

    act(() => jest.advanceTimersByTime(10 * 60 * 1000 - 1));
    expect(onTimeout).not.toHaveBeenCalled();

    act(() => jest.advanceTimersByTime(1));
    expect(onTimeout).toHaveBeenCalledTimes(1);
  });

  test('la actividad del usuario reinicia el temporizador', () => {
    const onTimeout = jest.fn();
    renderHook(() => useInactivityLogout(true, 10 * 60 * 1000, onTimeout));

    act(() => jest.advanceTimersByTime(9 * 60 * 1000));
    act(() => document.dispatchEvent(new Event('mousemove')));
    act(() => jest.advanceTimersByTime(9 * 60 * 1000));
    expect(onTimeout).not.toHaveBeenCalled();

    act(() => jest.advanceTimersByTime(60 * 1000));
    expect(onTimeout).toHaveBeenCalledTimes(1);
  });

  test('no arranca el temporizador si activo es false', () => {
    const onTimeout = jest.fn();
    renderHook(() => useInactivityLogout(false, 10 * 60 * 1000, onTimeout));

    act(() => jest.advanceTimersByTime(60 * 60 * 1000));
    expect(onTimeout).not.toHaveBeenCalled();
  });

  test('al volver a estar visible, cierra sesión si ya pasó el tiempo de inactividad aunque el timer no haya disparado', () => {
    const onTimeout = jest.fn();
    renderHook(() => useInactivityLogout(true, 10 * 60 * 1000, onTimeout));

    Object.defineProperty(document, 'visibilityState', { value: 'visible', configurable: true });
    const ahoraOriginal = Date.now;
    Date.now = () => ahoraOriginal() + 11 * 60 * 1000;

    act(() => document.dispatchEvent(new Event('visibilitychange')));

    expect(onTimeout).toHaveBeenCalledTimes(1);
    Date.now = ahoraOriginal;
  });

  test('desmontar limpia el temporizador y no llama a onTimeout', () => {
    const onTimeout = jest.fn();
    const { unmount } = renderHook(() => useInactivityLogout(true, 10 * 60 * 1000, onTimeout));

    unmount();
    act(() => jest.advanceTimersByTime(60 * 60 * 1000));

    expect(onTimeout).not.toHaveBeenCalled();
  });
});
