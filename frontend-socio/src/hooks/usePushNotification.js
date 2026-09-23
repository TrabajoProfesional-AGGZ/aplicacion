import { useEffect } from 'react';
import { getToken } from 'firebase/messaging';
import { messaging } from '../firebase';
import { fetchTo } from '../utils/utils'
import { logger } from '../utils/logger';

/** Pide permiso de notificaciones push y registra el token FCM contra el backend. */
export const usePushNotifications = (usuarioAutenticado) => {
  useEffect(() => {
    if (!usuarioAutenticado) return;

    const solicitarPermisoYRegistrar = async () => {
      try {
        const permission = await Notification.requestPermission();

        if (permission === 'granted') {
          const currentToken = await getToken(messaging, {
            vapidKey: import.meta.env.VITE_APP_VAPID_KEY
          });

          if (currentToken) {
            await fetchTo('/api/v1/notificaciones/token', 'POST', {
              token: currentToken,
              plataforma: 'web'
            });
            logger.log('Token push registrado con éxito en el backend');
          } else {
            logger.log('No se pudo generar el token de registro.');
          }
        } else {
          logger.log('El usuario denegó el permiso para notificaciones.');
        }
      } catch (error) {
        logger.error('Error al obtener el token o pedir permisos:', error);
      }
    };

    solicitarPermisoYRegistrar();
  }, [usuarioAutenticado]);
};