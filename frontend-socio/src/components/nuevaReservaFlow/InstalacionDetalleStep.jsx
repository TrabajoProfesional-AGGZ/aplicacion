import { ArrowLeft, Clock, ChevronRight, AlertCircle } from 'lucide-react';
import './InstalacionDetalleStep.css';

function formatearMonto(monto) {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(monto);
}

function hoyISO() {
  return new Date().toISOString().slice(0, 10);
}

function abrirCalendario(e) {
  try {
    e.target.showPicker?.();
  } catch {
    // Navegadores sin soporte (Safari viejo, Firefox <101) o sin gesto de usuario
    // válido: el input sigue siendo clickeable/enfocable normalmente.
  }
}

function bloquearEdicionManual(e) {
  // Solo se puede cambiar la fecha a través del calendario nativo (showPicker),
  // no tipeando sobre el input — evita fechas mal formadas / fuera de la grilla.
  if (e.key === 'Tab' || e.key === 'Escape') return;
  e.preventDefault();
}

export function InstalacionDetalleStep({
  instalacion,
  fecha,
  onFechaChange,
  turnos,
  cargandoTurnos,
  errorTurnos,
  onSeleccionarTurno,
  onVolver,
}) {
  const tolerancia = instalacion.tiempo_minimo_cancelacion ?? 60;

  return (
    <section className="detalle-instalacion">
      <button type="button" className="detalle-volver-btn" onClick={onVolver}>
        <ArrowLeft size={18} />
        Volver
      </button>

      <section className="instalacion-banner">
        <div className="instalacion-banner-texture" aria-hidden="true" />
        <div className="instalacion-banner-content">
          <span className="instalacion-banner-tag">{instalacion.tipo}</span>
          <h2 className="instalacion-banner-nombre">{instalacion.nombre}</h2>
          <p className="instalacion-banner-subtitulo">{instalacion.tipo} · {instalacion.capacidad_maxima} personas</p>

          <div className="instalacion-banner-stats">
            <div className="instalacion-banner-stat">
              <span className="instalacion-banner-stat-label">Cancelación sin cargo</span>
              <span className="instalacion-banner-stat-valor">hasta {tolerancia} min antes</span>
            </div>
            <div className="instalacion-banner-divider" aria-hidden="true" />
            <div className="instalacion-banner-stat">
              <span className="instalacion-banner-stat-label">Duración del turno</span>
              <span className="instalacion-banner-stat-valor">{instalacion.duracion_turno} min</span>
            </div>
            <div className="instalacion-banner-divider" aria-hidden="true" />
            <div className="instalacion-banner-stat">
              <span className="instalacion-banner-stat-label">Valor del turno</span>
              <span className="instalacion-banner-stat-valor">{formatearMonto(instalacion.valor_turno)}</span>
            </div>
          </div>
        </div>
      </section>

      <label className="detalle-fecha-label" htmlFor="detalle-fecha-input">Fecha</label>
      <input
        id="detalle-fecha-input"
        type="date"
        className="detalle-fecha-input"
        min={hoyISO()}
        value={fecha}
        onChange={(e) => onFechaChange(e.target.value)}
        onClick={abrirCalendario}
        onFocus={abrirCalendario}
        onKeyDown={bloquearEdicionManual}
      />

      <h3 className="detalle-turnos-titulo">Turnos disponibles</h3>

      {cargandoTurnos && (
        <div className="detalle-turnos-skeleton" aria-label="Cargando turnos">
          {[0, 1, 2].map((i) => <div key={i} className="detalle-turno-skeleton-row" />)}
        </div>
      )}

      {!cargandoTurnos && errorTurnos && (
        <p className="detalle-turnos-error">
          <AlertCircle size={14} />
          {errorTurnos}
        </p>
      )}

      {!cargandoTurnos && !errorTurnos && turnos.length === 0 && (
        <p className="detalle-turnos-vacio">No hay turnos disponibles para esta fecha.</p>
      )}

      {!cargandoTurnos && !errorTurnos && turnos.length > 0 && (
        <div className="detalle-turnos-lista">
          {turnos.map((turno) => (
            <button
              type="button"
              key={turno}
              className="detalle-turno-row"
              onClick={() => onSeleccionarTurno(turno)}
            >
              <span className="detalle-turno-hora">
                <Clock size={15} />
                {turno.slice(0, 5)}
              </span>
              <span className="detalle-turno-duracion">· {instalacion.duracion_turno} min</span>
              <ChevronRight size={16} className="detalle-turno-chevron" />
            </button>
          ))}
        </div>
      )}
    </section>
  );
}
