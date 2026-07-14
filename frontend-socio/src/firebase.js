import { initializeApp } from 'firebase/app';
import { getAuth, setPersistence, browserSessionPersistence } from 'firebase/auth';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_APP_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_APP_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_APP_FIREBASE_PROJECT_ID,
  appId: import.meta.env.VITE_APP_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Sesión atada a la pestaña/PWA en vez de persistir entre reinicios (default de Firebase):
// al cerrar la app, la sesión se pierde y hay que loguearse de nuevo la próxima vez.
setPersistence(auth, browserSessionPersistence).catch((error) => {
  console.error('No se pudo configurar la persistencia de sesión:', error);
});
