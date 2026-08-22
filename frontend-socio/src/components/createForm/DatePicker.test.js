import { render, screen, fireEvent } from '@testing-library/react';
import { DatePicker } from './DatePicker';

describe('DatePicker', () => {
  test('clickear un día en la grilla selecciona esa fecha y cierra el popover', () => {
    const { container } = render(<DatePicker name="fecha" min="2020-01-01" max="2030-12-31" />);

    fireEvent.click(screen.getByRole('button', { name: /seleccionar fecha/i }));
    expect(screen.getByRole('dialog', { name: /elegir fecha/i })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: '15' }));

    const hiddenInput = container.querySelector('input[type="date"]');
    expect(hiddenInput.value).toMatch(/-15$/);
    expect(screen.queryByRole('dialog', { name: /elegir fecha/i })).not.toBeInTheDocument();
  });

  test('los botones de mes anterior/siguiente cambian el mes mostrado en los selects', () => {
    render(<DatePicker name="fecha" />);
    fireEvent.click(screen.getByRole('button', { name: /seleccionar fecha/i }));

    const mesSelect = screen.getByRole('combobox', { name: 'Mes' });
    const mesInicial = mesSelect.value;

    fireEvent.click(screen.getByRole('button', { name: /mes siguiente/i }));
    expect(mesSelect.value).not.toBe(mesInicial);

    fireEvent.click(screen.getByRole('button', { name: /mes anterior/i }));
    expect(mesSelect.value).toBe(mesInicial);
  });

  test('cambiar el select de mes o de año actualiza la grilla', () => {
    render(<DatePicker name="fecha" />);
    fireEvent.click(screen.getByRole('button', { name: /seleccionar fecha/i }));

    const mesSelect = screen.getByRole('combobox', { name: 'Mes' });
    fireEvent.change(mesSelect, { target: { value: '0' } });
    expect(mesSelect.value).toBe('0');

    const anioSelect = screen.getByRole('combobox', { name: 'Año' });
    const anioDestino = anioSelect.options[anioSelect.options.length - 1].value;
    fireEvent.change(anioSelect, { target: { value: anioDestino } });
    expect(anioSelect.value).toBe(anioDestino);
  });

  test('el botón "Hoy" selecciona la fecha actual', () => {
    const { container } = render(<DatePicker name="fecha" />);
    fireEvent.click(screen.getByRole('button', { name: /seleccionar fecha/i }));

    fireEvent.click(screen.getByRole('button', { name: 'Hoy' }));

    const hiddenInput = container.querySelector('input[type="date"]');
    const today = new Date();
    const isoToday = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    expect(hiddenInput.value).toBe(isoToday);
  });

  test('un día fuera del rango min/max aparece deshabilitado', () => {
    render(<DatePicker name="fecha" min="2099-01-01" max="2099-01-31" />);
    fireEvent.click(screen.getByRole('button', { name: /seleccionar fecha/i }));

    const dias = screen.getAllByRole('button').filter((b) => /^\d{1,2}$/.test(b.textContent));
    expect(dias.some((d) => d.disabled)).toBe(true);
  });

  test('reabrir el picker luego de elegir un día vuelve a mostrar la grilla', () => {
    const { container } = render(<DatePicker name="fecha" />);
    fireEvent.click(screen.getByRole('button', { name: /seleccionar fecha/i }));
    fireEvent.click(screen.getByRole('button', { name: '10' }));

    const hiddenInput = container.querySelector('input[type="date"]');
    expect(hiddenInput.value).toMatch(/-10$/);

    fireEvent.click(screen.getByRole('button', { name: /seleccionar fecha/i }));
    expect(screen.getByRole('dialog', { name: /elegir fecha/i })).toBeInTheDocument();
  });
});
