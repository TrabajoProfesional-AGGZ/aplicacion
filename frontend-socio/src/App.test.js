import { render, screen, fireEvent } from '@testing-library/react';
import App from './App';

jest.mock('framer-motion', () => ({
  AnimatePresence: ({ children }) => children,
}));

let mockAuthState;
jest.mock('./hooks/useAuth', () => ({
  useAuth: () => mockAuthState,
}));

jest.mock('./pages/LoginPage/LoginSocio', () => ({
  LoginSocio: ({ irARegistro, onIngresoCompleto }) => (
    <div>
      <p>login-mock</p>
      <button onClick={irARegistro}>ir a registro</button>
      <button onClick={onIngresoCompleto}>simular ingreso completo</button>
    </div>
  ),
}));

jest.mock('./pages/Registropage/RegistroSocioForm', () => ({
  RegistroSocioForm: ({ onSuccess, onCancel }) => (
    <div>
      <p>registro-mock</p>
      <button onClick={onSuccess}>simular registro exitoso</button>
      <button onClick={onCancel}>cancelar</button>
    </div>
  ),
}));

describe('App', () => {
  beforeEach(() => {
    mockAuthState = { socio: null, cargandoAuth: false, cerrarSesion: jest.fn() };
  });

  test('muestra LoginSocio mientras no hay sesión, aunque el backend ya haya devuelto socio', () => {
    render(<App />);
    expect(screen.getByText('login-mock')).toBeInTheDocument();
  });

  test('click en "ir a registro" muestra RegistroSocioForm en vez de LoginSocio', () => {
    render(<App />);
    fireEvent.click(screen.getByText('ir a registro'));
    expect(screen.getByText('registro-mock')).toBeInTheDocument();
    expect(screen.queryByText('login-mock')).not.toBeInTheDocument();
  });

  test('el dashboard no se muestra hasta que LoginSocio llama a onIngresoCompleto, aunque socio ya sea verdadero', () => {
    mockAuthState = { ...mockAuthState, socio: { nro_socio: '1000', nombre: 'Ana', apellido: 'Pérez' } };
    render(<App />);
    expect(screen.getByText('login-mock')).toBeInTheDocument();
    expect(screen.queryByText('Panel principal')).not.toBeInTheDocument();

    fireEvent.click(screen.getByText('simular ingreso completo'));
    expect(screen.getByText('Panel principal')).toBeInTheDocument();
  });

  test('un registro exitoso lleva directo al dashboard, sin pasar por LoginSocio', () => {
    mockAuthState = { ...mockAuthState, socio: { nro_socio: '1000', nombre: 'Ana', apellido: 'Pérez' } };
    render(<App />);
    fireEvent.click(screen.getByText('ir a registro'));
    expect(screen.getByText('registro-mock')).toBeInTheDocument();

    fireEvent.click(screen.getByText('simular registro exitoso'));
    expect(screen.getByText('Panel principal')).toBeInTheDocument();
    expect(screen.queryByText('login-mock')).not.toBeInTheDocument();
  });
});
