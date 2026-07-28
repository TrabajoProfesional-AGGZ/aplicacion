import { getNoticiasVigentes, getNoticia } from './noticiasService';

beforeEach(() => { global.fetch = jest.fn(); });

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