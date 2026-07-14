import { render, screen, fireEvent } from '@testing-library/react';
import { BottomNav } from './BottomNav';

describe('BottomNav', () => {
  test('muestra los 5 botones de navegación', () => {
    render(<BottomNav onProximamente={jest.fn()} onInicio={jest.fn()} vistaActual="inicio" />);
    ['Inicio', 'Mis Reservas', 'Mi Carnet', 'Mis Inscripciones', 'Noticias del Club'].forEach((label) => {
      expect(screen.getByText(label)).toBeInTheDocument();
    });
  });

  test('"Inicio" está marcado como la página activa cuando vistaActual es "inicio"', () => {
    render(<BottomNav onProximamente={jest.fn()} onInicio={jest.fn()} vistaActual="inicio" />);
    expect(screen.getByText('Inicio').closest('button')).toHaveAttribute('aria-current', 'page');
  });

  test('"Inicio" no está marcado como activo en otras vistas', () => {
    render(<BottomNav onProximamente={jest.fn()} onInicio={jest.fn()} vistaActual="perfil" />);
    expect(screen.getByText('Inicio').closest('button')).not.toHaveAttribute('aria-current');
  });

  test('click en "Mis Reservas" llama a onProximamente con su label', () => {
    const onProximamente = jest.fn();
    render(<BottomNav onProximamente={onProximamente} onInicio={jest.fn()} vistaActual="inicio" />);
    fireEvent.click(screen.getByText('Mis Reservas'));
    expect(onProximamente).toHaveBeenCalledWith('Mis Reservas');
  });

  test('click en "Inicio" llama a onInicio en vez de onProximamente', () => {
    const onProximamente = jest.fn();
    const onInicio = jest.fn();
    render(<BottomNav onProximamente={onProximamente} onInicio={onInicio} vistaActual="perfil" />);
    fireEvent.click(screen.getByText('Inicio'));
    expect(onInicio).toHaveBeenCalled();
    expect(onProximamente).not.toHaveBeenCalled();
  });
});
