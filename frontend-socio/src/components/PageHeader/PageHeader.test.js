import { render, screen } from '@testing-library/react';
import { PageHeader } from './PageHeader';

describe('PageHeader', () => {
  test('variant="title": renderiza eyebrow, título, subtítulo y acción', () => {
    render(
      <PageHeader
        eyebrow="Instalaciones del club"
        titulo="Mis Reservas"
        subtitulo="Un subtítulo"
        accion={<button type="button">Nueva reserva</button>}
      />
    );
    expect(screen.getByText('Instalaciones del club')).toBeInTheDocument();
    expect(screen.getByText('Mis Reservas')).toBeInTheDocument();
    expect(screen.getByText('Un subtítulo')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Nueva reserva' })).toBeInTheDocument();
  });

  test('variant="title" es la que se usa por defecto', () => {
    const { container } = render(<PageHeader titulo="Título" />);
    expect(container.querySelector('.page-header--title')).toBeInTheDocument();
    expect(container.querySelector('.page-header--hero')).not.toBeInTheDocument();
  });

  test('variant="hero" agrega la clase de tono y la textura', () => {
    const { container } = render(<PageHeader variant="hero" tono="danger" titulo="Estado" />);
    expect(container.querySelector('.page-header--hero.page-header--danger')).toBeInTheDocument();
    expect(container.querySelector('.page-header-texture')).toBeInTheDocument();
  });

  test('variant="hero" sin tono no agrega modificador de color', () => {
    const { container } = render(<PageHeader variant="hero" titulo="Estado" />);
    expect(container.querySelector('[class*="page-header--"][class*="page-header--hero"]')).toBeInTheDocument();
    expect(container.querySelector('.page-header--success, .page-header--danger, .page-header--warning')).not.toBeInTheDocument();
  });

  test('stats: cada una tiene aria-label "{label}: {value}"', () => {
    render(
      <PageHeader
        titulo="Mis trámites"
        stats={[
          { label: 'Aprobados', value: 3, tono: 'success' },
          { label: 'Rechazados', value: 1, tono: 'danger' },
        ]}
      />
    );
    expect(screen.getByLabelText('Aprobados: 3')).toBeInTheDocument();
    expect(screen.getByLabelText('Rechazados: 1')).toBeInTheDocument();
  });

  test('sin stats no renderiza el contenedor de stats', () => {
    const { container } = render(<PageHeader titulo="Sin stats" />);
    expect(container.querySelector('.page-header-stats')).not.toBeInTheDocument();
  });

  test('renderiza children debajo de las stats', () => {
    render(
      <PageHeader titulo="Con children">
        <p>Contenido extra</p>
      </PageHeader>
    );
    expect(screen.getByText('Contenido extra')).toBeInTheDocument();
  });
});
