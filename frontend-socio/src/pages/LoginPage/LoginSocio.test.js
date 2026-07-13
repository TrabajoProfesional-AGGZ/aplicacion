import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { LoginSocio } from './LoginSocio';
import * as authService from '../../utils/authService';

jest.mock('../../firebase', () => ({ auth: {} }));
jest.mock('../../utils/authService', () => ({
  login: jest.fn(),
  logout: jest.fn(),
  changePassword: jest.fn(),
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
});
