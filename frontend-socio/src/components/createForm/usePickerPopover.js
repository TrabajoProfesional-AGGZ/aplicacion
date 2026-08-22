import { useState, useRef, useEffect, useLayoutEffect, useCallback } from 'react';
import { computePopoverPosition } from './nativeInputUtils';

/**
 * Estado + posicionamiento compartido por los popovers de `DatePicker`,
 * `TimePicker` y el dropdown custom de `StyledSelect`: abre anclado al
 * trigger (con flip hacia arriba si no entra abajo), cierra con click afuera
 * o Escape. El listener de Escape va en fase de captura y hace
 * `stopPropagation` para no disparar también el Escape global de `ModalOverlay`.
 *
 * `width`/`height` son solo una estimación para el primer cálculo, antes de
 * que el popover exista en el DOM; un `useLayoutEffect` la corrige con el
 * tamaño real apenas se monta, para no quedar mal posicionado si la
 * estimación no coincide con el contenido real.
 */
export function usePickerPopover({ width = 280, height = 320 } = {}) {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const triggerRef = useRef(null);
  const popoverRef = useRef(null);

  const reposition = useCallback(() => {
    const measured = popoverRef.current?.getBoundingClientRect();
    setPosition(computePopoverPosition(triggerRef.current, measured?.height || height, measured?.width || width));
  }, [height, width]);

  const openPopover = useCallback(() => {
    reposition();
    setOpen(true);
  }, [reposition]);

  useLayoutEffect(() => {
    if (open) reposition();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const closePopover = useCallback(() => setOpen(false), []);
  const toggle = useCallback(() => {
    if (open) closePopover(); else openPopover();
  }, [open, openPopover, closePopover]);

  useEffect(() => {
    if (!open) return undefined;

    function handlePointerDown(e) {
      if (triggerRef.current?.contains(e.target)) return;
      if (popoverRef.current?.contains(e.target)) return;
      closePopover();
    }
    function handleKeyDown(e) {
      if (e.key === 'Escape') {
        e.stopPropagation();
        closePopover();
        triggerRef.current?.focus();
      }
    }
    function handleReposition() { reposition(); }

    document.addEventListener('mousedown', handlePointerDown, true);
    document.addEventListener('keydown', handleKeyDown, true);
    window.addEventListener('resize', handleReposition);
    window.addEventListener('scroll', handleReposition, true);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown, true);
      document.removeEventListener('keydown', handleKeyDown, true);
      window.removeEventListener('resize', handleReposition);
      window.removeEventListener('scroll', handleReposition, true);
    };
  }, [open, reposition, closePopover]);

  return {
    open, openPopover, closePopover, toggle, position, triggerRef, popoverRef,
  };
}
