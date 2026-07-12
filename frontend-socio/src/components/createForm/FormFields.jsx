// src/components/createForm/FormFields.jsx
import React from 'react';

export const StyledInput = React.forwardRef(({ error, ...props }, ref) => (
  <input 
    ref={ref} 
    {...props} 
    style={{ 
      width: '100%', padding: '0.8rem', marginTop: '0.3rem', boxSizing: 'border-box',
      border: error ? '1px solid #ff4d4f' : '1px solid #ccc', borderRadius: '6px' 
    }} 
  />
));

export const StyledSelect = React.forwardRef(({ error, children, ...props }, ref) => (
  <select 
    ref={ref} 
    {...props} 
    style={{ 
      width: '100%', padding: '0.8rem', marginTop: '0.3rem', boxSizing: 'border-box',
      border: error ? '1px solid #ff4d4f' : '1px solid #ccc', borderRadius: '6px',
      backgroundColor: 'white'
    }}
  >
    {children}
  </select>
));

export const Field = ({ label, icon: Icon, error, children }) => (
  <div style={{ marginBottom: '1rem', width: '100%' }}>
    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', color: '#555', fontWeight: '500' }}>
      {Icon && <Icon size={16} color="#009ee3" />} {label}
    </label>
    {children}
    {error && <span style={{ color: '#ff4d4f', fontSize: '0.8rem', display: 'block', marginTop: '0.2rem' }}>{error}</span>}
  </div>
);

export const FormStep = ({ children }) => (
  // Acá podrías agregar clases CSS para animar la transición si quisieras
  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
    {children}
  </div>
);

export const DocNumberField = ({ docNumberRegister, errors, fieldKey = 'nroDocumento' }) => (
  <Field label="Número de Documento" error={errors[fieldKey]?.message}>
    <StyledInput {...docNumberRegister} placeholder="Sin puntos ni espacios" error={!!errors[fieldKey]} />
  </Field>
);

export const EmailField = ({ register, errors, required }) => (
  <Field label="Email" error={errors.email?.message}>
    <StyledInput 
      {...register('email', { 
        required: required ? 'Requerido' : false,
        pattern: { value: /^\S+@\S+$/i, message: 'Formato de email inválido' }
      })} 
      type="email" 
      placeholder="tu@email.com" 
      error={!!errors.email} 
    />
  </Field>
);