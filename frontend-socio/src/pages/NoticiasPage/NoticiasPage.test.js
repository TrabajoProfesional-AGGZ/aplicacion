import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { NoticiasPage } from './NoticiasPage';
import { getNoticiasVigentes, getNoticia } from '../../services/noticiasService';

jest.mock('../../services/noticiasService', () => ({
  getNoticiasVigentes: jest.fn(),
  getNoticia: jest.fn(),
}));

const noticias = [
  { id: 'n1', titulo: 'Noticia uno', fecha_publicacion: '2024-01-01' },
  { id: 'n2', titulo: 'Noticia dos', fecha_publicacion: '2024-06-01' },
];

const detalleN2 = {
  id: 'n2',
  titulo: 'Noticia dos',
  cuerpo: 'Cuerpo de la noticia dos.',
  imagen: null,
  fecha_publicacion: '2024-06-01',
  fecha_expiracion: '2024-12-01',
};

describe('NoticiasPage', () => {
  beforeEach(() => {
    getNoticiasVigentes.mockReset().mockResolvedValue(noticias);
    getNoticia.mockReset().mockResolvedValue(detalleN2);
  });

  test('sin noticiaInicialId, muestra la lista de noticias vigentes', async () => {
    render(<NoticiasPage />);
    expect(await screen.findByText('Noticia dos')).toBeInTheDocument();
    expect(screen.getByText('Noticia uno')).toBeInTheDocument();
    expect(getNoticia).not.toHaveBeenCalled();
  });

  test('con noticiaInicialId, abre directo el detalle de esa noticia y avisa al padre que lo consuma', async () => {
    const onConsumirNoticiaInicial = jest.fn();
    render(<NoticiasPage noticiaInicialId="n2" onConsumirNoticiaInicial={onConsumirNoticiaInicial} />);

    expect(onConsumirNoticiaInicial).toHaveBeenCalledTimes(1);
    expect(await screen.findByText('Cuerpo de la noticia dos.')).toBeInTheDocument();
    expect(getNoticia).toHaveBeenCalledWith('n2');
  });

  test('"Volver" desde el detalle abierto por noticiaInicialId muestra la lista completa', async () => {
    render(<NoticiasPage noticiaInicialId="n2" onConsumirNoticiaInicial={jest.fn()} />);

    await screen.findByText('Cuerpo de la noticia dos.');
    fireEvent.click(screen.getByText('Volver'));

    await waitFor(() => expect(screen.getByText('Noticia uno')).toBeInTheDocument());
    expect(screen.getByText('Noticia dos')).toBeInTheDocument();
  });

  describe('gesto de atrás del celular', () => {
    let pushStateSpy;

    beforeEach(() => {
      pushStateSpy = jest.spyOn(window.history, 'pushState');
    });

    afterEach(() => {
      pushStateSpy.mockRestore();
    });

    test('un click real en una card de la lista empuja una entrada de historial propia', async () => {
      render(<NoticiasPage />);
      fireEvent.click(await screen.findByText('Noticia dos'));
      await screen.findByText('Cuerpo de la noticia dos.');

      expect(pushStateSpy).toHaveBeenCalled();
    });

    test('abrir directo por el atajo de "Última Noticia" (noticiaInicialId) no empuja ninguna entrada propia', async () => {
      render(<NoticiasPage noticiaInicialId="n2" onConsumirNoticiaInicial={jest.fn()} />);
      await screen.findByText('Cuerpo de la noticia dos.');

      expect(pushStateSpy).not.toHaveBeenCalled();
    });

    test('un gesto de atrás real estando en un detalle abierto desde la lista vuelve a la lista, no a Home', async () => {
      render(<NoticiasPage />);
      fireEvent.click(await screen.findByText('Noticia dos'));
      await screen.findByText('Cuerpo de la noticia dos.');

      // Simula dónde aterriza un back real del celular: una entrada distinta
      // a la que este componente empujó (a diferencia de un popstate
      // "fantasma" que aterrizaría de vuelta en ella).
      window.history.replaceState({ otraEntrada: true }, '');
      act(() => { window.dispatchEvent(new PopStateEvent('popstate')); });

      await waitFor(() => expect(screen.getByText('Noticia uno')).toBeInTheDocument());
      expect(screen.getByText('Noticia dos')).toBeInTheDocument();
    });
  });
});
