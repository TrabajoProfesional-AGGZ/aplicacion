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

  test('usa 60 minutos por defecto cuando la instalación no tiene tolerancia definida', () => {
    render(<InstalacionDetalleStep {...baseProps} />);
    expect(screen.getByText('hasta 60 min antes')).toBeInTheDocument();
  });

  test('muestra la tolerancia de cancelación real de la instalación', () => {
    render(<InstalacionDetalleStep {...baseProps} instalacion={{ ...INSTALACION, tiempo_minimo_cancelacion: 120 }} />);
    expect(screen.getByText('hasta 120 min antes')).toBeInTheDocument();
  });

  test('muestra el valor del turno', () => {
    render(<InstalacionDetalleStep {...baseProps} />);
    expect(screen.getByText('$ 5.000,00')).toBeInTheDocument();
  });

  test('cambiar la fecha llama a onFechaChange', () => {
    const onFechaChange = jest.fn();
    render(<InstalacionDetalleStep {...baseProps} onFechaChange={onFechaChange} />);
    fireEvent.change(screen.getByLabelText('Fecha'), { target: { value: '2027-01-15' } });
    expect(onFechaChange).toHaveBeenCalledWith('2027-01-15');
  });

  test('clickear el input de fecha abre el calendario nativo en vez de permitir tipear', () => {
    render(<InstalacionDetalleStep {...baseProps} />);
    const input = screen.getByLabelText('Fecha');
    input.showPicker = jest.fn();

    fireEvent.click(input);

    expect(input.showPicker).toHaveBeenCalled();
  });

  test('no permite editar la fecha con el teclado (solo vía el calendario)', () => {
    const onFechaChange = jest.fn();
    render(<InstalacionDetalleStep {...baseProps} onFechaChange={onFechaChange} />);
    const input = screen.getByLabelText('Fecha');

    const evento = fireEvent.keyDown(input, { key: '5' });

    expect(evento).toBe(false); // false === preventDefault() fue llamado
    expect(onFechaChange).not.toHaveBeenCalled();
  });

  test('permite navegar con Tab fuera del input de fecha', () => {
    render(<InstalacionDetalleStep {...baseProps} />);
    const input = screen.getByLabelText('Fecha');

    const evento = fireEvent.keyDown(input, { key: 'Tab' });

    expect(evento).toBe(true); // no se llamó preventDefault()
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
    render(<InstalacionDetalleStep {...baseProps} turnos={['08:00:00', '09:00:00']} onSeleccionarTurno={onSeleccionarTurno} />);
    expect(screen.getByText('08:00')).toBeInTheDocument();
    fireEvent.click(screen.getByText('09:00'));
    expect(onSeleccionarTurno).toHaveBeenCalledWith('09:00:00');
  });

  test('el botón de volver llama a onVolver', () => {
    const onVolver = jest.fn();
    render(<InstalacionDetalleStep {...baseProps} onVolver={onVolver} />);
    fireEvent.click(screen.getByText('Volver'));
    expect(onVolver).toHaveBeenCalled();
  });
});
