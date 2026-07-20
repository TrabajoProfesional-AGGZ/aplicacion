import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { CrearReservaFlow } from './CrearReservaFlow';
import { createReserva, getTurnosDisponibles } from '../../services/reservasService';

jest.mock('../../assets/logo-verde.png', () => 'logo-verde.png');
jest.mock('../../services/reservasService', () => ({
  createReserva: jest.fn(),
  getTurnosDisponibles: jest.fn(),
}));

const socioFixture = { id: 'socio-1', nro_socio: '1000' };

const INSTALACIONES_TEST = [
  { id: 'inst-uuid-1', nombre: 'Cancha de fútbol', tipo: 'Deportiva' },
  { id: 'inst-uuid-2', nombre: 'Pileta', tipo: 'Social' },
];

const onSuccess = jest.fn();
const onCancel = jest.fn();

function renderForm(instalaciones = INSTALACIONES_TEST) {
  return render(
    <CrearReservaFlow socio={socioFixture} instalaciones={instalaciones} onSuccess={onSuccess} onCancel={onCancel} />
  );
}

async function avanzarAlPaso2(fecha = '2027-08-10') {
  fireEvent.change(screen.getByRole('combobox'), { target: { value: 'inst-uuid-1' } });
  const fechaInput = document.querySelector('input[type="date"]');
  await act(async () => {
    fireEvent.change(fechaInput, { target: { value: fecha } });
  });
  await act(async () => {
    fireEvent.click(screen.getByRole('button', { name: /siguiente/i }));
  });
  await waitFor(() => expect(screen.getByText(/paso 2 de 2/i)).toBeInTheDocument());
}

beforeEach(() => {
  jest.clearAllMocks();
  jest.useFakeTimers();
  createReserva.mockResolvedValue({ id: 'reserva-nueva' });
  getTurnosDisponibles.mockResolvedValue(['09:00:00', '10:00:00']);
});

afterEach(() => {
  jest.useRealTimers();
});

describe('CrearReservaFlow', () => {
  test('renderiza el paso 1 con instalación y fecha', () => {
    renderForm();
    expect(screen.getByText('Nueva reserva')).toBeInTheDocument();
    expect(screen.getByText(/paso 1 de 2/i)).toBeInTheDocument();
    expect(screen.getByRole('combobox')).toBeInTheDocument();
    expect(document.querySelector('input[type="date"]')).toBeInTheDocument();
  });

  test('muestra las instalaciones recibidas por props', () => {
    renderForm();
    expect(screen.getByRole('option', { name: 'Cancha de fútbol' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Pileta' })).toBeInTheDocument();
  });

  test('no avanza al paso 2 sin seleccionar instalación y fecha', async () => {
    renderForm();
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /siguiente/i }));
    });
    await waitFor(() => {
      expect(screen.getByText('Debe seleccionar una instalación')).toBeInTheDocument();
    });
    expect(screen.getByText(/paso 1 de 2/i)).toBeInTheDocument();
  });

  test('avanza al paso 2 con datos válidos y carga los turnos disponibles', async () => {
    renderForm();
    await avanzarAlPaso2();
    await waitFor(() => {
      expect(screen.getByRole('option', { name: '09:00' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: '10:00' })).toBeInTheDocument();
    });
    expect(getTurnosDisponibles).toHaveBeenCalledWith('inst-uuid-1', '2027-08-10');
  });

  test('llama a createReserva con un único socio (el que está logueado)', async () => {
    renderForm();
    await avanzarAlPaso2();
    await waitFor(() => expect(screen.getByRole('option', { name: '09:00' })).toBeInTheDocument());
    fireEvent.change(screen.getByRole('combobox'), { target: { value: '09:00:00' } });

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /confirmar reserva/i }));
    });

    expect(createReserva).toHaveBeenCalledWith({
      ids_socios: ['socio-1'],
      id_instalacion: 'inst-uuid-1',
      fecha_reserva: '2027-08-10',
      hora_inicio: '09:00:00',
    });
  });

  test('muestra pantalla de éxito y llama onSuccess al confirmar', async () => {
    renderForm();
    await avanzarAlPaso2();
    await waitFor(() => expect(screen.getByRole('option', { name: '09:00' })).toBeInTheDocument());
    fireEvent.change(screen.getByRole('combobox'), { target: { value: '09:00:00' } });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /confirmar reserva/i }));
    });
    await waitFor(() => expect(screen.getByText('¡Reserva registrada!')).toBeInTheDocument());
    act(() => jest.advanceTimersByTime(1800));
    expect(onSuccess).toHaveBeenCalledTimes(1);
  });

  test('muestra el error de apto médico cuando createReserva lanza "apto-medico"', async () => {
    createReserva.mockRejectedValue(new Error('apto-medico'));
    renderForm();
    await avanzarAlPaso2();
    await waitFor(() => expect(screen.getByRole('option', { name: '09:00' })).toBeInTheDocument());
    fireEvent.change(screen.getByRole('combobox'), { target: { value: '09:00:00' } });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /confirmar reserva/i }));
    });
    expect(await screen.findByText(/necesitás tener el apto médico al día/i)).toBeInTheDocument();
    expect(onSuccess).not.toHaveBeenCalled();
  });

  test('muestra el error de superposición cuando createReserva lanza "superposicion"', async () => {
    createReserva.mockRejectedValue(new Error('superposicion'));
    renderForm();
    await avanzarAlPaso2();
    await waitFor(() => expect(screen.getByRole('option', { name: '09:00' })).toBeInTheDocument());
    fireEvent.change(screen.getByRole('combobox'), { target: { value: '09:00:00' } });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /confirmar reserva/i }));
    });
    expect(await screen.findByText('Ese turno ya no está disponible. Elegí otro horario.')).toBeInTheDocument();
  });

  test('llama onCancel al hacer clic en Cancelar', () => {
    renderForm();
    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  test('muestra un aviso cuando no hay turnos disponibles', async () => {
    getTurnosDisponibles.mockResolvedValue([]);
    renderForm();
    await avanzarAlPaso2();
    await waitFor(() => {
      expect(screen.getByText(/no hay turnos disponibles/i)).toBeInTheDocument();
    });
  });
});
