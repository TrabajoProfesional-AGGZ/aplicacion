import { render, screen, fireEvent, within } from '@testing-library/react';
import { StyledSelect } from './FormFields';

// Portado de WebApp/src/components/createForm/FormFields.test.js (bloque
// StyledSelect) — mismo componente, mismo comportamiento esperado.
describe('StyledSelect', () => {
  function renderSelect(props = {}) {
    return render(
      <StyledSelect aria-label="Categoría" {...props}>
        <option value="">Seleccionar...</option>
        <option value="a">Opción A</option>
        <option value="b">Opción B</option>
      </StyledSelect>
    );
  }

  test('clickear una opción del listbox la selecciona y cierra el popover', () => {
    const { container } = renderSelect();
    fireEvent.click(screen.getByRole('button', { name: /seleccionar/i }));
    fireEvent.click(within(screen.getByRole('listbox')).getByRole('option', { name: 'Opción B' }));

    const hiddenSelect = container.querySelector('select');
    expect(hiddenSelect.value).toBe('b');
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  test('pasar el mouse por una opción la resalta', () => {
    renderSelect();
    fireEvent.click(screen.getByRole('button', { name: /seleccionar/i }));
    const opcionA = within(screen.getByRole('listbox')).getByRole('option', { name: 'Opción A' });

    fireEvent.mouseEnter(opcionA);

    expect(opcionA.className).toMatch(/highlighted/);
  });

  test('clickear una opción deshabilitada no selecciona nada', () => {
    const { container } = render(
      <StyledSelect aria-label="Categoría">
        <option value="">Seleccionar...</option>
        <option value="a" disabled>Opción A</option>
      </StyledSelect>
    );
    fireEvent.click(screen.getByRole('button', { name: /seleccionar/i }));
    fireEvent.click(within(screen.getByRole('listbox')).getByRole('option', { name: 'Opción A' }));

    const hiddenSelect = container.querySelector('select');
    expect(hiddenSelect.value).toBe('');
    expect(screen.getByRole('listbox')).toBeInTheDocument();
  });

  test('flecha abajo con el trigger cerrado lo abre', () => {
    renderSelect();
    const trigger = screen.getByRole('button', { name: /seleccionar/i });

    fireEvent.keyDown(trigger, { key: 'ArrowDown' });

    expect(screen.getByRole('listbox')).toBeInTheDocument();
  });

  test('flecha abajo/arriba recorren las opciones y Enter confirma la resaltada', () => {
    const { container } = renderSelect();
    const trigger = screen.getByRole('button', { name: /seleccionar/i });
    fireEvent.click(trigger);

    fireEvent.keyDown(trigger, { key: 'ArrowDown' });
    fireEvent.keyDown(trigger, { key: 'ArrowDown' });
    fireEvent.keyDown(trigger, { key: 'ArrowUp' });
    fireEvent.keyDown(trigger, { key: 'Enter' });

    const hiddenSelect = container.querySelector('select');
    expect(hiddenSelect.value).toBe('a');
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  test('flecha arriba no baja el índice resaltado por debajo de cero', () => {
    renderSelect();
    const trigger = screen.getByRole('button', { name: /seleccionar/i });
    fireEvent.click(trigger);

    fireEvent.keyDown(trigger, { key: 'ArrowUp' });
    fireEvent.keyDown(trigger, { key: ' ' });

    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  test('reabrir el select con un valor ya elegido resalta esa opción', () => {
    const { container } = renderSelect();
    const trigger = screen.getByRole('button', { name: /seleccionar/i });
    fireEvent.click(trigger);
    fireEvent.click(within(screen.getByRole('listbox')).getByRole('option', { name: 'Opción B' }));

    fireEvent.click(container.querySelector('.csf-dropdown-trigger'));

    expect(within(screen.getByRole('listbox')).getByRole('option', { name: 'Opción B' }))
      .toHaveClass('csf-dropdown-option--highlighted');
  });
});
