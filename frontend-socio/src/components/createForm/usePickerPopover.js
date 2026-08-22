import { useState, useRef, useEffect, useLayoutEffect, useCallback } from 'react';
import { computePopoverPosition } from './nativeInputUtils';

/**
 * Estado + posicionamiento compartido por los popovers de `DatePicker`,
 * `TimePicker` y el dropdown custom de `StyledSelect`: abre anclado al
 * trigger (con flip hacia arriba si no entra abajo), cierra con click afuera
 * o Escape. El listener de Escape va en fase de captura y llama
 * `stopPropagation` para consumir la tecla antes de que el Escape global de
 * `ModalOverlay` la vea y cierre el modal entero en vez de solo el popover.
 *
 * `width`/`height` son una estimación usada solo para el primer cálculo
 * (antes de que el popover exista en el DOM, para decidir de entrada si abre
 * hacia arriba o hacia abajo). Apenas se monta, un `useLayoutEffect` vuelve a
 * calcular la posición con el tamaño real (`popoverRef.getBoundingClientRect`)
 * antes del paint — si la estimación se queda corta (ej. un `StyledSelect`
 * con pocas opciones, mucho más bajo que los 260px estimados) el popover
 * quedaba flotando lejos del trigger, con un hueco grande en el medio de la
 * pantalla en vez de pegado a donde correspondía.
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
