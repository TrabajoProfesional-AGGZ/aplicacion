import { useEffect, useRef } from 'react';

const EDGE_PX = 24;
const COMMIT_PX = 70;

/**
 * true solo en iOS instalado como PWA ("standalone"), el único caso sin gesto
 * nativo de "atrás" (Android usa `popstate`; Safari en pestaña tiene su propio
 * edge-swipe).
 */
function esIOSStandalone() {
  return typeof navigator !== 'undefined' && navigator.standalone === true;
}

/**
 * Swipe desde el borde izquierdo que llama a `history.back()`, para cubrir el
 * hueco de iOS standalone. Dispara el mismo `popstate` que ya consumen
 * `useBackToRoot`/`useModalHistory`, así que no duplica su lógica de "qué se
 * cierra primero".
 */
export function useEdgeSwipeBack(enabled = esIOSStandalone()) {
  const startRef = useRef(null);
  const firedRef = useRef(false);

  useEffect(() => {
    if (!enabled) return undefined;

    function onPointerDown(e) {
      if (e.clientX > EDGE_PX) return;
      startRef.current = { x: e.clientX, y: e.clientY };
      firedRef.current = false;
    }

    function onPointerMove(e) {
      if (!startRef.current || firedRef.current) return;
      const dx = e.clientX - startRef.current.x;
      const dy = e.clientY - startRef.current.y;
      if (dx > COMMIT_PX && dx > Math.abs(dy) * 1.5) {
        firedRef.current = true;
        // Sin entrada propia (id numérico, ver historyEntryId.js) no hay nada
        // para "popear" — el swipe no navega fuera de la app.
        if (typeof window.history.state?.id === 'number') {
          window.history.back();
        }
      }
    }

    function onPointerEnd() {
      startRef.current = null;
    }

    window.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerEnd);
    window.addEventListener('pointercancel', onPointerEnd);
    return () => {
      window.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerEnd);
      window.removeEventListener('pointercancel', onPointerEnd);
    };
  }, [enabled]);
}
