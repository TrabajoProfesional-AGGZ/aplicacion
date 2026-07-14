import { useEffect, useRef } from 'react';

const EVENTOS_ACTIVIDAD = ['mousedown', 'mousemove', 'keydown', 'touchstart', 'scroll'];

export function useInactivityLogout(activo, timeoutMs, onTimeout) {
  const ultimaActividadRef = useRef(null);
  const timerRef = useRef(null);
  const onTimeoutRef = useRef(onTimeout);

  useEffect(() => {
    onTimeoutRef.current = onTimeout;
  }, [onTimeout]);

  useEffect(() => {
    if (!activo) return undefined;

    function chequearInactividad() {
      const inactivoPorMs = Date.now() - ultimaActividadRef.current;
      if (inactivoPorMs >= timeoutMs) {
        onTimeoutRef.current();
      } else {
        programarChequeo(timeoutMs - inactivoPorMs);
      }
    }

    function programarChequeo(delay) {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(chequearInactividad, delay);
    }

    function registrarActividad() {
      ultimaActividadRef.current = Date.now();
      programarChequeo(timeoutMs);
    }

    function manejarVisibilidad() {
      if (document.visibilityState === 'visible') chequearInactividad();
    }

    ultimaActividadRef.current = Date.now();
    programarChequeo(timeoutMs);
    EVENTOS_ACTIVIDAD.forEach((evento) => document.addEventListener(evento, registrarActividad));
    document.addEventListener('visibilitychange', manejarVisibilidad);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      EVENTOS_ACTIVIDAD.forEach((evento) => document.removeEventListener(evento, registrarActividad));
      document.removeEventListener('visibilitychange', manejarVisibilidad);
    };
  }, [activo, timeoutMs]);
}
