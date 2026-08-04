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
  test.each([
    ['el saludo de bienvenida con nombre y apellido', 'Bienvenido Ana Pérez'],
    ['el número de socio junto con la categoría', '1000 - Titular'],
    ['el estado del socio', 'Estado: Activo'],
  ])('muestra %s', (_descripcion, textoEsperado) => {
    render(<WelcomeCard socio={socioFixture} />);
    expect(screen.getByText(textoEsperado)).toBeInTheDocument();
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
