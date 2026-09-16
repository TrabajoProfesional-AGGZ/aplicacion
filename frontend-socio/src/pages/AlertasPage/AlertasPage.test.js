import { render, screen } from '@testing-library/react';
import { AlertasPage } from './AlertasPage';
import { getAlertasSocio } from '../../services/alertasService';

jest.mock('../../services/alertasService', () => ({
  getAlertasSocio: jest.fn(),
}));

const socioFixture = { id: 'socio-1' };

const ALERTA_MOCK = {
  id: 'a-1',
  mensaje: 'Recordá renovar tu apto médico',
  filtro_categoria: null,
  filtro_estado: null,
  cantidad_destinatarios: 12,
  creado_en: '2026-07-10T14:30:00Z',
};

describe('AlertasPage', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test('muestra el logo animado de carga mientras llega la respuesta', () => {
    getAlertasSocio.mockReturnValue(new Promise(() => {}));
    render(<AlertasPage socio={socioFixture} />);
    expect(screen.getByRole('status', { name: 'Cargando' })).toBeInTheDocument();
  });

  test('muestra un mensaje vacío si el socio no tiene alertas', async () => {
    getAlertasSocio.mockResolvedValue([]);
    render(<AlertasPage socio={socioFixture} />);
    expect(await screen.findByText('No tenés alertas por el momento.')).toBeInTheDocument();
  });

  test('lista las alertas del socio con su mensaje', async () => {
    getAlertasSocio.mockResolvedValue([ALERTA_MOCK]);
    render(<AlertasPage socio={socioFixture} />);
    expect(await screen.findByText('Recordá renovar tu apto médico')).toBeInTheDocument();
  });

  test('muestra un mensaje de error si falla la carga', async () => {
    getAlertasSocio.mockRejectedValue(new Error('servicio-no-disponible'));
    render(<AlertasPage socio={socioFixture} />);
    expect(await screen.findByText('No se pudieron cargar tus alertas.')).toBeInTheDocument();
  });

  test('avisa con la lista cargada vía onAlertasCargadas (E5, badge de la campana)', async () => {
    getAlertasSocio.mockResolvedValue([ALERTA_MOCK]);
    const onAlertasCargadas = jest.fn();
    render(<AlertasPage socio={socioFixture} onAlertasCargadas={onAlertasCargadas} />);
    await screen.findByText('Recordá renovar tu apto médico');
    expect(onAlertasCargadas).toHaveBeenCalledWith([ALERTA_MOCK]);
  });

  test('no rompe si no se pasa onAlertasCargadas', async () => {
    getAlertasSocio.mockResolvedValue([ALERTA_MOCK]);
    render(<AlertasPage socio={socioFixture} />);
    expect(await screen.findByText('Recordá renovar tu apto médico')).toBeInTheDocument();
  });
});
