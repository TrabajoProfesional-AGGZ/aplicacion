import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { InscripcionesPage } from './InscripcionesPage';
import { getDisciplinasPorSocio, darDeBajaInscripcion } from '../../services/disciplinasService';

jest.mock('../../services/disciplinasService', () => ({
  getDisciplinasPorSocio: jest.fn(),
  darDeBajaInscripcion: jest.fn(),
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

const INSCRIPCION_EN_ESPERA = {
  id: 'disc-3',
  nombre: 'Básquet',
  arancelada: true,
  monto_mensual: 3000,
  categoria_socio: { nombre: 'Activo' },
  sede: { nombre: 'Sede Central' },
  estado_suscripcion: 'en_espera',
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

  test('muestra la cantidad de inscripciones en espera en el banner', async () => {
    getDisciplinasPorSocio.mockResolvedValue([INSCRIPCION_ARANCELADA, INSCRIPCION_EN_ESPERA]);
    render(<InscripcionesPage socio={socioFixture} />);
    expect(await screen.findByLabelText('Inscripciones en espera: 1')).toBeInTheDocument();
  });

  test('el filtro "En espera" muestra solo las inscripciones en lista de espera', async () => {
    getDisciplinasPorSocio.mockResolvedValue([INSCRIPCION_ARANCELADA, INSCRIPCION_EN_ESPERA]);
    render(<InscripcionesPage socio={socioFixture} />);
    await screen.findByText('Natación');

    fireEvent.click(screen.getByRole('button', { name: 'En espera' }));

    expect(screen.queryByText('Natación')).not.toBeInTheDocument();
    expect(screen.getByText('Básquet')).toBeInTheDocument();
  });

  test('muestra un tag "En espera" en la card de una inscripción en lista de espera', async () => {
    getDisciplinasPorSocio.mockResolvedValue([INSCRIPCION_ARANCELADA, INSCRIPCION_EN_ESPERA]);
    render(<InscripcionesPage socio={socioFixture} />);
    await screen.findByText('Básquet');

    expect(screen.getByText('En espera', { selector: '.inscripcion-tag--en-espera' })).toBeInTheDocument();
  });

  test('al clickear una card se abre el detalle con el botón "Dar de Baja"', async () => {
    getDisciplinasPorSocio.mockResolvedValue([INSCRIPCION_ARANCELADA]);
    render(<InscripcionesPage socio={socioFixture} />);
    fireEvent.click(await screen.findByText('Natación'));

    expect(screen.getByRole('button', { name: 'Dar de Baja' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /volver/i })).toBeInTheDocument();
  });

  test('una inscripción en lista de espera no muestra el botón "Dar de Baja" en el detalle', async () => {
    getDisciplinasPorSocio.mockResolvedValue([INSCRIPCION_EN_ESPERA]);
    render(<InscripcionesPage socio={socioFixture} />);
    fireEvent.click(await screen.findByText('Básquet'));

    expect(screen.queryByRole('button', { name: 'Dar de Baja' })).not.toBeInTheDocument();
  });

  test('"Volver" desde el detalle vuelve a la lista', async () => {
    getDisciplinasPorSocio.mockResolvedValue([INSCRIPCION_ARANCELADA]);
    render(<InscripcionesPage socio={socioFixture} />);
    fireEvent.click(await screen.findByText('Natación'));

    fireEvent.click(screen.getByRole('button', { name: /volver/i }));

    expect(await screen.findByRole('heading', { name: 'Mis inscripciones' })).toBeInTheDocument();
  });

  test('"Dar de Baja" pide confirmación advirtiendo que no hay reintegro', async () => {
    getDisciplinasPorSocio.mockResolvedValue([INSCRIPCION_ARANCELADA]);
    render(<InscripcionesPage socio={socioFixture} />);
    fireEvent.click(await screen.findByText('Natación'));

    fireEvent.click(screen.getByRole('button', { name: 'Dar de Baja' }));

    expect(screen.getByText(/no se realizará el reintegro de la cuota paga de este mes/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sí, dar de baja/i })).toBeInTheDocument();
  });

  test('confirmar la baja llama al service y saca la inscripción de la lista', async () => {
    getDisciplinasPorSocio.mockResolvedValue([INSCRIPCION_ARANCELADA]);
    darDeBajaInscripcion.mockResolvedValue({ estado_suscripcion: 'inactiva' });
    render(<InscripcionesPage socio={socioFixture} />);
    fireEvent.click(await screen.findByText('Natación'));
    fireEvent.click(screen.getByRole('button', { name: 'Dar de Baja' }));

    fireEvent.click(screen.getByRole('button', { name: /sí, dar de baja/i }));

    await waitFor(() => expect(darDeBajaInscripcion).toHaveBeenCalledWith('disc-1', 'socio-1'));
    expect(await screen.findByRole('heading', { name: 'Mis inscripciones' })).toBeInTheDocument();
    expect(screen.queryByText('Natación')).not.toBeInTheDocument();
  });

  test('si la baja falla, muestra un error y no cierra el detalle', async () => {
    getDisciplinasPorSocio.mockResolvedValue([INSCRIPCION_ARANCELADA]);
    darDeBajaInscripcion.mockRejectedValue(new Error('servicio-no-disponible'));
    render(<InscripcionesPage socio={socioFixture} />);
    fireEvent.click(await screen.findByText('Natación'));
    fireEvent.click(screen.getByRole('button', { name: 'Dar de Baja' }));

    fireEvent.click(screen.getByRole('button', { name: /sí, dar de baja/i }));

    expect(await screen.findByText('No se pudo dar de baja la inscripción. Intentá de nuevo.')).toBeInTheDocument();
    expect(screen.getByText('Natación')).toBeInTheDocument();
  });
});
