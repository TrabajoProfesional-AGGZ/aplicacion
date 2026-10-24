/**
 * Tope absoluto de la sesión del socio, contado desde el último login.
 *
 * Firebase no tiene con qué expresar esto: la persistencia local (la que usa esta PWA, a
 * propósito, para que el carnet funcione offline) renueva el ID token indefinidamente contra el
 * refresh token, que sólo muere si se revoca del lado del servidor. Así que el vencimiento lo
 * lleva la app: `AuthContext` sella el inicio de sesión y cierra la sesión cuando se pasa de acá.
 */
export const DURACION_MAXIMA_SESION_MS = 3 * 24 * 60 * 60 * 1000;

const CLAVE_INICIO = 'sesion_iniciada_en';

/**
 * Lee el inicio de sesión cacheado. Devuelve `null` si no hay ninguno, que es el caso del
 * arranque offline de un socio que se logueó antes de que existiera esta clave.
 */
export function inicioDeSesion() {
  const valor = Number(localStorage.getItem(CLAVE_INICIO));
  return Number.isFinite(valor) && valor > 0 ? valor : null;
}

/**
 * Sella el inicio de sesión y lo devuelve en ms.
 *
 * La fuente de verdad es `metadata.lastSignInTime` de Firebase, no el momento en que corre esta
 * función: `onAuthStateChanged` dispara en cada arranque de la app, y tomar la hora de ahí
 * renovaría el plazo sin que el socio se vuelva a loguear. La copia en `localStorage` existe sólo
 * para el arranque offline, donde no hay usuario de Firebase del que leer la metadata.
 */
export function sellarInicioDeSesion(firebaseUser) {
  const deFirebase = Date.parse(firebaseUser?.metadata?.lastSignInTime ?? '');
  const inicio = Number.isNaN(deFirebase) ? (inicioDeSesion() ?? Date.now()) : deFirebase;
  try {
    localStorage.setItem(CLAVE_INICIO, String(inicio));
  } catch {
    // Cuota llena o storage bloqueado: el chequeo online sigue andando con la metadata de
    // Firebase; lo único que se pierde es el vencimiento del arranque offline.
  }
  return inicio;
}

/** Cuánto le queda a la sesión. Negativo si ya venció. */
export function msRestantesDeSesion(inicio) {
  return inicio + DURACION_MAXIMA_SESION_MS - Date.now();
}

/**
 * Fail-open con `inicio` en `null`: sin sello no hay de dónde deducir la antigüedad, y no vale
 * deslogear al socio por eso. El pase online lo sella en cuanto haya red.
 */
export function sesionExpirada(inicio) {
  return inicio !== null && msRestantesDeSesion(inicio) <= 0;
}
