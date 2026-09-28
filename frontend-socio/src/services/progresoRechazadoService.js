const CLAVE = 'su_progreso_rechazado';
const DURACION_MS = 5 * 60 * 1000;

/**
 * Guarda en `localStorage` el avance de un flujo (reserva/inscripción/entrada/compra)
 * rechazado por morosidad propia, para poder retomarlo desde "Volver a..." una vez
 * que el socio se puso al día — vive 5 minutos, ligado al socio que lo generó.
 * Todo en try/catch: `localStorage` puede estar deshabilitado/lleno, y no vale la
 * pena romper el flujo de rechazo por eso.
 */
export function guardarProgreso(tipo, socioId, datos) {
  try {
    const registro = {
      tipo,
      socioId,
      datos,
      expiraEn: Date.now() + DURACION_MS,
    };
    localStorage.setItem(CLAVE, JSON.stringify(registro));
  } catch {
    // noop: si no se puede guardar, simplemente no habrá "Volver a..." para retomar.
  }
}

export function leerProgreso(socioId) {
  try {
    const crudo = localStorage.getItem(CLAVE);
    if (!crudo) return null;

    const registro = JSON.parse(crudo);
    if (
      !registro ||
      typeof registro.expiraEn !== 'number' ||
      registro.expiraEn < Date.now() ||
      registro.socioId !== socioId
    ) {
      localStorage.removeItem(CLAVE);
      return null;
    }
    return registro;
  } catch {
    limpiarProgreso();
    return null;
  }
}

export function limpiarProgreso() {
  try {
    localStorage.removeItem(CLAVE);
  } catch {
    // noop
  }
}
