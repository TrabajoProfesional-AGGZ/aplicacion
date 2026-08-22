import { auth } from '../firebase';

const API_URL=import.meta.env.VITE_APP_API_BASE_URL;

// Rechaza rutas absolutas a otro host (protocol-relative "//" o "esquema://")
// para que un path mal armado no termine pegándole a un dominio ajeno.
function buildUrl(path) {
  if (typeof path !== 'string' || !path.startsWith('/') || path.startsWith('//') || path.includes('://')) {
    throw new Error('Ruta de API inválida');
  }
  return `${API_URL}${path}`;
}

/** Fetch autenticado: lee el token de Firebase actual en cada llamada y lo manda como Bearer. */
export async function fetchTo(path, method, body = null) {
  const token = await auth.currentUser?.getIdToken();
  const headers = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return fetch(buildUrl(path), {
    method,
    headers,
    body: body ? JSON.stringify(body) : null,
  });
}

export async function fetchWithOutAuth(path, method, body = null) {
  return fetch(buildUrl(path), {
    method,
    headers: {
      'Content-Type': 'application/json'
    },
    body: body ? JSON.stringify(body) : null,
  });
}