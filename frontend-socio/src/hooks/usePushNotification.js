import { useEffect } from 'react';
import { getToken } from 'firebase/messaging';
import { messaging } from '../services/firebase';
import { fetchTo } from '../utils/utils'

export const usePushNotifications = (usuarioAutenticado) => {
  useEffect(() => {
    if (!usuarioAutenticado) return;

    const solicitarPermisoYRegistrar = async () => {
      try {
        // Pedimos permiso al navegador
        const permission = await Notification.requestPermission();
        
        if (permission === 'granted') {
          // Generamos el token usando tu clave VAPID
          const currentToken = await getToken(messaging, { 
            vapidKey: import.meta.env.VITE_APP_KEY_PUSH
          });

          if (currentToken) {
            await fetchTo('/api/v1/notificaciones/token', 'POST', {
              token: currentToken,
              plataforma: 'web'
            });
            console.log('Token push registrado con éxito en el backend');
          } else {
            console.log('No se pudo generar el token de registro.');
          }
        } else {
          console.log('El usuario denegó el permiso para notificaciones.');
        }
      } catch (error) {
        console.error('Error al obtener el token o pedir permisos:', error);
      }
    };

    solicitarPermisoYRegistrar();
  }, [usuarioAutenticado]);
};