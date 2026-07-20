import { render, screen, fireEvent } from '@testing-library/react';
import { InstalacionesListStep } from './InstalacionesListStep';

const INSTALACIONES = [
  { id: 'inst-1', nombre: 'Cancha de fútbol', tipo: 'Deportiva', capacidad_maxima: 10, valor_turno: 5000 },
  { id: 'inst-2', nombre: 'Quincho', tipo: 'Social', capacidad_maxima: 20, valor_turno: 8000 },
];

describe('InstalacionesListStep', () => {
  test('muestra el logo animado de carga mientras cargan las instalaciones', () => {
    render(<InstalacionesListStep instalaciones={[]} cargando error={false} onSeleccionar={jest.fn()} onVolver={jest.fn()} />);
    expect(screen.getByRole('status', { name: 'Cargando' })).toBeInTheDocument();
  });

  test('muestra un mensaje de error si falla la carga', () => {
    render(<InstalacionesListStep instalaciones={[]} cargando={false} error onSeleccionar={jest.fn()} onVolver={jest.fn()} />);
    expect(screen.getByText('No se pudieron cargar las instalaciones.')).toBeInTheDocument();
  });

  test('muestra un mensaje vacío cuando no hay instalaciones', () => {
    render(<InstalacionesListStep instalaciones={[]} cargando={false} error={false} onSeleccionar={jest.fn()} onVolver={jest.fn()} />);
    expect(screen.getByText('No hay instalaciones disponibles en este momento.')).toBeInTheDocument();
  });

  test('lista cada instalación con nombre, capacidad y precio', () => {
    render(<InstalacionesListStep instalaciones={INSTALACIONES} cargando={false} error={false} onSeleccionar={jest.fn()} onVolver={jest.fn()} />);
    expect(screen.getByText('Cancha de fútbol')).toBeInTheDocument();
    expect(screen.getByText('10 personas')).toBeInTheDocument();
    expect(screen.getByText('$ 5.000,00')).toBeInTheDocument();
    expect(screen.getByText('Quincho')).toBeInTheDocument();
  });

  test('al hacer click en una instalación llama a onSeleccionar con esa instalación', () => {
    const onSeleccionar = jest.fn();
    render(<InstalacionesListStep instalaciones={INSTALACIONES} cargando={false} error={false} onSeleccionar={onSeleccionar} onVolver={jest.fn()} />);
    fireEvent.click(screen.getByText('Cancha de fútbol'));
    expect(onSeleccionar).toHaveBeenCalledWith(INSTALACIONES[0]);
  });

  test('el botón de volver llama a onVolver', () => {
    const onVolver = jest.fn();
    render(<InstalacionesListStep instalaciones={[]} cargando={false} error={false} onSeleccionar={jest.fn()} onVolver={onVolver} />);
    fireEvent.click(screen.getByLabelText('Volver'));
    expect(onVolver).toHaveBeenCalled();
  });
});
