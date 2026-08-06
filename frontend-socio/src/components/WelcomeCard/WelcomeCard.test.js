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

describe('WelcomeCard - mensaje de cumpleaños', () => {
  const RealDate = global.Date;

  function fijarHoy(fechaIso) {
    global.Date = class extends RealDate {
      constructor(...args) {
        if (args.length === 0) return new RealDate(fechaIso);
        return new RealDate(...args);
      }
      static now() {
        return new RealDate(fechaIso).getTime();
      }
    };
  }

  afterEach(() => {
    global.Date = RealDate;
  });

  test('no muestra nada si el socio no tiene fecha_nacimiento', () => {
    fijarHoy('2024-06-15T12:00:00');
    const { container } = render(<WelcomeCard socio={socioFixture} />);
    expect(container.querySelector('.welcome-card-cumpleanios')).not.toBeInTheDocument();
  });

  test('no muestra nada si hoy no es el cumpleaños del socio', () => {
    fijarHoy('2024-06-15T12:00:00');
    const { container } = render(<WelcomeCard socio={{ ...socioFixture, fecha_nacimiento: '1990-03-20' }} />);
    expect(container.querySelector('.welcome-card-cumpleanios')).not.toBeInTheDocument();
  });

  test('muestra el saludo dentro de la tarjeta si hoy coincide con día y mes de nacimiento', () => {
    fijarHoy('2024-06-15T12:00:00');
    render(<WelcomeCard socio={{ ...socioFixture, fecha_nacimiento: '1990-06-15' }} />);
    expect(screen.getByRole('status')).toHaveTextContent('¡Feliz cumpleaños, Ana! Desde el club te deseamos un gran día');
  });

  test('ignora el año de nacimiento, solo compara día y mes', () => {
    fijarHoy('2030-06-15T12:00:00');
    render(<WelcomeCard socio={{ ...socioFixture, fecha_nacimiento: '1990-06-15' }} />);
    expect(screen.getByRole('status')).toHaveTextContent('¡Feliz cumpleaños, Ana! Desde el club te deseamos un gran día');
  });
});
