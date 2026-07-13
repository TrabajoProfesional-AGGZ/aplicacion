import { render, screen, fireEvent } from '@testing-library/react';
import { ProximamenteOverlay } from './ProximamenteOverlay';

describe('ProximamenteOverlay', () => {
  test('muestra el título recibido y el texto "Próximamente..."', () => {
    render(<ProximamenteOverlay titulo="Mis Reservas" onClose={jest.fn()} />);
    expect(screen.getByText('Mis Reservas')).toBeInTheDocument();
    expect(screen.getByText('Próximamente...')).toBeInTheDocument();
  });

  test('click en "Cerrar" llama a onClose', () => {
    const onClose = jest.fn();
    render(<ProximamenteOverlay titulo="Mi Carnet" onClose={onClose} />);
    fireEvent.click(screen.getByText('Cerrar'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  test('presionar Escape llama a onClose', () => {
    const onClose = jest.fn();
    render(<ProximamenteOverlay titulo="Perfil" onClose={onClose} />);
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
