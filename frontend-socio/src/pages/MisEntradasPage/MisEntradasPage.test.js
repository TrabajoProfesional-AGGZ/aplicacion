import { render, screen, fireEvent } from '@testing-library/react';
import { MisEntradasPage } from './MisEntradasPage';
import { getEntradasActivas, getEntradasHistoricas, getEntradasPendientes } from '../../services/eventosService';

jest.mock('../../services/eventosService', () => ({
  getEntradasActivas: jest.fn(),
  getEntradasHistoricas: jest.fn(),
  getEntradasPendientes: jest.fn(),
}));

const SOCIO = { id: 'socio-1', nombre: 'Ana', apellido: 'Gómez' };

const EVENTO = {
  id: 'ev-1',
  nombre: 'Fiesta de fin de año',
  dia: '2026-12-31',
  hora_inicio: '20:00:00',
  hora_fin: '23:00:00',
};

const ENTRADA_ACTIVA = { id: 'ent-1', estado: 'Pagada', monto: '5000.00', evento: EVENTO };
const ENTRADA_VENCIDA = { id: 'ent-2', estado: 'Vencida', monto: '5000.00', evento: EVENTO };
const ENTRADA_PENDIENTE = { id: 'ent-3', estado: 'Pendiente', monto: '5000.00', evento: EVENTO };

describe('MisEntradasPage', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test('muestra el logo animado de carga mientras llega la respuesta', () => {
    getEntradasActivas.mockReturnValue(new Promise(() => {}));
    getEntradasPendientes.mockResolvedValue([]);
    render(<MisEntradasPage socio={SOCIO} />);
    expect(screen.getByRole('status', { name: 'Cargando' })).toBeInTheDocument();
  });

  test('muestra el título "Mis Entradas"', async () => {
    getEntradasActivas.mockResolvedValue([]);
    getEntradasPendientes.mockResolvedValue([]);
    render(<MisEntradasPage socio={SOCIO} />);
    expect(await screen.findByText('Mis Entradas')).toBeInTheDocument();
  });

  test('muestra un mensaje de error si falla la carga', async () => {
    getEntradasActivas.mockRejectedValue(new Error('servicio-no-disponible'));
    getEntradasPendientes.mockResolvedValue([]);
    render(<MisEntradasPage socio={SOCIO} />);
    expect(await screen.findByText('No se pudieron cargar tus entradas.')).toBeInTheDocument();
  });

  test('muestra un mensaje vacío cuando no hay entradas activas', async () => {
    getEntradasActivas.mockResolvedValue([]);
    getEntradasPendientes.mockResolvedValue([]);
    render(<MisEntradasPage socio={SOCIO} />);
    expect(await screen.findByText('No tenés entradas activas.')).toBeInTheDocument();
  });

  test('lista las entradas activas con el nombre del evento', async () => {
    getEntradasActivas.mockResolvedValue([ENTRADA_ACTIVA]);
    getEntradasPendientes.mockResolvedValue([]);
    render(<MisEntradasPage socio={SOCIO} />);
    expect(await screen.findByText('Fiesta de fin de año')).toBeInTheDocument();
    expect(screen.getByText('Pagada')).toBeInTheDocument();
  });

  test('click en "Ver código QR" abre el placeholder de próximamente', async () => {
    getEntradasActivas.mockResolvedValue([ENTRADA_ACTIVA]);
    getEntradasPendientes.mockResolvedValue([]);
    render(<MisEntradasPage socio={SOCIO} />);
    await screen.findByText('Fiesta de fin de año');

    fireEvent.click(screen.getByLabelText('Ver código QR de la entrada'));

    expect(screen.getByText('Código QR')).toBeInTheDocument();
    expect(screen.getByText('Próximamente...')).toBeInTheDocument();
  });

  test('alternar a "Históricas" pide y muestra el historial', async () => {
    getEntradasActivas.mockResolvedValue([]);
    getEntradasPendientes.mockResolvedValue([]);
    getEntradasHistoricas.mockResolvedValue([ENTRADA_VENCIDA]);
    render(<MisEntradasPage socio={SOCIO} />);
    await screen.findByText('No tenés entradas activas.');

    fireEvent.click(screen.getByRole('button', { name: 'Históricas' }));

    expect(await screen.findByText('Fiesta de fin de año')).toBeInTheDocument();
    expect(screen.getByText('Vencida')).toBeInTheDocument();
    expect(getEntradasHistoricas).toHaveBeenCalledWith('socio-1');
  });

  test('las entradas históricas no muestran el botón de QR', async () => {
    getEntradasActivas.mockResolvedValue([]);
    getEntradasPendientes.mockResolvedValue([]);
    getEntradasHistoricas.mockResolvedValue([ENTRADA_VENCIDA]);
    render(<MisEntradasPage socio={SOCIO} />);
    await screen.findByText('No tenés entradas activas.');

    fireEvent.click(screen.getByRole('button', { name: 'Históricas' }));

    await screen.findByText('Fiesta de fin de año');
    expect(screen.queryByLabelText('Ver código QR de la entrada')).not.toBeInTheDocument();
  });

  test('una entrada pendiente se lista en "Activas" con tag "Pendiente" y botón "Ir a pagar"', async () => {
    getEntradasActivas.mockResolvedValue([]);
    getEntradasPendientes.mockResolvedValue([ENTRADA_PENDIENTE]);
    render(<MisEntradasPage socio={SOCIO} />);

    expect(await screen.findByText('Fiesta de fin de año')).toBeInTheDocument();
    expect(screen.getByText('Pendiente')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Ir a pagar' })).toBeInTheDocument();
    expect(screen.queryByLabelText('Ver código QR de la entrada')).not.toBeInTheDocument();
  });

  test('click en "Ir a pagar" llama a onPagarEntrada con la entrada pendiente', async () => {
    getEntradasActivas.mockResolvedValue([]);
    getEntradasPendientes.mockResolvedValue([ENTRADA_PENDIENTE]);
    const onPagarEntrada = jest.fn();
    render(<MisEntradasPage socio={SOCIO} onPagarEntrada={onPagarEntrada} />);

    fireEvent.click(await screen.findByRole('button', { name: 'Ir a pagar' }));

    expect(onPagarEntrada).toHaveBeenCalledWith(ENTRADA_PENDIENTE);
  });
});
