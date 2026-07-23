import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { NuevaReservaPage } from './NuevaReservaPage';
import { getInstalaciones } from '../../services/instalacionesService';
import { getTurnosDisponibles, createReserva } from '../../services/reservasService';
import { getSocioByNroSocio } from '../../services/sociosService';

jest.mock('../../services/instalacionesService', () => ({
  getInstalaciones: jest.fn(),
}));
jest.mock('../../services/reservasService', () => ({
  getTurnosDisponibles: jest.fn(),
  createReserva: jest.fn(),
}));
jest.mock('../../services/sociosService', () => ({
  getSocioByNroSocio: jest.fn(),
}));

const SOCIO = { id: 'socio-1', nro_socio: '1000', nombre: 'Ana', apellido: 'Pérez' };
const OTRO_SOCIO = { id: 'socio-2', nro_socio: '2000', nombre: 'Luis', apellido: 'Gómez' };
const INSTALACION = {
  id: 'inst-1',
  nombre: 'Cancha de fútbol',
  tipo: 'Deportiva',
  capacidad_maxima: 10,
  valor_turno: 5000,
  duracion_turno: 60,
  tiempo_minimo_cancelacion: null,
  activa: true,
};

async function irHastaResumen() {
  render(<NuevaReservaPage socio={SOCIO} onSalir={jest.fn()} onExito={jest.fn()} />);
  await screen.findByText('Cancha de fútbol');
  fireEvent.click(screen.getByText('Cancha de fútbol'));

  await screen.findByText('08:00');
  fireEvent.click(screen.getByText('08:00'));

  await screen.findByText('Agregar socios');
  fireEvent.click(screen.getByRole('button', { name: 'Continuar' }));

  await screen.findByText('Confirmá tu reserva');
}

const RealDate = global.Date;

// Mockea solo `new Date()`/`Date.now()` a una hora fija, sin tocar setTimeout/setInterval
// (jest.useFakeTimers rompía el setTimeout real del que depende confirmarReserva para onExito).
function mockearAhora(iso) {
  global.Date = class extends RealDate {
    constructor(...args) {
      if (args.length === 0) return new RealDate(iso);
      return new RealDate(...args);
    }
    static now() {
      return new RealDate(iso).getTime();
    }
  };
}

describe('NuevaReservaPage', () => {
  beforeEach(() => {
    // Fija la hora "actual" bien temprano en la mañana para que los turnos de prueba
    // (08:00, 09:00) nunca queden filtrados por el chequeo de "turno ya pasado".
    mockearAhora('2024-06-15T06:30:00');
    getInstalaciones.mockResolvedValue([INSTALACION]);
    getTurnosDisponibles.mockResolvedValue(['08:00:00', '09:00:00']);
  });

  afterEach(() => {
    global.Date = RealDate;
    jest.clearAllMocks();
  });

  test('recorre el flujo completo hasta confirmar la reserva', async () => {
    createReserva.mockResolvedValue({ id: 'reserva-1', estado: 'Pendiente' });
    const onExito = jest.fn();
    render(<NuevaReservaPage socio={SOCIO} onSalir={jest.fn()} onExito={onExito} />);

    await screen.findByText('Cancha de fútbol');
    fireEvent.click(screen.getByText('Cancha de fútbol'));

    await screen.findByText('08:00');
    expect(screen.getByText('hasta 60 min antes')).toBeInTheDocument();
    fireEvent.click(screen.getByText('08:00'));

    await screen.findByText('Agregar socios');
    fireEvent.click(screen.getByRole('button', { name: 'Continuar' }));

    await screen.findByText('Confirmá tu reserva');
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar' }));

    await waitFor(() => expect(createReserva).toHaveBeenCalledWith({
      ids_socios: ['socio-1'],
      id_instalacion: 'inst-1',
      fecha_reserva: expect.any(String),
      hora_inicio: '08:00:00',
    }));

    expect(await screen.findByText('¡Reserva registrada!')).toBeInTheDocument();
    await waitFor(() => expect(onExito).toHaveBeenCalledTimes(1), { timeout: 3000 });
  });

  test('incluye a los socios agregados en el resumen y en el envío', async () => {
    getSocioByNroSocio.mockResolvedValue(OTRO_SOCIO);
    createReserva.mockResolvedValue({ id: 'reserva-1', estado: 'Pendiente' });
    render(<NuevaReservaPage socio={SOCIO} onSalir={jest.fn()} onExito={jest.fn()} />);

    await screen.findByText('Cancha de fútbol');
    fireEvent.click(screen.getByText('Cancha de fútbol'));
    await screen.findByText('08:00');
    fireEvent.click(screen.getByText('08:00'));

    await screen.findByText('Agregar socios');
    fireEvent.change(screen.getByPlaceholderText('Número de socio'), { target: { value: '2000' } });
    fireEvent.click(screen.getByRole('button', { name: 'Agregar' }));
    await screen.findByText('Luis Gómez');
    fireEvent.click(screen.getByRole('button', { name: 'Continuar' }));

    await screen.findByText('Confirmá tu reserva');
    expect(screen.getByText('Luis Gómez')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar' }));

    await waitFor(() => expect(createReserva).toHaveBeenCalledWith(
      expect.objectContaining({ ids_socios: ['socio-1', 'socio-2'] })
    ));
  });

  test('"Cancelar" en el resumen vuelve a la lista de instalaciones sin conservar la selección', async () => {
    await irHastaResumen();

    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }));

    await screen.findByText('Realizá tu reserva');
    expect(screen.getByText('Cancha de fútbol')).toBeInTheDocument();
  });

  test('muestra el mensaje de error mapeado si la reserva se superpone', async () => {
    createReserva.mockRejectedValue(new Error('superposicion'));
    await irHastaResumen();

    fireEvent.click(screen.getByRole('button', { name: 'Confirmar' }));

    expect(await screen.findByText('Ese turno ya no está disponible. Elegí otro horario.')).toBeInTheDocument();
    expect(screen.getByText('Confirmá tu reserva')).toBeInTheDocument();
  });

  test('si la reserva falla porque hay socios morosos, muestra el listado de socios que no cumplen', async () => {
    const error = new Error('socio-moroso');
    error.sociosIncumplen = ['1000'];
    createReserva.mockRejectedValue(error);
    await irHastaResumen();

    fireEvent.click(screen.getByRole('button', { name: 'Confirmar' }));

    expect(await screen.findByText(
      'Los siguientes socios no estan al día con sus pagos y deben regularizar su estado para poder realizar reservas:'
    )).toBeInTheDocument();
    expect(screen.getByText('Ana Pérez (N° 1000)')).toBeInTheDocument();
  });

  test('si la fecha elegida es hoy, no muestra turnos cuya hora de inicio ya pasó', async () => {
    mockearAhora('2024-06-15T14:00:00');
    getTurnosDisponibles.mockResolvedValue(['09:00:00', '13:30:00', '14:00:00', '15:00:00']);

    render(<NuevaReservaPage socio={SOCIO} onSalir={jest.fn()} onExito={jest.fn()} />);
    await screen.findByText('Cancha de fútbol');
    fireEvent.click(screen.getByText('Cancha de fútbol'));

    await screen.findByText('15:00');
    expect(screen.getByText('14:00')).toBeInTheDocument();
    expect(screen.queryByText('09:00')).not.toBeInTheDocument();
    expect(screen.queryByText('13:30')).not.toBeInTheDocument();
  });

  test('si la fecha elegida es una fecha futura, muestra todos los turnos aunque ya haya pasado ese horario hoy', async () => {
    mockearAhora('2024-06-15T14:00:00');
    getTurnosDisponibles.mockResolvedValue(['09:00:00', '10:00:00']);

    render(<NuevaReservaPage socio={SOCIO} onSalir={jest.fn()} onExito={jest.fn()} />);
    await screen.findByText('Cancha de fútbol');
    fireEvent.click(screen.getByText('Cancha de fútbol'));

    await screen.findByText('Turnos disponibles');
    fireEvent.change(screen.getByLabelText('Fecha'), { target: { value: '2024-06-16' } });

    expect(await screen.findByText('09:00')).toBeInTheDocument();
    expect(screen.getByText('10:00')).toBeInTheDocument();
  });

  test('el botón de volver en la lista de instalaciones llama a onSalir', async () => {
    const onSalir = jest.fn();
    render(<NuevaReservaPage socio={SOCIO} onSalir={onSalir} onExito={jest.fn()} />);
    await screen.findByText('Cancha de fútbol');

    fireEvent.click(screen.getByLabelText('Volver'));
    expect(onSalir).toHaveBeenCalled();
  });

  test('el botón "Volver" en cualquier paso del flujo vuelve directo a la lista de instalaciones', async () => {
    render(<NuevaReservaPage socio={SOCIO} onSalir={jest.fn()} onExito={jest.fn()} />);
    await screen.findByText('Cancha de fútbol');
    fireEvent.click(screen.getByText('Cancha de fútbol'));

    await screen.findByText('08:00');
    fireEvent.click(screen.getAllByText('Volver')[0]);
    await screen.findByText('Realizá tu reserva');

    fireEvent.click(screen.getByText('Cancha de fútbol'));
    await screen.findByText('08:00');
    fireEvent.click(screen.getByText('08:00'));

    await screen.findByText('Agregar socios');
    fireEvent.click(screen.getAllByText('Volver')[0]);
    await screen.findByText('Realizá tu reserva');
  });

  test('el gesto de atrás del celular no cierra el flujo: vuelve a la lista de instalaciones', async () => {
    const onSalir = jest.fn();
    render(<NuevaReservaPage socio={SOCIO} onSalir={onSalir} onExito={jest.fn()} />);
    await screen.findByText('Cancha de fútbol');
    fireEvent.click(screen.getByText('Cancha de fútbol'));

    await screen.findByText('08:00');
    fireEvent.click(screen.getByText('08:00'));
    await screen.findByText('Agregar socios');

    window.history.replaceState({ otraEntrada: true }, '');
    window.dispatchEvent(new PopStateEvent('popstate'));

    await screen.findByText('Realizá tu reserva');
    expect(onSalir).not.toHaveBeenCalled();
  });

  test('volver desde el resumen no deja memoria "vieja" para el siguiente intento de reserva', async () => {
    getSocioByNroSocio.mockResolvedValue(OTRO_SOCIO);
    createReserva.mockResolvedValue({ id: 'reserva-1', estado: 'Pendiente' });
    render(<NuevaReservaPage socio={SOCIO} onSalir={jest.fn()} onExito={jest.fn()} />);

    await screen.findByText('Cancha de fútbol');
    fireEvent.click(screen.getByText('Cancha de fútbol'));
    await screen.findByText('08:00');
    fireEvent.click(screen.getByText('08:00'));

    await screen.findByText('Agregar socios');
    fireEvent.change(screen.getByPlaceholderText('Número de socio'), { target: { value: '2000' } });
    fireEvent.click(screen.getByRole('button', { name: 'Agregar' }));
    await screen.findByText('Luis Gómez');
    fireEvent.click(screen.getByRole('button', { name: 'Continuar' }));

    await screen.findByText('Confirmá tu reserva');
    fireEvent.click(screen.getAllByText('Volver')[0]);

    await screen.findByText('Realizá tu reserva');
    fireEvent.click(screen.getByText('Cancha de fútbol'));

    await screen.findByText('08:00');
    fireEvent.click(screen.getByText('08:00'));

    await screen.findByText('Agregar socios');
    expect(screen.queryByText('Luis Gómez')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Continuar' }));

    await screen.findByText('Confirmá tu reserva');
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar' }));

    await waitFor(() => expect(createReserva).toHaveBeenCalledWith(
      expect.objectContaining({ ids_socios: ['socio-1'] })
    ));
  });
});
