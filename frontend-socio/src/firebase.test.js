const mockSetPersistence = jest.fn().mockResolvedValue();
const mockGetAuth = jest.fn(() => ({}));
const mockInitializeApp = jest.fn(() => ({}));
const SESSION_PERSISTENCE_MARKER = 'session-persistence';

jest.mock('firebase/app', () => ({
  initializeApp: (...args) => mockInitializeApp(...args),
}));

jest.mock('firebase/auth', () => ({
  getAuth: (...args) => mockGetAuth(...args),
  setPersistence: (...args) => mockSetPersistence(...args),
  browserSessionPersistence: SESSION_PERSISTENCE_MARKER,
}));

describe('firebase', () => {
  test('configura la sesión como browserSessionPersistence, no persistente entre cierres de la app', async () => {
    await import('./firebase');

    expect(mockSetPersistence).toHaveBeenCalledWith(expect.anything(), SESSION_PERSISTENCE_MARKER);
  });
});
