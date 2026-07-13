import { render, screen, fireEvent } from '@testing-library/react';
import { BottomNav } from './BottomNav';

describe('BottomNav', () => {
  test('muestra los 5 botones de navegación', () => {
    render(<BottomNav onProximamente={jest.fn()} />);
    ['Inicio', 'Mis Reservas', 'Mi Carnet', 'Mis Inscripciones', 'Noticias del Club'].forEach((label) => {
      expect(screen.getByText(label)).toBeInTheDocument();
    });
  });

  test('"Inicio" está marcado como la página activa', () => {
    render(<BottomNav onProximamente={jest.fn()} />);
    expect(screen.getByText('Inicio').closest('button')).toHaveAttribute('aria-current', 'page');
  });

  test('click en "Mis Reservas" llama a onProximamente con su label', () => {
    const onProximamente = jest.fn();
    render(<BottomNav onProximamente={onProximamente} />);
    fireEvent.click(screen.getByText('Mis Reservas'));
    expect(onProximamente).toHaveBeenCalledWith('Mis Reservas');
  });

  test('click en "Inicio" no llama a onProximamente', () => {
    const onProximamente = jest.fn();
    render(<BottomNav onProximamente={onProximamente} />);
    fireEvent.click(screen.getByText('Inicio'));
    expect(onProximamente).not.toHaveBeenCalled();
  });
});
