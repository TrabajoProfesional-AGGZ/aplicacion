import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { ReservasPage } from './ReservasPage';
import { getReservasPorSocio, getReservasHistoricasPorSocio, cancelReserva } from '../../services/reservasService';
import { getInstalaciones } from '../../services/instalacionesService';

jest.mock('../../services/reservasService', () => ({
  getReservasPorSocio: jest.fn(),
  getReservasHistoricasPorSocio: jest.fn(),
  cancelReserva: jest.fn(),
}));
jest.mock('../../services/instalacionesService', () => ({
  getInstalaciones: jest.fn(),
}));
jest.mock('../../components/crearReservaFlow/CrearReservaFlow', () => ({
  CrearReservaFlow: ({ onSuccess, onCancel }) => (
    <div data-testid="crear-reserva-flow">
      <button onClick={onSuccess}>Simular creada</button>
      <button onClick={onCancel}>Cerrar form</button>
    </div>
  ),
}));

const socioFixture = { id: 'socio-1', nro_socio: '1000' };

const INSTALACION_MOCK = { id: 'inst-1', nombre: 'Cancha de fútbol', tipo: 'Deportiva', activa: true };

const RESERVA_PENDIENTE = {
  id: 'reserva-1',
  id_instalacion: 'inst-1',
  fecha_reserva: '2027-01-10',
  hora_inicio: '10:00:00',
  hora_fin: '11:00:00',
  estado: 'Pendiente',
  socios: [],
};

const RESERVA_CONFIRMADA = { ...RESERVA_PENDIENTE, id: 'reserva-2', estado: 'Confirmada' };
const RESERVA_FINALIZADA = { ...RESERVA_PENDIENTE, id: 'reserva-3', estado: 'Finalizada' };

describe('ReservasPage', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test('muestra el logo animado de carga mientras llega la respuesta', () => {
    getReservasPorSocio.mockReturnValue(new Promise(() => {}));
    getInstalaciones.mockReturnValue(new Promise(() => {}));
    render(<ReservasPage socio={socioFixture} />);
    expect(screen.getByRole('status', { name: 'Cargando' })).toBeInTheDocument();
  });

  test('muestra un mensaje de error si falla la carga', async () => {
    getReservasPorSocio.mockRejectedValue(new Error('servicio-no-disponible'));
    getInstalaciones.mockResolvedValue([]);
    render(<ReservasPage socio={socioFixture} />);
    expect(await screen.findByText('No se pudieron cargar tus reservas.')).toBeInTheDocument();
  });

  test('muestra un mensaje vacío cuando no hay reservas pendientes', async () => {
    getReservasPorSocio.mockResolvedValue([]);
    getInstalaciones.mockResolvedValue([]);
    render(<ReservasPage socio={socioFixture} />);
    expect(await screen.findByText('No tenés reservas en este estado.')).toBeInTheDocument();
  });

  test('lista las reservas pendientes con el nombre de la instalación', async () => {
    getReservasPorSocio.mockResolvedValue([RESERVA_PENDIENTE]);
    getInstalaciones.mockResolvedValue([INSTALACION_MOCK]);
    render(<ReservasPage socio={socioFixture} />);
    expect(await screen.findByText('Cancha de fútbol')).toBeInTheDocument();
    expect(screen.getByText('Pendiente')).toBeInTheDocument();
  });

  test('muestra la cantidad de reservas confirmadas y pendientes en el banner', async () => {
    getReservasPorSocio.mockResolvedValue([RESERVA_PENDIENTE, RESERVA_CONFIRMADA]);
    getInstalaciones.mockResolvedValue([INSTALACION_MOCK]);
    render(<ReservasPage socio={socioFixture} />);
    expect(await screen.findByLabelText('Reservas confirmadas: 1')).toBeInTheDocument();
    expect(screen.getByLabelText('Reservas pendientes: 1')).toBeInTheDocument();
  });

  test('cambiar de filtro muestra solo las reservas de ese estado', async () => {
    getReservasPorSocio.mockResolvedValue([RESERVA_PENDIENTE, RESERVA_CONFIRMADA]);
    getInstalaciones.mockResolvedValue([INSTALACION_MOCK]);
    render(<ReservasPage socio={socioFixture} />);
    await screen.findByText('Cancha de fútbol');

    fireEvent.click(screen.getByRole('button', { name: 'Confirmadas' }));
    await waitFor(() => expect(screen.getAllByText('Cancha de fútbol')).toHaveLength(1));
    expect(screen.getByText('Confirmada')).toBeInTheDocument();
    expect(screen.queryByText('Pendiente')).not.toBeInTheDocument();
  });

  test('el filtro "Finalizadas" busca el historial y lo muestra', async () => {
    getReservasPorSocio.mockResolvedValue([RESERVA_PENDIENTE]);
    getInstalaciones.mockResolvedValue([INSTALACION_MOCK]);
    getReservasHistoricasPorSocio.mockResolvedValue([RESERVA_FINALIZADA]);
    render(<ReservasPage socio={socioFixture} />);
    await screen.findByText('Cancha de fútbol');

    fireEvent.click(screen.getByRole('button', { name: 'Finalizadas' }));
    await waitFor(() => expect(getReservasHistoricasPorSocio).toHaveBeenCalledWith('1000'));
    expect(await screen.findByText('Finalizada')).toBeInTheDocument();
  });

  test('el filtro "Todas" no vuelve a pedir el historial si ya se cargó', async () => {
    getReservasPorSocio.mockResolvedValue([RESERVA_PENDIENTE]);
    getInstalaciones.mockResolvedValue([INSTALACION_MOCK]);
    getReservasHistoricasPorSocio.mockResolvedValue([RESERVA_FINALIZADA, RESERVA_CONFIRMADA]);
    render(<ReservasPage socio={socioFixture} />);
    await screen.findByText('Cancha de fútbol');

    fireEvent.click(screen.getByRole('button', { name: 'Finalizadas' }));
    await waitFor(() => expect(getReservasHistoricasPorSocio).toHaveBeenCalledTimes(1));

    fireEvent.click(screen.getByRole('button', { name: 'Todas' }));
    await waitFor(() => expect(screen.getAllByText('Cancha de fútbol')).toHaveLength(2));
    expect(getReservasHistoricasPorSocio).toHaveBeenCalledTimes(1);
  });

  test('no se pueden cancelar reservas finalizadas', async () => {
    getReservasPorSocio.mockResolvedValue([RESERVA_PENDIENTE]);
    getInstalaciones.mockResolvedValue([INSTALACION_MOCK]);
    getReservasHistoricasPorSocio.mockResolvedValue([RESERVA_FINALIZADA]);
    render(<ReservasPage socio={socioFixture} />);
    await screen.findByText('Cancha de fútbol');

    fireEvent.click(screen.getByRole('button', { name: 'Finalizadas' }));
    await screen.findByText('Finalizada');
    expect(screen.queryByRole('button', { name: 'Cancelar' })).not.toBeInTheDocument();
  });

  test('abre el flujo de nueva reserva al hacer click en "Nueva reserva"', async () => {
    getReservasPorSocio.mockResolvedValue([]);
    getInstalaciones.mockResolvedValue([]);
    render(<ReservasPage socio={socioFixture} />);
    await screen.findByText('No tenés reservas en este estado.');

    fireEvent.click(screen.getByRole('button', { name: /nueva reserva/i }));
    expect(screen.getByTestId('crear-reserva-flow')).toBeInTheDocument();
  });

  test('cierra el flujo de nueva reserva y recarga la lista al crear una reserva', async () => {
    getReservasPorSocio.mockResolvedValue([]);
    getInstalaciones.mockResolvedValue([]);
    render(<ReservasPage socio={socioFixture} />);
    await screen.findByText('No tenés reservas en este estado.');

    fireEvent.click(screen.getByRole('button', { name: /nueva reserva/i }));
    fireEvent.click(screen.getByText('Simular creada'));

    expect(screen.queryByTestId('crear-reserva-flow')).not.toBeInTheDocument();
    await waitFor(() => expect(getReservasPorSocio).toHaveBeenCalledTimes(2));
  });

  test('confirma la cancelación de una reserva y actualiza su estado', async () => {
    getReservasPorSocio.mockResolvedValue([RESERVA_PENDIENTE]);
    getInstalaciones.mockResolvedValue([INSTALACION_MOCK]);
    cancelReserva.mockResolvedValue({ ...RESERVA_PENDIENTE, estado: 'Cancelada' });
    render(<ReservasPage socio={socioFixture} />);
    await screen.findByText('Cancha de fútbol');

    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }));
    expect(screen.getByText('¿Seguro que querés cancelar esta reserva?')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Sí, cancelar' }));
    await waitFor(() => expect(cancelReserva).toHaveBeenCalledWith('reserva-1'));
    await waitFor(() => expect(screen.queryByText('¿Seguro que querés cancelar esta reserva?')).not.toBeInTheDocument());
  });

  test('muestra el mensaje de tolerancia si la cancelación llega fuera de término', async () => {
    getReservasPorSocio.mockResolvedValue([RESERVA_PENDIENTE]);
    getInstalaciones.mockResolvedValue([INSTALACION_MOCK]);
    const error = new Error('fuera-de-tolerancia');
    error.tiempoMinimoCancelacion = 60;
    cancelReserva.mockRejectedValue(error);
    render(<ReservasPage socio={socioFixture} />);
    await screen.findByText('Cancha de fútbol');

    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }));
    fireEvent.click(screen.getByRole('button', { name: 'Sí, cancelar' }));

    expect(await screen.findByText('No podés cancelar esta reserva a menos de 60 minutos del turno.')).toBeInTheDocument();
  });

  test('"Volver" cierra la confirmación de cancelación sin cancelar', async () => {
    getReservasPorSocio.mockResolvedValue([RESERVA_PENDIENTE]);
    getInstalaciones.mockResolvedValue([INSTALACION_MOCK]);
    render(<ReservasPage socio={socioFixture} />);
    await screen.findByText('Cancha de fútbol');

    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }));
    fireEvent.click(screen.getByRole('button', { name: 'Volver' }));

    expect(screen.queryByText('¿Seguro que querés cancelar esta reserva?')).not.toBeInTheDocument();
    expect(cancelReserva).not.toHaveBeenCalled();
  });
});
