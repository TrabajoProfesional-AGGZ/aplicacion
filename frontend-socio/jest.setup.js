import '@testing-library/jest-dom';

jest.setTimeout(15000);

global.fetch ??= jest.fn();
global.Request ??= jest.fn();
global.Response ??= jest.fn();
global.Headers ??= jest.fn();

jest.mock('firebase/messaging', () => ({
  getMessaging: jest.fn(() => ({})),
  onMessage: jest.fn(),
  getToken: jest.fn(),
}));

process.env.VITE_APP_FIREBASE_API_KEY ??= 'test-api-key';
process.env.VITE_APP_FIREBASE_AUTH_DOMAIN ??= 'test.firebaseapp.com';
process.env.VITE_APP_FIREBASE_PROJECT_ID ??= 'test-project';
process.env.VITE_APP_FIREBASE_MESSAGING ??= 'test-sender-id';
process.env.VITE_APP_FIREBASE_APP_ID ??= 'test-app-id';
process.env.VITE_APP_API_BASE_URL ??= 'http://localhost:8080';
