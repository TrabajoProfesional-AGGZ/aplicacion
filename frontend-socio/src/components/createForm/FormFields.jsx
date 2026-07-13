// src/components/createForm/FormFields.jsx
import React from 'react';
import { AlertCircle } from 'lucide-react';

export const StyledInput = React.forwardRef(({ error, ...props }, ref) => (
  <input
    ref={ref}
    {...props}
    className={`csf-input${error ? ' csf-input--error' : ''}`}
  />
));

export const StyledSelect = React.forwardRef(({ error, children, ...props }, ref) => (
  <select
    ref={ref}
    {...props}
    className={`csf-select${error ? ' csf-select--error' : ''}`}
  >
    {children}
  </select>
));

export const Field = ({ label, icon: Icon, error, children }) => (
  <div className="csf-field">
    <label className="csf-label">
      {Icon && <Icon size={16} color="#4A4A4A" />} {label}
    </label>
    {children}
    {error && (
      <span className="csf-error">
        <AlertCircle size={14} /> {error}
      </span>
    )}
  </div>
);

export const FormStep = ({ children }) => (
  <div className="csf-fields">
    {children}
  </div>
);

export const DocNumberField = ({ docNumberRegister, errors, fieldKey = 'nroDocumento', placeholder = 'Ej. 12345678' }) => (
  <Field label="Número de Documento" error={errors[fieldKey]?.message}>
    <StyledInput {...docNumberRegister} placeholder={placeholder} error={!!errors[fieldKey]} />
  </Field>
);

export const EmailField = ({ register, errors, required, placeholder = 'maria@ejemplo.com' }) => (
  <Field label="Email" error={errors.email?.message}>
    <StyledInput
      {...register('email', {
        required: required ? 'Requerido' : false,
        pattern: { value: /^\S+@\S+$/i, message: 'Formato de email inválido' }
      })}
      type="email"
      placeholder={placeholder}
      error={!!errors.email}
    />
  </Field>
);