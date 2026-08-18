import { render, screen, fireEvent } from '@testing-library/react';
import { PagoResultado } from './PagoResultado';

describe('PagoResultado', () => {
  test('muestra el mensaje de pago aprobado si el status es "approved"', () => {
    render(<PagoResultado status="approved" onVolver={jest.fn()} />);
    expect(screen.getByText('¡Pago aprobado!')).toBeInTheDocument();
    
    expect(screen.getByText(/Tu pago se acreditó correctamente!/i)).toBeInTheDocument();
  });

  test('muestra el mensaje de pago rechazado si el status es "rejected"', () => {
    render(<PagoResultado status="rejected" onVolver={jest.fn()} />);
    expect(screen.getByText('Pago rechazado')).toBeInTheDocument();
    expect(screen.getByText(/Tuvimos un problema al procesar tu pago/i)).toBeInTheDocument();
  });

  test('muestra el mensaje de pago pendiente si el status es "pending"', () => {
    render(<PagoResultado status="pending" onVolver={jest.fn()} />);
    expect(screen.getByText('Pago pendiente')).toBeInTheDocument();
    expect(screen.getByText(/Tu pago está en revisión o a la espera/i)).toBeInTheDocument();
  });

  test('muestra el mensaje de pago cancelado por defecto si el status es nulo o desconocido', () => {
    render(<PagoResultado status={null} onVolver={jest.fn()} />);
    expect(screen.getByText('Pago cancelado')).toBeInTheDocument();
    expect(screen.getByText(/Cancelaste el proceso de pago/i)).toBeInTheDocument();
  });

  test('el botón "Volver al inicio" dispara el callback onVolver', () => {
    const mockOnVolver = jest.fn();
    render(<PagoResultado status="approved" onVolver={mockOnVolver} />);

    const btn = screen.getByRole('button', { name: /volver al inicio/i });
    fireEvent.click(btn);

    expect(mockOnVolver).toHaveBeenCalledTimes(1);
  });
});