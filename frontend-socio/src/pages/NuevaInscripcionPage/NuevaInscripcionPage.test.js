import { render, screen, fireEvent } from '@testing-library/react';
import { NuevaInscripcionPage } from './NuevaInscripcionPage';
import { getDisciplinasActivas } from '../../services/disciplinasService';

jest.mock('../../services/disciplinasService', () => ({
  getDisciplinasActivas: jest.fn(),
}));

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
    render(<NuevaInscripcionPage onSalir={jest.fn()} />);
    expect(await screen.findByRole('heading', { name: 'Inscribite a una actividad' })).toBeInTheDocument();
  });

  test('lista las disciplinas activas con cupos, categoría y sede', async () => {
    getDisciplinasActivas.mockResolvedValue([DISCIPLINA]);
    render(<NuevaInscripcionPage onSalir={jest.fn()} />);
    expect(await screen.findByText('Natación')).toBeInTheDocument();
    expect(screen.getByText('5/20 cupos')).toBeInTheDocument();
    expect(screen.getByText('Infantil')).toBeInTheDocument();
    expect(screen.getByText('Sede Central')).toBeInTheDocument();
  });

  test('click en una disciplina navega al detalle con el arancel mensual', async () => {
    getDisciplinasActivas.mockResolvedValue([DISCIPLINA]);
    render(<NuevaInscripcionPage onSalir={jest.fn()} />);
    fireEvent.click(await screen.findByText('Natación'));

    expect(screen.getByRole('heading', { name: 'Natación' })).toBeInTheDocument();
    expect(screen.getByText('$ 5.000,00')).toBeInTheDocument();
  });

  test('click en "Inscribirme" abre el overlay "Próximamente"', async () => {
    getDisciplinasActivas.mockResolvedValue([DISCIPLINA]);
    render(<NuevaInscripcionPage onSalir={jest.fn()} />);
    fireEvent.click(await screen.findByText('Natación'));

    fireEvent.click(screen.getByRole('button', { name: 'Inscribirme' }));
    expect(screen.getByText('Próximamente...')).toBeInTheDocument();
  });

  test('"Volver" desde el detalle vuelve a la grilla', async () => {
    getDisciplinasActivas.mockResolvedValue([DISCIPLINA]);
    render(<NuevaInscripcionPage onSalir={jest.fn()} />);
    fireEvent.click(await screen.findByText('Natación'));

    fireEvent.click(screen.getByText('Volver'));
    expect(await screen.findByRole('heading', { name: 'Inscribite a una actividad' })).toBeInTheDocument();
  });

  test('el botón volver del banner llama a onSalir', async () => {
    getDisciplinasActivas.mockResolvedValue([]);
    const onSalir = jest.fn();
    render(<NuevaInscripcionPage onSalir={onSalir} />);
    await screen.findByRole('heading', { name: 'Inscribite a una actividad' });

    fireEvent.click(screen.getByLabelText('Volver'));
    expect(onSalir).toHaveBeenCalled();
  });
});
