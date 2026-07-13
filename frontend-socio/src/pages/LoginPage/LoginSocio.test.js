import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { LoginSocio } from './LoginSocio';
import * as authService from '../../utils/authService';
import { MAX_LEN } from '../../utils/formValidators';

jest.mock('../../firebase', () => ({ auth: {} }));
jest.mock('../../utils/authService', () => ({
  login: jest.fn(),
  logout: jest.fn(),
  changePassword: jest.fn(),
}));

let mockAuthState;
jest.mock('../../hooks/useAuth', () => ({
  useAuth: () => mockAuthState,
}));

jest.mock('framer-motion', () => {
  const React = require('react');
  const passthrough = (Tag) => ({ children, ...props }) => {
    const { variants, initial, animate, transition, whileTap, ...rest } = props;
    return React.createElement(Tag, rest, children);
  };
  return {
    motion: new Proxy({}, { get: (_, tag) => passthrough(tag) }),
    useReducedMotion: () => true,
  };
});

describe('LoginSocio', () => {
  beforeEach(() => {
    mockAuthState = { socio: null, authError: null, cerrarSesion: jest.fn().mockResolvedValue() };
    authService.login.mockClear();
  });

  test('renderiza los campos de email, contraseña y el botón de ingresar', () => {
    render(<LoginSocio irARegistro={() => {}} />);
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByLabelText('Contraseña')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /ingresar/i })).toBeInTheDocument();
  });

  test('no muestra ningún error en el estado inicial', () => {
    render(<LoginSocio irARegistro={() => {}} />);
    expect(screen.queryByText(/credenciales incorrectas/i)).not.toBeInTheDocument();
  });

  test('muestra exactamente "Credenciales incorrectas" cuando Firebase rechaza por auth/invalid-credential', async () => {
    authService.login.mockRejectedValueOnce({ code: 'auth/invalid-credential' });
    render(<LoginSocio irARegistro={() => {}} />);

    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'socio@club.com' } });
    fireEvent.change(screen.getByLabelText('Contraseña'), { target: { value: 'mala-clave' } });
    fireEvent.click(screen.getByRole('button', { name: /ingresar/i }));

    await waitFor(() => {
      expect(screen.getByText('Credenciales incorrectas')).toBeInTheDocument();
    });
  });

  test('muestra exactamente "Credenciales incorrectas" para auth/user-not-found y auth/wrong-password', async () => {
    for (const code of ['auth/user-not-found', 'auth/wrong-password']) {
      authService.login.mockRejectedValueOnce({ code });
      const { unmount } = render(<LoginSocio irARegistro={() => {}} />);

      fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'socio@club.com' } });
      fireEvent.change(screen.getByLabelText('Contraseña'), { target: { value: 'mala-clave' } });
      fireEvent.click(screen.getByRole('button', { name: /ingresar/i }));

      await waitFor(() => {
        expect(screen.getByText('Credenciales incorrectas')).toBeInTheDocument();
      });
      unmount();
    }
  });

  test('muestra un error distinto cuando falla por otro motivo (no de credenciales)', async () => {
    authService.login.mockRejectedValueOnce({ code: 'auth/network-request-failed', message: 'Error de red' });
    render(<LoginSocio irARegistro={() => {}} />);

    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'socio@club.com' } });
    fireEvent.change(screen.getByLabelText('Contraseña'), { target: { value: 'clave123' } });
    fireEvent.click(screen.getByRole('button', { name: /ingresar/i }));

    await waitFor(() => {
      expect(screen.getByText('Error de red')).toBeInTheDocument();
    });
    expect(screen.queryByText('Credenciales incorrectas')).not.toBeInTheDocument();
  });

  test('llama a irARegistro al hacer click en el link de primera vez', () => {
    const irARegistro = jest.fn();
    render(<LoginSocio irARegistro={irARegistro} />);
    fireEvent.click(screen.getByText(/configurar mi cuenta/i));
    expect(irARegistro).toHaveBeenCalledTimes(1);
  });

  test('si Firebase acepta el login pero falla la carga del perfil (ej. backend caído), muestra el error y no deja el formulario trabado', async () => {
    authService.login.mockResolvedValueOnce({ user: { uid: 'firebase-uid' } });
    const { rerender } = render(<LoginSocio irARegistro={() => {}} />);

    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'socio@club.com' } });
    fireEvent.change(screen.getByLabelText('Contraseña'), { target: { value: 'clave123' } });
    fireEvent.click(screen.getByRole('button', { name: /ingresar/i }));

    await waitFor(() => expect(authService.login).toHaveBeenCalled());
    expect(screen.getByRole('button', { name: /ingresando/i })).toBeDisabled();

    // AuthContext detectó que no pudo traer el perfil del socio (ej. GET .../por-email devolvió 500)
    mockAuthState = {
      ...mockAuthState,
      authError: 'No pudimos cargar tu perfil de socio. Probá de nuevo en unos segundos.',
    };
    rerender(<LoginSocio irARegistro={() => {}} />);

    await waitFor(() => {
      expect(screen.getByText(/no pudimos cargar tu perfil de socio/i)).toBeInTheDocument();
    });
    expect(mockAuthState.cerrarSesion).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('button', { name: /^ingresar$/i })).not.toBeDisabled();
  });

  test('rechaza el envío si el email supera la longitud máxima permitida, sin llamar a Firebase', async () => {
    render(<LoginSocio irARegistro={() => {}} />);
    const emailDemasiadoLargo = `${'a'.repeat(MAX_LEN.EMAIL - 4)}@a.co`;

    fireEvent.change(screen.getByLabelText('Email'), { target: { value: emailDemasiadoLargo } });
    fireEvent.change(screen.getByLabelText('Contraseña'), { target: { value: 'clave123' } });
    fireEvent.click(screen.getByRole('button', { name: /ingresar/i }));

    await waitFor(() => {
      expect(screen.getByText(`Máximo ${MAX_LEN.EMAIL} caracteres`)).toBeInTheDocument();
    });
    expect(authService.login).not.toHaveBeenCalled();
  });

  test('rechaza el envío si la contraseña supera la longitud máxima permitida, sin llamar a Firebase', async () => {
    render(<LoginSocio irARegistro={() => {}} />);
    const passwordDemasiadoLarga = 'a'.repeat(MAX_LEN.PASSWORD + 1);

    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'socio@club.com' } });
    fireEvent.change(screen.getByLabelText('Contraseña'), { target: { value: passwordDemasiadoLarga } });
    fireEvent.click(screen.getByRole('button', { name: /ingresar/i }));

    await waitFor(() => {
      expect(screen.getByText(`Máximo ${MAX_LEN.PASSWORD} caracteres`)).toBeInTheDocument();
    });
    expect(authService.login).not.toHaveBeenCalled();
  });

  test('rechaza el envío si la contraseña contiene caracteres de control, sin llamar a Firebase', async () => {
    render(<LoginSocio irARegistro={() => {}} />);
    // String.fromCharCode(7) = BEL, un carácter de control real (no whitespace,
    // así que trim() no lo elimina antes de validar).
    const passwordConCaracterDeControl = `clave123${String.fromCharCode(7)}`;

    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'socio@club.com' } });
    fireEvent.change(screen.getByLabelText('Contraseña'), { target: { value: passwordConCaracterDeControl } });
    fireEvent.click(screen.getByRole('button', { name: /ingresar/i }));

    await waitFor(() => {
      expect(screen.getByText('El valor contiene caracteres no permitidos')).toBeInTheDocument();
    });
    expect(authService.login).not.toHaveBeenCalled();
  });

  test('llama a onIngresoCompleto una sola vez cuando el login es exitoso', async () => {
    const onIngresoCompleto = jest.fn();
    const { rerender } = render(<LoginSocio irARegistro={() => {}} onIngresoCompleto={onIngresoCompleto} />);

    mockAuthState = { ...mockAuthState, socio: { nro_socio: '1000' } };
    rerender(<LoginSocio irARegistro={() => {}} onIngresoCompleto={onIngresoCompleto} />);

    await waitFor(() => expect(onIngresoCompleto).toHaveBeenCalledTimes(1));

    // Un segundo re-render con socio todavía activo no debería volver a disparar el callback
    rerender(<LoginSocio irARegistro={() => {}} onIngresoCompleto={onIngresoCompleto} />);
    expect(onIngresoCompleto).toHaveBeenCalledTimes(1);
  });
});
