import { render, screen, fireEvent } from '@testing-library/react';
import { InscripcionesPage } from './InscripcionesPage';
import { getDisciplinasPorSocio } from '../../services/disciplinasService';

jest.mock('../../services/disciplinasService', () => ({
  getDisciplinasPorSocio: jest.fn(),
}));

const socioFixture = { id: 'socio-1' };

const INSCRIPCION_ARANCELADA = {
  id: 'disc-1',
  nombre: 'Natación',
  arancelada: true,
  monto_mensual: 5000,
  categoria_socio: { nombre: 'Infantil' },
  sede: { nombre: 'Sede Central' },
};

const INSCRIPCION_SIN_COSTO = {
  id: 'disc-2',
  nombre: 'Ajedrez',
  arancelada: false,
  monto_mensual: 0,
  categoria_socio: null,
  sede: { nombre: 'Sede Central' },
};

describe('InscripcionesPage', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test('muestra el logo animado de carga mientras llega la respuesta', () => {
    getDisciplinasPorSocio.mockReturnValue(new Promise(() => {}));
    render(<InscripcionesPage socio={socioFixture} />);
    expect(screen.getByRole('status', { name: 'Cargando' })).toBeInTheDocument();
  });

  test('muestra un mensaje de error si falla la carga', async () => {
    getDisciplinasPorSocio.mockRejectedValue(new Error('servicio-no-disponible'));
    render(<InscripcionesPage socio={socioFixture} />);
    expect(await screen.findByText('No se pudieron cargar tus inscripciones.')).toBeInTheDocument();
  });

  test('muestra un mensaje vacío cuando no hay inscripciones', async () => {
    getDisciplinasPorSocio.mockResolvedValue([]);
    render(<InscripcionesPage socio={socioFixture} />);
    expect(await screen.findByText('No tenés inscripciones en esta categoría.')).toBeInTheDocument();
  });

  test('lista las inscripciones con nombre, categoría y sede', async () => {
    getDisciplinasPorSocio.mockResolvedValue([INSCRIPCION_ARANCELADA]);
    render(<InscripcionesPage socio={socioFixture} />);
    expect(await screen.findByText('Natación')).toBeInTheDocument();
    expect(screen.getByText('Infantil')).toBeInTheDocument();
    expect(screen.getByText('Sede Central')).toBeInTheDocument();
  });

  test('muestra la cantidad de inscripciones aranceladas y sin costo en el banner', async () => {
    getDisciplinasPorSocio.mockResolvedValue([INSCRIPCION_ARANCELADA, INSCRIPCION_SIN_COSTO]);
    render(<InscripcionesPage socio={socioFixture} />);
    expect(await screen.findByLabelText('Inscripciones aranceladas: 1')).toBeInTheDocument();
    expect(screen.getByLabelText('Inscripciones sin costo: 1')).toBeInTheDocument();
  });

  test('el filtro "Aranceladas" oculta las inscripciones sin costo', async () => {
    getDisciplinasPorSocio.mockResolvedValue([INSCRIPCION_ARANCELADA, INSCRIPCION_SIN_COSTO]);
    render(<InscripcionesPage socio={socioFixture} />);
    await screen.findByText('Natación');

    fireEvent.click(screen.getByRole('button', { name: 'Aranceladas' }));

    expect(screen.getByText('Natación')).toBeInTheDocument();
    expect(screen.queryByText('Ajedrez')).not.toBeInTheDocument();
  });

  test('el botón "Nueva Inscripcion" del banner llama a onNuevaInscripcion', async () => {
    getDisciplinasPorSocio.mockResolvedValue([]);
    const onNuevaInscripcion = jest.fn();
    render(<InscripcionesPage socio={socioFixture} onNuevaInscripcion={onNuevaInscripcion} />);
    await screen.findByRole('heading', { name: 'Mis inscripciones' });

    fireEvent.click(screen.getByRole('button', { name: /nueva inscripcion/i }));
    expect(onNuevaInscripcion).toHaveBeenCalled();
  });
});
