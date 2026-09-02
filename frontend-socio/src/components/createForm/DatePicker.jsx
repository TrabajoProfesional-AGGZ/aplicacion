import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import PropTypes from 'prop-types';
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react';
import { setNativeValue, mergeRefs } from './nativeInputUtils';
import { usePickerPopover } from './usePickerPopover';
import './Pickers.css';

const DIAS_SEMANA = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];
const MESES = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
];

function buildYearRange(min, max) {
  const currentYear = new Date().getFullYear();
  const maxYear = max ? Number(max.slice(0, 4)) : currentYear;
  const minYear = min ? Number(min.slice(0, 4)) : currentYear - 100;
  const years = [];
  for (let y = maxYear; y >= minYear; y -= 1) years.push(y);
  return years;
}

function pad2(n) { return String(n).padStart(2, '0'); }
function toIso(date) { return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`; }

function parseIso(str) {
  if (!str) return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(str);
  if (!match) return null;
  return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
}

function buildGridDays(viewDate) {
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const firstOfMonth = new Date(year, month, 1);
  const offset = (firstOfMonth.getDay() + 6) % 7; // grilla arranca en lunes
  const start = new Date(year, month, 1 - offset);
  return Array.from({ length: 42 }, (_, i) => {
    const d = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i);
    return { date: d, iso: toIso(d), inMonth: d.getMonth() === month };
  });
}

/**
 * Selector de fecha estilo calendario que reemplaza el `<input type="date">`
 * nativo. Por debajo mantiene un input real (accesible pero visualmente
 * oculto vía clip, nunca `display:none`/`hidden`) para que `register()` de
 * react-hook-form, `getByLabelText`/`getByRole('textbox')` y
 * `fireEvent.change` de los tests existentes sigan funcionando exactamente
 * igual que antes — la grilla de calendario solo escribe en ese input con
 * `setNativeValue` (dispara `change` real) en vez de manejar su propio estado
 * de formulario.
 */
export function DatePicker({ error, className, style, min, max, disabled, placeholder, ref: forwardedRef, ...props }) {
  const inputRef = useRef(null);
  const {
    open, toggle, closePopover, position, triggerRef, popoverRef,
  } = usePickerPopover({ width: 272, height: 336 });
  const [value, setValue] = useState('');
  const [viewDate, setViewDate] = useState(() => parseIso(value) || new Date());

  useEffect(() => {
    setValue(props.value || inputRef.current?.value || '');
  }, [props.value]);

  useEffect(() => {
    if (open) setViewDate(parseIso(value) || new Date());
  }, [open, value]);

  const selectedIso = value || null;
  const label = selectedIso
    ? (() => {
      const d = parseIso(selectedIso);
      return d ? `${d.getDate()} de ${MESES[d.getMonth()]} de ${d.getFullYear()}` : selectedIso;
    })()
    : (placeholder || 'Seleccionar fecha');

  function selectDay(iso) {
    setNativeValue(inputRef.current, iso);
    setValue(iso);
    closePopover();
  }

  function changeMonth(delta) {
    setViewDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + delta, 1));
  }

  const todayIso = toIso(new Date());
  const days = buildGridDays(viewDate);
  const years = buildYearRange(min, max);

  return (
    <div className="csf-picker" style={style}>
      <input
        ref={mergeRefs(inputRef, forwardedRef)}
        type="date"
        className="csf-native-hidden"
        min={min}
        max={max}
        disabled={disabled}
        {...props}
      />
      <button
        ref={triggerRef}
        type="button"
        className={`csf-picker-trigger${error ? ' csf-picker-trigger--error' : ''}${className ? ` ${className}` : ''}`}
        onClick={toggle}
        disabled={disabled}
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        <CalendarDays size={15} strokeWidth={2} />
        <span className={selectedIso ? '' : 'csf-picker-placeholder'}>{label}</span>
      </button>

      {open && createPortal(
        <div
          ref={popoverRef}
          className="csf-calendar-popover"
          role="dialog"
          aria-label="Elegir fecha"
          style={{ top: position.top, left: position.left }}
        >
          <div className="csf-calendar-header">
            <button type="button" className="csf-calendar-nav" onClick={() => changeMonth(-1)} aria-label="Mes anterior">
              <ChevronLeft size={16} />
            </button>
            <div className="csf-calendar-title-selects">
              <select
                className="csf-calendar-select"
                aria-label="Mes"
                value={viewDate.getMonth()}
                onChange={(e) => setViewDate(new Date(viewDate.getFullYear(), Number(e.target.value), 1))}
              >
                {MESES.map((m, i) => <option key={m} value={i}>{m}</option>)}
              </select>
              <select
                className="csf-calendar-select"
                aria-label="Año"
                value={viewDate.getFullYear()}
                onChange={(e) => setViewDate(new Date(Number(e.target.value), viewDate.getMonth(), 1))}
              >
                {years.map((y) => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
            <button type="button" className="csf-calendar-nav" onClick={() => changeMonth(1)} aria-label="Mes siguiente">
              <ChevronRight size={16} />
            </button>
          </div>
          <div className="csf-calendar-weekdays">
            {DIAS_SEMANA.map((d, i) => <span key={`${d}-${i}`}>{d}</span>)}
          </div>
          <div className="csf-calendar-grid">
            {days.map(({ date, iso, inMonth }) => {
              const isDisabled = (min && iso < min) || (max && iso > max);
              const isSelected = iso === selectedIso;
              const isToday = iso === todayIso;
              return (
                <button
                  key={iso}
                  type="button"
                  disabled={isDisabled}
                  onClick={() => selectDay(iso)}
                  aria-label={inMonth ? undefined : `${date.getDate()} de ${MESES[date.getMonth()]}`}
                  className={[
                    'csf-calendar-day',
                    !inMonth && 'csf-calendar-day--muted',
                    isSelected && 'csf-calendar-day--selected',
                    isToday && !isSelected && 'csf-calendar-day--today',
                  ].filter(Boolean).join(' ')}
                >
                  {date.getDate()}
                </button>
              );
            })}
          </div>
          <button type="button" className="csf-calendar-today-btn" onClick={() => selectDay(todayIso)}>
            Hoy
          </button>
        </div>,
        document.body,
      )}
    </div>
  );
}

DatePicker.propTypes = {
  error: PropTypes.bool,
  className: PropTypes.string,
  style: PropTypes.object,
  min: PropTypes.string,
  max: PropTypes.string,
  disabled: PropTypes.bool,
  placeholder: PropTypes.string,
};
