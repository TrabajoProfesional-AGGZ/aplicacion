import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Building2, Calendar, Clock, AlertCircle } from 'lucide-react';
import { createReserva, getTurnosDisponibles } from '../../services/reservasService';
import { Field, StyledInput, StyledSelect, FormStep } from '../createForm/FormFields';
import { MultiStepFormShell } from '../createForm/MultiStepFormShell';

const STEPS = [
  { id: 1, label: 'Instalación', icon: Building2 },
  { id: 2, label: 'Horario', icon: Clock },
];

const stepFields = {
  1: ['id_instalacion', 'fecha_reserva'],
  2: ['hora_inicio'],
};

const MENSAJES_ERROR_SUBMIT = {
  superposicion: 'Ese turno ya no está disponible. Elegí otro horario.',
  'apto-medico': 'Para reservar esta instalación necesitás tener el apto médico al día. Actualizalo en Mis trámites.',
  'socio-moroso': 'No podés reservar hasta regularizar tu situación financiera con el club.',
  'socio-suspendido': 'No podés reservar mientras tu cuenta esté suspendida.',
};

function hoyISO() {
  return new Date().toISOString().slice(0, 10);
}

export function CrearReservaFlow({ socio, instalaciones, onSuccess, onCancel }) {
  const [step, setStep] = useState(1);
  const [direction, setDirection] = useState(1);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [turnosDisponibles, setTurnosDisponibles] = useState([]);
  const [cargandoTurnos, setCargandoTurnos] = useState(false);
  const [errorTurnos, setErrorTurnos] = useState('');

  const {
    register,
    handleSubmit,
    trigger,
    watch,
    setValue,
    formState: { errors },
  } = useForm({ mode: 'onTouched' });

  const idInstalacionSeleccionada = watch('id_instalacion');
  const fechaSeleccionada = watch('fecha_reserva');

  useEffect(() => {
    if (!idInstalacionSeleccionada || !fechaSeleccionada) {
      setTurnosDisponibles([]);
      return;
    }
    let cancelled = false;
    setCargandoTurnos(true);
    setErrorTurnos('');
    getTurnosDisponibles(idInstalacionSeleccionada, fechaSeleccionada)
      .then((turnos) => {
        if (cancelled) return;
        setTurnosDisponibles(turnos);
        setValue('hora_inicio', '');
      })
      .catch(() => {
        if (!cancelled) {
          setTurnosDisponibles([]);
          setErrorTurnos('No se pudieron cargar los turnos disponibles.');
        }
      })
      .finally(() => { if (!cancelled) setCargandoTurnos(false); });
    return () => { cancelled = true; };
  }, [idInstalacionSeleccionada, fechaSeleccionada, setValue]);

  const goNext = async () => {
    const valid = await trigger(stepFields[step]);
    if (!valid) return;
    setDirection(1);
    setStep((s) => s + 1);
  };

  const goBack = () => {
    setDirection(-1);
    setStep((s) => s - 1);
  };

  const onSubmit = async (data) => {
    setSubmitError('');
    try {
      await createReserva({
        ids_socios: [socio.id],
        id_instalacion: data.id_instalacion,
        fecha_reserva: data.fecha_reserva,
        hora_inicio: data.hora_inicio,
      });
      setSubmitted(true);
      setTimeout(() => onSuccess(), 1800);
    } catch (e) {
      setSubmitError(MENSAJES_ERROR_SUBMIT[e.message] || 'No se pudo registrar la reserva. Intentá de nuevo.');
    }
  };

  return (
    <MultiStepFormShell
      steps={STEPS}
      step={step}
      submitted={submitted}
      title="Nueva reserva"
      successTitle="¡Reserva registrada!"
      successMessage="Tu reserva quedó pendiente hasta confirmar el pago."
      submitLabel="Confirmar reserva"
      onCancel={onCancel}
      goBack={goBack}
      goNext={goNext}
      direction={direction}
      onFormSubmit={handleSubmit(onSubmit)}
    >
      {step === 1 && (
        <FormStep key="step1" direction={direction}>
          <Field label="Instalación" icon={Building2} error={errors.id_instalacion?.message}>
            <StyledSelect
              {...register('id_instalacion', { required: 'Debe seleccionar una instalación' })}
              error={!!errors.id_instalacion}
            >
              <option value="">Seleccionar instalación...</option>
              {instalaciones.map((inst) => (
                <option key={inst.id} value={inst.id}>{inst.nombre}</option>
              ))}
            </StyledSelect>
          </Field>
          <Field label="Fecha" icon={Calendar} error={errors.fecha_reserva?.message}>
            <StyledInput
              {...register('fecha_reserva', { required: 'La fecha es requerida' })}
              type="date"
              min={hoyISO()}
              error={!!errors.fecha_reserva}
            />
          </Field>
        </FormStep>
      )}

      {step === 2 && (
        <FormStep key="step2" direction={direction}>
          <Field label="Turno" icon={Clock} error={errors.hora_inicio?.message}>
            <StyledSelect
              {...register('hora_inicio', { required: 'Debe seleccionar un turno' })}
              error={!!errors.hora_inicio}
              disabled={cargandoTurnos || turnosDisponibles.length === 0}
            >
              <option value="">
                {cargandoTurnos ? 'Cargando turnos...' : 'Seleccionar turno...'}
              </option>
              {turnosDisponibles.map((turno) => (
                <option key={turno} value={turno}>{turno.slice(0, 5)}</option>
              ))}
            </StyledSelect>
          </Field>
          {!cargandoTurnos && !errorTurnos && turnosDisponibles.length === 0 && (
            <p className="csf-error">
              <AlertCircle size={12} />
              No hay turnos disponibles para esta instalación en la fecha elegida.
            </p>
          )}
          {errorTurnos && (
            <p className="csf-error">
              <AlertCircle size={12} />
              {errorTurnos}
            </p>
          )}
          {submitError && (
            <p className="csf-error">
              <AlertCircle size={12} />
              {submitError}
            </p>
          )}
        </FormStep>
      )}
    </MultiStepFormShell>
  );
}
