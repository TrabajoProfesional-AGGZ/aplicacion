import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QuickAccessGrid } from './QuickAccessGrid';
import { getUltimaNoticia } from '../../services/noticiasService';

jest.mock('../../services/noticiasService', () => ({
  getUltimaNoticia: jest.fn(() => Promise.resolve(null)),
}));

describe('QuickAccessGrid', () => {
  beforeEach(() => {
    getUltimaNoticia.mockClear().mockResolvedValue(null);
  });

  test('muestra las 7 tarjetas de acceso rápido con sus títulos', () => {
    render(<QuickAccessGrid />);
    expect(screen.getByText('Cuotas y pagos')).toBeInTheDocument();
    expect(screen.getByText('Reservar instalación')).toBeInTheDocument();
    expect(screen.getByText('Inscribirme a actividad')).toBeInTheDocument();
    expect(screen.getByText('Comprar entradas')).toBeInTheDocument();
    expect(screen.getByText('Mis trámites')).toBeInTheDocument();
    expect(screen.getByText('Noticias')).toBeInTheDocument();
    expect(screen.getByText('Tienda')).toBeInTheDocument();
  });

  test('click en "Noticias" llama a onNoticias', () => {
    const onNoticias = jest.fn();
    render(<QuickAccessGrid onPagos={jest.fn()} onNoticias={onNoticias} />);
    fireEvent.click(screen.getByText('Noticias'));
    expect(onNoticias).toHaveBeenCalled();
  });

  test('click en "Comprar entradas" llama a onEventos', () => {
    const onEventos = jest.fn();
    render(<QuickAccessGrid onPagos={jest.fn()} onEventos={onEventos} />);
    fireEvent.click(screen.getByText('Comprar entradas'));
    expect(onEventos).toHaveBeenCalled();
  });

  test('click en "Inscribirme a actividad" llama a onInscripciones', () => {
    const onInscripciones = jest.fn();
    render(<QuickAccessGrid onPagos={jest.fn()} onInscripciones={onInscripciones} />);
    fireEvent.click(screen.getByText('Inscribirme a actividad'));
    expect(onInscripciones).toHaveBeenCalled();
  });

  test('click en "Reservar instalación" llama a onReservas', () => {
    const onReservas = jest.fn();
    render(<QuickAccessGrid onPagos={jest.fn()} onReservas={onReservas} />);
    fireEvent.click(screen.getByText('Reservar instalación'));
    expect(onReservas).toHaveBeenCalled();
  });

  test('click en "Cuotas y pagos" llama a onPagos', () => {
    const onPagos = jest.fn();
    render(<QuickAccessGrid onPagos={onPagos} />);
    fireEvent.click(screen.getByText('Cuotas y pagos'));
    expect(onPagos).toHaveBeenCalled();
  });

  test('click en "Mis trámites" llama a onTramites', () => {
    const onTramites = jest.fn();
    render(<QuickAccessGrid onPagos={jest.fn()} onTramites={onTramites} />);
    fireEvent.click(screen.getByText('Mis trámites'));
    expect(onTramites).toHaveBeenCalled();
  });
  
  test('click en "Tienda" llama a onTienda', () => {
    const onTienda = jest.fn();
    render(<QuickAccessGrid onPagos={jest.fn()} onTienda={onTienda} />);
    fireEvent.click(screen.getByText('Tienda'));
    expect(onTienda).toHaveBeenCalled();
  });

  test('"Tienda" aparece antes que "Noticias" en la lista', () => {
    render(<QuickAccessGrid onPagos={jest.fn()} />);
    const titulos = screen.getAllByRole('button').map((btn) => btn.textContent);
    const indiceTienda = titulos.findIndex((t) => t.includes('Tienda'));
    const indiceNoticias = titulos.findIndex((t) => t.includes('Noticias'));
    expect(indiceTienda).toBeGreaterThan(-1);
    expect(indiceNoticias).toBeGreaterThan(indiceTienda);
  });

  test('no muestra la extensión de "Última Noticia" si no hay ninguna vigente', async () => {
    getUltimaNoticia.mockResolvedValue(null);
    render(<QuickAccessGrid onPagos={jest.fn()} />);
    await waitFor(() => expect(getUltimaNoticia).toHaveBeenCalled());
    expect(screen.queryByText('Última Noticia')).not.toBeInTheDocument();
  });

  test('muestra la extensión de "Última Noticia" (con foto y título) cuando getUltimaNoticia resuelve una', async () => {
    getUltimaNoticia.mockResolvedValue({ id: 'n2', titulo: 'Noticia nueva', imagen: 'https://cdn.test/n2.jpg', cuerpo: '...' });

    render(<QuickAccessGrid onPagos={jest.fn()} />);

    expect(await screen.findByText('Última Noticia')).toBeInTheDocument();
    expect(screen.getByText('Noticia nueva')).toBeInTheDocument();
  });

  test('click en la extensión de "Última Noticia" llama a onVerNoticia con el id de la noticia', async () => {
    getUltimaNoticia.mockResolvedValue({ id: 'n1', titulo: 'Noticia X', imagen: null, cuerpo: '...' });
    const onVerNoticia = jest.fn();
    const onNoticias = jest.fn();

    render(<QuickAccessGrid onPagos={jest.fn()} onNoticias={onNoticias} onVerNoticia={onVerNoticia} />);

    await screen.findByText('Última Noticia');
    fireEvent.click(screen.getByText('Última Noticia'));

    expect(onVerNoticia).toHaveBeenCalledWith('n1');
    expect(onNoticias).not.toHaveBeenCalled();
  });
});
