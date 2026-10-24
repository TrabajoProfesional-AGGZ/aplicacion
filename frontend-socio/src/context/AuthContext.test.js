import { render, screen, act, waitFor } from '@testing-library/react';
import { AuthProvider } from './AuthContext';
import { useAuth } from '../hooks/useAuth';

jest.mock('../firebase', () => (
  {
    auth: {currentUser: {email: 'ana@example.com'}},
    messaging: {} 
  }
));
jest.mock('firebase/messaging', () => ({
  getToken: jest.fn(),
}));

let callbackAuthState;
const mockSignOut = jest.fn();
jest.mock('firebase/auth', () => ({
  onAuthStateChanged: (auth, callback) => {
    callbackAuthState = callback;
    return () => {};
  },
  signOut: (...args) => mockSignOut(...args),
}));

jest.mock('../utils/utils', () => ({
  fetchTo: jest.fn(),
}));
import { fetchTo } from '../utils/utils';

function Sonda() {
  const { socio } = useAuth();
  return <span>socio: {socio ? socio.nombre : 'ninguno'}</span>;
}

describe('AuthProvider — Contingencia Offline', () => {
  const originalOnLine = navigator.onLine;

  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    Object.defineProperty(navigator, 'onLine', { configurable: true, value: true });
  });

  afterAll(() => {
    Object.defineProperty(navigator, 'onLine', { configurable: true, value: originalOnLine });
  });

  test('rescata la sesión local inmediatamente en arranque en frío (PWA Cold Boot) sin internet', async () => {
    Object.defineProperty(navigator, 'onLine', { configurable: true, value: false });
    
    localStorage.setItem('socio_totp_secret', 'SECRETO123');
    localStorage.setItem('socio_id', 'id-123');
    localStorage.setItem('socio_nombre', 'Lautaro');
    localStorage.setItem('socio_nro_socio', '1234');

    render(
      <AuthProvider>
        <Sonda />
      </AuthProvider>
    );

    expect(await screen.findByText('socio: Lautaro')).toBeInTheDocument();
  });

  test('rescata la sesión local si falla el backend con la app abierta (pérdida de red en uso)', async () => {
    fetchTo.mockRejectedValueOnce(new Error('Network error'));
    
    localStorage.setItem('socio_totp_secret', 'SECRETO123');
    localStorage.setItem('socio_id', 'id-123');
    localStorage.setItem('socio_nombre', 'Lautaro');
    localStorage.setItem('socio_nro_socio', '1234');

    render(
      <AuthProvider>
        <Sonda />
      </AuthProvider>
    );

    await act(async () => {
      await callbackAuthState({ email: 'lautaro@example.com', getIdToken: async () => 'token' });
    });

    expect(await screen.findByText('socio: Lautaro')).toBeInTheDocument();
  });

  test('falla completamente si no hay conexión y tampoco hay datos locales', async () => {
    fetchTo.mockRejectedValueOnce(new Error('Network error'));

    render(
      <AuthProvider>
        <Sonda />
      </AuthProvider>
    );

    await act(async () => {
      await callbackAuthState({ email: 'lautaro@example.com', getIdToken: async () => 'token' });
    });

    expect(await screen.findByText('socio: ninguno')).toBeInTheDocument();
  });
});

describe('AuthProvider — vencimiento de la sesión a los tres días', () => {
  const CUATRO_DIAS = 4 * 24 * 60 * 60 * 1000;
  const DOS_DIAS = 2 * 24 * 60 * 60 * 1000;

  function usuario(hace) {
    return {
      email: 'lautaro@example.com',
      getIdToken: async () => 'token',
      metadata: { lastSignInTime: new Date(Date.now() - hace).toUTCString() },
    };
  }

  function sembrarSesionCacheada() {
    localStorage.setItem('socio_totp_secret', 'SECRETO123');
    localStorage.setItem('socio_id', 'id-123');
    localStorage.setItem('socio_nombre', 'Lautaro');
  }

  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    Object.defineProperty(navigator, 'onLine', { configurable: true, value: true });
  });

  test('cierra la sesión si el login fue hace más de tres días', async () => {
    render(
      <AuthProvider>
        <Sonda />
      </AuthProvider>
    );

    await act(async () => {
      await callbackAuthState(usuario(CUATRO_DIAS));
    });

    expect(mockSignOut).toHaveBeenCalled();
    expect(fetchTo).not.toHaveBeenCalled();
    expect(await screen.findByText('socio: ninguno')).toBeInTheDocument();
  });

  test('no la cierra si el login fue hace menos de tres días', async () => {
    fetchTo.mockResolvedValueOnce({ ok: true, json: async () => ({ nombre: 'Lautaro' }) });

    render(
      <AuthProvider>
        <Sonda />
      </AuthProvider>
    );

    await act(async () => {
      await callbackAuthState(usuario(DOS_DIAS));
    });

    expect(mockSignOut).not.toHaveBeenCalled();
    expect(await screen.findByText('socio: Lautaro')).toBeInTheDocument();
  });

  test('no rescata la sesión cacheada en un arranque offline si ya venció', async () => {
    Object.defineProperty(navigator, 'onLine', { configurable: true, value: false });
    sembrarSesionCacheada();
    localStorage.setItem('sesion_iniciada_en', String(Date.now() - CUATRO_DIAS));

    render(
      <AuthProvider>
        <Sonda />
      </AuthProvider>
    );

    expect(await screen.findByText('socio: ninguno')).toBeInTheDocument();
  });

  test('sí la rescata en un arranque offline si todavía está vigente', async () => {
    Object.defineProperty(navigator, 'onLine', { configurable: true, value: false });
    sembrarSesionCacheada();
    localStorage.setItem('sesion_iniciada_en', String(Date.now() - DOS_DIAS));

    render(
      <AuthProvider>
        <Sonda />
      </AuthProvider>
    );

    expect(await screen.findByText('socio: Lautaro')).toBeInTheDocument();
  });
});
