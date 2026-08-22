import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import { AlertCircle, ChevronDown, Check } from 'lucide-react';
import { DatePicker } from './DatePicker';
import { setNativeValue, mergeRefs } from './nativeInputUtils';
import { usePickerPopover } from './usePickerPopover';
import './Pickers.css';

const slideVariants = {
  enter: (dir) => ({ x: dir > 0 ? 52 : -52, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir) => ({ x: dir > 0 ? -52 : 52, opacity: 0 }),
};

/** Input de texto estándar; si `type="date"`, delega en `DatePicker`. */
export const StyledInput = React.forwardRef(({ error, ...props }, ref) => {
  if (props.type === 'date') return <DatePicker error={error} ref={ref} {...props} />;
  return (
    <input
      ref={ref}
      {...props}
      className={`csf-input${error ? ' csf-input--error' : ''}`}
    />
  );
});

/**
 * Select con el estilo estándar de los formularios, con estado de error opcional.
 * Por debajo sigue siendo un `<select>` real (oculto vía clip, no `display:none`
 * — sigue en el árbol de accesibilidad y lo encuentran `getByRole('combobox')`/
 * `getByLabelText` de los tests), reemplazado visualmente por un listbox custom
 * animado que lee las opciones del DOM del `<select>` y escribe en él con
 * `setNativeValue` (dispara `change` real, así que `register()` de
 * react-hook-form lo recibe sin cambios).
 */
export function StyledSelect({ error, className, children, ref: forwardedRef, ...props }) {
  const selectRef = useRef(null);
  const {
    open, toggle, closePopover, position, triggerRef, popoverRef,
  } = usePickerPopover({ width: 260, height: 260 });
  const [options, setOptions] = useState([]);
  const [currentValue, setCurrentValue] = useState('');
  const [highlighted, setHighlighted] = useState(0);

  // Sin array de deps a propósito: re-lee `el.options`/`el.value` en cada render para
  // detectar cambios en `children` (options dinámicas) sin depender de identidad de props.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    const el = selectRef.current;
    if (!el) return;
    const next = Array.from(el.options).map((o) => ({ value: o.value, label: o.text, disabled: o.disabled }));
    setOptions((prev) => {
      const same = prev.length === next.length
        && prev.every((o, i) => o.value === next[i].value && o.label === next[i].label && o.disabled === next[i].disabled);
      return same ? prev : next;
    });
    setCurrentValue(el.value);
  });

  useEffect(() => {
    if (!open) return;
    const idx = options.findIndex((o) => o.value === currentValue);
    setHighlighted(idx >= 0 ? idx : 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  function selectOption(opt) {
    if (opt.disabled) return;
    setNativeValue(selectRef.current, opt.value);
    closePopover();
    triggerRef.current?.focus();
  }

  function handleTriggerKeyDown(e) {
    if (!open && ['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(e.key)) {
      e.preventDefault();
      toggle();
      return;
    }
    if (!open) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlighted((h) => Math.min(h + 1, options.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlighted((h) => Math.max(h - 1, 0));
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (options[highlighted]) selectOption(options[highlighted]);
    }
  }

  const selectedOption = options.find((o) => o.value === currentValue);
  const isPlaceholder = !currentValue;

  return (
    <div className="csf-picker">
      <select ref={mergeRefs(selectRef, forwardedRef)} tabIndex={-1} className="csf-native-hidden" {...props}>
        {children}
      </select>
      <button
        ref={triggerRef}
        type="button"
        className={[
          'csf-picker-trigger',
          'csf-dropdown-trigger',
          error && 'csf-picker-trigger--error',
          className,
        ].filter(Boolean).join(' ')}
        onClick={toggle}
        onKeyDown={handleTriggerKeyDown}
        disabled={props.disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className={isPlaceholder ? 'csf-picker-placeholder' : ''}>
          {selectedOption?.label || 'Seleccionar...'}
        </span>
        <ChevronDown size={14} strokeWidth={2} />
      </button>

      {open && createPortal(
        <ul
          ref={popoverRef}
          className="csf-dropdown-popover"
          role="listbox"
          aria-label="Opciones"
          style={{ top: position.top, left: position.left, minWidth: triggerRef.current?.offsetWidth }}
        >
          {options.map((opt, i) => (
            <li key={`${opt.value}-${i}`}>
              <button
                type="button"
                role="option"
                aria-selected={opt.value === currentValue}
                disabled={opt.disabled}
                className={[
                  'csf-dropdown-option',
                  i === highlighted && 'csf-dropdown-option--highlighted',
                  opt.value === currentValue && 'csf-dropdown-option--selected',
                ].filter(Boolean).join(' ')}
                onMouseEnter={() => setHighlighted(i)}
                onClick={() => selectOption(opt)}
              >
                <span>{opt.label}</span>
                {opt.value === currentValue && <Check size={14} strokeWidth={2.5} />}
              </button>
            </li>
          ))}
        </ul>,
        document.body,
      )}
    </div>
  );
}

/** Fila de label + input/select + mensaje de error. */
export const Field = ({ label, icon: Icon, error, children }) => (
  <div className="csf-field">
    <label className="csf-label">
      {Icon && <Icon size={16} color="#5C7285" />} {label}
    </label>
    {children}
    {error && (
      <span className="csf-error">
        <AlertCircle size={14} /> {error}
      </span>
    )}
  </div>
);

/** Wrapper animado (slide in/out según `direction`) de un paso del formulario multi-step. */
export const FormStep = ({ direction, children }) => (
  <motion.div
    custom={direction}
    variants={slideVariants}
    initial="enter"
    animate="center"
    exit="exit"
    transition={{ duration: 0.26, ease: 'easeInOut' }}
    className="csf-fields"
  >
    {children}
  </motion.div>
);

/** Campo de número de documento, ya conectado a react-hook-form vía `docNumberRegister`. */
export const DocNumberField = ({ docNumberRegister, errors, fieldKey = 'nroDocumento', placeholder = 'Ej. 12345678' }) => (
  <Field label="Número de Documento" error={errors[fieldKey]?.message}>
    <StyledInput {...docNumberRegister} placeholder={placeholder} error={!!errors[fieldKey]} />
  </Field>
);

/** Campo de email con validación de formato incorporada. */
export const EmailField = ({ register, errors, required, placeholder = 'maria@ejemplo.com' }) => (
  <Field label="Email" error={errors.email?.message}>
    <StyledInput
      {...register('email', {
        required: required ? 'Requerido' : false,
        pattern: { value: /^[^\s@]+@[^\s@]+$/i, message: 'Formato de email inválido' }
      })}
      type="email"
      placeholder={placeholder}
      error={!!errors.email}
    />
  </Field>
);