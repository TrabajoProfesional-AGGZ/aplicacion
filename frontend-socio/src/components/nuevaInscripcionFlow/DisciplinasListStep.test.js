import { render, screen, fireEvent } from '@testing-library/react';
import { DisciplinasListStep } from './DisciplinasListStep';

const DISCIPLINA_CON_LIMITE = {
  id: 'disc-1',
  nombre: 'Natación',
  cupo_maximo: 20,
  cupos_ocupados: 5,
  categoria_socio: { nombre: 'Infantil' },
  sede: { nombre: 'Sede Central' },
};

const DISCIPLINA_SIN_LIMITE = {
  id: 'disc-2',
  nombre: 'Ajedrez',
  cupo_maximo: null,
  cupos_ocupados: 3,
  categoria_socio: null,
  sede: { nombre: 'Sede Central' },
};

describe('DisciplinasListStep', () => {
  test('muestra el logo animado de carga', () => {
    render(<DisciplinasListStep disciplinas={[]} cargando error={false} onSeleccionar={jest.fn()} onVolver={jest.fn()} />);
    expect(screen.getByRole('status', { name: 'Cargando' })).toBeInTheDocument();
  });

  test('muestra un mensaje de error', () => {
    render(<DisciplinasListStep disciplinas={[]} cargando={false} error onSeleccionar={jest.fn()} onVolver={jest.fn()} />);
    expect(screen.getByText('No se pudieron cargar las disciplinas.')).toBeInTheDocument();
  });

  test('muestra un mensaje vacío sin disciplinas', () => {
    render(<DisciplinasListStep disciplinas={[]} cargando={false} error={false} onSeleccionar={jest.fn()} onVolver={jest.fn()} />);
    expect(screen.getByText('No hay disciplinas disponibles en este momento.')).toBeInTheDocument();
  });

  test('muestra cupos/totales, categoría y sede de cada disciplina', () => {
    render(
      <DisciplinasListStep
        disciplinas={[DISCIPLINA_CON_LIMITE]}
        cargando={false}
        error={false}
        onSeleccionar={jest.fn()}
        onVolver={jest.fn()}
      />
    );
    expect(screen.getByText('Natación')).toBeInTheDocument();
    expect(screen.getByText('5/20 cupos')).toBeInTheDocument();
    expect(screen.getByText('Infantil')).toBeInTheDocument();
    expect(screen.getByText('Sede Central')).toBeInTheDocument();
  });

  test('muestra "Sin límite" cuando cupo_maximo es null y "Todas las categorías" sin categoría', () => {
    render(
      <DisciplinasListStep
        disciplinas={[DISCIPLINA_SIN_LIMITE]}
        cargando={false}
        error={false}
        onSeleccionar={jest.fn()}
        onVolver={jest.fn()}
      />
    );
    expect(screen.getByText('3 inscriptos · Sin límite')).toBeInTheDocument();
    expect(screen.getByText('Todas las categorías')).toBeInTheDocument();
  });

  test('click en una disciplina llama a onSeleccionar con esa disciplina', () => {
    const onSeleccionar = jest.fn();
    render(
      <DisciplinasListStep
        disciplinas={[DISCIPLINA_CON_LIMITE]}
        cargando={false}
        error={false}
        onSeleccionar={onSeleccionar}
        onVolver={jest.fn()}
      />
    );
    fireEvent.click(screen.getByText('Natación'));
    expect(onSeleccionar).toHaveBeenCalledWith(DISCIPLINA_CON_LIMITE);
  });

  test('click en el botón de volver llama a onVolver', () => {
    const onVolver = jest.fn();
    render(<DisciplinasListStep disciplinas={[]} cargando={false} error={false} onSeleccionar={jest.fn()} onVolver={onVolver} />);
    fireEvent.click(screen.getByLabelText('Volver'));
    expect(onVolver).toHaveBeenCalled();
  });
});
