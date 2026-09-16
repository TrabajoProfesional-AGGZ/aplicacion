import { render, screen, act, fireEvent } from '@testing-library/react';
import { HoyCard, __resetCacheHoyParaTests } from './HoyCard';
import { getReservasPorSocio } from '../../services/reservasService';
import { getEntradasActivas, getEntradasPendientes } from '../../services/eventosService';
import { getInstalaciones } from '../../services/instalacionesService';

jest.mock('../../services/reservasService', () => ({
  getReservasPorSocio: jest.fn(),
}));
jest.mock('../../services/eventosService', () => ({
  getEntradasActivas: jest.fn(),
  getEntradasPendientes: jest.fn(),
}));
jest.mock('../../services/instalacionesService', () => ({
  getInstalaciones: jest.fn(),
}));

const socioFixture = { id: 'socio-1', nro_socio: '1000' };

const HOY = '2024-06-15';
const OTRO_DIA = '2024-06-20';

const reservaHoyFixture = {
  id: 'r-1',
  id_instalacion: 'inst-1',
  fecha_reserva: HOY,
  hora_inicio: '08:00:00',
  hora_fin: '09:00:00',
  estado: 'Confirmada',
};

const entradaHoyFixture = {
  id: 'e-1',
  estado: 'Pagada',
  evento: { nombre: 'Torneo de tenis', dia: HOY, hora_inicio: '18:00:00', hora_fin: '20:00:00' },
};

/** Flushea las promesas encadenadas del `useEffect` de carga (Promise.all + .catch + .then). */
async function flushCarga() {
  await act(async () => {
    for (let i = 0; i < 6; i += 1) await Promise.resolve();
  });
}

describe('HoyCard', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2024-06-15T12:00:00'));
    getInstalaciones.mockResolvedValue([{ id: 'inst-1', nombre: 'Cancha de fútbol' }]);
    getReservasPorSocio.mockResolvedValue([]);
    getEntradasActivas.mockResolvedValue([]);
    getEntradasPendientes.mockResolvedValue([]);
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.clearAllMocks();
    __resetCacheHoyParaTests();
  });

  test('no muestra nada si no hay reservas ni entradas para hoy', async () => {
    const { container } = render(<HoyCard socio={socioFixture} />);
    await flushCarga();
    expect(container.firstChild).toBeNull();
  });

  test('ignora reservas y entradas que no son de hoy', async () => {
    getReservasPorSocio.mockResolvedValue([{ ...reservaHoyFixture, fecha_reserva: OTRO_DIA }]);
    getEntradasActivas.mockResolvedValue([{ ...entradaHoyFixture, evento: { ...entradaHoyFixture.evento, dia: OTRO_DIA } }]);
    const { container } = render(<HoyCard socio={socioFixture} />);
    await flushCarga();
    expect(container.firstChild).toBeNull();
  });

  test('muestra solo la vista de reservas, sin puntos de carrusel, si solo hay reservas hoy', async () => {
    getReservasPorSocio.mockResolvedValue([reservaHoyFixture]);
    const { container } = render(<HoyCard socio={socioFixture} />);
    await flushCarga();
    expect(screen.getByText('Tus reservas para hoy')).toBeInTheDocument();
    expect(screen.getByText('Cancha de fútbol')).toBeInTheDocument();
    expect(container.querySelector('.hoy-card-dots')).not.toBeInTheDocument();
  });

  test('muestra solo la vista de entradas si solo hay entradas hoy', async () => {
    getEntradasActivas.mockResolvedValue([entradaHoyFixture]);
    render(<HoyCard socio={socioFixture} />);
    await flushCarga();
    expect(screen.getByText('Tus entradas para hoy')).toBeInTheDocument();
    expect(screen.getByText('Torneo de tenis')).toBeInTheDocument();
  });

  test('alterna automáticamente entre reservas y entradas cada 30 segundos', async () => {
    getReservasPorSocio.mockResolvedValue([reservaHoyFixture]);
    getEntradasActivas.mockResolvedValue([entradaHoyFixture]);
    render(<HoyCard socio={socioFixture} />);
    await flushCarga();

    expect(screen.getByText('Tus reservas para hoy')).toBeInTheDocument();
    expect(screen.queryByText('Tus entradas para hoy')).not.toBeInTheDocument();

    act(() => { jest.advanceTimersByTime(30000); });
    expect(screen.getByText('Tus entradas para hoy')).toBeInTheDocument();

    act(() => { jest.advanceTimersByTime(30000); });
    expect(screen.getByText('Tus reservas para hoy')).toBeInTheDocument();
  });

  test('muestra como máximo 3 items y un botón "Ver todas" si hay más, que llama a onVerReservas', async () => {
    const reservas = [1, 2, 3, 4].map((n) => ({ ...reservaHoyFixture, id: `r-${n}` }));
    getReservasPorSocio.mockResolvedValue(reservas);
    const onVerReservas = jest.fn();
    render(<HoyCard socio={socioFixture} onVerReservas={onVerReservas} />);
    await flushCarga();

    expect(screen.getAllByText('Cancha de fútbol')).toHaveLength(3);
    const boton = screen.getByRole('button', { name: /ver todas/i });
    fireEvent.click(boton);
    expect(onVerReservas).toHaveBeenCalled();
  });

  test('no muestra el botón "Ver todas" si hay 3 items o menos', async () => {
    getReservasPorSocio.mockResolvedValue([reservaHoyFixture]);
    render(<HoyCard socio={socioFixture} />);
    await flushCarga();
    expect(screen.queryByRole('button', { name: /ver todas/i })).not.toBeInTheDocument();
  });

  test('clickear en cualquier parte de la card (no solo "Ver todas") llama a onVerReservas', async () => {
    getReservasPorSocio.mockResolvedValue([reservaHoyFixture]);
    const onVerReservas = jest.fn();
    render(<HoyCard socio={socioFixture} onVerReservas={onVerReservas} />);
    await flushCarga();

    fireEvent.click(screen.getByText('Tus reservas para hoy'));
    expect(onVerReservas).toHaveBeenCalledTimes(1);
  });

  test('clickear "Ver todas" navega una sola vez, no dos, pese al bubbling del click de la card', async () => {
    const reservas = [1, 2, 3, 4].map((n) => ({ ...reservaHoyFixture, id: `r-${n}` }));
    getReservasPorSocio.mockResolvedValue(reservas);
    const onVerReservas = jest.fn();
    render(<HoyCard socio={socioFixture} onVerReservas={onVerReservas} />);
    await flushCarga();

    fireEvent.click(screen.getByRole('button', { name: /ver todas/i }));
    expect(onVerReservas).toHaveBeenCalledTimes(1);
  });

  test('en un segundo mount del mismo socio, muestra el contenido cacheado sin esperar a que resuelvan los fetches (evita el parpadeo al volver a Inicio)', async () => {
    getReservasPorSocio.mockResolvedValue([reservaHoyFixture]);
    const primerRender = render(<HoyCard socio={socioFixture} />);
    await flushCarga();
    expect(screen.getByText('Cancha de fútbol')).toBeInTheDocument();
    primerRender.unmount();

    getReservasPorSocio.mockImplementation(() => new Promise(() => {})); // nunca resuelve en este remount
    getInstalaciones.mockImplementation(() => new Promise(() => {}));
    render(<HoyCard socio={socioFixture} />);
    expect(screen.getByText('Cancha de fútbol')).toBeInTheDocument();
  });
});
