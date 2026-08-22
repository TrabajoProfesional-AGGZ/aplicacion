/**
 * Actualiza el valor de un `<input>`/`<select>` nativo pasando por el setter
 * real del prototipo (no el de la instancia, que React pisa) y dispara
 * `input`/`change` con `bubbles: true` para que tanto un `onChange` directo
 * como el `onChange` que devuelve `register()` de react-hook-form lo detecten
 * — el mismo mecanismo que usa `fireEvent.change` de Testing Library.
 */
export function setNativeValue(element, value) {
  const descriptor = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(element), 'value');
  descriptor.set.call(element, value);
  element.dispatchEvent(new Event('input', { bubbles: true }));
  element.dispatchEvent(new Event('change', { bubbles: true }));
}

/**
 * Combina el `ref` propio de un componente con uno recibido como prop.
 *
 * En React 19 un componente función puede recibir `ref` como prop normal
 * (ya no hace falta `forwardRef`) — así que cuando `register()` de
 * react-hook-form se spreadea sobre `DatePicker`/`TimePicker`/`StyledSelect`
 * (`{...register('x')}`), su `ref` viaja dentro de `...props` y, si se
 * spreadea después de un `ref={miRefInterno}` en el input/select real, lo
 * pisa en silencio — el componente se queda sin acceso a su propio nodo DOM
 * (`inputRef.current` termina `null`). Hay que extraer `ref` de `props`
 * *antes* de spreadear y fusionarlo acá con el ref interno.
 */
export function mergeRefs(...refs) {
  return (node) => {
    refs.forEach((ref) => {
      if (!ref) return;
      if (typeof ref === 'function') ref(node);
      else ref.current = node;
    });
  };
}

/** Posición fija (viewport) para un popover anclado a `triggerEl`, con flip vertical si no entra abajo. */
export function computePopoverPosition(triggerEl, popoverHeight = 320, popoverWidth = 280) {
  if (!triggerEl) return { top: 0, left: 0 };
  const rect = triggerEl.getBoundingClientRect();
  const spaceBelow = window.innerHeight - rect.bottom;
  const openUp = spaceBelow < popoverHeight && rect.top > spaceBelow;
  const top = openUp ? Math.max(8, rect.top - popoverHeight - 6) : rect.bottom + 6;
  const left = Math.min(Math.max(8, rect.left), window.innerWidth - popoverWidth - 8);
  return { top, left };
}
