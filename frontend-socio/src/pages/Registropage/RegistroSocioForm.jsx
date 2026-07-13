import {
  User, Mail, Phone,
  Calendar, Lock, ShieldCheck, MapPin
} from 'lucide-react';
import { validarFechaNacimiento, getDocNumberRules, getPasswordRules } from '../../utils/formValidators';
import { Field, StyledInput, StyledSelect, FormStep, DocNumberField, EmailField } from '../../components/createForm/FormFields';
import { MultiStepFormShell } from '../../components/createForm/MultiStepFormShell';
import { useMultiStepForm } from '../../hooks/useMultiStepForm';
import { useEffect, useRef, useState } from 'react';
import { fetchTo } from '../../utils/utils';
import { validarSocio, reclamarCuentaSocio } from '../../services/sociosService';

import { auth } from '../../firebase';
import { createUserWithEmailAndPassword, getIdToken, deleteUser } from 'firebase/auth';

const STEPS = [
  { id: 1, label: 'Validación', icon: ShieldCheck },
  { id: 2, label: 'Personal', icon: User },
  { id: 3, label: 'Contacto', icon: Phone },
  { id: 4, label: 'Credenciales', icon: Mail },
];

const stepFields = {
  1: ['nroSocio', 'nroDocumento'],
  2: ['nombre', 'apellido', 'fechaNacimiento', 'genero'],
  3: ['telefono', 'direccion'],
  4: ['email', 'password'],
};

export function RegistroSocioForm({ onSuccess, onCancel }) {
const {
    step, direction, submitted, setSubmitted, navGuard,
    goBack, goNext, formError, setFormError,
    register, handleSubmit, errors, isSubmitting, setIsSubmitting,
    getValues, trigger
  } = useMultiStepForm(stepFields);

  const [validandoPaso, setValidandoPaso] = useState(false);
  const montadoRef = useRef(true);

  useEffect(() => {
    return () => {
      montadoRef.current = false;
    };
  }, []);

  const notificarExito = () => {
    if (montadoRef.current) onSuccess();
  };

  const manejarSiguiente = async () => {
    setFormError('');
    
    const isStepValid = await trigger(stepFields[step]);
    if (!isStepValid) return;

    if (step === 1) {
      setValidandoPaso(true);
      try {
        const { nroSocio, nroDocumento } = getValues();

        await validarSocio(nroSocio, nroDocumento);

        goNext();
      } catch (error) {
        if (error.message === 'cuenta-ya-registrada') {
          setFormError('Este socio ya tiene una cuenta registrada. Iniciá sesión en su lugar.');
        } else if (error.message === 'socio-no-encontrado') {
          setFormError('No pudimos validar tu identidad. Por favor, revisá los datos completados.');
        } else {
          console.error('Error al validar el socio:', error);
          setFormError('Error de conexión al validar el socio.');
        }
      } finally {
        setValidandoPaso(false);
      }
    } else {
      goNext();
    }
  };

  const onSubmit = async (data) => {
    setFormError('');
    if (setIsSubmitting) setIsSubmitting(true);
    let usuarioCreado = null;
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
      usuarioCreado = userCredential.user;
      const tokenJWT = await getIdToken(userCredential.user);

      const payload = {
        nombre: data.nombre,
        apellido: data.apellido,
        fecha_nacimiento: data.fechaNacimiento,
        nro_documento: data.nroDocumento,
        genero: data.genero.value,
        email: data.email,
        telefono: data.telefono,
        direccion: data.direccion
      };

      const updateResponse = await fetchTo(`/api/v1/socios/por-dni/${data.nroDocumento}`,'PATCH', payload)

      if (!updateResponse.ok) {
        throw new Error('error-actualizacion');
      }

      try {
        await reclamarCuentaSocio(data.nroDocumento);
      } catch (reclamarErr) {
        console.error('No se pudo marcar la cuenta como reclamada:', reclamarErr);
      }

      localStorage.setItem('socioToken', tokenJWT);
      setSubmitted(true);
      setTimeout(notificarExito, 1800);

    } catch (err) {
      if (usuarioCreado) {
        try {
          await deleteUser(usuarioCreado);
          console.log("Rollback ejecutado: Usuario fantasma eliminado de Firebase.");
        } catch (rollbackErr) {
          console.error("Error crítico al intentar hacer rollback:", rollbackErr);
        }
      }
      if (err.message === 'validacion-fallida') {
        setFormError('Los datos no coinciden con ningún socio registrado.');
      } else if (err.code === 'auth/email-already-in-use') {
        setFormError('El email ya está en uso. Por favor, iniciá sesión.');
      } else if (err.message === 'error-actualizacion') {
        setFormError('Tu cuenta fue creada pero hubo un error al guardar tus datos. Contactá al club.');
      } else {
        setFormError('Error al procesar el registro. Verificá tu conexión e intentá de nuevo.');
      }
    } finally {
      if (setIsSubmitting) setIsSubmitting(false);
    }
  };

  const nroDocumentoRegister = register('nroDocumento', getDocNumberRules());

  const enviarFormulario = handleSubmit(onSubmit);

  return (
    <MultiStepFormShell
      steps={STEPS}
      step={step}
      submitted={submitted}
      navGuard={navGuard}
      isSubmitting={isSubmitting || validandoPaso}
      title="Registro de Socio"
      successTitle="¡Cuenta configurada!"
      successMessage="Ya podés empezar a usar la aplicación del club."
      submitLabel="Completar registro"
      submitLoadingLabel="Procesando..."
      onCancel={onCancel}
      goBack={goBack}
      goNext={manejarSiguiente}
      direction={direction}
      onFormSubmit={enviarFormulario}
    >
        {/* PASO 1: VALIDACIÓN DE IDENTIDAD */}
        {step === 1 && (
          <FormStep key="step1" direction={direction}>
            <Field label="Número de Socio" icon={ShieldCheck} error={errors.nroSocio?.message}>
              <StyledInput
                {...register('nroSocio', { required: 'Requerido' })}
                placeholder="Ej: 1234"
                error={!!errors.nroSocio}
              />
            </Field>
            <DocNumberField docNumberRegister={nroDocumentoRegister} errors={errors} fieldKey="nroDocumento" />
            
            {formError && <p className="csf-form-error">{formError}</p>}
          </FormStep>
        )}

        {/* PASO 2: DATOS PERSONALES[cite: 1] */}
        {step === 2 && (
          <FormStep key="step2" direction={direction}>
            <div className="csf-grid-2">
              <Field label="Nombre" icon={User} error={errors.nombre?.message}>
                <StyledInput
                  {...register('nombre', { required: 'Requerido' })}
                  placeholder="María"
                  error={!!errors.nombre}
                />
              </Field>
              <Field label="Apellido" icon={User} error={errors.apellido?.message}>
                <StyledInput
                  {...register('apellido', { required: 'Requerido' })}
                  placeholder="González"
                  error={!!errors.apellido}
                />
              </Field>
            </div>
            
            <div className="csf-grid-2">
              <Field label="Fecha de nacimiento" icon={Calendar} error={errors.fechaNacimiento?.message}>
                <StyledInput
                  {...register('fechaNacimiento', { required: 'Requerida', validate: validarFechaNacimiento })}
                  type="date"
                  max={new Date().toISOString().split('T')[0]}
                  error={!!errors.fechaNacimiento}
                />
              </Field>
              <Field label="Género" icon={User} error={errors.genero?.message}>
                <StyledSelect
                  {...register('genero', { required: 'Seleccioná una opción' })}
                  error={!!errors.genero}
                >
                  <option value="">Seleccionar...</option>
                  <option value="Femenino">Femenino</option>
                  <option value="Masculino">Masculino</option>
                  <option value="Otro">Otro</option>
                </StyledSelect>
              </Field>
            </div>
          </FormStep>
        )}

        {/* PASO 3: DATOS DE CONTACTO */}
        {step === 3 && (
          <FormStep key="step3" direction={direction}>
            <Field label="Teléfono" icon={Phone} error={errors.telefono?.message}>
              <StyledInput
                {...register('telefono', { required: 'Requerido' })}
                placeholder="Ej: 1123456789"
                type="tel"
                error={!!errors.telefono}
              />
            </Field>
            <Field label="Dirección" icon={MapPin} error={errors.direccion?.message}>
              <StyledInput
                {...register('direccion', { required: 'Requerida' })}
                placeholder="Calle Falsa 123"
                error={!!errors.direccion}
              />
            </Field>
          </FormStep>
        )}

        {/* PASO 4: CREDENCIALES (Firebase)[cite: 1] */}
        {step === 4 && (
          <FormStep key="step4" direction={direction}>
            <EmailField register={register} errors={errors} required />
            <Field label="Contraseña" icon={Lock} error={errors.password?.message}>
              <StyledInput
                {...register('password', getPasswordRules())}
                type="password"
                placeholder="Mínimo 10 caracteres, con mayúscula, minúscula y número"
                autoComplete="new-password"
                error={!!errors.password}
              />
            </Field>
            {formError && <p className="csf-form-error">{formError}</p>}
          </FormStep>
        )}
    </MultiStepFormShell>
  );
}