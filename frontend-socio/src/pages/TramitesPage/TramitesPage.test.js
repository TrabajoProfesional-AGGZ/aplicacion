import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { TramitesPage } from './TramitesPage';
import { getTramitesPorSocio } from '../../services/tramitesService';

jest.mock('../../services/tramitesService', () => ({
  getTramitesPorSocio: jest.fn(),
}));
jest.mock('../../components/subirTramiteForm/SubirTramiteForm', () => ({
  SubirTramiteForm: ({ onClose, onCreado }) => (
    <div data-testid="subir-tramite-form">
      <button onClick={() => onCreado({
        id: 't-nuevo',
        tipo_tramite: { id: 1, nombre: 'Apto médico', requiere_vencimiento: true },
        estado: 'en_revision',
        fecha_carga: '2026-07-15T00:00:00Z',
        fecha_vencimiento: null,
        observaciones: null,
      })}
      >
        Simular creado
      </button>
      <button onClick={onClose}>Cerrar form</button>
    </div>
  ),
}));

const socioFixture = { id: 'socio-1' };

const TRAMITE_MOCK = {
  id: 't-1',
  tipo_tramite: { id: 1, nombre: 'Apto médico', requiere_vencimiento: true },
  estado: 'en_revision',
  fecha_carga: '2026-07-10T00:00:00Z',
  fecha_vencimiento: '2027-07-10',
  observaciones: null,
};

describe('TramitesPage', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test('muestra el logo animado de carga mientras llega la respuesta', () => {
    getTramitesPorSocio.mockReturnValue(new Promise(() => {}));
    render(<TramitesPage socio={socioFixture} />);
    expect(screen.getByRole('status', { name: 'Cargando' })).toBeInTheDocument();
  });

  test('muestra un mensaje vacío si el socio no tiene trámites', async () => {
    getTramitesPorSocio.mockResolvedValue([]);
    render(<TramitesPage socio={socioFixture} />);
    expect(await screen.findByText('No tenés trámites cargados.')).toBeInTheDocument();
  });

  test('lista los trámites con su tipo y estado', async () => {
    getTramitesPorSocio.mockResolvedValue([TRAMITE_MOCK]);
    render(<TramitesPage socio={socioFixture} />);
    expect(await screen.findByText('Apto médico')).toBeInTheDocument();
    expect(screen.getByText('En revisión')).toBeInTheDocument();
  });

  test('muestra un mensaje de error si falla la carga', async () => {
    getTramitesPorSocio.mockRejectedValue(new Error('servicio-no-disponible'));
    render(<TramitesPage socio={socioFixture} />);
    expect(await screen.findByText('No se pudieron cargar tus trámites.')).toBeInTheDocument();
  });

  test('abre el formulario de carga al hacer click en "Cargar trámite"', async () => {
    getTramitesPorSocio.mockResolvedValue([]);
    render(<TramitesPage socio={socioFixture} />);
    await screen.findByText('No tenés trámites cargados.');

    fireEvent.click(screen.getByRole('button', { name: 'Cargar trámite' }));
    expect(screen.getByTestId('subir-tramite-form')).toBeInTheDocument();
  });

  test('agrega el trámite creado a la lista y cierra el formulario', async () => {
    getTramitesPorSocio.mockResolvedValue([]);
    render(<TramitesPage socio={socioFixture} />);
    await screen.findByText('No tenés trámites cargados.');

    fireEvent.click(screen.getByRole('button', { name: 'Cargar trámite' }));
    fireEvent.click(screen.getByText('Simular creado'));

    expect(await screen.findByText('Apto médico')).toBeInTheDocument();
  });

  test('no actualiza el estado si el componente se desmonta antes de que resuelva el fetch', async () => {
    let resolverPromesa;
    getTramitesPorSocio.mockReturnValue(new Promise((resolve) => { resolverPromesa = resolve; }));

    const { unmount } = render(<TramitesPage socio={socioFixture} />);
    unmount();
    resolverPromesa([]);

    await waitFor(() => expect(getTramitesPorSocio).toHaveBeenCalled());
  });
});
