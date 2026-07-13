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
  pattern: { value: /^\d+$/, message: 'Solo se permiten números' }
});

export const MAX_LEN = {
  EMAIL: 254,
  PASSWORD: 128,
};

// eslint-disable-next-line no-control-regex
const CARACTERES_DE_CONTROL = /[\x00-\x1F\x7F]/;

// Defensa de longitud/caracteres para credenciales de login. Firebase Auth ya
// parametriza sus queries (no hay SQL injection real posible acá), así que esto
// no incluye un blocklist de palabras SQL — solo evita strings eternos (DoS de
// UX/servicio) y bytes de control que no tienen ningún uso legítimo en un
// email/contraseña de un solo renglón.
export function validarCredencialSegura(value, maxLength) {
  if (CARACTERES_DE_CONTROL.test(value)) {
    return 'El valor contiene caracteres no permitidos';
  }
  if (value.length > maxLength) {
    return `Máximo ${maxLength} caracteres`;
  }
  return '';
}

// Misma política de contraseñas que WebApp (CreateUserForm/useChangePassword):
// mín. 10, máx. MAX_LEN.PASSWORD, minúscula + mayúscula + número. Se usa al
// definir una contraseña nueva (registro, cambio de contraseña) — no al hacer
// login, donde solo corre `validarCredencialSegura` contra la que ya existe.
export function validarFortalezaPassword(v) {
  if (!v || v.length < 10) return 'Mínimo 10 caracteres';
  if (v.length > MAX_LEN.PASSWORD) return `Máximo ${MAX_LEN.PASSWORD} caracteres`;
  if (!/[a-z]/.test(v)) return 'Debe incluir al menos una minúscula';
  if (!/[A-Z]/.test(v)) return 'Debe incluir al menos una mayúscula';
  if (!/\d/.test(v)) return 'Debe incluir al menos un número';
  return undefined;
}

export function getPasswordRules() {
  return {
    required: 'La contraseña es requerida',
    validate: validarFortalezaPassword,
  };
}