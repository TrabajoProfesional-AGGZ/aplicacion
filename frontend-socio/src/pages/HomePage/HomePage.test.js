import { render, screen, fireEvent } from '@testing-library/react';
import { HomePage } from './HomePage';

jest.mock('../../firebase', () => ({ auth: {} }));
jest.mock('../../utils/authService', () => ({
  changePassword: jest.fn(),
}));
jest.mock('../../services/finanzasService', () => ({
  getEstadoFinanciero: jest.fn(() => Promise.resolve({
    id_socio: 'socio-1',
    estado_financiero: 'Al día',
    deuda_total: 0,
    cuotas: [],
  })),
}));
jest.mock('../../services/tramitesService', () => ({
  getTramitesPendientes: jest.fn(() => Promise.resolve({ vencidos: [], por_vencer: [], total: 0 })),
  getTramitesPorSocio: jest.fn(() => Promise.resolve([])),
}));
jest.mock('../../services/alertasService', () => ({
  getAlertasSocio: jest.fn(() => Promise.resolve([])),
}));
jest.mock('../../hooks/useBiometricLogin', () => ({
  useBiometricLogin: () => ({
    soportado: false,
    enrolado: false,
    cargando: false,
    error: null,
    ofrecerEnrolamiento: jest.fn(),
    desenrolar: jest.fn(),
    iniciarSesionBiometrico: jest.fn(),
  }),
}));

const socioFixture = {
  id: 'socio-1',
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

  test('muestra las 5 tarjetas de acceso rápido', () => {
    render(<HomePage socio={socioFixture} cerrarSesion={jest.fn()} />);
    expect(screen.getByText('Cuotas y pagos')).toBeInTheDocument();
    expect(screen.getByText('Reservar instalación')).toBeInTheDocument();
    expect(screen.getByText('Inscribirme a actividad')).toBeInTheDocument();
    expect(screen.getByText('Última noticia')).toBeInTheDocument();
    expect(screen.getByText('Mis trámites')).toBeInTheDocument();
  });

  test('click en "Mis trámites" navega a la página de trámites (no abre el overlay)', async () => {
    render(<HomePage socio={socioFixture} cerrarSesion={jest.fn()} />);
    fireEvent.click(screen.getByText('Mis trámites'));
    expect(screen.queryByText('Próximamente...')).not.toBeInTheDocument();
    expect(await screen.findByRole('heading', { name: 'Mis trámites' })).toBeInTheDocument();
  });

  test('"Inicio" del nav inferior vuelve a mostrar el inicio desde trámites', async () => {
    render(<HomePage socio={socioFixture} cerrarSesion={jest.fn()} />);
    fireEvent.click(screen.getByText('Mis trámites'));
    await screen.findByRole('heading', { name: 'Mis trámites' });
    fireEvent.click(screen.getByText('Inicio'));
    expect(screen.getByText('Bienvenido Ana Pérez')).toBeInTheDocument();
  });

  test('click en una tarjeta de acceso rápido abre el overlay "Próximamente" con su título', () => {
    render(<HomePage socio={socioFixture} cerrarSesion={jest.fn()} />);
    fireEvent.click(screen.getByText('Reservar instalación'));
    expect(screen.getByText('Próximamente...')).toBeInTheDocument();
    expect(screen.getAllByText('Reservar instalación').length).toBeGreaterThan(1);
  });

  test('click en "Cerrar" del overlay lo cierra', () => {
    render(<HomePage socio={socioFixture} cerrarSesion={jest.fn()} />);
    fireEvent.click(screen.getByText('Inscribirme a actividad'));
    expect(screen.getByText('Próximamente...')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Cerrar'));
    expect(screen.queryByText('Próximamente...')).not.toBeInTheDocument();
  });

  test('click en "Cuotas y pagos" navega a la página de finanzas (no abre el overlay)', async () => {
    render(<HomePage socio={socioFixture} cerrarSesion={jest.fn()} />);
    fireEvent.click(screen.getByText('Cuotas y pagos'));
    expect(screen.queryByText('Próximamente...')).not.toBeInTheDocument();
    expect(await screen.findByRole('heading', { name: 'Cuotas' })).toBeInTheDocument();
  });

  test('la página de finanzas se mantiene dentro del layout con Header y BottomNav', async () => {
    render(<HomePage socio={socioFixture} cerrarSesion={jest.fn()} />);
    fireEvent.click(screen.getByText('Cuotas y pagos'));
    await screen.findByRole('heading', { name: 'Cuotas' });
    expect(screen.getByLabelText('Mi perfil')).toBeInTheDocument();
    expect(screen.getByText('Inicio').closest('button')).toBeInTheDocument();
  });

  test('"Inicio" del nav inferior vuelve a mostrar el inicio desde cuotas y pagos', async () => {
    render(<HomePage socio={socioFixture} cerrarSesion={jest.fn()} />);
    fireEvent.click(screen.getByText('Cuotas y pagos'));
    await screen.findByRole('heading', { name: 'Cuotas' });
    fireEvent.click(screen.getByText('Inicio'));
    expect(screen.getByText('Bienvenido Ana Pérez')).toBeInTheDocument();
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

  test('click en el botón de notificaciones navega a la página de alertas', async () => {
    render(<HomePage socio={socioFixture} cerrarSesion={jest.fn()} />);
    fireEvent.click(screen.getByLabelText('Notificaciones'));
    expect(await screen.findByRole('heading', { name: 'Mis alertas' })).toBeInTheDocument();
  });

  test('"Inicio" del nav inferior vuelve a mostrar el inicio desde alertas', async () => {
    render(<HomePage socio={socioFixture} cerrarSesion={jest.fn()} />);
    fireEvent.click(screen.getByLabelText('Notificaciones'));
    await screen.findByRole('heading', { name: 'Mis alertas' });
    fireEvent.click(screen.getByText('Inicio'));
    expect(screen.getByText('Bienvenido Ana Pérez')).toBeInTheDocument();
  });

  test('click en el botón de perfil del header navega a la página de perfil, sin flecha de volver', () => {
    render(<HomePage socio={socioFixture} cerrarSesion={jest.fn()} />);
    fireEvent.click(screen.getByLabelText('Mi perfil'));
    expect(screen.getByText('Cerrar sesión')).toBeInTheDocument();
    expect(screen.queryByText('Bienvenido Ana Pérez')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Volver')).not.toBeInTheDocument();
  });

  test('el perfil se muestra dentro del layout con Header y BottomNav, sin el ícono de perfil', () => {
    render(<HomePage socio={socioFixture} cerrarSesion={jest.fn()} />);
    fireEvent.click(screen.getByLabelText('Mi perfil'));
    expect(screen.getByAltText('SocioUnido')).toBeInTheDocument();
    expect(screen.getByText('Inicio').closest('button')).toBeInTheDocument();
    expect(screen.queryByLabelText('Mi perfil')).not.toBeInTheDocument();
  });

  test('"Inicio" del nav inferior vuelve a mostrar el inicio desde el perfil', () => {
    render(<HomePage socio={socioFixture} cerrarSesion={jest.fn()} />);
    fireEvent.click(screen.getByLabelText('Mi perfil'));
    fireEvent.click(screen.getByText('Inicio'));
    expect(screen.getByText('Cuotas y pagos')).toBeInTheDocument();
  });
});
