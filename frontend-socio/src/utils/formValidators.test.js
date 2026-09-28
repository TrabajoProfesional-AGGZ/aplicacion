import {
  validarArchivoTramite,
  aplicarMascaraFecha,
  parsearFechaTexto,
  validarFechaNacimientoTexto,
} from './formValidators';

function crearArchivo({ name, type, size }) {
  const file = new File(['contenido'], name, { type });
  Object.defineProperty(file, 'size', { value: size });
  return file;
}

describe('validarArchivoTramite', () => {
  test('devuelve undefined si no se pasa archivo', () => {
    expect(validarArchivoTramite(null)).toBeUndefined();
  });

  test('acepta un PDF válido', () => {
    const file = crearArchivo({ name: 'apto.pdf', type: 'application/pdf', size: 1024 });
    expect(validarArchivoTramite(file)).toBeUndefined();
  });

  test('acepta una imagen JPG válida', () => {
    const file = crearArchivo({ name: 'foto.jpg', type: 'image/jpeg', size: 1024 });
    expect(validarArchivoTramite(file)).toBeUndefined();
  });

  test('rechaza tipos MIME no permitidos', () => {
    const file = crearArchivo({ name: 'archivo.gif', type: 'image/gif', size: 1024 });
    expect(validarArchivoTramite(file)).toMatch(/Solo se permiten archivos/);
  });

  test('rechaza extensión que no coincide con la lista permitida', () => {
    const file = crearArchivo({ name: 'archivo.exe', type: 'application/pdf', size: 1024 });
    expect(validarArchivoTramite(file)).toMatch(/Solo se permiten archivos/);
  });

  test('rechaza doble extensión peligrosa', () => {
    const file = crearArchivo({ name: 'archivo.exe.pdf', type: 'application/pdf', size: 1024 });
    expect(validarArchivoTramite(file)).toBe('Nombre de archivo no permitido');
  });

  test('rechaza archivos de más de 10MB', () => {
    const file = crearArchivo({ name: 'apto.pdf', type: 'application/pdf', size: 11 * 1024 * 1024 });
    expect(validarArchivoTramite(file)).toBe('El archivo no puede superar los 10MB');
  });
});

describe('aplicarMascaraFecha', () => {
  test('inserta "/" automáticamente al completar el día y el mes al escribir', () => {
    let valor = '';
    for (const char of '15031990') {
      valor = aplicarMascaraFecha(valor + char, valor);
    }
    expect(valor).toBe('15/03/1990');
  });

  test('descarta caracteres no numéricos', () => {
    expect(aplicarMascaraFecha('1a5', '1')).toBe('15/');
  });

  test('al borrar la barra, borra también el dígito anterior en vez de quedar "trabado"', () => {
    // value "12/3" -> backspace elimina el "3", deja "12/"
    const resultado = aplicarMascaraFecha('12/', '12/3');
    expect(resultado).toBe('1');
  });

  test('al borrar un dígito sin llegar a la barra, no la reinserta', () => {
    const resultado = aplicarMascaraFecha('12/34', '12/34/');
    expect(resultado).toBe('12/34');
  });

  test('limita a 8 dígitos', () => {
    expect(aplicarMascaraFecha('123456789', '12345678')).toBe('12/34/5678');
  });
});

describe('parsearFechaTexto', () => {
  test('convierte una fecha válida a formato ISO', () => {
    expect(parsearFechaTexto('15/03/1990')).toBe('1990-03-15');
  });

  test('acepta 29/02 en año bisiesto', () => {
    expect(parsearFechaTexto('29/02/2024')).toBe('2024-02-29');
  });

  test('rechaza 29/02 en año no bisiesto', () => {
    expect(parsearFechaTexto('29/02/2023')).toBeNull();
  });

  test('rechaza 31/02 (día inexistente para ese mes)', () => {
    expect(parsearFechaTexto('31/02/2020')).toBeNull();
  });

  test('rechaza formato incompleto', () => {
    expect(parsearFechaTexto('1/2/2020')).toBeNull();
    expect(parsearFechaTexto('15/03/199')).toBeNull();
  });
});

describe('validarFechaNacimientoTexto', () => {
  test('devuelve mensaje de requerido si está vacío', () => {
    expect(validarFechaNacimientoTexto('')).toBe('La fecha es requerida');
  });

  test('devuelve mensaje de formato incompleto', () => {
    expect(validarFechaNacimientoTexto('15/03/99')).toBe('Ingresá la fecha como DD/MM/AAAA');
  });

  test('devuelve mensaje de fecha inválida para una fecha inexistente', () => {
    expect(validarFechaNacimientoTexto('31/02/2020')).toBe('La fecha no es válida');
  });

  test('devuelve mensaje de fecha inválida para un año menor a 1900', () => {
    expect(validarFechaNacimientoTexto('01/01/1850')).toBe('La fecha no es válida');
  });

  test('devuelve mensaje de fecha futura', () => {
    const enUnAnio = new Date();
    enUnAnio.setFullYear(enUnAnio.getFullYear() + 1);
    const dd = String(enUnAnio.getDate()).padStart(2, '0');
    const mm = String(enUnAnio.getMonth() + 1).padStart(2, '0');
    const yyyy = enUnAnio.getFullYear();
    expect(validarFechaNacimientoTexto(`${dd}/${mm}/${yyyy}`)).toBe('La fecha no puede ser en el futuro');
  });

  test('acepta una fecha válida', () => {
    expect(validarFechaNacimientoTexto('15/03/1990')).toBeUndefined();
  });
});
