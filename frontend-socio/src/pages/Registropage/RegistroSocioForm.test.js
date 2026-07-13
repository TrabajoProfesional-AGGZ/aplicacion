import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RegistroSocioForm } from './RegistroSocioForm';

jest.mock('../../firebase', () => ({ auth: {} }));

jest.mock('firebase/auth', () => ({
  createUserWithEmailAndPassword: jest.fn(),
  getIdToken: jest.fn(),
  deleteUser: jest.fn(),
}));
import { createUserWithEmailAndPassword, getIdToken, deleteUser } from 'firebase/auth';

jest.mock('../../services/sociosService', () => ({
  validarSocio: jest.fn(),
  reclamarCuentaSocio: jest.fn(),
}));
import { validarSocio, reclamarCuentaSocio } from '../../services/sociosService';

jest.mock('../../utils/utils', () => ({
  fetchTo: jest.fn(),
}));
import { fetchTo } from '../../utils/utils';

const onSuccess = jest.fn();
const onCancel = jest.fn();

async function fillStep1() {
  await userEvent.type(screen.getByPlaceholderText('Ej: 1234'), '1000');
  await userEvent.type(screen.getByPlaceholderText('Ej. 12345678'), '12345678');
}

async function fillStep2() {
  await userEvent.type(screen.getByPlaceholderText('María'), 'Juan');
  await userEvent.type(screen.getByPlaceholderText('González'), 'Lopez');
  fireEvent.change(document.querySelector('input[type="date"]'), { target: { value: '1990-01-01' } });
  await userEvent.selectOptions(screen.getByRole('combobox'), 'Masculino');
}

async function fillStep3() {
  await userEvent.type(screen.getByPlaceholderText('Ej: 1123456789'), '1123456789');
  await userEvent.type(screen.getByPlaceholderText('Calle Falsa 123'), 'Calle Falsa 123');
}

async function fillStep4() {
  await userEvent.type(screen.getByPlaceholderText('maria@ejemplo.com'), 'juan@club.com');
  await userEvent.type(screen.getByPlaceholderText('Mínimo 6 caracteres'), 'clave123');
}

async function navigateToStep2() {
  await fillStep1();
  userEvent.click(screen.getByRole('button', { name: /siguiente/i }));
  await waitFor(() => expect(screen.getByText(/Paso 2 de 4/)).toBeInTheDocument());
}

async function navigateToStep3() {
  await navigateToStep2();
  await fillStep2();
  userEvent.click(screen.getByRole('button', { name: /siguiente/i }));
  await waitFor(() => expect(screen.getByText(/Paso 3 de 4/)).toBeInTheDocument());
}

async function navigateToStep4() {
  await navigateToStep3();
  await fillStep3();
  userEvent.click(screen.getByRole('button', { name: /siguiente/i }));
  await waitFor(() => expect(screen.getByText(/Paso 4 de 4/)).toBeInTheDocument());
}

describe('RegistroSocioForm', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    validarSocio.mockResolvedValue({ nro_socio: '1000', nro_documento: '12345678', email: 'placeholder@club.com' });
  });

  test('renderiza el paso 1 con los campos de validación de identidad', () => {
    render(<RegistroSocioForm onSuccess={onSuccess} onCancel={onCancel} />);
    expect(screen.getByText('Registro de Socio')).toBeInTheDocument();
    expect(screen.getByText(/Paso 1 de 4/)).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Ej: 1234')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Ej. 12345678')).toBeInTheDocument();
  });

  test('muestra errores de validación si se intenta avanzar con campos vacíos', async () => {
    render(<RegistroSocioForm onSuccess={onSuccess} onCancel={onCancel} />);
    userEvent.click(screen.getByRole('button', { name: /siguiente/i }));
    await waitFor(() => {
      expect(screen.getAllByText('Requerido').length).toBeGreaterThan(0);
    });
    expect(validarSocio).not.toHaveBeenCalled();
  });

  test('avanza al paso 2 cuando la validación de identidad es exitosa', async () => {
    render(<RegistroSocioForm onSuccess={onSuccess} onCancel={onCancel} />);
    await navigateToStep2();
    expect(validarSocio).toHaveBeenCalledWith('1000', '12345678');
  });

  test('muestra error cuando los datos no coinciden con ningún socio', async () => {
    validarSocio.mockRejectedValueOnce(new Error('socio-no-encontrado'));
    render(<RegistroSocioForm onSuccess={onSuccess} onCancel={onCancel} />);
    await fillStep1();
    userEvent.click(screen.getByRole('button', { name: /siguiente/i }));

    await waitFor(() => {
      expect(screen.getByText(/no pudimos validar tu identidad/i)).toBeInTheDocument();
    });
    expect(screen.queryByText(/Paso 2 de 4/)).not.toBeInTheDocument();
  });

  test('muestra aviso de cuenta ya registrada cuando el socio ya reclamó su cuenta', async () => {
    validarSocio.mockRejectedValueOnce(new Error('cuenta-ya-registrada'));
    render(<RegistroSocioForm onSuccess={onSuccess} onCancel={onCancel} />);
    await fillStep1();
    userEvent.click(screen.getByRole('button', { name: /siguiente/i }));

    await waitFor(() => {
      expect(screen.getByText(/ya tiene una cuenta registrada/i)).toBeInTheDocument();
    });
    expect(screen.queryByText(/Paso 2 de 4/)).not.toBeInTheDocument();
  });

  test('retrocede al paso 1 desde el paso 2', async () => {
    render(<RegistroSocioForm onSuccess={onSuccess} onCancel={onCancel} />);
    await navigateToStep2();
    userEvent.click(screen.getByRole('button', { name: /atrás/i }));
    await waitFor(() => expect(screen.getByText(/Paso 1 de 4/)).toBeInTheDocument());
  });

  test('completa el registro: crea el usuario en Firebase, actualiza el perfil y reclama la cuenta', async () => {
    createUserWithEmailAndPassword.mockResolvedValueOnce({ user: { uid: 'firebase-uid' } });
    getIdToken.mockResolvedValueOnce('mock-id-token');
    fetchTo.mockResolvedValueOnce({ ok: true });
    reclamarCuentaSocio.mockResolvedValueOnce({});

    render(<RegistroSocioForm onSuccess={onSuccess} onCancel={onCancel} />);
    await navigateToStep4();
    await fillStep4();
    userEvent.click(screen.getByRole('button', { name: /completar registro/i }));

    await waitFor(() => expect(createUserWithEmailAndPassword).toHaveBeenCalledWith(
      expect.anything(), 'juan@club.com', 'clave123'
    ));
    await waitFor(() => expect(fetchTo).toHaveBeenCalledWith(
      '/api/v1/socios/por-dni/12345678', 'PATCH', expect.objectContaining({ nombre: 'Juan', apellido: 'Lopez' })
    ));
    await waitFor(() => expect(reclamarCuentaSocio).toHaveBeenCalledWith('12345678'));
    await waitFor(() => expect(screen.getByText('¡Cuenta configurada!')).toBeInTheDocument());
    expect(deleteUser).not.toHaveBeenCalled();
  });

  test('llama a onSuccess tras 1800ms de la pantalla de éxito', async () => {
    createUserWithEmailAndPassword.mockResolvedValueOnce({ user: { uid: 'firebase-uid' } });
    getIdToken.mockResolvedValueOnce('mock-id-token');
    fetchTo.mockResolvedValueOnce({ ok: true });
    reclamarCuentaSocio.mockResolvedValueOnce({});

    render(<RegistroSocioForm onSuccess={onSuccess} onCancel={onCancel} />);
    await navigateToStep4();
    await fillStep4();
    userEvent.click(screen.getByRole('button', { name: /completar registro/i }));

    await waitFor(() => expect(screen.getByText('¡Cuenta configurada!')).toBeInTheDocument());
    expect(onSuccess).not.toHaveBeenCalled();

    await waitFor(() => expect(onSuccess).toHaveBeenCalledTimes(1), { timeout: 3000 });
  });

  test('si falla la actualización del perfil, hace rollback del usuario recién creado en Firebase', async () => {
    createUserWithEmailAndPassword.mockResolvedValueOnce({ user: { uid: 'firebase-uid' } });
    getIdToken.mockResolvedValueOnce('mock-id-token');
    fetchTo.mockResolvedValueOnce({ ok: false });
    deleteUser.mockResolvedValueOnce();

    render(<RegistroSocioForm onSuccess={onSuccess} onCancel={onCancel} />);
    await navigateToStep4();
    await fillStep4();
    userEvent.click(screen.getByRole('button', { name: /completar registro/i }));

    await waitFor(() => expect(deleteUser).toHaveBeenCalledWith({ uid: 'firebase-uid' }));
    expect(reclamarCuentaSocio).not.toHaveBeenCalled();
    expect(screen.getByText(/hubo un error al guardar tus datos/i)).toBeInTheDocument();
  });

  test('llama a onCancel al hacer click en Cancelar', async () => {
    render(<RegistroSocioForm onSuccess={onSuccess} onCancel={onCancel} />);
    await userEvent.click(screen.getByRole('button', { name: /cancelar/i }));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});
