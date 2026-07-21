import { render, screen, fireEvent } from '@testing-library/react';
import { NuevaInscripcionPage } from './NuevaInscripcionPage';
import {
  getDisciplinasActivas,
  inscribirseADisciplina,
  sumarseAListaEspera,
} from '../../services/disciplinasService';

jest.mock('../../services/disciplinasService', () => ({
  getDisciplinasActivas: jest.fn(),
  inscribirseADisciplina: jest.fn(),
  sumarseAListaEspera: jest.fn(),
}));

const SOCIO = { id: 'socio-1', nombre: 'Ana', apellido: 'Gómez' };

const DISCIPLINA = {
  id: 'disc-1',
  nombre: 'Natación',
  cupo_maximo: 20,
  cupos_ocupados: 5,
  arancelada: true,
  monto_mensual: 5000,
  categoria_socio: { nombre: 'Infantil' },
  sede: { nombre: 'Sede Central' },
};

describe('NuevaInscripcionPage', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test('muestra el banner de la grilla de disciplinas', async () => {
    getDisciplinasActivas.mockResolvedValue([]);
    render(<NuevaInscripcionPage socio={SOCIO} onSalir={jest.fn()} />);
    expect(await screen.findByRole('heading', { name: 'Inscribite a una actividad' })).toBeInTheDocument();
  });

  test('lista las disciplinas activas con cupos, categoría y sede', async () => {
    getDisciplinasActivas.mockResolvedValue([DISCIPLINA]);
    render(<NuevaInscripcionPage socio={SOCIO} onSalir={jest.fn()} />);
    expect(await screen.findByText('Natación')).toBeInTheDocument();
    expect(screen.getByText('5/20 cupos')).toBeInTheDocument();
    expect(screen.getByText('Infantil')).toBeInTheDocument();
    expect(screen.getByText('Sede Central')).toBeInTheDocument();
  });

  test('click en una disciplina navega al detalle con el arancel mensual', async () => {
    getDisciplinasActivas.mockResolvedValue([DISCIPLINA]);
    render(<NuevaInscripcionPage socio={SOCIO} onSalir={jest.fn()} />);
    fireEvent.click(await screen.findByText('Natación'));

    expect(screen.getByRole('heading', { name: 'Natación' })).toBeInTheDocument();
    expect(screen.getByText('$ 5.000,00')).toBeInTheDocument();
  });

  test('click en "Inscribirme" con éxito muestra la confirmación', async () => {
    getDisciplinasActivas.mockResolvedValue([DISCIPLINA]);
    inscribirseADisciplina.mockResolvedValue({ estado_suscripcion: 'activa' });
    render(<NuevaInscripcionPage socio={SOCIO} onSalir={jest.fn()} />);
    fireEvent.click(await screen.findByText('Natación'));

    fireEvent.click(screen.getByRole('button', { name: 'Inscribirme' }));

    expect(await screen.findByText('¡Inscripción confirmada!')).toBeInTheDocument();
    expect(inscribirseADisciplina).toHaveBeenCalledWith('disc-1', 'socio-1');
  });

  test('muestra el error de apto médico y ofrece ir a trámites', async () => {
    getDisciplinasActivas.mockResolvedValue([DISCIPLINA]);
    inscribirseADisciplina.mockRejectedValue(new Error('apto-medico'));
    const onIrATramites = jest.fn();
    render(<NuevaInscripcionPage socio={SOCIO} onSalir={jest.fn()} onIrATramites={onIrATramites} />);
    fireEvent.click(await screen.findByText('Natación'));

    fireEvent.click(screen.getByRole('button', { name: 'Inscribirme' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(/apto médico/);
    fireEvent.click(screen.getByRole('button', { name: 'Actualizar apto médico' }));
    expect(onIrATramites).toHaveBeenCalled();
  });

  test('muestra el error de deuda (moroso)', async () => {
    getDisciplinasActivas.mockResolvedValue([DISCIPLINA]);
    inscribirseADisciplina.mockRejectedValue(new Error('moroso'));
    render(<NuevaInscripcionPage socio={SOCIO} onSalir={jest.fn()} />);
    fireEvent.click(await screen.findByText('Natación'));

    fireEvent.click(screen.getByRole('button', { name: 'Inscribirme' }));

    expect(await screen.findByText(/Tenés pagos pendientes/)).toBeInTheDocument();
  });

  test('cuando no hay cupo, ofrece sumarse a la lista de espera', async () => {
    getDisciplinasActivas.mockResolvedValue([DISCIPLINA]);
    inscribirseADisciplina.mockRejectedValue(new Error('sin-cupo'));
    sumarseAListaEspera.mockResolvedValue({ estado_suscripcion: 'en_espera' });
    render(<NuevaInscripcionPage socio={SOCIO} onSalir={jest.fn()} />);
    fireEvent.click(await screen.findByText('Natación'));

    fireEvent.click(screen.getByRole('button', { name: 'Inscribirme' }));

    const botonEspera = await screen.findByRole('button', { name: 'Sumarme a lista de espera' });
    fireEvent.click(botonEspera);

    expect(await screen.findByText('¡Te sumaste a la lista de espera!')).toBeInTheDocument();
    expect(sumarseAListaEspera).toHaveBeenCalledWith('disc-1', 'socio-1');
  });

  test('"Volver" desde el detalle vuelve a la grilla', async () => {
    getDisciplinasActivas.mockResolvedValue([DISCIPLINA]);
    render(<NuevaInscripcionPage socio={SOCIO} onSalir={jest.fn()} />);
    fireEvent.click(await screen.findByText('Natación'));

    fireEvent.click(screen.getByText('Volver'));
    expect(await screen.findByRole('heading', { name: 'Inscribite a una actividad' })).toBeInTheDocument();
  });

  test('el botón volver del banner llama a onSalir', async () => {
    getDisciplinasActivas.mockResolvedValue([]);
    const onSalir = jest.fn();
    render(<NuevaInscripcionPage socio={SOCIO} onSalir={onSalir} />);
    await screen.findByRole('heading', { name: 'Inscribite a una actividad' });

    fireEvent.click(screen.getByLabelText('Volver'));
    expect(onSalir).toHaveBeenCalled();
  });
});
