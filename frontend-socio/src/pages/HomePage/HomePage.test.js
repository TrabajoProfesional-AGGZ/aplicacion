import { render, screen, fireEvent } from '@testing-library/react';
import { HomePage } from './HomePage';

jest.mock('../../firebase', () => ({ auth: {} }));
jest.mock('../../utils/authService', () => ({
  changePassword: jest.fn(),
}));

const socioFixture = {
  nombre: 'Ana',
  apellido: 'Pérez',
  nro_socio: '1000',
  categoria: { nombre: 'Titular' },
  estado: { nombre: 'Activo' },
};

describe('HomePage', () => {
  test('muestra la tarjeta de bienvenida con los datos del socio', () => {
    render(<HomePage socio={socioFixture} cerrarSesion={jest.fn()} />);
    expect(screen.getByText('Bienvenido Ana Pérez')).toBeInTheDocument();
    expect(screen.getByText('1000 - Titular')).toBeInTheDocument();
  });

  test('muestra las 4 tarjetas de acceso rápido', () => {
    render(<HomePage socio={socioFixture} cerrarSesion={jest.fn()} />);
    expect(screen.getByText('Cuotas y pagos')).toBeInTheDocument();
    expect(screen.getByText('Reservar instalación')).toBeInTheDocument();
    expect(screen.getByText('Inscribirme a actividad')).toBeInTheDocument();
    expect(screen.getByText('Última noticia')).toBeInTheDocument();
  });

  test('click en una tarjeta de acceso rápido abre el overlay "Próximamente" con su título', () => {
    render(<HomePage socio={socioFixture} cerrarSesion={jest.fn()} />);
    fireEvent.click(screen.getByText('Reservar instalación'));
    expect(screen.getByText('Próximamente...')).toBeInTheDocument();
    expect(screen.getAllByText('Reservar instalación').length).toBeGreaterThan(1);
  });

  test('click en "Cerrar" del overlay lo cierra', () => {
    render(<HomePage socio={socioFixture} cerrarSesion={jest.fn()} />);
    fireEvent.click(screen.getByText('Cuotas y pagos'));
    expect(screen.getByText('Próximamente...')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Cerrar'));
    expect(screen.queryByText('Próximamente...')).not.toBeInTheDocument();
  });

  test('muestra el nav inferior con los 5 botones y "Inicio" activo', () => {
    render(<HomePage socio={socioFixture} cerrarSesion={jest.fn()} />);
    expect(screen.getByText('Inicio').closest('button')).toHaveAttribute('aria-current', 'page');
    expect(screen.getByText('Mis Inscripciones')).toBeInTheDocument();
  });

  test('click en un botón del nav inferior (distinto de Inicio) abre el overlay', () => {
    render(<HomePage socio={socioFixture} cerrarSesion={jest.fn()} />);
    fireEvent.click(screen.getByText('Mi Carnet'));
    expect(screen.getByText('Próximamente...')).toBeInTheDocument();
  });

  test('click en el botón de perfil del header navega a la página de perfil', () => {
    render(<HomePage socio={socioFixture} cerrarSesion={jest.fn()} />);
    fireEvent.click(screen.getByLabelText('Mi perfil'));
    expect(screen.getByText('Mi perfil')).toBeInTheDocument();
    expect(screen.getByText('Cerrar sesión')).toBeInTheDocument();
  });

  test('"Volver" desde el perfil vuelve a mostrar el inicio', () => {
    render(<HomePage socio={socioFixture} cerrarSesion={jest.fn()} />);
    fireEvent.click(screen.getByLabelText('Mi perfil'));
    fireEvent.click(screen.getByLabelText('Volver'));
    expect(screen.getByText('Cuotas y pagos')).toBeInTheDocument();
  });
});
