import { fetchWithOutAuth } from '../utils/utils';
import { logger } from '../utils/logger';

/**
 * De qué club es esta instalación de la PWA, resuelto por hostname.
 *
 * Para toda llamada **autenticada** el frontend no tiene que hacer nada: el club viaja en el
 * claim `club_id` del ID token y el gateway lo propaga como `X-Club-Id`, así que el header no
 * entra en `allow_headers` y no hay nada que spoofear. El problema son las llamadas
 * **pre-login** —validar un socio y sellar el claim `tipo`—, que se piden justamente antes de
 * que exista el token del que sale el claim. Esas llevan el club en el path, y de acá lo sacan.
 *
 * Se resuelve por **hostname y no por variable de build**: un mismo bundle sirve a N clubes y
 * cada uno entra por su dominio, así que hornear el club en el build obligaría a un deploy por
 * cliente. Un solo lookup devuelve además la marca blanca (nombre, colores y escudo), que es
 * lo que permite pintar la pantalla de login con la identidad del club sin una segunda llamada.
 */

const RUTA = '/api/v1/clubes/publico/por-dominio';

// El club entra en el cache de `localStorage` por el mismo motivo que la sesión del socio: esta
// PWA arranca offline y reconstruye lo que puede desde ahí. Sin esto, un arranque sin red se
// quedaría sin branding y sin poder resolver ninguna ruta pre-login.
const CLAVE_CACHE = 'club_actual';

// El hostname no cambia mientras la pestaña esté abierta, así que el club se resuelve una sola
// vez por carga. La promesa en curso se comparte para que dos consumidores concurrentes —el
// provider al montar y el primer submit de un formulario— no disparen dos lookups; el endpoint
// tiene rate limit por IP en el gateway.
let clubResuelto = null;
let promesaEnCurso = null;

/** Deja pasar sólo colores hexadecimales: el valor va a terminar en una custom property de CSS. */
function colorSeguro(color) {
  return typeof color === 'string' && /^#[0-9a-f]{3}([0-9a-f]{3})?$/i.test(color.trim())
    ? color.trim()
    : null;
}

/** Deja pasar sólo escudos servidos por HTTPS, igual que `urlImagenSegura` de plataforma-web. */
function escudoSeguro(url) {
  if (!url) return null;
  try {
    return new URL(url).protocol === 'https:' ? url : null;
  } catch {
    return null;
  }
}

/**
 * Normaliza la respuesta del catálogo una sola vez, acá, en vez de en cada consumidor: el
 * branding sale de una tabla que un operador edita a mano y termina en el DOM. Se aplica también
 * a lo que vuelve del cache, que es contenido viejo de esa misma tabla.
 */
function normalizar(datos) {
  if (!datos?.club_id) return null;
  return {
    club_id: datos.club_id,
    slug: datos.slug ?? null,
    nombre: datos.nombre ?? null,
    colores: {
      primario: colorSeguro(datos.colores?.primario),
      secundario: colorSeguro(datos.colores?.secundario),
    },
    escudo: escudoSeguro(datos.escudo),
  };
}

function leerDelCache() {
  try {
    return normalizar(JSON.parse(localStorage.getItem(CLAVE_CACHE)));
  } catch {
    return null;
  }
}

/**
 * Deja el club en el cache que sobrevive a un cierre de la app. Lo exporta además de usarlo acá
 * porque el `localStorage.clear()` del logout —que es amplio a propósito, para no dejar el
 * secreto TOTP del carnet— se lleva también esta clave, y el club no es dato de sesión sino del
 * dominio: `AuthContext` lo vuelve a escribir después de limpiar.
 */
export function recordarClub(club) {
  try {
    localStorage.setItem(CLAVE_CACHE, JSON.stringify(club));
  } catch {
    // Cuota llena o storage bloqueado: el club ya está en memoria, no vale voltear nada por esto.
  }
}

/**
 * Escape de desarrollo, con el mismo criterio que `MP_ACCESS_TOKEN_TEST` en ms-pagos: permite
 * levantar la PWA contra un backend de prueba sin tener que registrar `localhost` en el
 * catálogo de clubes. **No debe estar seteada en producción**: ahí el dominio está registrado y
 * el lookup gana, pero si el dominio faltara esta variable serviría el club equivocado.
 */
function clubDeDesarrollo() {
  const id = import.meta.env.VITE_APP_CLUB_ID;
  if (!id) return null;
  return { club_id: id, slug: null, nombre: null, colores: { primario: null, secundario: null }, escudo: null };
}

async function pedirClub() {
  const host = window.location.hostname;
  let fallo;

  try {
    const res = await fetchWithOutAuth(`${RUTA}/${encodeURIComponent(host)}`, 'GET');
    if (res.ok) {
      clubResuelto = normalizar(await res.json());
      if (clubResuelto) {
        recordarClub(clubResuelto);
        return clubResuelto;
      }
    }
    // 404 es "ningún club activo responde por este dominio", que es distinto de que el catálogo
    // no esté respondiendo: uno se arregla dando de alta el dominio y el otro esperando.
    fallo = new Error(res.status === 404 ? 'club-desconocido' : 'servicio-no-disponible');
  } catch {
    fallo = new Error('servicio-no-disponible');
  }

  // Sin red o con el catálogo caído, el club de la última visita es el correcto: el hostname es
  // el mismo. Un dominio que el catálogo ya rechazó (404) no se rescata del cache, porque ahí el
  // catálogo respondió y dijo que no.
  if (fallo.message === 'servicio-no-disponible') {
    const cacheado = leerDelCache();
    if (cacheado) {
      clubResuelto = cacheado;
      return clubResuelto;
    }
  }

  const deDesarrollo = clubDeDesarrollo();
  if (deDesarrollo) {
    logger.warn(
      `No se pudo resolver el club de "${host}" (${fallo.message}); se usa VITE_APP_CLUB_ID.`,
    );
    clubResuelto = deDesarrollo;
    return clubResuelto;
  }

  throw fallo;
}

/**
 * El club de este dominio, con su branding. Falla cerrado: si el catálogo no lo reconoce
 * **no cae a ningún club por defecto**, porque servirle a un dominio el tenant de otro es
 * exactamente el error que toda la migración a multi-cliente trata de hacer imposible.
 * @returns {Promise<{club_id: string, slug: string|null, nombre: string|null, colores: {primario: string|null, secundario: string|null}, escudo: string|null}>}
 * @throws {Error} 'club-desconocido' | 'servicio-no-disponible'
 */
export async function resolverClub() {
  if (clubResuelto) return clubResuelto;
  if (!promesaEnCurso) {
    promesaEnCurso = pedirClub().finally(() => {
      promesaEnCurso = null;
    });
  }
  return promesaEnCurso;
}

/**
 * El `club_id` que va en el path de las rutas pre-login. Los servicios lo piden acá en vez de
 * recibirlo por parámetro para no tener que enhebrarlo por cada componente que los llama.
 * @throws {Error} 'club-desconocido' | 'servicio-no-disponible'
 */
export async function idDeClubActual() {
  const { club_id: clubId } = await resolverClub();
  return clubId;
}

/**
 * El club ya resuelto, sin disparar ningún lookup: primero el de esta carga y si no el cacheado.
 * Es lo que deja que un arranque offline ya tenga la marca blanca en el primer render.
 */
export function clubEnMemoria() {
  return clubResuelto ?? leerDelCache();
}

/** Sólo para los tests: el cache de módulo sobrevive entre casos y los cruzaría. */
export function reiniciarClubResuelto() {
  clubResuelto = null;
  promesaEnCurso = null;
}
