import {
  User, CreditCard, Phone,
  Calendar, MapPin,
} from 'lucide-react';
import { createSocio } from '../../services/sociosService';
import { validarFechaNacimiento, getDocNumberRules } from '../../utils/formValidators';
import { Field, StyledInput, StyledSelect, FormStep, SOCIOS_STEPS, DocTypeOptions, DocNumberField, EmailField } from './FormFields';
import { MultiStepFormShell } from './MultiStepFormShell';
import { useMultiStepForm } from '../../hooks/useMultiStepForm';
import './CreateSocioForm.css';

const STEPS = SOCIOS_STEPS;

const stepFields = {
  1: ['firstName', 'lastName', 'birthDate', 'gender'],
  2: ['docType', 'docNumber'],
  3: ['email', 'phone', 'address'],
};

export function CreateSocioForm({ onSuccess, onCancel }) {
  const {
    step, direction, submitted, setSubmitted, navGuard,
    goBack, goNext, formError, setFormError,
    register, handleSubmit, errors, isSubmitting,
  } = useMultiStepForm(stepFields);

  const onSubmit = async (data) => {
    setFormError('');
    const payload = {
      nombre: data.firstName,
      apellido: data.lastName,
      fecha_nacimiento: data.birthDate,
      genero: data.gender,
      tipo_doc: data.docType,
      nro_documento: data.docNumber,
      email: data.email,
      ...(data.phone && { telefono: data.phone }),
      ...(data.address && { direccion: data.address }),
    };
    try {
      await createSocio(payload);
      setSubmitted(true);
      setTimeout(() => onSuccess(), 1800);
    } catch (err) {
      if (err.message === 'socio-duplicado') {
        setFormError('Ya existe un socio con ese documento o email.');
      } else if (err.message === 'servicio-no-disponible') {
        setFormError('El servicio no está disponible. Intentá de nuevo más tarde.');
      } else {
        setFormError('Error al crear el socio. Verificá los datos e intentá de nuevo.');
      }
    }
  };

  const docNumberRegister = register('docNumber', getDocNumberRules());

  return (
    <MultiStepFormShell
      steps={STEPS}
      step={step}
      submitted={submitted}
      navGuard={navGuard}
      isSubmitting={isSubmitting}
      title="Nuevo socio"
      successTitle="¡Socio creado!"
      successMessage="Los datos fueron guardados correctamente."
      submitLabel="Crear socio"
      submitLoadingLabel="Creando..."
      onCancel={onCancel}
      goBack={goBack}
      goNext={goNext}
      direction={direction}
      onFormSubmit={handleSubmit(onSubmit)}
    >
        {step === 1 && (
          <FormStep key="step1" direction={direction}>
            <div className="csf-grid-2">
              <Field label="Nombre" icon={User} error={errors.firstName?.message}>
                <StyledInput
                  {...register('firstName', { required: 'Requerido' })}
                  placeholder="María"
                  error={!!errors.firstName}
                />
              </Field>
              <Field label="Apellido" icon={User} error={errors.lastName?.message}>
                <StyledInput
                  {...register('lastName', { required: 'Requerido' })}
                  placeholder="González"
                  error={!!errors.lastName}
                />
              </Field>
            </div>
            <Field label="Fecha de nacimiento" icon={Calendar} error={errors.birthDate?.message}>
              <StyledInput
                {...register('birthDate', { required: 'La fecha es requerida', validate: validarFechaNacimiento })}
                type="date"
                max={new Date().toISOString().split('T')[0]}
                error={!!errors.birthDate}
              />
            </Field>
            <Field label="Género" icon={User} error={errors.gender?.message}>
              <StyledSelect
                {...register('gender', { required: 'Seleccioná una opción' })}
                error={!!errors.gender}
              >
                <option value="">Seleccionar...</option>
                <option value="M">Masculino (M)</option>
                <option value="F">Femenino (F)</option>
                <option value="X">No binario (X)</option>
              </StyledSelect>
            </Field>
          </FormStep>
        )}

        {step === 2 && (
          <FormStep key="step2" direction={direction}>
            <Field label="Tipo de documento" icon={CreditCard} error={errors.docType?.message}>
              <StyledSelect
                {...register('docType', { required: 'Seleccioná un tipo' })}
                error={!!errors.docType}
              >
                <DocTypeOptions />
              </StyledSelect>
            </Field>
            <DocNumberField docNumberRegister={docNumberRegister} errors={errors} fieldKey="docNumber" />
          </FormStep>
        )}

        {step === 3 && (
          <FormStep key="step3" direction={direction}>
            <EmailField register={register} errors={errors} required />
            <Field label="Teléfono (opcional)" icon={Phone} error={errors.phone?.message}>
              <StyledInput
                {...register('phone', {
                  pattern: {
                    value: /^[+\d\s\-()]{7,20}$/,
                    message: 'Número inválido',
                  },
                })}
                type="tel"
                placeholder="+54 11 1234-5678"
                error={!!errors.phone}
              />
            </Field>
            <Field label="Dirección (opcional)" icon={MapPin} error={errors.address?.message}>
              <StyledInput
                {...register('address', {
                  minLength: { value: 5, message: 'Ingresá una dirección completa' },
                })}
                placeholder="Av. Corrientes 1234, CABA"
                error={!!errors.address}
              />
            </Field>
            {formError && <p className="csf-form-error">{formError}</p>}
          </FormStep>
        )}
    </MultiStepFormShell>
  );
}
