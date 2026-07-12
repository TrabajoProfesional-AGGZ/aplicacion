export const validarFechaNacimiento = (value) => {
  if (!value) return "La fecha es requerida";
  
  const fechaSeleccionada = new Date(value);
  const hoy = new Date();
  
  if (fechaSeleccionada > hoy) {
    return "La fecha no puede ser en el futuro";
  }
  return true;
};

export const getDocNumberRules = () => ({
  required: 'El número de documento es requerido',
  minLength: { value: 7, message: 'Mínimo 7 números' },
  maxLength: { value: 9, message: 'Máximo 9 números' },
  pattern: { value: /^[0-9]+$/, message: 'Solo se permiten números' }
});