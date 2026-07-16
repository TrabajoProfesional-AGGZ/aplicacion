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

export function validarCredencialSegura(value, maxLength) {
  if (CARACTERES_DE_CONTROL.test(value)) {
    return 'El valor contiene caracteres no permitidos';
  }
  if (value.length > maxLength) {
    return `Máximo ${maxLength} caracteres`;
  }
  return '';
}

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

const TIPOS_IMAGEN_PERMITIDOS = new Set(['image/jpeg', 'image/png', 'image/webp']);
const EXTENSIONES_IMAGEN_PERMITIDAS = new Set(['jpg', 'jpeg', 'png', 'webp']);
const EXTENSIONES_PELIGROSAS = new Set([
  'exe', 'sh', 'bat', 'cmd', 'msi', 'php', 'js', 'jar', 'py',
  'dll', 'com', 'scr', 'vbs', 'ps1', 'apk', 'html', 'htm',
]);
const TAMANIO_MAXIMO_IMAGEN = 5 * 1024 * 1024;

export function validarArchivoImagen(file) {
  if (!file) return undefined;
  if (!TIPOS_IMAGEN_PERMITIDOS.has(file.type)) return 'Solo se permiten imágenes JPG, PNG o WEBP';

  const partes = file.name.split('.');
  const extension = partes[partes.length - 1]?.toLowerCase();
  if (partes.length < 2 || !EXTENSIONES_IMAGEN_PERMITIDAS.has(extension)) {
    return 'Solo se permiten imágenes JPG, PNG o WEBP';
  }
  if (partes.slice(1, -1).some((segmento) => EXTENSIONES_PELIGROSAS.has(segmento.toLowerCase()))) {
    return 'Nombre de archivo no permitido';
  }
  if (file.size > TAMANIO_MAXIMO_IMAGEN) return 'La imagen no puede superar los 5MB';
  return undefined;
}

const TIPOS_TRAMITE_PERMITIDOS = new Set(['image/jpeg', 'image/png', 'image/webp', 'application/pdf']);
const EXTENSIONES_TRAMITE_PERMITIDAS = new Set(['jpg', 'jpeg', 'png', 'webp', 'pdf']);
const TAMANIO_MAXIMO_TRAMITE = 10 * 1024 * 1024;

export function validarArchivoTramite(file) {
  if (!file) return undefined;
  if (!TIPOS_TRAMITE_PERMITIDOS.has(file.type)) return 'Solo se permiten archivos JPG, PNG, WEBP o PDF';

  const partes = file.name.split('.');
  const extension = partes[partes.length - 1]?.toLowerCase();
  if (partes.length < 2 || !EXTENSIONES_TRAMITE_PERMITIDAS.has(extension)) {
    return 'Solo se permiten archivos JPG, PNG, WEBP o PDF';
  }
  if (partes.slice(1, -1).some((segmento) => EXTENSIONES_PELIGROSAS.has(segmento.toLowerCase()))) {
    return 'Nombre de archivo no permitido';
  }
  if (file.size > TAMANIO_MAXIMO_TRAMITE) return 'El archivo no puede superar los 10MB';
  return undefined;
}