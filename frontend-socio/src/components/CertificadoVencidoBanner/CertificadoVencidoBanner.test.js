import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { CertificadoVencidoBanner } from './CertificadoVencidoBanner';
import { getTramitesPendientes } from '../../services/tramitesService';

jest.mock('../../services/tramitesService', () => ({
  getTramitesPendientes: jest.fn(),
}));

const socioFixture = { id: 'socio-1' };

describe('CertificadoVencidoBanner', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test('no muestra nada mientras no hay trámites vencidos ni por vencer', async () => {
    getTramitesPendientes.mockResolvedValue({ vencidos: [], por_vencer: [], total: 0 });
    const { container } = render(<CertificadoVencidoBanner socio={socioFixture} onClick={jest.fn()} />);
    await waitFor(() => expect(getTramitesPendientes).toHaveBeenCalledWith('socio-1'));
    expect(container.firstChild).toBeNull();
  });

  test('muestra el banner de peligro si hay trámites vencidos', async () => {
    getTramitesPendientes.mockResolvedValue({ vencidos: [{ id: 't-1' }], por_vencer: [], total: 1 });
    render(<CertificadoVencidoBanner socio={socioFixture} onClick={jest.fn()} />);
    expect(await screen.findByText(/tenés un trámite vencido/i)).toBeInTheDocument();
  });

  test('muestra el banner de advertencia si hay trámites por vencer (sin vencidos)', async () => {
    getTramitesPendientes.mockResolvedValue({ vencidos: [], por_vencer: [{ id: 't-2' }], total: 1 });
    render(<CertificadoVencidoBanner socio={socioFixture} onClick={jest.fn()} />);
    expect(await screen.findByText(/tenés un trámite por vencer pronto/i)).toBeInTheDocument();
  });

  test('prioriza vencidos sobre por_vencer cuando hay ambos', async () => {
    getTramitesPendientes.mockResolvedValue({ vencidos: [{ id: 't-1' }], por_vencer: [{ id: 't-2' }], total: 2 });
    render(<CertificadoVencidoBanner socio={socioFixture} onClick={jest.fn()} />);
    expect(await screen.findByText(/tenés un trámite vencido/i)).toBeInTheDocument();
  });

  test('llama a onClick al hacer click en el banner', async () => {
    getTramitesPendientes.mockResolvedValue({ vencidos: [{ id: 't-1' }], por_vencer: [], total: 1 });
    const onClick = jest.fn();
    render(<CertificadoVencidoBanner socio={socioFixture} onClick={onClick} />);
    const boton = await screen.findByRole('button');
    fireEvent.click(boton);
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  test('no muestra nada si falla la carga', async () => {
    getTramitesPendientes.mockRejectedValue(new Error('servicio-no-disponible'));
    const { container } = render(<CertificadoVencidoBanner socio={socioFixture} onClick={jest.fn()} />);
    await waitFor(() => expect(getTramitesPendientes).toHaveBeenCalled());
    expect(container.firstChild).toBeNull();
  });
});
