import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { RecuperarContraseniaModal } from './RecuperarContraseniaModal';
import * as authService from '../../utils/authService';
import { MAX_LEN } from '../../utils/formValidators';

jest.mock('../../firebase', () => ({ auth: {} }));
jest.mock('../../utils/authService', () => ({
  resetPassword: jest.fn(),
}));

describe('RecuperarContraseniaModal', () => {
  beforeEach(() => {
    authService.resetPassword.mockClear();
  });

  test('muestra el logo de SocioUnido y el campo de email', () => {
    render(<RecuperarContraseniaModal onClose={() => {}} />);
    expect(screen.getByRole('heading', { name: 'Recuperar contraseña' })).toBeInTheDocument();
    expect(screen.getByAltText('SocioUnido')).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Recuperar contraseña' })).toBeInTheDocument();
  });

  test('rechaza el envío si el email supera la longitud máxima permitida, sin llamar a Firebase', async () => {
    render(<RecuperarContraseniaModal onClose={() => {}} />);
    const emailDemasiadoLargo = `${'a'.repeat(MAX_LEN.EMAIL - 4)}@a.co`;

    fireEvent.change(screen.getByLabelText('Email'), { target: { value: emailDemasiadoLargo } });
    fireEvent.click(screen.getByRole('button', { name: 'Recuperar contraseña' }));

    await waitFor(() => {
      expect(screen.getByText(`Máximo ${MAX_LEN.EMAIL} caracteres`)).toBeInTheDocument();
    });
    expect(authService.resetPassword).not.toHaveBeenCalled();
  });

  test('al recuperar contraseña con un email válido, llama a Firebase y muestra un mensaje genérico (no revela si la cuenta existe)', async () => {
    authService.resetPassword.mockResolvedValueOnce();
    render(<RecuperarContraseniaModal onClose={() => {}} />);

    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'socio@club.com' } });
    fireEvent.click(screen.getByRole('button', { name: 'Recuperar contraseña' }));

    await waitFor(() => {
      expect(authService.resetPassword).toHaveBeenCalledWith('socio@club.com');
    });
    expect(await screen.findByText(/te enviamos un mail para restablecer tu contraseña/i)).toBeInTheDocument();
  });

  test('muestra el mismo mensaje genérico aunque Firebase falle (ej. auth/user-not-found)', async () => {
    authService.resetPassword.mockRejectedValueOnce({ code: 'auth/user-not-found' });
    render(<RecuperarContraseniaModal onClose={() => {}} />);

    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'nadie@club.com' } });
    fireEvent.click(screen.getByRole('button', { name: 'Recuperar contraseña' }));

    expect(await screen.findByText(/te enviamos un mail para restablecer tu contraseña/i)).toBeInTheDocument();
    expect(screen.queryByText(/user-not-found/i)).not.toBeInTheDocument();
  });

  test('llama a onClose al cerrar la pantalla de éxito', async () => {
    authService.resetPassword.mockResolvedValueOnce();
    const onClose = jest.fn();
    render(<RecuperarContraseniaModal onClose={onClose} />);

    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'socio@club.com' } });
    fireEvent.click(screen.getByRole('button', { name: 'Recuperar contraseña' }));

    fireEvent.click(await screen.findByRole('button', { name: 'Cerrar' }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  test('se cierra al presionar Escape', () => {
    const onClose = jest.fn();
    render(<RecuperarContraseniaModal onClose={onClose} />);
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  test('se cierra al hacer click fuera del formulario (en el fondo del modal)', () => {
    const onClose = jest.fn();
    render(<RecuperarContraseniaModal onClose={onClose} />);
    fireEvent.click(screen.getByRole('presentation'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  test('no se cierra al hacer click dentro del formulario', () => {
    const onClose = jest.fn();
    render(<RecuperarContraseniaModal onClose={onClose} />);
    fireEvent.click(screen.getByRole('heading', { name: 'Recuperar contraseña' }));
    expect(onClose).not.toHaveBeenCalled();
  });
});
