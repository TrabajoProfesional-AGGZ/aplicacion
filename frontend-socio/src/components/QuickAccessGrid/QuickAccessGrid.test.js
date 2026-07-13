import { render, screen, fireEvent } from '@testing-library/react';
import { QuickAccessGrid } from './QuickAccessGrid';

describe('QuickAccessGrid', () => {
  test('muestra las 4 tarjetas de acceso rápido con sus títulos', () => {
    render(<QuickAccessGrid onProximamente={jest.fn()} />);
    expect(screen.getByText('Cuotas y pagos')).toBeInTheDocument();
    expect(screen.getByText('Reservar instalación')).toBeInTheDocument();
    expect(screen.getByText('Inscribirme a actividad')).toBeInTheDocument();
    expect(screen.getByText('Última noticia')).toBeInTheDocument();
  });

  test('click en una tarjeta llama a onProximamente con su título', () => {
    const onProximamente = jest.fn();
    render(<QuickAccessGrid onProximamente={onProximamente} />);
    fireEvent.click(screen.getByText('Cuotas y pagos'));
    expect(onProximamente).toHaveBeenCalledWith('Cuotas y pagos');
  });
});
