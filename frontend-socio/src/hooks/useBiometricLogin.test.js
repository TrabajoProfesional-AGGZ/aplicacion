import { renderHook, act, waitFor } from '@testing-library/react';
import { useBiometricLogin } from './useBiometricLogin';
import * as authService from '../utils/authService';
import * as webauthnService from '../utils/webauthnService';

jest.mock('../firebase', () => ({ auth: {} }));
jest.mock('../utils/authService', () => ({
  login: jest.fn(),
}));
jest.mock('../utils/webauthnService', () => ({
  enroll: jest.fn(),
  hasEnrolledCredential: jest.fn(),
  isPlatformAuthenticatorAvailable: jest.fn(),
  unenroll: jest.fn(),
  unlock: jest.fn(),
}));

describe('useBiometricLogin', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    webauthnService.hasEnrolledCredential.mockReturnValue(false);
    webauthnService.isPlatformAuthenticatorAvailable.mockResolvedValue(false);
  });

  test('refleja `enrolado` desde hasEnrolledCredential() en el estado inicial', () => {
    webauthnService.hasEnrolledCredential.mockReturnValue(true);
    const { result } = renderHook(() => useBiometricLogin());
    expect(result.current.enrolado).toBe(true);
  });

  test('actualiza `soportado` cuando isPlatformAuthenticatorAvailable resuelve true', async () => {
    webauthnService.isPlatformAuthenticatorAvailable.mockResolvedValue(true);
    const { result } = renderHook(() => useBiometricLogin());
    expect(result.current.soportado).toBe(false);
    await waitFor(() => expect(result.current.soportado).toBe(true));
  });

  test('ofrecerEnrolamiento llama a enroll() y marca `enrolado` en true', async () => {
    webauthnService.enroll.mockResolvedValue();
    const { result } = renderHook(() => useBiometricLogin());

    await act(async () => {
      await result.current.ofrecerEnrolamiento('socio@club.com', 'clave123');
    });

    expect(webauthnService.enroll).toHaveBeenCalledWith('socio@club.com', 'clave123');
    expect(result.current.enrolado).toBe(true);
  });

  test('ofrecerEnrolamiento propaga el error y setea `error` si enroll() falla', async () => {
    webauthnService.enroll.mockRejectedValue(new Error('biometria-no-soportada'));
    const { result } = renderHook(() => useBiometricLogin());

    await act(async () => {
      await expect(result.current.ofrecerEnrolamiento('a@a.com', 'x')).rejects.toThrow('biometria-no-soportada');
    });

    expect(result.current.error).toBe('biometria-no-soportada');
    expect(result.current.enrolado).toBe(false);
  });

  test('desenrolar llama a unenroll() y marca `enrolado` en false', async () => {
    webauthnService.hasEnrolledCredential.mockReturnValue(true);
    webauthnService.unenroll.mockResolvedValue();
    const { result } = renderHook(() => useBiometricLogin());
    expect(result.current.enrolado).toBe(true);

    await act(async () => {
      await result.current.desenrolar();
    });

    expect(webauthnService.unenroll).toHaveBeenCalledTimes(1);
    expect(result.current.enrolado).toBe(false);
  });

  test('iniciarSesionBiometrico descifra con unlock() y llama a login() con esas credenciales', async () => {
    webauthnService.unlock.mockResolvedValue({ email: 'socio@club.com', password: 'clave123' });
    authService.login.mockResolvedValue();
    const { result } = renderHook(() => useBiometricLogin());

    await act(async () => {
      await result.current.iniciarSesionBiometrico();
    });

    expect(authService.login).toHaveBeenCalledWith('socio@club.com', 'clave123');
    expect(result.current.error).toBeNull();
  });

  test('iniciarSesionBiometrico propaga el error si unlock() se cancela', async () => {
    webauthnService.unlock.mockRejectedValue(new Error('biometria-cancelada'));
    const { result } = renderHook(() => useBiometricLogin());

    await act(async () => {
      await expect(result.current.iniciarSesionBiometrico()).rejects.toThrow('biometria-cancelada');
    });

    expect(authService.login).not.toHaveBeenCalled();
    expect(result.current.error).toBe('biometria-cancelada');
  });
});
