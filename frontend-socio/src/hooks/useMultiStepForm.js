// src/hooks/useMultiStepForm.js
import { useState } from 'react';
import { useForm } from 'react-hook-form';

export function useMultiStepForm(stepFields) {
  const [step, setStep] = useState(1);
  const [direction, setDirection] = useState(1);
  const [submitted, setSubmitted] = useState(false);
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Inicializamos react-hook-form
  const { register, handleSubmit, getValues, trigger, formState: { errors } } = useForm({
    mode: 'onTouched'
  });

  // Avanzar de paso con validación previa
  const goNext = async () => {
    const fieldsToValidate = stepFields[step];
    // Dispara la validación solo para los campos del paso actual
    const isStepValid = await trigger(fieldsToValidate);
    
    if (isStepValid) {
      setDirection(1);
      setStep((s) => s + 1);
    }
  };

  const goBack = () => {
    setDirection(-1);
    setStep((s) => s - 1);
  };

  return {
    step, direction, submitted, setSubmitted,
    goBack, goNext, formError, setFormError,
    register, handleSubmit, errors, isSubmitting, setIsSubmitting,
    navGuard: true,
    getValues,
    trigger
  };
}