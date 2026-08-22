import { useEffect, useRef } from 'react';
import { nextHistoryEntryId } from './historyEntryId';

/**
 * Ata el ciclo de vida de un modal a una entrada del historial del navegador
 * para que el gesto/botón de atrás lo cierre en vez de cerrar toda la app.
 * Pushea una entrada al montar; un `popstate` (atrás por hardware) llama a
 * `onClose`. Si el modal se cierra por otra vía (Escape, click afuera,
 * Cancelar), la entrada se consume al desmontar con `history.back()` — pero
 * solo si sigue siendo la vigente, para no deshacer una navegación ajena
 * que haya pusheado encima en el medio.
 *
 * El consumo al desmontar se difiere con `queueMicrotask` (en vez de
 * correr sincrónico), y un re-montaje puede reusar la misma entrada en vez
 * de pushear una nueva: esto es necesario para sobrevivir al doble-invoke
 * de efectos de React 18 StrictMode en desarrollo (montar → desmontar →
 * remontar, todo sincrónico) sin duplicar ni perder entradas de historial
 * — de lo contrario un consumidor externo (ej. `useBackToRoot`) queda
 * desincronizado al comparar contra su propio id pusheado.
 */
export function useModalHistory(onClose) {
  const onCloseRef = useRef(onClose);
  const poppedRef = useRef(false);
  const pushedStateRef = useRef(null);
  const pendingConsumeRef = useRef(false);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    let state;
    if (pendingConsumeRef.current) {
      // Un desmontaje fantasma en el mismo tick ya pusheó una entrada y armó
      // su chequeo de consumo diferido — se reusa esa entrada en vez de
      // pushear una duplicada, y se desarma el chequeo para que sobreviva.
      state = pushedStateRef.current;
      pendingConsumeRef.current = false;
    } else {
      state = { modalOverlay: true, id: nextHistoryEntryId() };
      pushedStateRef.current = state;
      window.history.pushState(state, '');
    }

    const handlePopState = () => {
      poppedRef.current = true;
      onCloseRef.current();
    };

    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
      pendingConsumeRef.current = true;
      queueMicrotask(() => {
        // Desarmado significa que un remontaje ya reusó esta entrada — ese
        // montaje real es ahora su dueño, no tocar el historial acá.
        if (!pendingConsumeRef.current) return;
        pendingConsumeRef.current = false;
        if (!poppedRef.current && window.history.state?.id === state.id) {
          window.history.back();
        }
      });
    };
  }, []);
}
