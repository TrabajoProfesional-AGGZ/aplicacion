import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CreateSocioForm } from './CreateSocioForm';

jest.mock('../../services/sociosService', () => ({
  createSocio: jest.fn(),
}));
import { createSocio } from '../../services/sociosService';

const onSuccess = jest.fn();
const onCancel = jest.fn();

async function fillStep1() {
  await userEvent.type(screen.getByPlaceholderText('María'), 'Juan');
  await userEvent.type(screen.getByPlaceholderText('González'), 'Lopez');
  fireEvent.change(document.querySelector('input[type="date"]'), { target: { value: '1990-01-01' } });
  await userEvent.selectOptions(screen.getByRole('combobox'), 'M');
}

async function fillStep2() {
  await userEvent.selectOptions(screen.getByRole('combobox'), 'DNI');
  await userEvent.type(screen.getByPlaceholderText('Ej. 12345678'), '12345678');
}

async function fillStep3() {
  await userEvent.type(screen.getByPlaceholderText('maria@ejemplo.com'), 'juan@club.com');
}

async function navigateToStep2() {
  await fillStep1();
  userEvent.click(screen.getByRole('button', { name: /siguiente/i }));
  await waitFor(() => expect(screen.getByText(/Paso 2 de 3/)).toBeInTheDocument());
}

async function navigateToStep3() {
  await navigateToStep2();
  await fillStep2();
  userEvent.click(screen.getByRole('button', { name: /siguiente/i }));
  await waitFor(() => expect(screen.getByText(/Paso 3 de 3/)).toBeInTheDocument());
  await waitFor(() => expect(screen.getByRole('button', { name: /crear socio/i })).not.toBeDisabled());
}

describe('CreateSocioForm', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renderiza el paso 1 con los campos de datos personales', () => {
    render(<CreateSocioForm onSuccess={onSuccess} onCancel={onCancel} />);
    expect(screen.getByText('Nuevo socio')).toBeInTheDocument();
    expect(screen.getByText(/Paso 1 de 3/)).toBeInTheDocument();
    expect(screen.getByPlaceholderText('María')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('González')).toBeInTheDocument();
  });

  test('muestra errores de validación si se intenta avanzar con campos vacíos', async () => {
    render(<CreateSocioForm onSuccess={onSuccess} onCancel={onCancel} />);
    userEvent.click(screen.getByRole('button', { name: /siguiente/i }));
    await waitFor(() => {
      expect(screen.getAllByText('Requerido').length).toBeGreaterThan(0);
    });
  });

  test('avanza al paso 2 cuando el paso 1 está completo', async () => {
    render(<CreateSocioForm onSuccess={onSuccess} onCancel={onCancel} />);
    await navigateToStep2();
    expect(screen.getByText(/Paso 2 de 3/)).toBeInTheDocument();
  });

  test('retrocede al paso 1 desde el paso 2', async () => {
    render(<CreateSocioForm onSuccess={onSuccess} onCancel={onCancel} />);
    await navigateToStep2();
    userEvent.click(screen.getByRole('button', { name: /atrás/i }));
    await waitFor(() => expect(screen.getByText(/Paso 1 de 3/)).toBeInTheDocument());
  });

  test('avanza al paso 3 cuando el paso 2 está completo', async () => {
    render(<CreateSocioForm onSuccess={onSuccess} onCancel={onCancel} />);
    await navigateToStep3();
    expect(screen.getByText(/Paso 3 de 3/)).toBeInTheDocument();
  });

  test('llama a createSocio con el payload correcto al completar el formulario', async () => {
    createSocio.mockResolvedValueOnce({ id: 'uuid-new' });
    render(<CreateSocioForm onSuccess={onSuccess} onCancel={onCancel} />);
    await navigateToStep3();
    await fillStep3();
    userEvent.click(screen.getByRole('button', { name: /crear socio/i }));

    await waitFor(() => expect(createSocio).toHaveBeenCalledTimes(1));
    expect(createSocio).toHaveBeenCalledWith(expect.objectContaining({
      nombre: 'Juan',
      apellido: 'Lopez',
      genero: 'M',
      tipo_doc: 'DNI',
      email: 'juan@club.com',
    }));
  });

  test('muestra la pantalla de éxito tras crear el socio', async () => {
    createSocio.mockResolvedValueOnce({ id: 'uuid-new' });
    render(<CreateSocioForm onSuccess={onSuccess} onCancel={onCancel} />);
    await navigateToStep3();
    await fillStep3();
    userEvent.click(screen.getByRole('button', { name: /crear socio/i }));

    await waitFor(() => expect(screen.getByText('¡Socio creado!')).toBeInTheDocument());
  });

  test('llama a onSuccess tras 1800ms de la pantalla de éxito', async () => {
    createSocio.mockResolvedValueOnce({ id: 'uuid-new' });
    render(<CreateSocioForm onSuccess={onSuccess} onCancel={onCancel} />);
    await navigateToStep3();
    await fillStep3();
    userEvent.click(screen.getByRole('button', { name: /crear socio/i }));

    await waitFor(() => expect(screen.getByText('¡Socio creado!')).toBeInTheDocument());
    expect(onSuccess).not.toHaveBeenCalled();

    await waitFor(() => expect(onSuccess).toHaveBeenCalledTimes(1), { timeout: 3000 });
  });

  test('muestra error de duplicado cuando el servicio lanza socio-duplicado', async () => {
    createSocio.mockRejectedValueOnce(new Error('socio-duplicado'));
    render(<CreateSocioForm onSuccess={onSuccess} onCancel={onCancel} />);
    await navigateToStep3();
    await fillStep3();
    userEvent.click(screen.getByRole('button', { name: /crear socio/i }));

    await waitFor(() => expect(screen.getByText(/ya existe un socio/i)).toBeInTheDocument());
  });

  test('muestra error de servicio no disponible', async () => {
    createSocio.mockRejectedValueOnce(new Error('servicio-no-disponible'));
    render(<CreateSocioForm onSuccess={onSuccess} onCancel={onCancel} />);
    await navigateToStep3();
    await fillStep3();
    userEvent.click(screen.getByRole('button', { name: /crear socio/i }));

    await waitFor(() => expect(screen.getByText(/servicio no está disponible/i)).toBeInTheDocument());
  });

  test('llama a onCancel al hacer click en Cancelar', async () => {
    render(<CreateSocioForm onSuccess={onSuccess} onCancel={onCancel} />);
    await userEvent.click(screen.getByRole('button', { name: /cancelar/i }));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  test('llama a onCancel al hacer click en el overlay', () => {
    render(<CreateSocioForm onSuccess={onSuccess} onCancel={onCancel} />);
    fireEvent.click(document.querySelector('.csf-overlay'));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});
