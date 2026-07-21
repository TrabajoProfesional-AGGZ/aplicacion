import { auth } from '../firebase';

const API_URL=import.meta.env.VITE_APP_API_BASE_URL;

function buildUrl(path) {
  if (typeof path !== 'string' || !path.startsWith('/') || path.startsWith('//') || path.includes('://')) {
    throw new Error('Ruta de API inválida');
  }
  return `${API_URL}${path}`;
}

export async function fetchTo(path, method, body = null) {
  const token = await auth.currentUser?.getIdToken();
  return fetch(buildUrl(path), {
    method,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
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