import { render, screen } from '@testing-library/react';
import { WelcomeCard } from './WelcomeCard';

const socioFixture = {
  nombre: 'Ana',
  apellido: 'Pérez',
  nro_socio: '1000',
  categoria: { nombre: 'Titular' },
  estado: { nombre: 'Activo' },
};

describe('WelcomeCard', () => {
  test('muestra el saludo de bienvenida con nombre y apellido', () => {
    render(<WelcomeCard socio={socioFixture} />);
    expect(screen.getByText('Bienvenido Ana Pérez')).toBeInTheDocument();
  });

  test('muestra el número de socio junto con la categoría', () => {
    render(<WelcomeCard socio={socioFixture} />);
    expect(screen.getByText('1000 - Titular')).toBeInTheDocument();
  });

  test('muestra el estado del socio', () => {
    render(<WelcomeCard socio={socioFixture} />);
    expect(screen.getByText('Estado: Activo')).toBeInTheDocument();
  });

  test('muestra una fecha', () => {
    const { container } = render(<WelcomeCard socio={socioFixture} />);
    expect(container.querySelector('.welcome-card-fecha')).not.toBeEmptyDOMElement();
  });

  test('no rompe si categoria o estado vienen indefinidos', () => {
    render(<WelcomeCard socio={{ nombre: 'Ana', apellido: 'Pérez', nro_socio: '1000' }} />);
    expect(screen.getByText('Bienvenido Ana Pérez')).toBeInTheDocument();
  });
});
