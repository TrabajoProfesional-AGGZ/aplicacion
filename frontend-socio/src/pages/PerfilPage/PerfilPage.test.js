import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { PerfilPage } from './PerfilPage';

jest.mock('../../firebase', () => ({ auth: {} }));
jest.mock('../../utils/authService', () => ({
  changePassword: jest.fn(),
  login: jest.fn(),
}));
import { changePassword, login } from '../../utils/authService';

const mockSetSocio = jest.fn();
jest.mock('../../hooks/useAuth', () => ({
  useAuth: () => ({ setSocio: mockSetSocio }),
}));

let mockBiometricState;
jest.mock('../../hooks/useBiometricLogin', () => ({
  useBiometricLogin: () => mockBiometricState,
}));

jest.mock('../../services/sociosService', () => ({
  subirFotoSocio: jest.fn(),
}));
import { subirFotoSocio } from '../../services/sociosService';

const socioFixture = {
  nombre: 'Ana',
  apellido: 'Pérez',
  nro_socio: '1000',
  categoria: { nombre: 'Titular' },
  estado: { nombre: 'Activo' },
  nro_documento: '30123456',
  fecha_nacimiento: '1990-05-12',
  email: 'ana.perez@example.com',
  telefono: '+54 9 11 5555-1234',
};

function abrirModalCambiarContrasenia() {
  fireEvent.click(screen.getByText('Cambiar contraseña'));
}

function completarFormulario({ actual = 'ActualClave1', nueva = 'NuevaClave12', confirmar = 'NuevaClave12' } = {}) {
  fireEvent.change(screen.getByLabelText('Contraseña actual'), { target: { value: actual } });
  fireEvent.change(screen.getByLabelText('Nueva contraseña'), { target: { value: nueva } });
  fireEvent.change(screen.getByLabelText('Confirmar nueva contraseña'), { target: { value: confirmar } });
}

// El botón "Cambiar contraseña" existe dos veces en pantalla con el modal
// abierto (el que lo abre y el submit del form) — se envía el form
// directamente para no depender de cuál de los dos matchea `getByRole`.
function enviarFormulario() {
  fireEvent.submit(screen.getByLabelText('Contraseña actual').closest('form'));
}

class MockFileReader {
  readAsDataURL(file) {
    this.result = `data:${file.type};base64,ZmFrZQ==`;
    if (this.onload) this.onload();
  }
}

function crearArchivo({ name = 'foto.jpg', type = 'image/jpeg', size } = {}) {
  const file = new File(['contenido-de-prueba'], name, { type });
  if (size !== undefined) Object.defineProperty(file, 'size', { value: size });
  return file;
}

function abrirModalFoto() {
  fireEvent.click(screen.getByLabelText('Cambiar foto de perfil'));
}

async function subirArchivoDesdeDispositivo(file) {
  await act(async () => {
    fireEvent.change(screen.getByLabelText('Subir archivo desde el dispositivo'), { target: { files: [file] } });
    await Promise.resolve();
    await Promise.resolve();
  });
}

describe('PerfilPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    global.FileReader = MockFileReader;
    mockBiometricState = {
      soportado: false,
      enrolado: false,
      cargando: false,
      error: null,
      ofrecerEnrolamiento: jest.fn(),
      desenrolar: jest.fn(),
      iniciarSesionBiometrico: jest.fn(),
    };
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('muestra el nombre y el estado del socio', () => {
    render(<PerfilPage socio={socioFixture} cerrarSesion={jest.fn()} />);
    expect(screen.getByText('Ana Pérez')).toBeInTheDocument();
    expect(screen.getByText('Estado: Activo')).toBeInTheDocument();
  });

  test('muestra el número de socio con su etiqueta', () => {
    render(<PerfilPage socio={socioFixture} cerrarSesion={jest.fn()} />);
    expect(screen.getByText('Número de Socio')).toBeInTheDocument();
    expect(screen.getByText('1000')).toBeInTheDocument();
  });

  test('muestra el resto de los datos personales dentro de la misma tarjeta', () => {
    const { container } = render(
      <PerfilPage socio={socioFixture} cerrarSesion={jest.fn()} />,
    );
    expect(screen.getByText('Titular')).toBeInTheDocument();
    expect(screen.getByText('30123456')).toBeInTheDocument();
    expect(screen.getByText('ana.perez@example.com')).toBeInTheDocument();
    expect(screen.getByText('+54 9 11 5555-1234')).toBeInTheDocument();
    expect(screen.getByText('12 de mayo de 1990')).toBeInTheDocument();
    expect(container.querySelectorAll('.perfil-card').length).toBe(1);
  });

  test('no muestra una fila para los campos opcionales ausentes', () => {
    const socioSinTelefono = { ...socioFixture, telefono: null };
    render(<PerfilPage socio={socioSinTelefono} cerrarSesion={jest.fn()} />);
    expect(screen.queryByText('Teléfono')).not.toBeInTheDocument();
  });

  test('click en "Cerrar sesión" llama a cerrarSesion', () => {
    const cerrarSesion = jest.fn();
    render(<PerfilPage socio={socioFixture} cerrarSesion={cerrarSesion} />);
    fireEvent.click(screen.getByText('Cerrar sesión'));
    expect(cerrarSesion).toHaveBeenCalledTimes(1);
  });

  test('click en "Cambiar contraseña" abre el formulario de cambio de contraseña', () => {
    render(<PerfilPage socio={socioFixture} cerrarSesion={jest.fn()} />);
    abrirModalCambiarContrasenia();
    expect(screen.getByLabelText('Contraseña actual')).toBeInTheDocument();
  });

  test('"Cancelar" cierra el formulario de cambio de contraseña', () => {
    render(<PerfilPage socio={socioFixture} cerrarSesion={jest.fn()} />);
    abrirModalCambiarContrasenia();
    fireEvent.click(screen.getByText('Cancelar'));
    expect(screen.queryByLabelText('Contraseña actual')).not.toBeInTheDocument();
  });

  test('muestra el error de la nueva contraseña al salir del campo, sin esperar al submit', () => {
    render(<PerfilPage socio={socioFixture} cerrarSesion={jest.fn()} />);
    abrirModalCambiarContrasenia();
    const nuevaInput = screen.getByLabelText('Nueva contraseña');
    fireEvent.change(nuevaInput, { target: { value: 'clave123456' } });
    fireEvent.blur(nuevaInput);
    expect(screen.getByText('Debe incluir al menos una mayúscula')).toBeInTheDocument();
    expect(changePassword).not.toHaveBeenCalled();
  });

  test('muestra error si la nueva contraseña no cumple la política de seguridad', async () => {
    render(<PerfilPage socio={socioFixture} cerrarSesion={jest.fn()} />);
    abrirModalCambiarContrasenia();
    completarFormulario({ nueva: 'clave123456', confirmar: 'clave123456' });
    enviarFormulario();
    expect(await screen.findByText('Debe incluir al menos una mayúscula')).toBeInTheDocument();
    expect(changePassword).not.toHaveBeenCalled();
  });

  test('muestra error si la confirmación no coincide con la nueva contraseña', async () => {
    render(<PerfilPage socio={socioFixture} cerrarSesion={jest.fn()} />);
    abrirModalCambiarContrasenia();
    completarFormulario({ nueva: 'NuevaClave12', confirmar: 'OtraClave12' });
    enviarFormulario();
    expect(await screen.findByText('Las contraseñas nuevas no coinciden')).toBeInTheDocument();
    expect(changePassword).not.toHaveBeenCalled();
  });

  test('al cambiar la contraseña con éxito, cierra la sesión automáticamente', async () => {
    changePassword.mockResolvedValueOnce();
    const cerrarSesion = jest.fn().mockResolvedValueOnce();
    render(<PerfilPage socio={socioFixture} cerrarSesion={cerrarSesion} />);
    abrirModalCambiarContrasenia();
    completarFormulario();
    enviarFormulario();

    await waitFor(() => expect(changePassword).toHaveBeenCalledWith('ActualClave1', 'NuevaClave12'));
    await waitFor(() => expect(cerrarSesion).toHaveBeenCalledTimes(1));
  });

  test('si falla el cambio de contraseña, muestra un error y no cierra la sesión', async () => {
    changePassword.mockRejectedValueOnce(new Error('auth/wrong-password'));
    const cerrarSesion = jest.fn();
    render(<PerfilPage socio={socioFixture} cerrarSesion={cerrarSesion} />);
    abrirModalCambiarContrasenia();
    completarFormulario();
    enviarFormulario();

    expect(await screen.findByText('Contraseña actual incorrecta o error al cambiar la contraseña')).toBeInTheDocument();
    expect(cerrarSesion).not.toHaveBeenCalled();
  });

  test('muestra las iniciales cuando el socio no tiene foto', () => {
    render(<PerfilPage socio={socioFixture} cerrarSesion={jest.fn()} />);
    expect(screen.getByText('AP')).toBeInTheDocument();
  });

  test('muestra la imagen del socio cuando tiene foto_url', () => {
    const socioConFoto = { ...socioFixture, foto_url: 'https://res.cloudinary.com/demo/image/upload/v1/socios/1.jpg' };
    render(<PerfilPage socio={socioConFoto} cerrarSesion={jest.fn()} />);
    expect(screen.queryByText('AP')).not.toBeInTheDocument();
    const img = screen.getByAltText('');
    expect(img).toHaveAttribute('src', socioConFoto.foto_url);
  });

  test('click en "Cambiar foto de perfil" abre el modal con las dos opciones', () => {
    render(<PerfilPage socio={socioFixture} cerrarSesion={jest.fn()} />);
    abrirModalFoto();
    expect(screen.getByText('Subir desde el dispositivo')).toBeInTheDocument();
    expect(screen.getByText('Tomar una foto en el momento')).toBeInTheDocument();
  });

  test('seleccionar una foto la previsualiza sin subirla todavía', async () => {
    render(<PerfilPage socio={{ ...socioFixture, id: 'socio-1' }} cerrarSesion={jest.fn()} />);
    abrirModalFoto();

    await subirArchivoDesdeDispositivo(crearArchivo());

    expect(screen.getByAltText('Previsualización de la nueva foto')).toBeInTheDocument();
    expect(screen.getByText('Confirmar')).toBeInTheDocument();
    expect(subirFotoSocio).not.toHaveBeenCalled();
  });

  test('"Elegir otra" descarta la previsualización sin llamar al backend', async () => {
    render(<PerfilPage socio={{ ...socioFixture, id: 'socio-1' }} cerrarSesion={jest.fn()} />);
    abrirModalFoto();
    await subirArchivoDesdeDispositivo(crearArchivo());

    fireEvent.click(screen.getByText('Elegir otra'));

    expect(screen.getByText('Subir desde el dispositivo')).toBeInTheDocument();
    expect(screen.queryByAltText('Previsualización de la nueva foto')).not.toBeInTheDocument();
    expect(subirFotoSocio).not.toHaveBeenCalled();
  });

  test('confirmar la foto la envía al backend y actualiza el avatar', async () => {
    subirFotoSocio.mockResolvedValueOnce({ foto_url: 'https://res.cloudinary.com/demo/image/upload/v1/socios/1.jpg' });
    render(<PerfilPage socio={{ ...socioFixture, id: 'socio-1' }} cerrarSesion={jest.fn()} />);
    abrirModalFoto();
    await subirArchivoDesdeDispositivo(crearArchivo());

    expect(subirFotoSocio).not.toHaveBeenCalled();
    fireEvent.click(screen.getByText('Confirmar'));

    await waitFor(() => expect(subirFotoSocio).toHaveBeenCalledWith('socio-1', 'data:image/jpeg;base64,ZmFrZQ=='));
    await waitFor(() => expect(mockSetSocio).toHaveBeenCalledWith(
      expect.objectContaining({ foto_url: 'https://res.cloudinary.com/demo/image/upload/v1/socios/1.jpg' }),
    ));
    expect(await screen.findByText('Foto actualizada')).toBeInTheDocument();
  });

  test('rechaza un archivo con tipo no permitido sin llamar al backend', async () => {
    render(<PerfilPage socio={socioFixture} cerrarSesion={jest.fn()} />);
    abrirModalFoto();

    await subirArchivoDesdeDispositivo(crearArchivo({ name: 'foto.gif', type: 'image/gif' }));

    expect(screen.getByText('Solo se permiten imágenes JPG, PNG o WEBP')).toBeInTheDocument();
    expect(subirFotoSocio).not.toHaveBeenCalled();
  });

  test('si falla la subida al confirmar, muestra un mensaje de error', async () => {
    subirFotoSocio.mockRejectedValueOnce(new Error('servicio-no-disponible'));
    render(<PerfilPage socio={{ ...socioFixture, id: 'socio-1' }} cerrarSesion={jest.fn()} />);
    abrirModalFoto();
    await subirArchivoDesdeDispositivo(crearArchivo());
    fireEvent.click(screen.getByText('Confirmar'));

    expect(await screen.findByText('No pudimos subir la foto. Probá de nuevo.')).toBeInTheDocument();
    expect(mockSetSocio).not.toHaveBeenCalled();
  });

  test('click en la foto de perfil abre la vista ampliada con el mismo botón para cambiarla', () => {
    const socioConFoto = { ...socioFixture, foto_url: 'https://res.cloudinary.com/demo/image/upload/v1/socios/1.jpg' };
    render(<PerfilPage socio={socioConFoto} cerrarSesion={jest.fn()} />);

    fireEvent.click(screen.getByLabelText('Ver foto de perfil ampliada'));

    expect(screen.getAllByAltText('').length).toBe(2);
    expect(screen.getAllByLabelText('Cambiar foto de perfil').length).toBe(2);
  });

  test('el botón "+" de la vista ampliada abre el formulario de subida', () => {
    const socioConFoto = { ...socioFixture, foto_url: 'https://res.cloudinary.com/demo/image/upload/v1/socios/1.jpg' };
    render(<PerfilPage socio={socioConFoto} cerrarSesion={jest.fn()} />);
    fireEvent.click(screen.getByLabelText('Ver foto de perfil ampliada'));

    const botonesCambiar = screen.getAllByLabelText('Cambiar foto de perfil');
    fireEvent.click(botonesCambiar[botonesCambiar.length - 1]);

    expect(screen.getByText('Subir desde el dispositivo')).toBeInTheDocument();
    expect(screen.getAllByLabelText('Cambiar foto de perfil').length).toBe(1);
  });

  test('no muestra la opción de biometría si el dispositivo no la soporta', () => {
    render(<PerfilPage socio={socioFixture} cerrarSesion={jest.fn()} />);
    expect(screen.queryByText(/login con biometría/i)).not.toBeInTheDocument();
  });

  test('ofrece activar la biometría cuando el dispositivo la soporta y no hay enrolamiento', () => {
    mockBiometricState.soportado = true;
    render(<PerfilPage socio={socioFixture} cerrarSesion={jest.fn()} />);
    expect(screen.getByText('Activar login con biometría')).toBeInTheDocument();
  });

  test('activar biometría pide la contraseña actual, la valida contra Firebase y recién ahí enrola', async () => {
    mockBiometricState.soportado = true;
    login.mockResolvedValueOnce();
    mockBiometricState.ofrecerEnrolamiento.mockResolvedValueOnce();

    render(<PerfilPage socio={socioFixture} cerrarSesion={jest.fn()} />);
    fireEvent.click(screen.getByText('Activar login con biometría'));

    fireEvent.change(screen.getByLabelText('Contraseña actual'), { target: { value: 'ActualClave1' } });
    fireEvent.click(screen.getByRole('button', { name: /^activar$/i }));

    await waitFor(() => expect(login).toHaveBeenCalledWith('ana.perez@example.com', 'ActualClave1'));
    expect(mockBiometricState.ofrecerEnrolamiento).toHaveBeenCalledWith('ana.perez@example.com', 'ActualClave1');
    await waitFor(() => {
      expect(screen.queryByText('Activar biometría')).not.toBeInTheDocument();
    });
  });

  test('activar biometría muestra un error si la contraseña es incorrecta, sin llamar a ofrecerEnrolamiento', async () => {
    mockBiometricState.soportado = true;
    login.mockRejectedValueOnce(new Error('auth/wrong-password'));

    render(<PerfilPage socio={socioFixture} cerrarSesion={jest.fn()} />);
    fireEvent.click(screen.getByText('Activar login con biometría'));

    fireEvent.change(screen.getByLabelText('Contraseña actual'), { target: { value: 'mala-clave' } });
    fireEvent.click(screen.getByRole('button', { name: /^activar$/i }));

    expect(await screen.findByText('Contraseña incorrecta o no se pudo activar la biometría.')).toBeInTheDocument();
    expect(mockBiometricState.ofrecerEnrolamiento).not.toHaveBeenCalled();
  });

  test('con biometría ya enrolada, ofrece desactivarla y llama a desenrolar al hacer click', () => {
    mockBiometricState.soportado = true;
    mockBiometricState.enrolado = true;

    render(<PerfilPage socio={socioFixture} cerrarSesion={jest.fn()} />);
    fireEvent.click(screen.getByText('Desactivar login con biometría'));

    expect(mockBiometricState.desenrolar).toHaveBeenCalledTimes(1);
  });
});
