import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { PerfilPage } from './PerfilPage';

jest.mock('../../firebase', () => ({ auth: {} }));
jest.mock('../../utils/authService', () => ({
  changePassword: jest.fn(),
}));
import { changePassword } from '../../utils/authService';

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

describe('PerfilPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('muestra el nombre y el estado del socio', () => {
    render(<PerfilPage socio={socioFixture} cerrarSesion={jest.fn()} onVolver={jest.fn()} />);
    expect(screen.getByText('Ana Pérez')).toBeInTheDocument();
    expect(screen.getByText('Estado: Activo')).toBeInTheDocument();
  });

  test('muestra el número de socio con su etiqueta', () => {
    render(<PerfilPage socio={socioFixture} cerrarSesion={jest.fn()} onVolver={jest.fn()} />);
    expect(screen.getByText('Número de Socio')).toBeInTheDocument();
    expect(screen.getByText('1000')).toBeInTheDocument();
  });

  test('muestra el resto de los datos personales dentro de la misma tarjeta', () => {
    const { container } = render(
      <PerfilPage socio={socioFixture} cerrarSesion={jest.fn()} onVolver={jest.fn()} />,
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
    render(<PerfilPage socio={socioSinTelefono} cerrarSesion={jest.fn()} onVolver={jest.fn()} />);
    expect(screen.queryByText('Teléfono')).not.toBeInTheDocument();
  });

  test('click en "Volver" llama a onVolver', () => {
    const onVolver = jest.fn();
    render(<PerfilPage socio={socioFixture} cerrarSesion={jest.fn()} onVolver={onVolver} />);
    fireEvent.click(screen.getByLabelText('Volver'));
    expect(onVolver).toHaveBeenCalledTimes(1);
  });

  test('click en "Cerrar sesión" llama a cerrarSesion', () => {
    const cerrarSesion = jest.fn();
    render(<PerfilPage socio={socioFixture} cerrarSesion={cerrarSesion} onVolver={jest.fn()} />);
    fireEvent.click(screen.getByText('Cerrar sesión'));
    expect(cerrarSesion).toHaveBeenCalledTimes(1);
  });

  test('click en "Cambiar contraseña" abre el formulario de cambio de contraseña', () => {
    render(<PerfilPage socio={socioFixture} cerrarSesion={jest.fn()} onVolver={jest.fn()} />);
    abrirModalCambiarContrasenia();
    expect(screen.getByLabelText('Contraseña actual')).toBeInTheDocument();
  });

  test('"Cancelar" cierra el formulario de cambio de contraseña', () => {
    render(<PerfilPage socio={socioFixture} cerrarSesion={jest.fn()} onVolver={jest.fn()} />);
    abrirModalCambiarContrasenia();
    fireEvent.click(screen.getByText('Cancelar'));
    expect(screen.queryByLabelText('Contraseña actual')).not.toBeInTheDocument();
  });

  test('muestra el error de la nueva contraseña al salir del campo, sin esperar al submit', () => {
    render(<PerfilPage socio={socioFixture} cerrarSesion={jest.fn()} onVolver={jest.fn()} />);
    abrirModalCambiarContrasenia();
    const nuevaInput = screen.getByLabelText('Nueva contraseña');
    fireEvent.change(nuevaInput, { target: { value: 'clave123456' } });
    fireEvent.blur(nuevaInput);
    expect(screen.getByText('Debe incluir al menos una mayúscula')).toBeInTheDocument();
    expect(changePassword).not.toHaveBeenCalled();
  });

  test('muestra error si la nueva contraseña no cumple la política de seguridad', async () => {
    render(<PerfilPage socio={socioFixture} cerrarSesion={jest.fn()} onVolver={jest.fn()} />);
    abrirModalCambiarContrasenia();
    completarFormulario({ nueva: 'clave123456', confirmar: 'clave123456' });
    enviarFormulario();
    expect(await screen.findByText('Debe incluir al menos una mayúscula')).toBeInTheDocument();
    expect(changePassword).not.toHaveBeenCalled();
  });

  test('muestra error si la confirmación no coincide con la nueva contraseña', async () => {
    render(<PerfilPage socio={socioFixture} cerrarSesion={jest.fn()} onVolver={jest.fn()} />);
    abrirModalCambiarContrasenia();
    completarFormulario({ nueva: 'NuevaClave12', confirmar: 'OtraClave12' });
    enviarFormulario();
    expect(await screen.findByText('Las contraseñas nuevas no coinciden')).toBeInTheDocument();
    expect(changePassword).not.toHaveBeenCalled();
  });

  test('al cambiar la contraseña con éxito, cierra la sesión automáticamente', async () => {
    changePassword.mockResolvedValueOnce();
    const cerrarSesion = jest.fn().mockResolvedValueOnce();
    render(<PerfilPage socio={socioFixture} cerrarSesion={cerrarSesion} onVolver={jest.fn()} />);
    abrirModalCambiarContrasenia();
    completarFormulario();
    enviarFormulario();

    await waitFor(() => expect(changePassword).toHaveBeenCalledWith('ActualClave1', 'NuevaClave12'));
    await waitFor(() => expect(cerrarSesion).toHaveBeenCalledTimes(1));
  });

  test('si falla el cambio de contraseña, muestra un error y no cierra la sesión', async () => {
    changePassword.mockRejectedValueOnce(new Error('auth/wrong-password'));
    const cerrarSesion = jest.fn();
    render(<PerfilPage socio={socioFixture} cerrarSesion={cerrarSesion} onVolver={jest.fn()} />);
    abrirModalCambiarContrasenia();
    completarFormulario();
    enviarFormulario();

    expect(await screen.findByText('Contraseña actual incorrecta o error al cambiar la contraseña')).toBeInTheDocument();
    expect(cerrarSesion).not.toHaveBeenCalled();
  });
});
