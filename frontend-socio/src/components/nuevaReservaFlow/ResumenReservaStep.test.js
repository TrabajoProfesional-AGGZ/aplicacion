import { render, screen, fireEvent } from '@testing-library/react';
import { ResumenReservaStep } from './ResumenReservaStep';

const INSTALACION = { id: 'inst-1', nombre: 'Cancha de fútbol', valor_turno: 5000 };
const TITULAR = { id: 'socio-1', nombre: 'Ana', apellido: 'Pérez' };
const AGREGADO = { id: 'socio-2', nombre: 'Luis', apellido: 'Gómez' };

const baseProps = {
  instalacion: INSTALACION,
  fecha: '2027-01-10',
  turno: '10:00:00',
  socioTitular: TITULAR,
  sociosAgregados: [],
  onConfirmar: jest.fn(),
  onCancelar: jest.fn(),
  onVolver: jest.fn(),
  enviando: false,
  submitted: false,
  submitError: '',
};

describe('ResumenReservaStep', () => {
  test('muestra instalación, turno y valor', () => {
    render(<ResumenReservaStep {...baseProps} />);
    expect(screen.getByText('Cancha de fútbol')).toBeInTheDocument();
    expect(screen.getByText(/10:00/)).toBeInTheDocument();
    expect(screen.getByText('$ 5.000,00')).toBeInTheDocument();
  });

  test('lista al titular con su etiqueta y a los socios agregados sin ella', () => {
    render(<ResumenReservaStep {...baseProps} sociosAgregados={[AGREGADO]} />);
    expect(screen.getByText('Ana Pérez')).toBeInTheDocument();
    expect(screen.getByText('Titular')).toBeInTheDocument();
    expect(screen.getByText('Luis Gómez')).toBeInTheDocument();
  });

  test('muestra el mensaje de error mapeado sin perder el resumen', () => {
    render(<ResumenReservaStep {...baseProps} submitError="Ese turno ya no está disponible. Elegí otro horario." />);
    expect(screen.getByText('Ese turno ya no está disponible. Elegí otro horario.')).toBeInTheDocument();
    expect(screen.getByText('Cancha de fútbol')).toBeInTheDocument();
  });

  test('confirmar llama a onConfirmar', () => {
    const onConfirmar = jest.fn();
    render(<ResumenReservaStep {...baseProps} onConfirmar={onConfirmar} />);
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar' }));
    expect(onConfirmar).toHaveBeenCalled();
  });

  test('cancelar llama a onCancelar', () => {
    const onCancelar = jest.fn();
    render(<ResumenReservaStep {...baseProps} onCancelar={onCancelar} />);
    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }));
    expect(onCancelar).toHaveBeenCalled();
  });

  test('los botones se deshabilitan mientras se envía', () => {
    render(<ResumenReservaStep {...baseProps} enviando />);
    expect(screen.getByRole('button', { name: 'Confirmando...' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Cancelar' })).toBeDisabled();
  });

  test('cuando la reserva se envió con éxito muestra la pantalla de confirmación', () => {
    render(<ResumenReservaStep {...baseProps} submitted />);
    expect(screen.getByText('¡Reserva registrada!')).toBeInTheDocument();
    expect(screen.queryByText('Cancha de fútbol')).not.toBeInTheDocument();
  });

  test('cuando el error incluye socios que no cumplen los requisitos, los lista con nombre y número', () => {
    const titular = { ...TITULAR, nro_socio: '1000' };
    const agregado = { ...AGREGADO, nro_socio: '1002' };
    render(
      <ResumenReservaStep
        {...baseProps}
        socioTitular={titular}
        sociosAgregados={[agregado]}
        submitError="Los siguientes socios no estan al día con sus pagos y deben regularizar su estado para poder realizar reservas:"
        sociosIncumplen={['1002']}
      />
    );
    expect(screen.getByText('Luis Gómez (N° 1002)')).toBeInTheDocument();
  });

  test('si un socio incumplidor no está en la lista de socios de la reserva, muestra solo su número', () => {
    render(
      <ResumenReservaStep
        {...baseProps}
        submitError="Los siguientes socios no estan al día con sus pagos y deben regularizar su estado para poder realizar reservas:"
        sociosIncumplen={['9999']}
      />
    );
    expect(screen.getByText('Socio N° 9999')).toBeInTheDocument();
  });

  test('sin sociosIncumplen no muestra ningún listado adicional junto al error', () => {
    render(<ResumenReservaStep {...baseProps} submitError="Ese turno ya no está disponible. Elegí otro horario." />);
    expect(screen.queryByText(/N°/)).not.toBeInTheDocument();
  });

  test('el botón de volver llama a onVolver', () => {
    const onVolver = jest.fn();
    render(<ResumenReservaStep {...baseProps} onVolver={onVolver} />);
    fireEvent.click(screen.getByText('Volver'));
    expect(onVolver).toHaveBeenCalled();
  });
});
