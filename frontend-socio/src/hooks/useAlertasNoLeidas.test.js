import { renderHook, waitFor, act } from '@testing-library/react';
import { useAlertasNoLeidas } from './useAlertasNoLeidas';
import { getAlertasSocio } from '../services/alertasService';

jest.mock('../services/alertasService', () => ({
  getAlertasSocio: jest.fn(),
}));

const ALERTA_VIEJA = { id: 'a-1', creado_en: '2026-07-01T10:00:00Z' };
const ALERTA_NUEVA = { id: 'a-2', creado_en: '2026-07-10T10:00:00Z' };

describe('useAlertasNoLeidas', () => {
  beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
  });

  test('sin alertas, no muestra el badge', async () => {
    getAlertasSocio.mockResolvedValue([]);
    const { result } = renderHook(() => useAlertasNoLeidas('socio-1'));
    await waitFor(() => expect(getAlertasSocio).toHaveBeenCalled());
    expect(result.current.hayNoLeidas).toBe(false);
  });

  test('con alertas y sin visita previa registrada, muestra el badge', async () => {
    getAlertasSocio.mockResolvedValue([ALERTA_VIEJA]);
    const { result } = renderHook(() => useAlertasNoLeidas('socio-1'));
    await waitFor(() => expect(result.current.hayNoLeidas).toBe(true));
  });

  test('si ya se vio una alerta tan reciente como la última, no muestra el badge', async () => {
    localStorage.setItem('alertas_ultima_vista_socio-1', ALERTA_NUEVA.creado_en);
    getAlertasSocio.mockResolvedValue([ALERTA_NUEVA]);
    const { result } = renderHook(() => useAlertasNoLeidas('socio-1'));
    await waitFor(() => expect(getAlertasSocio).toHaveBeenCalled());
    expect(result.current.hayNoLeidas).toBe(false);
  });

  test('si aparece una alerta más nueva que la última vista, muestra el badge', async () => {
    localStorage.setItem('alertas_ultima_vista_socio-1', ALERTA_VIEJA.creado_en);
    getAlertasSocio.mockResolvedValue([ALERTA_VIEJA, ALERTA_NUEVA]);
    const { result } = renderHook(() => useAlertasNoLeidas('socio-1'));
    await waitFor(() => expect(result.current.hayNoLeidas).toBe(true));
  });

  test('marcarComoLeidas guarda la fecha más reciente y apaga el badge', async () => {
    getAlertasSocio.mockResolvedValue([ALERTA_VIEJA, ALERTA_NUEVA]);
    const { result } = renderHook(() => useAlertasNoLeidas('socio-1'));
    await waitFor(() => expect(result.current.hayNoLeidas).toBe(true));

    act(() => { result.current.marcarComoLeidas([ALERTA_VIEJA, ALERTA_NUEVA]); });

    expect(result.current.hayNoLeidas).toBe(false);
    expect(localStorage.getItem('alertas_ultima_vista_socio-1')).toBe(ALERTA_NUEVA.creado_en);
  });

  test('el guardado es por socio: la marca de un socio no afecta a otro', async () => {
    localStorage.setItem('alertas_ultima_vista_socio-2', ALERTA_NUEVA.creado_en);
    getAlertasSocio.mockResolvedValue([ALERTA_NUEVA]);
    const { result } = renderHook(() => useAlertasNoLeidas('socio-1'));
    await waitFor(() => expect(result.current.hayNoLeidas).toBe(true));
  });

  test('repolla cada 60s: una alerta nueva que llega mientras el socio está adentro prende el badge', async () => {
    jest.useFakeTimers();
    getAlertasSocio.mockResolvedValue([]);
    const { result } = renderHook(() => useAlertasNoLeidas('socio-1'));
    await act(async () => { await Promise.resolve(); });
    expect(result.current.hayNoLeidas).toBe(false);

    getAlertasSocio.mockResolvedValue([ALERTA_NUEVA]);
    await act(async () => {
      jest.advanceTimersByTime(60_000);
      await Promise.resolve();
    });

    expect(getAlertasSocio).toHaveBeenCalledTimes(2);
    expect(result.current.hayNoLeidas).toBe(true);
    jest.useRealTimers();
  });

  test('al desmontar, deja de repollar', async () => {
    jest.useFakeTimers();
    getAlertasSocio.mockResolvedValue([]);
    const { unmount } = renderHook(() => useAlertasNoLeidas('socio-1'));
    await act(async () => { await Promise.resolve(); });
    unmount();

    getAlertasSocio.mockClear();
    act(() => { jest.advanceTimersByTime(120_000); });

    expect(getAlertasSocio).not.toHaveBeenCalled();
    jest.useRealTimers();
  });
});
