import { render, screen, fireEvent } from '@testing-library/react';
import { DisciplinaDetalleStep } from './DisciplinaDetalleStep';

const DISCIPLINA_ARANCELADA = {
  id: 'disc-1',
  nombre: 'Natación',
  cupo_maximo: 20,
  cupos_ocupados: 5,
  arancelada: true,
  monto_mensual: 5000,
  categoria_socio: { nombre: 'Infantil' },
  sede: { nombre: 'Sede Central' },
};

const DISCIPLINA_SIN_COSTO = {
  ...DISCIPLINA_ARANCELADA,
  id: 'disc-2',
  nombre: 'Ajedrez',
  arancelada: false,
  cupo_maximo: null,
  categoria_socio: null,
};

describe('DisciplinaDetalleStep', () => {
  test('muestra nombre, cupos, categoría, sede y arancel mensual', () => {
    render(<DisciplinaDetalleStep disciplina={DISCIPLINA_ARANCELADA} onInscribirme={jest.fn()} onVolver={jest.fn()} />);
    expect(screen.getByRole('heading', { name: 'Natación' })).toBeInTheDocument();
    expect(screen.getByText('5/20')).toBeInTheDocument();
    expect(screen.getByText('Infantil')).toBeInTheDocument();
    expect(screen.getByText('Sede Central')).toBeInTheDocument();
    expect(screen.getByText('$ 5.000,00')).toBeInTheDocument();
  });

  test('muestra "Sin costo" cuando la disciplina no es arancelada', () => {
    render(<DisciplinaDetalleStep disciplina={DISCIPLINA_SIN_COSTO} onInscribirme={jest.fn()} onVolver={jest.fn()} />);
    expect(screen.getByText('Sin costo')).toBeInTheDocument();
    expect(screen.getByText('5 inscriptos')).toBeInTheDocument();
    expect(screen.getByText('Todas')).toBeInTheDocument();
  });

  test('click en "Inscribirme" llama a onInscribirme', () => {
    const onInscribirme = jest.fn();
    render(<DisciplinaDetalleStep disciplina={DISCIPLINA_ARANCELADA} onInscribirme={onInscribirme} onVolver={jest.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: 'Inscribirme' }));
    expect(onInscribirme).toHaveBeenCalled();
  });

  test('click en "Volver" llama a onVolver', () => {
    const onVolver = jest.fn();
    render(<DisciplinaDetalleStep disciplina={DISCIPLINA_ARANCELADA} onInscribirme={jest.fn()} onVolver={onVolver} />);
    fireEvent.click(screen.getByText('Volver'));
    expect(onVolver).toHaveBeenCalled();
  });
});
