import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getMessaging } from "firebase/messaging"

const firebaseConfig = {
  apiKey: import.meta.env.VITE_APP_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_APP_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_APP_FIREBASE_PROJECT_ID,
  messagingSenderId: import.meta.env.VITE_APP_FIREBASE_MESSAGING,
  appId: import.meta.env.VITE_APP_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
// Sin setPersistence: se usa el default de Firebase (browserLocalPersistence), para que la sesión
// sobreviva al cierre de la app y el carnet se pueda mostrar offline. Eso deja la sesión sin
// vencimiento propio —Firebase renueva el token mientras exista el refresh token—, así que el tope
// de tres días lo aplica `AuthContext` con `utils/sesion.js`, no la persistencia.
export const auth = getAuth(app);
export const messaging = getMessaging(app);
