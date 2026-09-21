import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { CertificadoVencidoBanner, __resetCachePendientesParaTests } from './CertificadoVencidoBanner';
import { getTramitesPendientes, getTramitesPorSocio } from '../../services/tramitesService';

jest.mock('../../services/tramitesService', () => ({
  getTramitesPendientes: jest.fn(),
  getTramitesPorSocio: jest.fn(),
}));

const socioFixture = { id: 'socio-1' };

describe('CertificadoVencidoBanner', () => {
  beforeEach(() => {
    getTramitesPorSocio.mockResolvedValue([]);
  });

  afterEach(() => {
    jest.clearAllMocks();
    __resetCachePendientesParaTests();
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

  test('no crashea ni llama al servicio si socio todavía no está inicializado', () => {
    const { container } = render(<CertificadoVencidoBanner socio={null} onClick={jest.fn()} />);
    expect(getTramitesPendientes).not.toHaveBeenCalled();
    expect(container.firstChild).toBeNull();
  });

  test('en un segundo mount del mismo socio, muestra el valor cacheado sin esperar a que resuelva el fetch (evita el parpadeo al volver a Inicio)', async () => {
    getTramitesPendientes.mockResolvedValue({ vencidos: [{ id: 't-1' }], por_vencer: [], total: 1 });
    const primerRender = render(<CertificadoVencidoBanner socio={socioFixture} onClick={jest.fn()} />);
    expect(await screen.findByText(/tenés un trámite vencido/i)).toBeInTheDocument();
    primerRender.unmount();

    getTramitesPendientes.mockImplementation(() => new Promise(() => {})); // nunca resuelve en este remount
    render(<CertificadoVencidoBanner socio={socioFixture} onClick={jest.fn()} />);
    expect(screen.getByText(/tenés un trámite vencido/i)).toBeInTheDocument();
  });

  test('no muestra el banner si el trámite vencido ya fue renovado con otro aprobado y vigente del mismo tipo', async () => {
    const tipo = { id: 1, nombre: 'Apto médico' };
    getTramitesPendientes.mockResolvedValue({
      vencidos: [{ id: 't-viejo', tipo_tramite: tipo }], por_vencer: [], total: 1,
    });
    getTramitesPorSocio.mockResolvedValue([
      { id: 't-viejo', tipo_tramite: tipo, estado: 'aprobado', fecha_vencimiento: '2020-01-01' },
      { id: 't-nuevo', tipo_tramite: tipo, estado: 'aprobado', fecha_vencimiento: '2099-01-01' },
    ]);
    const { container } = render(<CertificadoVencidoBanner socio={socioFixture} onClick={jest.fn()} />);
    await waitFor(() => expect(getTramitesPorSocio).toHaveBeenCalled());
    expect(container.firstChild).toBeNull();
  });

  test('sigue mostrando el banner si el aprobado vigente es de otro tipo', async () => {
    getTramitesPendientes.mockResolvedValue({
      vencidos: [{ id: 't-viejo', tipo_tramite: { id: 1 } }], por_vencer: [], total: 1,
    });
    getTramitesPorSocio.mockResolvedValue([
      { id: 't-viejo', tipo_tramite: { id: 1 }, estado: 'aprobado', fecha_vencimiento: '2020-01-01' },
      { id: 't-otro', tipo_tramite: { id: 2 }, estado: 'aprobado', fecha_vencimiento: '2099-01-01' },
    ]);
    render(<CertificadoVencidoBanner socio={socioFixture} onClick={jest.fn()} />);
    expect(await screen.findByText(/tenés un trámite vencido/i)).toBeInTheDocument();
  });

  test('un trámite en revisión del mismo tipo no cuenta como renovación', async () => {
    const tipo = { id: 1 };
    getTramitesPendientes.mockResolvedValue({
      vencidos: [{ id: 't-viejo', tipo_tramite: tipo }], por_vencer: [], total: 1,
    });
    getTramitesPorSocio.mockResolvedValue([
      { id: 't-viejo', tipo_tramite: tipo, estado: 'aprobado', fecha_vencimiento: '2020-01-01' },
      { id: 't-nuevo', tipo_tramite: tipo, estado: 'en_revision', fecha_vencimiento: null },
    ]);
    render(<CertificadoVencidoBanner socio={socioFixture} onClick={jest.fn()} />);
    expect(await screen.findByText(/tenés un trámite vencido/i)).toBeInTheDocument();
  });

  test('si falla el listado completo, muestra el aviso del backend igual', async () => {
    getTramitesPendientes.mockResolvedValue({ vencidos: [{ id: 't-1' }], por_vencer: [], total: 1 });
    getTramitesPorSocio.mockRejectedValue(new Error('servicio-no-disponible'));
    render(<CertificadoVencidoBanner socio={socioFixture} onClick={jest.fn()} />);
    expect(await screen.findByText(/tenés un trámite vencido/i)).toBeInTheDocument();
  });
});
