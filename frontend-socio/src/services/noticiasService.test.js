global.fetch = jest.fn();

import { getNoticiasVigentes, getNoticia, getUltimaNoticia } from './noticiasService';

beforeEach(() => { global.fetch = jest.fn(); });

function mockOk(data) {
  return { ok: true, json: () => Promise.resolve(data) };
}

describe('noticiasService', () => {
  test('getNoticiasVigentes OK', async () => {
    fetch.mockResolvedValue({ ok: true, json: () => Promise.resolve([{ id: '1', titulo: 'Test' }]) });
    const data = await getNoticiasVigentes();
    expect(data).toHaveLength(1);
  });

  test('getNoticiasVigentes error', async () => {
    fetch.mockResolvedValue({ ok: false });
    await expect(getNoticiasVigentes()).rejects.toThrow();
  });

  test('getNoticia OK', async () => {
    fetch.mockResolvedValue({ ok: true, json: () => Promise.resolve({ id: '1', titulo: 'Test', cuerpo: 'Hola' }) });
    const data = await getNoticia('1');
    expect(data.titulo).toBe('Test');
  });

  test('getNoticia error', async () => {
    fetch.mockResolvedValue({ ok: false });
    await expect(getNoticia('1')).rejects.toThrow();
  });
});

describe('getUltimaNoticia (caché en memoria por id)', () => {
  test('cachea el detalle mientras la más reciente no cambie, y lo vuelve a pedir si cambia', async () => {
    // 1) Primera llamada: la más reciente es "n2" -> pide lista + su detalle.
    fetch
      .mockResolvedValueOnce(mockOk([
        { id: 'n1', titulo: 'Vieja', fecha_publicacion: '2024-01-01' },
        { id: 'n2', titulo: 'Nueva', fecha_publicacion: '2024-06-01' },
      ]))
      .mockResolvedValueOnce(mockOk({ id: 'n2', titulo: 'Nueva', imagen: null, cuerpo: '...' }));

    const primera = await getUltimaNoticia();
    expect(primera.id).toBe('n2');
    expect(fetch).toHaveBeenCalledTimes(2);

    // 2) La más reciente sigue siendo "n2" -> no vuelve a pedir el detalle (solo la lista, barata).
    fetch.mockClear();
    fetch.mockResolvedValueOnce(mockOk([
      { id: 'n1', titulo: 'Vieja', fecha_publicacion: '2024-01-01' },
      { id: 'n2', titulo: 'Nueva', fecha_publicacion: '2024-06-01' },
    ]));

    const segunda = await getUltimaNoticia();
    expect(segunda).toBe(primera);
    expect(fetch).toHaveBeenCalledTimes(1);

    // 3) Aparece una noticia nueva y más reciente ("n3") -> fuerza a pedir su detalle de nuevo.
    fetch.mockClear();
    fetch
      .mockResolvedValueOnce(mockOk([
        { id: 'n1', titulo: 'Vieja', fecha_publicacion: '2024-01-01' },
        { id: 'n2', titulo: 'Nueva', fecha_publicacion: '2024-06-01' },
        { id: 'n3', titulo: 'Recién publicada', fecha_publicacion: '2024-09-01' },
      ]))
      .mockResolvedValueOnce(mockOk({ id: 'n3', titulo: 'Recién publicada', imagen: null, cuerpo: '...' }));

    const tercera = await getUltimaNoticia();
    expect(tercera.id).toBe('n3');
    expect(fetch).toHaveBeenCalledTimes(2);

    // 4) Sin noticias vigentes, limpia la caché y devuelve null.
    fetch.mockClear();
    fetch.mockResolvedValueOnce(mockOk([]));
    const cuarta = await getUltimaNoticia();
    expect(cuarta).toBeNull();
  });
});