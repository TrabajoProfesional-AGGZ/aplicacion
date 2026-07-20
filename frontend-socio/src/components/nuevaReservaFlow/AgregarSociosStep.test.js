import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AgregarSociosStep } from './AgregarSociosStep';
import { getSocioByNroSocio } from '../../services/sociosService';

jest.mock('../../services/sociosService', () => ({
  getSocioByNroSocio: jest.fn(),
}));

const TITULAR = { id: 'socio-1', nro_socio: '1000', nombre: 'Ana', apellido: 'Pérez' };
const OTRO_SOCIO = { id: 'socio-2', nro_socio: '2000', nombre: 'Luis', apellido: 'Gómez' };

function renderStep(props = {}) {
  return render(
    <AgregarSociosStep
      socioTitular={TITULAR}
      sociosAgregados={[]}
      onAgregar={jest.fn()}
      onQuitar={jest.fn()}
      onContinuar={jest.fn()}
      onVolver={jest.fn()}
      {...props}
    />
  );
}

async function agregar(nro) {
  fireEvent.change(screen.getByPlaceholderText('Número de socio'), { target: { value: nro } });
  fireEvent.click(screen.getByRole('button', { name: 'Agregar' }));
}

describe('AgregarSociosStep', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test('muestra al titular con su etiqueta, sin botón de quitar', () => {
    renderStep();
    expect(screen.getByText('Ana Pérez')).toBeInTheDocument();
    expect(screen.getByText('Titular')).toBeInTheDocument();
    expect(screen.queryByLabelText('Quitar a Ana Pérez')).not.toBeInTheDocument();
  });

  test('agrega un socio válido por número', async () => {
    const onAgregar = jest.fn();
    getSocioByNroSocio.mockResolvedValue(OTRO_SOCIO);
    renderStep({ onAgregar });

    await agregar('2000');

    await waitFor(() => expect(onAgregar).toHaveBeenCalledWith(OTRO_SOCIO));
    expect(getSocioByNroSocio).toHaveBeenCalledWith('2000');
  });

  test('muestra un error si no se encuentra el socio', async () => {
    getSocioByNroSocio.mockRejectedValue(new Error('socio-no-encontrado'));
    renderStep();

    await agregar('9999');

    expect(await screen.findByText('No se encontró ningún socio con ese número.')).toBeInTheDocument();
  });

  test('no permite agregar dos veces al mismo socio ya agregado', async () => {
    renderStep({ sociosAgregados: [OTRO_SOCIO] });

    await agregar('2000');

    expect(await screen.findByText('Este socio ya fue agregado.')).toBeInTheDocument();
    expect(getSocioByNroSocio).not.toHaveBeenCalled();
  });

  test('no permite agregar al titular por su propio número', async () => {
    renderStep();

    await agregar('1000');

    expect(await screen.findByText('Ya sos parte de esta reserva como titular.')).toBeInTheDocument();
    expect(getSocioByNroSocio).not.toHaveBeenCalled();
  });

  test('permite quitar un socio ya agregado', () => {
    const onQuitar = jest.fn();
    renderStep({ sociosAgregados: [OTRO_SOCIO], onQuitar });

    fireEvent.click(screen.getByLabelText('Quitar a Luis Gómez'));
    expect(onQuitar).toHaveBeenCalledWith('socio-2');
  });

  test('"Continuar" está siempre habilitado y llama a onContinuar', () => {
    const onContinuar = jest.fn();
    renderStep({ onContinuar });

    const boton = screen.getByRole('button', { name: 'Continuar' });
    expect(boton).toBeEnabled();
    fireEvent.click(boton);
    expect(onContinuar).toHaveBeenCalled();
  });

  test('el botón de volver llama a onVolver', () => {
    const onVolver = jest.fn();
    renderStep({ onVolver });
    fireEvent.click(screen.getByText('Volver'));
    expect(onVolver).toHaveBeenCalled();
  });
});
