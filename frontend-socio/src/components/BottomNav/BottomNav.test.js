import { render, screen, fireEvent } from '@testing-library/react';
import { BottomNav } from './BottomNav';

describe('BottomNav', () => {
  test('muestra los 5 botones de navegación', () => {
    render(<BottomNav onInicio={jest.fn()} onReservas={jest.fn()} vistaActual="inicio" />);
    ['Inicio', 'Reservas', 'Carnet', 'Inscripciones', 'Entradas'].forEach((label) => {
      expect(screen.getByText(label)).toBeInTheDocument();
    });
  });

  test('"Inicio" está marcado como la página activa cuando vistaActual es "inicio"', () => {
    render(<BottomNav onInicio={jest.fn()} onReservas={jest.fn()} vistaActual="inicio" />);
    expect(screen.getByText('Inicio').closest('button')).toHaveAttribute('aria-current', 'page');
  });

  test('"Inicio" no está marcado como activo en otras vistas', () => {
    render(<BottomNav onInicio={jest.fn()} onReservas={jest.fn()} vistaActual="perfil" />);
    expect(screen.getByText('Inicio').closest('button')).not.toHaveAttribute('aria-current');
  });

  test('"Mis Reservas" está marcado como activo cuando vistaActual es "reservas"', () => {
    render(<BottomNav onInicio={jest.fn()} onReservas={jest.fn()} vistaActual="reservas" />);
    expect(screen.getByText('Reservas').closest('button')).toHaveAttribute('aria-current', 'page');
  });

  test('click en "Mis Reservas" llama a onReservas', () => {
    const onReservas = jest.fn();
    render(<BottomNav onInicio={jest.fn()} onReservas={onReservas} vistaActual="inicio" />);
    fireEvent.click(screen.getByText('Reservas'));
    expect(onReservas).toHaveBeenCalled();
  });

  test('click en "Mi Carnet" llama a onCarnet', () => {
    const onCarnet = jest.fn(); // Asegurate de que este prop coincida con el que usás en BottomNav.jsx
    
    render(
      <BottomNav 
        
        onInicio={jest.fn()} 
        onReservas={jest.fn()} 
        onCarnet={onCarnet} 
        vistaActual="inicio" 
      />
    );
    
    fireEvent.click(screen.getByText('Carnet'));
    expect(onCarnet).toHaveBeenCalled();
  });

  test('click en "Inicio" llama a onInicio', () => {
    const onInicio = jest.fn();
    render(<BottomNav onInicio={onInicio} onReservas={jest.fn()} vistaActual="perfil" />);
    fireEvent.click(screen.getByText('Inicio'));
    expect(onInicio).toHaveBeenCalled();
  });

  test('"Mis Inscripciones" está marcado como activo cuando vistaActual es "inscripciones"', () => {
    render(<BottomNav onInicio={jest.fn()} onReservas={jest.fn()} vistaActual="inscripciones" />);
    expect(screen.getByText('Inscripciones').closest('button')).toHaveAttribute('aria-current', 'page');
  });

  test('click en "Mis Inscripciones" llama a onMisInscripciones', () => {
    const onMisInscripciones = jest.fn();
    render(
      <BottomNav
        
        onInicio={jest.fn()}
        onReservas={jest.fn()}
        onMisInscripciones={onMisInscripciones}
        vistaActual="inicio"
      />
    );
    fireEvent.click(screen.getByText('Inscripciones'));
    expect(onMisInscripciones).toHaveBeenCalled();
  });

  test('"Mi Carnet" está marcado como activo cuando vistaActual es "carnet"', () => {
    render(
      <BottomNav 
        
        onInicio={jest.fn()} 
        onReservas={jest.fn()} 
        vistaActual="carnet" 
      />
    );
    expect(screen.getByText('Carnet').closest('button')).toHaveAttribute('aria-current', 'page');
  });

  test('click en "Mis Entradas" llama a onMisEntradas', () => {
    const onMisEntradas = jest.fn();
    render(
      <BottomNav 
        
        onInicio={jest.fn()} 
        onReservas={jest.fn()} 
        onMisEntradas={onMisEntradas} 
        vistaActual="inicio" 
      />
    );
    fireEvent.click(screen.getByText('Entradas'));
    expect(onMisEntradas).toHaveBeenCalled();
  });

  test('"Mis Entradas" está marcado como activo cuando vistaActual es "mis-entradas"', () => {
    render(
      <BottomNav 
        
        onInicio={jest.fn()} 
        onReservas={jest.fn()} 
        vistaActual="mis-entradas" 
      />
    );
    expect(screen.getByText('Entradas').closest('button')).toHaveAttribute('aria-current', 'page');
  });
});
