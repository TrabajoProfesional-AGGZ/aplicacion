import { render, screen, fireEvent } from '@testing-library/react';
import { InstalacionDetalleStep } from './InstalacionDetalleStep';

const INSTALACION = {
  id: 'inst-1',
  nombre: 'Cancha de fútbol',
  tipo: 'Deportiva',
  capacidad_maxima: 10,
  valor_turno: 5000,
  duracion_turno: 60,
  tiempo_minimo_cancelacion: null,
};

const baseProps = {
  instalacion: INSTALACION,
  fecha: '2027-01-10',
  onFechaChange: jest.fn(),
  turnos: [],
  cargandoTurnos: false,
  errorTurnos: '',
  onSeleccionarTurno: jest.fn(),
  onVolver: jest.fn(),
};

describe('InstalacionDetalleStep', () => {
  test('muestra el nombre, tipo y capacidad de la instalación', () => {
    render(<InstalacionDetalleStep {...baseProps} />);
    expect(screen.getByText('Cancha de fútbol')).toBeInTheDocument();
    expect(screen.getByText('Deportiva · 10 personas')).toBeInTheDocument();
  });

  test.each([
    ['usa 60 minutos por defecto cuando la instalación no tiene tolerancia definida', {}, 'hasta 60 min antes'],
    [
      'muestra la tolerancia de cancelación real de la instalación',
      { instalacion: { ...INSTALACION, tiempo_minimo_cancelacion: 120 } },
      'hasta 120 min antes',
    ],
    ['muestra el valor del turno', {}, '$ 5.000,00'],
  ])('%s', (_descripcion, propsOverride, textoEsperado) => {
    render(<InstalacionDetalleStep {...baseProps} {...propsOverride} />);
    expect(screen.getByText(textoEsperado)).toBeInTheDocument();
  });

  test('cambiar la fecha llama a onFechaChange', () => {
    const onFechaChange = jest.fn();
    render(<InstalacionDetalleStep {...baseProps} onFechaChange={onFechaChange} />);
    fireEvent.change(screen.getByLabelText('Fecha'), { target: { value: '2027-01-15' } });
    expect(onFechaChange).toHaveBeenCalledWith('2027-01-15');
  });

  test('clickear el selector de fecha abre el calendario custom (mismo estilo que WebApp)', () => {
    render(<InstalacionDetalleStep {...baseProps} />);
    fireEvent.click(screen.getByRole('button', { name: /10 de enero de 2027/i }));
    expect(screen.getByRole('dialog', { name: /elegir fecha/i })).toBeInTheDocument();
  });

  test('elegir un día en el calendario llama a onFechaChange y cierra el popover', () => {
    const onFechaChange = jest.fn();
    render(<InstalacionDetalleStep {...baseProps} onFechaChange={onFechaChange} />);
    fireEvent.click(screen.getByRole('button', { name: /10 de enero de 2027/i }));

    fireEvent.click(screen.getByRole('button', { name: '15' }));

    expect(onFechaChange).toHaveBeenCalledWith('2027-01-15');
    expect(screen.queryByRole('dialog', { name: /elegir fecha/i })).not.toBeInTheDocument();
  });

  test('muestra un esqueleto de carga mientras llegan los turnos', () => {
    render(<InstalacionDetalleStep {...baseProps} cargandoTurnos />);
    expect(screen.getByLabelText('Cargando turnos')).toBeInTheDocument();
  });

  test('muestra un error si fallan los turnos', () => {
    render(<InstalacionDetalleStep {...baseProps} errorTurnos="No se pudieron cargar los turnos disponibles." />);
    expect(screen.getByText('No se pudieron cargar los turnos disponibles.')).toBeInTheDocument();
  });

  test('muestra un mensaje vacío cuando no hay turnos para la fecha elegida', () => {
    render(<InstalacionDetalleStep {...baseProps} />);
    expect(screen.getByText('No hay turnos disponibles para esta fecha.')).toBeInTheDocument();
  });

  test('lista los turnos disponibles y permite seleccionar uno', () => {
    const onSeleccionarTurno = jest.fn();
    const turnos = [
      { hora_inicio: '08:00:00', cupos_disponibles: 10 },
      { hora_inicio: '09:00:00', cupos_disponibles: 3 },
    ];
    render(<InstalacionDetalleStep {...baseProps} turnos={turnos} onSeleccionarTurno={onSeleccionarTurno} />);
    expect(screen.getByText('08:00')).toBeInTheDocument();
    fireEvent.click(screen.getByText('09:00'));
    expect(onSeleccionarTurno).toHaveBeenCalledWith(turnos[1]);
  });

  test('muestra los cupos disponibles de cada turno', () => {
    const turnos = [{ hora_inicio: '08:00:00', cupos_disponibles: 3 }];
    render(<InstalacionDetalleStep {...baseProps} turnos={turnos} />);
    expect(screen.getByText('3/10 lugares')).toBeInTheDocument();
  });

  test('el botón de volver llama a onVolver', () => {
    const onVolver = jest.fn();
    render(<InstalacionDetalleStep {...baseProps} onVolver={onVolver} />);
    fireEvent.click(screen.getByText('Volver'));
    expect(onVolver).toHaveBeenCalled();
  });
});
