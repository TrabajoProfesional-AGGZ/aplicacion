export const validarFechaNacimiento = (value) => {
  if (!value) return "La fecha es requerida";

  const fechaSeleccionada = new Date(value);
  const hoy = new Date();

  if (fechaSeleccionada > hoy) {
    return "La fecha no puede ser en el futuro";
  }
  return undefined;
};

function formatearDigitosFecha(digitos, agregarBorde) {
  const dia = digitos.slice(0, 2);
  const mes = digitos.slice(2, 4);
  const anio = digitos.slice(4, 8);
  let resultado = dia;
  if (digitos.length > 2 || (digitos.length === 2 && agregarBorde)) {
    resultado = `${dia}/${mes}`;
  }
  if (digitos.length > 4 || (digitos.length === 4 && agregarBorde)) {
    resultado = `${dia}/${mes}/${anio}`;
  }
  return resultado;
}

/** Máscara DD/MM/AAAA: inserta "/" al completar día y mes al escribir; al borrar, no vuelve a insertarlo (evita que el backspace quede "trabado" justo después de una barra). */
export function aplicarMascaraFecha(valorNuevo, valorAnterior = '') {
  const borrando = valorNuevo.length < valorAnterior.length;
  let base = valorNuevo;
  if (borrando && base.endsWith('/')) {
    base = base.slice(0, -2);
  }
  const digitos = base.replace(/\D/g, '').slice(0, 8);
  return formatearDigitosFecha(digitos, !borrando);
}

/** 'DD/MM/AAAA' -> 'AAAA-MM-DD', o null si el formato/valor no es una fecha real (round-trip contra Date.UTC para rechazar 31/02, 29/02 no bisiesto, etc). */
export function parsearFechaTexto(valor) {
  if (!/^\d{2}\/\d{2}\/\d{4}$/.test(valor || '')) return null;

  const [diaStr, mesStr, anioStr] = valor.split('/');
  const dia = Number(diaStr);
  const mes = Number(mesStr);
  const anio = Number(anioStr);
  if (mes < 1 || mes > 12 || dia < 1 || dia > 31) return null;

  const fecha = new Date(Date.UTC(anio, mes - 1, dia));
  if (
    fecha.getUTCFullYear() !== anio ||
    fecha.getUTCMonth() !== mes - 1 ||
    fecha.getUTCDate() !== dia
  ) {
    return null;
  }

  const pad = (n) => String(n).padStart(2, '0');
  return `${anio}-${pad(mes)}-${pad(dia)}`;
}

export function validarFechaNacimientoTexto(valor) {
  if (!valor) return 'La fecha es requerida';
  if (!/^\d{2}\/\d{2}\/\d{4}$/.test(valor)) return 'Ingresá la fecha como DD/MM/AAAA';

  const anio = Number(valor.split('/')[2]);
  if (anio < 1900) return 'La fecha no es válida';

  const iso = parsearFechaTexto(valor);
  if (!iso) return 'La fecha no es válida';

  const fechaSeleccionada = new Date(`${iso}T00:00:00`);
  const hoy = new Date();
  if (fechaSeleccionada > hoy) return 'La fecha no puede ser en el futuro';

  return undefined;
}

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

/** Valida una credencial ya existente en el login (longitud, sin caracteres de control) — no es una política de fortaleza para contraseñas nuevas. */
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
  // Rechaza doble extensión peligrosa (ej. "foto.jpg.exe"), no solo la extensión final.
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
  // Rechaza doble extensión peligrosa (ej. "foto.jpg.exe"), no solo la extensión final.
  if (partes.slice(1, -1).some((segmento) => EXTENSIONES_PELIGROSAS.has(segmento.toLowerCase()))) {
    return 'Nombre de archivo no permitido';
  }
  if (file.size > TAMANIO_MAXIMO_TRAMITE) return 'El archivo no puede superar los 10MB';
  return undefined;
}