import { useEffect, useRef } from 'react';
import { nextHistoryEntryId } from './historyEntryId';

/**
 * Ata un valor de "pantalla actual" al historial del navegador para que el
 * gesto/botón de atrás del celular vuelva directo a `rootValue` en un solo
 * gesto, sin importar cuántas transiciones internas hubo (se pushea una
 * sola entrada por cada salida de la raíz, no una por paso).
 *
 * Si se sale del estado no-raíz por otra vía (ej. un botón "Inicio"), la
 * entrada pusheada se consume con `history.back()` — pero solo si sigue
 * siendo la entrada vigente, para no deshacer una navegación ajena que
 * haya pusheado encima en el medio.
 *
 * Un `popstate` puede disparar por el gesto de atrás en un consumidor de
 * historial anidado (un modal vía `useModalHistory`, u otra instancia de
 * este mismo hook más arriba en la cadena de pantallas) y no solo por salir
 * del propio segmento. El handler distingue ambos casos comparando el `id`
 * de la entrada (secuencia compartida, ver `historyEntryId.js`): un id
 * mayor o igual al propio viene de algo anidado (se ignora), uno menor —o
 * ausente— significa que el gesto realmente pasó de largo esta entrada, y
 * ahí se dispara `onBack`.
 */
export function useBackToRoot(current, rootValue, onBack) {
  const onBackRef = useRef(onBack);
  const currentRef = useRef(current);
  // Arranca en false sin importar el `current` inicial: así, si el componente
  // monta ya fuera de la raíz, el efecto de abajo igual pushea su entrada en
  // la primera corrida en vez de perderse ese caso.
  const isAwayRef = useRef(false);
  const poppedRef = useRef(false);
  const pushedStateRef = useRef(null);

  useEffect(() => {
    onBackRef.current = onBack;
    currentRef.current = current;
  }, [onBack, current]);

  useEffect(() => {
    const isAway = current !== rootValue;

    if (isAway && !isAwayRef.current) {
      const state = { backToRoot: true, id: nextHistoryEntryId() };
      pushedStateRef.current = state;
      window.history.pushState(state, '');
      isAwayRef.current = true;
    } else if (!isAway && isAwayRef.current) {
      isAwayRef.current = false;
      if (!poppedRef.current && window.history.state?.id === pushedStateRef.current?.id) {
        window.history.back();
      }
      poppedRef.current = false;
    }
  }, [current, rootValue]);

  useEffect(() => {
    const handlePopState = () => {
      if (currentRef.current === rootValue) return;

      // Un id propio o de algo anidado (>= al nuestro) significa que todavía
      // no se salió de este segmento — se ignora.
      const landedId = window.history.state?.id;
      const ownId = pushedStateRef.current?.id;
      if (typeof landedId === 'number' && typeof ownId === 'number' && landedId >= ownId) {
        return;
      }

      poppedRef.current = true;
      onBackRef.current();
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [rootValue]);
}
