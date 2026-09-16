import { useCallback, useEffect, useState } from 'react';
import { getAlertasSocio } from '../services/alertasService';

const POLLING_INTERVALO_MS = 60_000;

function claveStorage(idSocio) {
  return `alertas_ultima_vista_${idSocio}`;
}

function masReciente(alertas) {
  return alertas.reduce((max, a) => (a.creado_en > max ? a.creado_en : max), alertas[0].creado_en);
}

/**
 * Badge de "hay alertas nuevas" en la campana. No hay lectura/no-lectura
 * persistida en el backend: se compara la fecha de la alerta más reciente
 * contra la última vez que el socio abrió la campana (guardado en
 * localStorage por socio). Se repolla cada 60s mientras el socio está
 * adentro (HomePage no se remonta al navegar entre vistas, así que sin esto
 * una alerta nueva no se reflejaría hasta el próximo login).
 */
export function useAlertasNoLeidas(idSocio) {
  const [hayNoLeidas, setHayNoLeidas] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const revisar = () => {
      getAlertasSocio(idSocio)
        .then((alertas) => {
          if (cancelled || alertas.length === 0) return;
          const ultimaVista = localStorage.getItem(claveStorage(idSocio));
          setHayNoLeidas(!ultimaVista || masReciente(alertas) > ultimaVista);
        })
        .catch(() => {});
    };

    revisar();
    const intervalo = setInterval(revisar, POLLING_INTERVALO_MS);
    return () => { cancelled = true; clearInterval(intervalo); };
  }, [idSocio]);

  const marcarComoLeidas = useCallback((alertas) => {
    if (!alertas || alertas.length === 0) return;
    localStorage.setItem(claveStorage(idSocio), masReciente(alertas));
    setHayNoLeidas(false);
  }, [idSocio]);

  return { hayNoLeidas, marcarComoLeidas };
}
