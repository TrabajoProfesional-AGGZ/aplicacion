import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { DeudaBanner, __resetCacheDeudaParaTests } from './DeudaBanner';
import { getEstadoFinanciero } from '../../services/finanzasService';

jest.mock('../../services/finanzasService', () => ({
  getEstadoFinanciero: jest.fn(),
}));

const socioFixture = { id: 'socio-1' };

describe('DeudaBanner', () => {
  afterEach(() => {
    jest.clearAllMocks();
    __resetCacheDeudaParaTests();
  });

  test('no muestra nada si no tiene cuotas pendientes ni vencidas', async () => {
    getEstadoFinanciero.mockResolvedValue({ cuotas: [{ id: 'c-1', estado: 'Pagada' }] });
    const { container } = render(<DeudaBanner socio={socioFixture} onClick={jest.fn()} />);
    await waitFor(() => expect(getEstadoFinanciero).toHaveBeenCalledWith('socio-1'));
    expect(container.firstChild).toBeNull();
  });

  test('no muestra nada si solo tiene cuotas pendientes, sin ninguna vencida', async () => {
    getEstadoFinanciero.mockResolvedValue({
      cuotas: [
        { id: 'c-1', estado: 'Pendiente' },
        { id: 'c-2', estado: 'Pagada' },
      ],
    });
    const { container } = render(<DeudaBanner socio={socioFixture} onClick={jest.fn()} />);
    await waitFor(() => expect(getEstadoFinanciero).toHaveBeenCalledWith('socio-1'));
    expect(container.firstChild).toBeNull();
  });

  test('muestra el mensaje en singular si debe una sola cuota vencida', async () => {
    getEstadoFinanciero.mockResolvedValue({ cuotas: [{ id: 'c-1', estado: 'Vencida' }] });
    render(<DeudaBanner socio={socioFixture} onClick={jest.fn()} />);
    expect(await screen.findByText('Debés 1 cuota, tocá acá para ponerte al día.')).toBeInTheDocument();
  });

  test('muestra el mensaje en plural con la cantidad de cuotas vencidas si todas están vencidas', async () => {
    getEstadoFinanciero.mockResolvedValue({
      cuotas: [
        { id: 'c-1', estado: 'Vencida' },
        { id: 'c-2', estado: 'Vencida' },
        { id: 'c-3', estado: 'Pagada' },
      ],
    });
    render(<DeudaBanner socio={socioFixture} onClick={jest.fn()} />);
    expect(await screen.findByText('Debés 2 cuotas, tocá acá para ponerte al día.')).toBeInTheDocument();
  });

  test('muestra el mensaje mixto si hay al menos una vencida y al menos una pendiente', async () => {
    getEstadoFinanciero.mockResolvedValue({
      cuotas: [
        { id: 'c-1', estado: 'Vencida' },
        { id: 'c-2', estado: 'Pendiente' },
        { id: 'c-3', estado: 'Pagada' },
      ],
    });
    render(<DeudaBanner socio={socioFixture} onClick={jest.fn()} />);
    expect(
      await screen.findByText('Tenés 2 cuotas vencidas y/o pendientes, tocá acá para ponerte al día.')
    ).toBeInTheDocument();
  });

  test('llama a onClick al tocar el banner', async () => {
    getEstadoFinanciero.mockResolvedValue({ cuotas: [{ id: 'c-1', estado: 'Vencida' }] });
    const onClick = jest.fn();
    render(<DeudaBanner socio={socioFixture} onClick={onClick} />);
    const boton = await screen.findByRole('button');
    fireEvent.click(boton);
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  test('no muestra nada si falla la carga', async () => {
    getEstadoFinanciero.mockRejectedValue(new Error('servicio-no-disponible'));
    const { container } = render(<DeudaBanner socio={socioFixture} onClick={jest.fn()} />);
    await waitFor(() => expect(getEstadoFinanciero).toHaveBeenCalled());
    expect(container.firstChild).toBeNull();
  });

  test('no crashea ni llama al servicio si socio todavía no está inicializado', () => {
    const { container } = render(<DeudaBanner socio={null} onClick={jest.fn()} />);
    expect(getEstadoFinanciero).not.toHaveBeenCalled();
    expect(container.firstChild).toBeNull();
  });

  test('en un segundo mount del mismo socio, muestra el valor cacheado sin esperar a que resuelva el fetch (evita el parpadeo al volver a Inicio)', async () => {
    getEstadoFinanciero.mockResolvedValue({ cuotas: [{ id: 'c-1', estado: 'Vencida' }] });
    const primerRender = render(<DeudaBanner socio={socioFixture} onClick={jest.fn()} />);
    expect(await screen.findByText('Debés 1 cuota, tocá acá para ponerte al día.')).toBeInTheDocument();
    primerRender.unmount();

    getEstadoFinanciero.mockImplementation(() => new Promise(() => {})); // nunca resuelve en este remount
    render(<DeudaBanner socio={socioFixture} onClick={jest.fn()} />);
    expect(screen.getByText('Debés 1 cuota, tocá acá para ponerte al día.')).toBeInTheDocument();
  });
});
