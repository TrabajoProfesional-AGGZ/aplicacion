import { TextEncoder, TextDecoder } from 'util';
import FDBFactory from 'fake-indexeddb/lib/FDBFactory';
import {
  enroll,
  hasEnrolledCredential,
  isPlatformAuthenticatorAvailable,
  unenroll,
  unlock,
} from './webauthnService';

// jsdom no implementa IndexedDB, SubtleCrypto, TextEncoder/Decoder ni
// structuredClone por defecto: se stubean acá (no en jest.setup.js global)
// para no enmascarar el código que detecta "no soportado" en otros tests.
// `crypto.subtle` se reemplaza por un cifrado identidad (no real AES-GCM):
// esto prueba que el servicio orquesta IndexedDB/localStorage/WebAuthn
// correctamente, no que WebCrypto funciona — eso queda para QA manual en
// un dispositivo real (ver la nota en el plan de EXTRA-3).
beforeEach(() => {
  window.indexedDB = new FDBFactory();
  global.TextEncoder = TextEncoder;
  global.TextDecoder = TextDecoder;
  global.structuredClone = (value) => JSON.parse(JSON.stringify(value));

  window.crypto.subtle = {
    generateKey: jest.fn().mockResolvedValue({ mock: 'clave-no-exportable' }),
    encrypt: jest.fn((_algo, _key, datos) => Promise.resolve(datos)),
    decrypt: jest.fn((_algo, _key, datos) => Promise.resolve(datos)),
  };
  window.PublicKeyCredential = {
    isUserVerifyingPlatformAuthenticatorAvailable: jest.fn().mockResolvedValue(true),
  };
  window.navigator.credentials = {
    create: jest.fn().mockResolvedValue({ rawId: new Uint8Array([1, 2, 3, 4]).buffer }),
    get: jest.fn().mockResolvedValue({}),
  };
  window.localStorage.clear();
});

describe('isPlatformAuthenticatorAvailable', () => {
  test('devuelve true si el navegador expone un platform authenticator', async () => {
    await expect(isPlatformAuthenticatorAvailable()).resolves.toBe(true);
  });

  test('devuelve false si no existe PublicKeyCredential', async () => {
    delete window.PublicKeyCredential;
    await expect(isPlatformAuthenticatorAvailable()).resolves.toBe(false);
  });
});

describe('hasEnrolledCredential', () => {
  test('es false antes de enrolar', () => {
    expect(hasEnrolledCredential()).toBe(false);
  });

  test('es true después de un enrolamiento exitoso', async () => {
    await enroll('socio@club.com', 'clave-secreta');
    expect(hasEnrolledCredential()).toBe(true);
  });
});

describe('enroll + unlock', () => {
  test('unlock descifra exactamente el email/password guardados en enroll', async () => {
    await enroll('socio@club.com', 'clave-secreta');
    await expect(unlock()).resolves.toEqual({ email: 'socio@club.com', password: 'clave-secreta' });
  });

  test('enroll lanza si no hay platform authenticator disponible', async () => {
    window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable.mockResolvedValue(false);
    await expect(enroll('socio@club.com', 'clave-secreta')).rejects.toThrow('biometria-no-soportada');
    expect(hasEnrolledCredential()).toBe(false);
  });

  test('enroll lanza si se cancela la creación de la credencial, sin dejar nada guardado', async () => {
    window.navigator.credentials.create.mockRejectedValueOnce(new Error('cancelado por el usuario'));
    await expect(enroll('socio@club.com', 'clave-secreta')).rejects.toThrow('biometria-enrolamiento-cancelado');
    expect(hasEnrolledCredential()).toBe(false);
  });
});

describe('unlock sin enrolamiento previo', () => {
  test('lanza si no hay ninguna credencial enrolada', async () => {
    await expect(unlock()).rejects.toThrow('biometria-no-enrolada');
  });

  test('lanza si se cancela el prompt biométrico', async () => {
    await enroll('socio@club.com', 'clave-secreta');
    window.navigator.credentials.get.mockRejectedValueOnce(new Error('cancelado por el usuario'));
    await expect(unlock()).rejects.toThrow('biometria-cancelada');
  });
});

describe('unenroll', () => {
  test('borra la credencial guardada; unlock vuelve a fallar después', async () => {
    await enroll('socio@club.com', 'clave-secreta');
    expect(hasEnrolledCredential()).toBe(true);

    await unenroll();

    expect(hasEnrolledCredential()).toBe(false);
    await expect(unlock()).rejects.toThrow('biometria-no-enrolada');
  });

  test('no lanza aunque no haya nada enrolado', async () => {
    await expect(unenroll()).resolves.toBeUndefined();
  });
});
