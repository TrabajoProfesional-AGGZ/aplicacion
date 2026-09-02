import { useEffect, useState } from 'react';
import { getInstalaciones } from '../../services/instalacionesService';
import { getTurnosDisponibles, createReserva } from '../../services/reservasService';
import { useBackToRoot } from '../../hooks/useBackToRoot';
import { InstalacionesListStep } from '../../components/nuevaReservaFlow/InstalacionesListStep';
import { InstalacionDetalleStep } from '../../components/nuevaReservaFlow/InstalacionDetalleStep';
import { AgregarSociosStep } from '../../components/nuevaReservaFlow/AgregarSociosStep';
import { ResumenReservaStep } from '../../components/nuevaReservaFlow/ResumenReservaStep';

const MENSAJES_ERROR_SUBMIT = {
  superposicion: 'Ese turno ya no está disponible. Elegí otro horario.',
  'sin-cupo': 'Ya no quedan cupos suficientes para ese turno con la cantidad de socios elegida.',
  'conflicto-temporal': 'La instalación está siendo actualizada por otra reserva. Probá de nuevo en unos segundos.',
  'apto-medico': 'Los siguientes socios no tienen el apto médico al día y deben actualizarlo para poder realizar reservas de tipo deportivas:',
  'socio-moroso': 'Los siguientes socios no estan al día con sus pagos y deben regularizar su estado para poder realizar reservas:',
  'socio-suspendido': 'Ningun socio suspendido puede realizar una reserva.',
};

function hoyISO() {
  // Fecha local, no UTC: `toISOString()` adelanta el día para usuarios en
  // husos horarios negativos (ej. Argentina, UTC-3) cerca de la medianoche.
  const ahora = new Date();
  const anio = ahora.getFullYear();
  const mes = String(ahora.getMonth() + 1).padStart(2, '0');
  const dia = String(ahora.getDate()).padStart(2, '0');
  return `${anio}-${mes}-${dia}`;
}

function filtrarTurnosPasados(turnos, fecha) {
  if (fecha !== hoyISO()) return turnos;
  const ahora = new Date();
  const horaActual = ahora.getHours() * 60 + ahora.getMinutes();
  return turnos.filter((turno) => {
    const [h, m] = turno.hora_inicio.split(':').map(Number);
    return h * 60 + m >= horaActual;
  });
}

/**
 * Flujo de reserva de una instalación en 4 pasos: instalaciones → detalle
 * (fecha y turno) → agregar socios → resumen y confirmación.
 */
export function NuevaReservaPage({ socio, onSalir, onExito }) {
  const [step, setStep] = useState('lista');

  const [instalaciones, setInstalaciones] = useState([]);
  const [cargandoInstalaciones, setCargandoInstalaciones] = useState(true);
  const [errorInstalaciones, setErrorInstalaciones] = useState(false);

  const [instalacionSeleccionada, setInstalacionSeleccionada] = useState(null);
  const [fecha, setFecha] = useState(hoyISO());
  const [turnos, setTurnos] = useState([]);
  const [cargandoTurnos, setCargandoTurnos] = useState(false);
  const [errorTurnos, setErrorTurnos] = useState('');
  const [turnoSeleccionado, setTurnoSeleccionado] = useState(null);
  const [cuposDisponiblesTurno, setCuposDisponiblesTurno] = useState(null);

  const [sociosAgregados, setSociosAgregados] = useState([]);

  const [enviando, setEnviando] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [reservaConfirmada, setReservaConfirmada] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [sociosIncumplen, setSociosIncumplen] = useState([]);

  useBackToRoot(step, 'lista', volverAInstalaciones);

  useEffect(() => {
    let cancelled = false;
    setCargandoInstalaciones(true);
    setErrorInstalaciones(false);
    getInstalaciones()
      .then((data) => { if (!cancelled) setInstalaciones(data); })
      .catch(() => { if (!cancelled) setErrorInstalaciones(true); })
      .finally(() => { if (!cancelled) setCargandoInstalaciones(false); });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!instalacionSeleccionada || !fecha) {
      setTurnos([]);
      return;
    }
    let cancelled = false;
    setCargandoTurnos(true);
    setErrorTurnos('');
    getTurnosDisponibles(instalacionSeleccionada.id, fecha)
      .then((data) => {
        if (cancelled) return;
        setTurnos(filtrarTurnosPasados(data, fecha));
        setTurnoSeleccionado(null);
      })
      .catch(() => {
        if (!cancelled) {
          setTurnos([]);
          setErrorTurnos('No se pudieron cargar los turnos disponibles.');
        }
      })
      .finally(() => { if (!cancelled) setCargandoTurnos(false); });
    return () => { cancelled = true; };
  }, [instalacionSeleccionada, fecha]);

  function irADetalle(instalacion) {
    setInstalacionSeleccionada(instalacion);
    setFecha(hoyISO());
    setTurnoSeleccionado(null);
    setSociosAgregados([]);
    setStep('detalle');
  }

  function irASocios(turno) {
    setTurnoSeleccionado(turno.hora_inicio);
    setCuposDisponiblesTurno(turno.cupos_disponibles);
    // Con capacidad máxima 1 (ej. parrillas) no tiene sentido agregar otros
    // socios a la reserva: se salta directo al resumen.
    setStep(instalacionSeleccionada.capacidad_maxima === 1 ? 'resumen' : 'socios');
  }

  function volverAInstalaciones() {
    setInstalacionSeleccionada(null);
    setTurnos([]);
    setTurnoSeleccionado(null);
    setCuposDisponiblesTurno(null);
    setSociosAgregados([]);
    setSubmitError('');
    setSociosIncumplen([]);
    setReservaConfirmada(false);
    setStep('lista');
  }

  async function confirmarReserva() {
    setEnviando(true);
    setSubmitError('');
    setSociosIncumplen([]);
    try {
      const reserva = await createReserva({
        ids_socios: [socio.id, ...sociosAgregados.map((s) => s.id)],
        id_instalacion: instalacionSeleccionada.id,
        fecha_reserva: fecha,
        hora_inicio: turnoSeleccionado,
      });
      setReservaConfirmada(reserva.estado === 'Confirmada');
      setSubmitted(true);
      setTimeout(() => onExito(), 1800);
    } catch (e) {
      setSubmitError(MENSAJES_ERROR_SUBMIT[e.message] || 'No se pudo registrar la reserva. Intentá de nuevo.');
      setSociosIncumplen(e.sociosIncumplen ?? []);
    } finally {
      setEnviando(false);
    }
  }

  if (step === 'lista') {
    return (
      <InstalacionesListStep
        instalaciones={instalaciones}
        cargando={cargandoInstalaciones}
        error={errorInstalaciones}
        onSeleccionar={irADetalle}
        onVolver={onSalir}
      />
    );
  }

  if (step === 'detalle') {
    return (
      <InstalacionDetalleStep
        instalacion={instalacionSeleccionada}
        fecha={fecha}
        onFechaChange={setFecha}
        turnos={turnos}
        cargandoTurnos={cargandoTurnos}
        errorTurnos={errorTurnos}
        onSeleccionarTurno={irASocios}
        onVolver={volverAInstalaciones}
      />
    );
  }

  if (step === 'socios') {
    return (
      <AgregarSociosStep
        socioTitular={socio}
        sociosAgregados={sociosAgregados}
        cuposDisponibles={cuposDisponiblesTurno}
        onAgregar={(s) => setSociosAgregados((prev) => [...prev, s])}
        onQuitar={(id) => setSociosAgregados((prev) => prev.filter((s) => s.id !== id))}
        onContinuar={() => setStep('resumen')}
        onVolver={volverAInstalaciones}
      />
    );
  }

  return (
    <ResumenReservaStep
      instalacion={instalacionSeleccionada}
      fecha={fecha}
      turno={turnoSeleccionado}
      socioTitular={socio}
      sociosAgregados={sociosAgregados}
      onConfirmar={confirmarReserva}
      onCancelar={volverAInstalaciones}
      onVolver={volverAInstalaciones}
      enviando={enviando}
      submitted={submitted}
      reservaConfirmada={reservaConfirmada}
      submitError={submitError}
      sociosIncumplen={sociosIncumplen}
    />
  );
}
