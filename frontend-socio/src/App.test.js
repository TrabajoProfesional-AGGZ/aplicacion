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

jest.mock('./pages/HomePage/HomePage', () => ({
  HomePage: () => <p>home-mock</p>,
}));

describe('App', () => {
  beforeEach(() => {
    mockAuthState = { socio: null, cargandoAuth: false, cerrarSesion: jest.fn() };
    sessionStorage.clear();
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
    expect(screen.queryByText('home-mock')).not.toBeInTheDocument();

    fireEvent.click(screen.getByText('simular ingreso completo'));
    expect(screen.getByText('home-mock')).toBeInTheDocument();
  });

  test('un registro exitoso lleva directo al dashboard, sin pasar por LoginSocio', () => {
    mockAuthState = { ...mockAuthState, socio: { nro_socio: '1000', nombre: 'Ana', apellido: 'Pérez' } };
    render(<App />);
    fireEvent.click(screen.getByText('ir a registro'));
    expect(screen.getByText('registro-mock')).toBeInTheDocument();

    fireEvent.click(screen.getByText('simular registro exitoso'));
    expect(screen.getByText('home-mock')).toBeInTheDocument();
    expect(screen.queryByText('login-mock')).not.toBeInTheDocument();
  });

  test('si la animación de login ya se mostró antes en esta pestaña y hay sesión activa, salta directo al dashboard sin montar LoginSocio', () => {
    sessionStorage.setItem('su_intro_mostrada', '1');
    mockAuthState = { ...mockAuthState, socio: { nro_socio: '1000', nombre: 'Ana', apellido: 'Pérez' } };
    render(<App />);
    expect(screen.getByText('home-mock')).toBeInTheDocument();
    expect(screen.queryByText('login-mock')).not.toBeInTheDocument();
  });

  test('si es la primera vez que se resuelve la sesión en esta pestaña, LoginSocio se monta igual aunque ya haya socio (animación de entrada a la app)', () => {
    mockAuthState = { ...mockAuthState, socio: { nro_socio: '1000', nombre: 'Ana', apellido: 'Pérez' } };
    render(<App />);
    expect(screen.getByText('login-mock')).toBeInTheDocument();
    expect(sessionStorage.getItem('su_intro_mostrada')).toBe('1');
  });
});
