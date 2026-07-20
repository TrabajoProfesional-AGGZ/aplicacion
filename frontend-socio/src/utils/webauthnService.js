const DB_NAME = 'socio_biometric';
const DB_STORE = 'keys';
const DB_KEY_ID = 'main';
const LS_BLOB_KEY = 'socio_biometric_blob';
const LS_CREDENTIAL_ID_KEY = 'socio_biometric_credential_id';

function abrirDb() {
  return new Promise((resolve, reject) => {
    const request = window.indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      request.result.createObjectStore(DB_STORE);
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function guardarClaveEnIndexedDb(cryptoKey) {
  const db = await abrirDb();
  await new Promise((resolve, reject) => {
    const tx = db.transaction(DB_STORE, 'readwrite');
    tx.objectStore(DB_STORE).put(cryptoKey, DB_KEY_ID);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  db.close();
}

async function leerClaveDeIndexedDb() {
  const db = await abrirDb();
  const cryptoKey = await new Promise((resolve, reject) => {
    const tx = db.transaction(DB_STORE, 'readonly');
    const req = tx.objectStore(DB_STORE).get(DB_KEY_ID);
    req.onsuccess = () => resolve(req.result ?? null);
    req.onerror = () => reject(req.error);
  });
  db.close();
  return cryptoKey;
}

async function borrarClaveDeIndexedDb() {
  const db = await abrirDb();
  await new Promise((resolve, reject) => {
    const tx = db.transaction(DB_STORE, 'readwrite');
    tx.objectStore(DB_STORE).delete(DB_KEY_ID);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  db.close();
}

function bufferABase64(buffer) {
  const bytes = new Uint8Array(buffer);
  let binario = '';
  for (let i = 0; i < bytes.length; i += 1) binario += String.fromCharCode(bytes[i]);
  return window.btoa(binario);
}

function base64ABuffer(base64) {
  const binario = window.atob(base64);
  const bytes = new Uint8Array(binario.length);
  for (let i = 0; i < binario.length; i += 1) bytes[i] = binario.charCodeAt(i);
  return bytes;
}

/**
 * Feature-detects a platform authenticator (huella/Face ID vía el navegador).
 * No hay wrapper nativo (Capacitor) en esta app, así que esto es lo único
 * disponible como gate biométrico real — ver la nota de seguridad en
 * `unlock()` sobre qué garantiza y qué no.
 */
export async function isPlatformAuthenticatorAvailable() {
  if (typeof window === 'undefined' || !window.PublicKeyCredential) return false;
  if (typeof window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable !== 'function') {
    return false;
  }
  try {
    return await window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
  } catch {
    return false;
  }
}

export function hasEnrolledCredential() {
  return Boolean(
    window.localStorage.getItem(LS_CREDENTIAL_ID_KEY) && window.localStorage.getItem(LS_BLOB_KEY)
  );
}

/**
 * Cifra `{email, password}` con una CryptoKey AES-GCM no exportable (vive
 * solo en IndexedDB) y registra una credencial WebAuthn de plataforma cuyo
 * único rol es forzar el prompt biométrico del OS antes de que `unlock()`
 * intente descifrar. No hay backend que verifique el assertion — ver la
 * nota de seguridad en `unlock()`.
 */
export async function enroll(email, password) {
  const soportado = await isPlatformAuthenticatorAvailable();
  if (!soportado) {
    throw new Error('biometria-no-soportada');
  }

  const cryptoKey = await window.crypto.subtle.generateKey(
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );

  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const datos = new TextEncoder().encode(JSON.stringify({ email, password }));
  const ciphertext = await window.crypto.subtle.encrypt({ name: 'AES-GCM', iv }, cryptoKey, datos);

  let credential;
  try {
    credential = await navigator.credentials.create({
      publicKey: {
        rp: { name: 'SocioUnido' },
        user: {
          id: window.crypto.getRandomValues(new Uint8Array(16)),
          name: email,
          displayName: email,
        },
        challenge: window.crypto.getRandomValues(new Uint8Array(32)),
        pubKeyCredParams: [
          { type: 'public-key', alg: -7 },
          { type: 'public-key', alg: -257 },
        ],
        authenticatorSelection: {
          authenticatorAttachment: 'platform',
          userVerification: 'required',
          residentKey: 'preferred',
        },
        timeout: 60000,
        attestation: 'none',
      },
    });
  } catch {
    throw new Error('biometria-enrolamiento-cancelado');
  }

  if (!credential) {
    throw new Error('biometria-enrolamiento-cancelado');
  }

  await guardarClaveEnIndexedDb(cryptoKey);
  window.localStorage.setItem(
    LS_BLOB_KEY,
    JSON.stringify({ ciphertext: bufferABase64(ciphertext), iv: bufferABase64(iv) })
  );
  window.localStorage.setItem(LS_CREDENTIAL_ID_KEY, bufferABase64(credential.rawId));
}

export async function unenroll() {
  window.localStorage.removeItem(LS_BLOB_KEY);
  window.localStorage.removeItem(LS_CREDENTIAL_ID_KEY);
  try {
    await borrarClaveDeIndexedDb();
  } catch {
    // la clave puede no existir en IndexedDB; no bloquea el desenrolamiento
  }
}

/**
 * Pide el prompt biométrico del OS y, si lo confirma, descifra y devuelve
 * `{email, password}` guardados en `enroll()`.
 *
 * Advertencia de seguridad (deliberada, no un descuido): no hay backend que
 * verifique la firma del assertion de WebAuthn, así que esto es un gate de
 * conveniencia local, no una prueba criptográfica de identidad ante un
 * tercero. La no-exportabilidad de la CryptoKey evita leer la clave cruda
 * desde devtools, pero "primero pedí la huella, después descifrá" es una
 * regla de esta función, no un enlace criptográfico real entre el
 * assertion y la clave. Limitación aceptada de no tener un wrapper nativo
 * (Capacitor) — revisar si el proyecto lo adopta alguna vez.
 */
export async function unlock() {
  if (!hasEnrolledCredential()) {
    throw new Error('biometria-no-enrolada');
  }

  const credentialId = window.localStorage.getItem(LS_CREDENTIAL_ID_KEY);

  let assertion;
  try {
    assertion = await navigator.credentials.get({
      publicKey: {
        challenge: window.crypto.getRandomValues(new Uint8Array(32)),
        allowCredentials: [{ id: base64ABuffer(credentialId), type: 'public-key' }],
        userVerification: 'required',
        timeout: 60000,
      },
    });
  } catch {
    throw new Error('biometria-cancelada');
  }

  if (!assertion) {
    throw new Error('biometria-cancelada');
  }

  const cryptoKey = await leerClaveDeIndexedDb();
  const blobRaw = window.localStorage.getItem(LS_BLOB_KEY);
  if (!cryptoKey || !blobRaw) {
    throw new Error('biometria-no-enrolada');
  }
  const { ciphertext, iv } = JSON.parse(blobRaw);

  let datos;
  try {
    datos = await window.crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: base64ABuffer(iv) },
      cryptoKey,
      base64ABuffer(ciphertext)
    );
  } catch {
    throw new Error('biometria-descifrado-fallido');
  }

  return JSON.parse(new TextDecoder().decode(datos));
}
