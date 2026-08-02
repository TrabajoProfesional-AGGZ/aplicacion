import { render, screen } from '@testing-library/react';
import { Carnet } from './Carnet';

jest.mock('../AccesoQR/AccesoQr', () => {
  return function MockAccesoQR() {
    return <div data-testid="mock-acceso-qr" />;
  };
});

describe('Carnet', () => {
  test('renderiza la estructura básica de la credencial', () => {
    render(<Carnet socio={null} />);
    
    expect(screen.getByText('Mi Pase de Acceso')).toBeInTheDocument();
    expect(screen.getByText('Mostrá este código para ingresar')).toBeInTheDocument();
    expect(screen.getByText('SOCIOUNIDO')).toBeInTheDocument();
    expect(screen.getByTestId('mock-acceso-qr')).toBeInTheDocument();
  });

  test('muestra los datos del socio correctamente cuando están disponibles', () => {
    const socioMock = {
      nombre: 'Lautaro Ghosn',
      nro_socio: '12345'
    };

    render(<Carnet socio={socioMock} />);
    
    expect(screen.getByText('Lautaro Ghosn')).toBeInTheDocument();
    expect(screen.getByText('#12345')).toBeInTheDocument();
  });

  test('muestra guiones ("---") como fallback si faltan los datos del socio', () => {
    render(<Carnet socio={{}} />);
    
    expect(screen.getByText('---')).toBeInTheDocument();
    
    expect(screen.getByText('#---')).toBeInTheDocument();
  });
});