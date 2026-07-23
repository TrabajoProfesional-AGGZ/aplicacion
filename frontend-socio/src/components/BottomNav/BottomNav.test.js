import { render, screen, fireEvent } from '@testing-library/react';
import { BottomNav } from './BottomNav';

describe('BottomNav', () => {
  test('muestra los 5 botones de navegación', () => {
    render(<BottomNav onProximamente={jest.fn()} onInicio={jest.fn()} onReservas={jest.fn()} vistaActual="inicio" />);
    ['Inicio', 'Mis Reservas', 'Mi Carnet', 'Mis Inscripciones', 'Mis Entradas'].forEach((label) => {
      expect(screen.getByText(label)).toBeInTheDocument();
    });
  });

  test('"Inicio" está marcado como la página activa cuando vistaActual es "inicio"', () => {
    render(<BottomNav onProximamente={jest.fn()} onInicio={jest.fn()} onReservas={jest.fn()} vistaActual="inicio" />);
    expect(screen.getByText('Inicio').closest('button')).toHaveAttribute('aria-current', 'page');
  });

  test('"Inicio" no está marcado como activo en otras vistas', () => {
    render(<BottomNav onProximamente={jest.fn()} onInicio={jest.fn()} onReservas={jest.fn()} vistaActual="perfil" />);
    expect(screen.getByText('Inicio').closest('button')).not.toHaveAttribute('aria-current');
  });

  test('"Mis Reservas" está marcado como activo cuando vistaActual es "reservas"', () => {
    render(<BottomNav onProximamente={jest.fn()} onInicio={jest.fn()} onReservas={jest.fn()} vistaActual="reservas" />);
    expect(screen.getByText('Mis Reservas').closest('button')).toHaveAttribute('aria-current', 'page');
  });

  test('click en "Mis Reservas" llama a onReservas', () => {
    const onProximamente = jest.fn();
    const onReservas = jest.fn();
    render(<BottomNav onProximamente={onProximamente} onInicio={jest.fn()} onReservas={onReservas} vistaActual="inicio" />);
    fireEvent.click(screen.getByText('Mis Reservas'));
    expect(onReservas).toHaveBeenCalled();
    expect(onProximamente).not.toHaveBeenCalled();
  });

  test('click en "Mi Carnet" llama a onProximamente con su label', () => {
    const onProximamente = jest.fn();
    render(<BottomNav onProximamente={onProximamente} onInicio={jest.fn()} onReservas={jest.fn()} vistaActual="inicio" />);
    fireEvent.click(screen.getByText('Mi Carnet'));
    expect(onProximamente).toHaveBeenCalledWith('Mi Carnet');
  });

  test('click en "Inicio" llama a onInicio en vez de onProximamente', () => {
    const onProximamente = jest.fn();
    const onInicio = jest.fn();
    render(<BottomNav onProximamente={onProximamente} onInicio={onInicio} onReservas={jest.fn()} vistaActual="perfil" />);
    fireEvent.click(screen.getByText('Inicio'));
    expect(onInicio).toHaveBeenCalled();
    expect(onProximamente).not.toHaveBeenCalled();
  });

  test('"Mis Inscripciones" está marcado como activo cuando vistaActual es "inscripciones"', () => {
    render(<BottomNav onProximamente={jest.fn()} onInicio={jest.fn()} onReservas={jest.fn()} vistaActual="inscripciones" />);
    expect(screen.getByText('Mis Inscripciones').closest('button')).toHaveAttribute('aria-current', 'page');
  });

  test('click en "Mis Inscripciones" llama a onMisInscripciones en vez de onProximamente', () => {
    const onProximamente = jest.fn();
    const onMisInscripciones = jest.fn();
    render(
      <BottomNav
        onProximamente={onProximamente}
        onInicio={jest.fn()}
        onReservas={jest.fn()}
        onMisInscripciones={onMisInscripciones}
        vistaActual="inicio"
      />
    );
    fireEvent.click(screen.getByText('Mis Inscripciones'));
    expect(onMisInscripciones).toHaveBeenCalled();
    expect(onProximamente).not.toHaveBeenCalled();
  });
});
