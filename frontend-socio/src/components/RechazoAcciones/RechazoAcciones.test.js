import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RechazoAcciones } from './RechazoAcciones';

describe('RechazoAcciones', () => {
  test('muestra "Ir a pagar" cuando el motivo es moroso', async () => {
    const onIrAPagar = jest.fn();
    render(<RechazoAcciones motivo="moroso" onIrAPagar={onIrAPagar} onIrATramites={jest.fn()} />);
    await userEvent.click(screen.getByRole('button', { name: 'Ir a pagar' }));
    expect(onIrAPagar).toHaveBeenCalledTimes(1);
  });

  test('muestra "Ir a mis trámites" cuando el motivo es trámite', async () => {
    const onIrATramites = jest.fn();
    render(<RechazoAcciones motivo="tramite" onIrAPagar={jest.fn()} onIrATramites={onIrATramites} />);
    await userEvent.click(screen.getByRole('button', { name: 'Ir a mis trámites' }));
    expect(onIrATramites).toHaveBeenCalledTimes(1);
  });

  test('no renderiza nada si el motivo es null (incumple otro socio, no el propio)', () => {
    const { container } = render(<RechazoAcciones motivo={null} onIrAPagar={jest.fn()} onIrATramites={jest.fn()} />);
    expect(container).toBeEmptyDOMElement();
  });
});
