import { Clock, ChevronRight, AlertCircle } from 'lucide-react';
import { DatePicker } from '../createForm/DatePicker';
import { SkeletonRows } from '../SkeletonRows/SkeletonRows';
import { PageHeader } from '../PageHeader/PageHeader';
import './InstalacionDetalleStep.css';

function formatearMonto(monto) {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(monto);
}

function hoyISO() {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/** Detalle de una instalación: banner con condiciones, selector de fecha y turnos disponibles. */
export function InstalacionDetalleStep({
  instalacion,
  fecha,
  onFechaChange,
  turnos,
  cargandoTurnos,
  errorTurnos,
  onSeleccionarTurno,
}) {
  const tolerancia = instalacion.tiempo_minimo_cancelacion ?? 60;

  return (
    <section className="detalle-instalacion">
      <PageHeader
        eyebrow={instalacion.tipo}
        titulo={instalacion.nombre}
        subtitulo={`${instalacion.tipo} · ${instalacion.capacidad_maxima} personas`}
        stats={[
          { label: 'Cancelación sin cargo', value: `Hasta ${tolerancia} min antes` },
          { label: 'Duración del turno', value: `${instalacion.duracion_turno} min` },
          { label: 'Valor del turno', value: formatearMonto(instalacion.valor_turno) },
        ]}
      />

      <label className="detalle-fecha-label" htmlFor="detalle-fecha-input">Fecha</label>
      <DatePicker
        id="detalle-fecha-input"
        className="detalle-fecha-input"
        min={hoyISO()}
        value={fecha}
        onChange={(e) => onFechaChange(e.target.value)}
      />

      <h3 className="detalle-turnos-titulo">Turnos disponibles</h3>

      {cargandoTurnos && <SkeletonRows n={3} altura={48} label="Cargando turnos" />}

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
              key={turno.hora_inicio}
              className="detalle-turno-row"
              onClick={() => onSeleccionarTurno(turno)}
            >
              <span className="detalle-turno-hora">
                <Clock size={15} />
                {turno.hora_inicio.slice(0, 5)}
              </span>
              <span className="detalle-turno-duracion">· {instalacion.duracion_turno} min</span>
              <span className="detalle-turno-cupos">
                {turno.cupos_disponibles}/{instalacion.capacidad_maxima} lugares
              </span>
              <ChevronRight size={16} className="detalle-turno-chevron" />
            </button>
          ))}
        </div>
      )}
    </section>
  );
}
