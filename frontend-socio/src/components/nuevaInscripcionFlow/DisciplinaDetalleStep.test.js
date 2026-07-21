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

  test('deshabilita "Inscribirme" mientras enviando', () => {
    render(
      <DisciplinaDetalleStep
        disciplina={DISCIPLINA_ARANCELADA}
        onInscribirme={jest.fn()}
        onVolver={jest.fn()}
        enviando
      />
    );
    expect(screen.getByRole('button', { name: 'Inscribiendo...' })).toBeDisabled();
  });

  test('muestra el mensaje de error y el botón de trámites cuando falta el apto médico', () => {
    const onIrATramites = jest.fn();
    render(
      <DisciplinaDetalleStep
        disciplina={DISCIPLINA_ARANCELADA}
        onInscribirme={jest.fn()}
        onVolver={jest.fn()}
        submitError="Necesitás actualizar tu apto médico."
        mostrarBotonTramites
        onIrATramites={onIrATramites}
      />
    );
    expect(screen.getByRole('alert')).toHaveTextContent('Necesitás actualizar tu apto médico.');
    fireEvent.click(screen.getByRole('button', { name: 'Actualizar apto médico' }));
    expect(onIrATramites).toHaveBeenCalled();
  });

  test('sin cupo: oculta "Inscribirme" y ofrece sumarse a la lista de espera', () => {
    const onSumarseListaEspera = jest.fn();
    render(
      <DisciplinaDetalleStep
        disciplina={DISCIPLINA_ARANCELADA}
        onInscribirme={jest.fn()}
        onVolver={jest.fn()}
        sinCupo
        onSumarseListaEspera={onSumarseListaEspera}
      />
    );
    expect(screen.queryByRole('button', { name: 'Inscribirme' })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Sumarme a lista de espera' }));
    expect(onSumarseListaEspera).toHaveBeenCalled();
  });

  test('muestra la confirmación de inscripción exitosa', () => {
    render(
      <DisciplinaDetalleStep disciplina={DISCIPLINA_ARANCELADA} onInscribirme={jest.fn()} onVolver={jest.fn()} submitted />
    );
    expect(screen.getByText('¡Inscripción confirmada!')).toBeInTheDocument();
  });

  test('muestra la confirmación de lista de espera', () => {
    render(
      <DisciplinaDetalleStep disciplina={DISCIPLINA_ARANCELADA} onInscribirme={jest.fn()} onVolver={jest.fn()} enEspera />
    );
    expect(screen.getByText('¡Te sumaste a la lista de espera!')).toBeInTheDocument();
  });
});
