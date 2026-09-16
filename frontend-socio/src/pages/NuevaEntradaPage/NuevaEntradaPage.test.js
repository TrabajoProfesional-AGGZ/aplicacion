import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { NuevaEntradaPage } from './NuevaEntradaPage';
import {
  getEventos,
  comprarEntrada,
  getEntradasActivas,
  getEntradasPendientes,
} from '../../services/eventosService';

jest.mock('../../services/eventosService', () => ({
  getEventos: jest.fn(),
  comprarEntrada: jest.fn(),
  getEntradasActivas: jest.fn(),
  getEntradasPendientes: jest.fn(),
}));

jest.mock('../../components/pagoCuota/PagoCuotaFlow', () => ({
  PagoCuotaFlow: ({ item }) => <div data-testid="payment-brick">pago-flow-stub {item.concepto}</div>,
}));

const SOCIO = { id: 'socio-1', nombre: 'Ana', apellido: 'Gómez', email: 'ana@test.com' };

const EVENTO = {
  id: 'ev-1',
  nombre: 'Fiesta de fin de año',
  descripcion: 'Un evento para todos los socios.',
  dia: '2026-12-31',
  hora_inicio: '20:00:00',
  hora_fin: '23:00:00',
  capacidad_maxima: 100,
  entradas_vendidas: 10,
  valor_entrada: '5000.00',
  foto_url: null,
};

const ENTRADA = {
  id: 'ent-1',
  estado: 'Pendiente',
  monto: '5000.00',
  evento: EVENTO,
};

describe('NuevaEntradaPage', () => {
  beforeEach(() => {
    getEntradasActivas.mockResolvedValue([]);
    getEntradasPendientes.mockResolvedValue([]);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('muestra el banner de eventos', async () => {
    getEventos.mockResolvedValue([]);
    render(<NuevaEntradaPage socio={SOCIO} />);
    expect(await screen.findByRole('heading', { name: 'Comprá tu entrada' })).toBeInTheDocument();
  });

  test('lista los eventos con cupo y valor', async () => {
    getEventos.mockResolvedValue([EVENTO]);
    render(<NuevaEntradaPage socio={SOCIO} />);
    expect(await screen.findByText('Fiesta de fin de año')).toBeInTheDocument();
    expect(screen.getByText('10/100')).toBeInTheDocument();
  });

  test('click en un evento navega al detalle', async () => {
    getEventos.mockResolvedValue([EVENTO]);
    render(<NuevaEntradaPage socio={SOCIO} />);
    fireEvent.click(await screen.findByText('Fiesta de fin de año'));

    expect(screen.getByRole('heading', { name: 'Fiesta de fin de año' })).toBeInTheDocument();
    expect(screen.getByText('Un evento para todos los socios.')).toBeInTheDocument();
  });

  test('click en "Reserva tu entrada" con éxito avanza al flujo de pago', async () => {
    getEventos.mockResolvedValue([EVENTO]);
    comprarEntrada.mockResolvedValue(ENTRADA);
    render(<NuevaEntradaPage socio={SOCIO} />);
    fireEvent.click(await screen.findByText('Fiesta de fin de año'));

    fireEvent.click(screen.getByRole('button', { name: 'Reserva tu entrada' }));

    expect(await screen.findByTestId('payment-brick')).toBeInTheDocument();
    expect(comprarEntrada).toHaveBeenCalledWith('ev-1', 'socio-1');
  });

  test('si el evento es gratuito, la entrada queda pagada y salta el paso de pago', async () => {
    const eventoGratis = { ...EVENTO, id: 'ev-2', valor_entrada: '0.00' };
    const entradaGratis = { ...ENTRADA, id: 'ent-2', estado: 'Pagada', monto: '0.00', evento: eventoGratis };
    getEventos.mockResolvedValue([eventoGratis]);
    comprarEntrada.mockResolvedValue(entradaGratis);
    const onExito = jest.fn();
    render(<NuevaEntradaPage socio={SOCIO} onExito={onExito} />);
    fireEvent.click(await screen.findByText('Fiesta de fin de año'));

    fireEvent.click(screen.getByRole('button', { name: 'Reserva tu entrada' }));

    expect(await screen.findByText('¡Entrada confirmada!')).toBeInTheDocument();
    expect(screen.queryByTestId('payment-brick')).not.toBeInTheDocument();
    await waitFor(() => expect(onExito).toHaveBeenCalledTimes(1), { timeout: 3600 });
  });

  test('tocar "Ver mis entradas" en la pantalla de éxito llama a onExito antes del timer', async () => {
    const eventoGratis = { ...EVENTO, id: 'ev-2', valor_entrada: '0.00' };
    const entradaGratis = { ...ENTRADA, id: 'ent-2', estado: 'Pagada', monto: '0.00', evento: eventoGratis };
    getEventos.mockResolvedValue([eventoGratis]);
    comprarEntrada.mockResolvedValue(entradaGratis);
    const onExito = jest.fn();
    render(<NuevaEntradaPage socio={SOCIO} onExito={onExito} />);
    fireEvent.click(await screen.findByText('Fiesta de fin de año'));

    fireEvent.click(screen.getByRole('button', { name: 'Reserva tu entrada' }));

    await screen.findByText('¡Entrada confirmada!');
    fireEvent.click(screen.getByRole('button', { name: 'Ver mis entradas' }));

    expect(onExito).toHaveBeenCalledTimes(1);
  });

  test('muestra el error cuando no hay cupo', async () => {
    getEventos.mockResolvedValue([EVENTO]);
    comprarEntrada.mockRejectedValue(new Error('sin-cupo'));
    render(<NuevaEntradaPage socio={SOCIO} />);
    fireEvent.click(await screen.findByText('Fiesta de fin de año'));

    fireEvent.click(screen.getByRole('button', { name: 'Reserva tu entrada' }));

    expect(await screen.findByText('Este evento ya no tiene entradas disponibles.')).toBeInTheDocument();
  });

  test('muestra el error de deuda (moroso)', async () => {
    getEventos.mockResolvedValue([EVENTO]);
    comprarEntrada.mockRejectedValue(new Error('moroso'));
    render(<NuevaEntradaPage socio={SOCIO} />);
    fireEvent.click(await screen.findByText('Fiesta de fin de año'));

    fireEvent.click(screen.getByRole('button', { name: 'Reserva tu entrada' }));

    expect(await screen.findByText(/Tenés pagos pendientes/)).toBeInTheDocument();
  });

  test('el gesto de atrás desde el detalle vuelve a la lista', async () => {
    getEventos.mockResolvedValue([EVENTO]);
    render(<NuevaEntradaPage socio={SOCIO} />);
    fireEvent.click(await screen.findByText('Fiesta de fin de año'));

    window.history.replaceState({ otraEntrada: true }, '');
    act(() => { window.dispatchEvent(new PopStateEvent('popstate')); });

    expect(await screen.findByRole('heading', { name: 'Comprá tu entrada' })).toBeInTheDocument();
  });

  test('si el socio ya tiene una entrada para el evento, no muestra el botón y avisa en el banner', async () => {
    getEventos.mockResolvedValue([EVENTO]);
    getEntradasPendientes.mockResolvedValue([ENTRADA]);
    render(<NuevaEntradaPage socio={SOCIO} />);
    fireEvent.click(await screen.findByText('Fiesta de fin de año'));

    expect(await screen.findByText('Ya tenés una entrada para este evento')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Reserva tu entrada' })).not.toBeInTheDocument();
  });
});
