import { validarArchivoTramite } from './formValidators';

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
