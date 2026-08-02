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

async function loguearSocio(firebaseUser = { email: 'ana@example.com', getIdToken: async () => 'token' }) {
  fetchTo.mockResolvedValueOnce({ ok: true, json: async () => ({ nombre: 'Ana' }) });
  await act(async () => {
    await callbackAuthState(firebaseUser);
  });
}

describe('AuthProvider — cierre de sesión por inactividad', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    global.Notification = {
      requestPermission: jest.fn().mockResolvedValue('denied'),
    };
  });

  afterEach(() => {
    jest.useRealTimers();
    delete global.Notification;
  });

  test('cierra la sesión automáticamente tras 10 minutos sin actividad', async () => {
    render(
      <AuthProvider>
        <Sonda />
      </AuthProvider>,
    );
    await loguearSocio();
    expect(await screen.findByText('socio: Ana')).toBeInTheDocument();

    act(() => jest.advanceTimersByTime(10 * 60 * 1000));

    await waitFor(() => expect(mockSignOut).toHaveBeenCalledTimes(1));
  });

  test('la actividad del usuario evita el cierre automático antes de tiempo', async () => {
    render(
      <AuthProvider>
        <Sonda />
      </AuthProvider>,
    );
    await loguearSocio();
    await screen.findByText('socio: Ana');

    act(() => jest.advanceTimersByTime(9 * 60 * 1000));
    act(() => document.dispatchEvent(new Event('touchstart')));
    act(() => jest.advanceTimersByTime(9 * 60 * 1000));

    expect(mockSignOut).not.toHaveBeenCalled();
  });

  test('no cierra sesión por inactividad si no hay un socio logueado', async () => {
    render(
      <AuthProvider>
        <Sonda />
      </AuthProvider>,
    );
    await act(async () => {
      await callbackAuthState(null);
    });

    act(() => jest.advanceTimersByTime(60 * 60 * 1000));

    expect(mockSignOut).not.toHaveBeenCalled();
  });
});

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
