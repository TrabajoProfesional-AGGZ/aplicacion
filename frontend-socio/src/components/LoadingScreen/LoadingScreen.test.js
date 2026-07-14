import { render, screen } from '@testing-library/react';
import { LoadingScreen } from './LoadingScreen';

describe('LoadingScreen', () => {
  test('renderiza la imagen del logo', () => {
    render(<LoadingScreen />);
    expect(screen.getByAltText('SocioUnido')).toBeInTheDocument();
  });

  test('aplica la clase loading-logo a la imagen', () => {
    render(<LoadingScreen />);
    expect(screen.getByAltText('SocioUnido')).toHaveClass('loading-logo');
  });

  test('expone role status con aria-label para lectores de pantalla', () => {
    render(<LoadingScreen />);
    expect(screen.getByRole('status')).toHaveAccessibleName('Cargando');
  });
});
