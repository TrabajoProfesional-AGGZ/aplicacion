import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { VolverAlFlujoBanner } from './VolverAlFlujoBanner';
import { guardarProgreso } from '../../services/progresoRechazadoService';

const socio = { id: 'socio-1' };

describe('VolverAlFlujoBanner', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  test('no renderiza nada si no hay progreso guardado', () => {
    const { container } = render(<VolverAlFlujoBanner socio={socio} onVolver={jest.fn()} />);
    expect(container).toBeEmptyDOMElement();
  });

  test('muestra el botón "Volver a la reserva" si hay progreso de una reserva', () => {
    guardarProgreso('reserva', 'socio-1', { instalacion: { id: 1 } });
    render(<VolverAlFlujoBanner socio={socio} onVolver={jest.fn()} />);
    expect(screen.getByRole('button', { name: /Volver a la reserva/ })).toBeInTheDocument();
  });

  test('al tocarlo llama a onVolver con el progreso guardado', async () => {
    guardarProgreso('inscripcion', 'socio-1', { disciplina: { id: 2 } });
    const onVolver = jest.fn();
    render(<VolverAlFlujoBanner socio={socio} onVolver={onVolver} />);
    await userEvent.click(screen.getByRole('button', { name: /Volver a la inscripción/ }));
    expect(onVolver).toHaveBeenCalledWith(expect.objectContaining({ tipo: 'inscripcion', datos: { disciplina: { id: 2 } } }));
  });

  test('se oculta solo al expirar', () => {
    jest.useFakeTimers();
    guardarProgreso('entrada', 'socio-1', { evento: { id: 3 } });
    render(<VolverAlFlujoBanner socio={socio} onVolver={jest.fn()} />);
    expect(screen.getByRole('button', { name: /Volver a la entrada/ })).toBeInTheDocument();

    act(() => {
      jest.advanceTimersByTime(5 * 60 * 1000 + 1000);
    });

    expect(screen.queryByRole('button', { name: /Volver a la entrada/ })).not.toBeInTheDocument();
    jest.useRealTimers();
  });
});
