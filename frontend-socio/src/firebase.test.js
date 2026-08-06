const mockSetPersistence = jest.fn().mockResolvedValue();
const mockGetAuth = jest.fn(() => ({}));
const mockInitializeApp = jest.fn(() => ({}));

jest.mock('firebase/app', () => ({
  initializeApp: (...args) => mockInitializeApp(...args),
}));

jest.mock('firebase/auth', () => ({
  getAuth: (...args) => mockGetAuth(...args),
  setPersistence: (...args) => mockSetPersistence(...args),
}));

jest.mock('firebase/messaging', () => ({
  getMessaging: jest.fn(() => ({})),
}));

describe('firebase', () => {
  test('no fuerza ninguna persistencia de sesión, usa el default de Firebase (persiste entre cierres de la app)', async () => {
    await import('./firebase');

    expect(mockSetPersistence).not.toHaveBeenCalled();
  });
});
