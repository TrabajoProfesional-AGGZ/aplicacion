import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BiometriaOfferBanner } from './BiometriaOfferBanner';

let mockBiometricState;
jest.mock('../../hooks/useBiometricLogin', () => ({
  useBiometricLogin: () => mockBiometricState,
}));

const credencial = { email: 'socio@club.com', password: 'clave123' };

describe('BiometriaOfferBanner', () => {
  beforeEach(() => {
    mockBiometricState = {
      soportado: true,
      enrolado: false,
      ofrecerEnrolamiento: jest.fn(),
    };
  });

  test('no renderiza nada si no hay credencial para ofrecer', () => {
    const { container } = render(<BiometriaOfferBanner credencial={null} onDescartar={jest.fn()} />);
    expect(container).toBeEmptyDOMElement();
  });

  test('no renderiza nada si el dispositivo no soporta biometría', () => {
    mockBiometricState.soportado = false;
    const { container } = render(<BiometriaOfferBanner credencial={credencial} onDescartar={jest.fn()} />);
    expect(container).toBeEmptyDOMElement();
  });

  test('no renderiza nada si ya hay una credencial enrolada', () => {
    mockBiometricState.enrolado = true;
    const { container } = render(<BiometriaOfferBanner credencial={credencial} onDescartar={jest.fn()} />);
    expect(container).toBeEmptyDOMElement();
  });

  test('"Activar" llama a ofrecerEnrolamiento con la credencial y luego descarta el banner', async () => {
    mockBiometricState.ofrecerEnrolamiento.mockResolvedValueOnce();
    const onDescartar = jest.fn();
    render(<BiometriaOfferBanner credencial={credencial} onDescartar={onDescartar} />);

    fireEvent.click(screen.getByRole('button', { name: /^activar$/i }));

    await waitFor(() => {
      expect(mockBiometricState.ofrecerEnrolamiento).toHaveBeenCalledWith('socio@club.com', 'clave123');
    });
    expect(onDescartar).toHaveBeenCalledTimes(1);
  });

  test('si ofrecerEnrolamiento falla, muestra un error y no descarta el banner', async () => {
    mockBiometricState.ofrecerEnrolamiento.mockRejectedValueOnce(new Error('biometria-enrolamiento-cancelado'));
    const onDescartar = jest.fn();
    render(<BiometriaOfferBanner credencial={credencial} onDescartar={onDescartar} />);

    fireEvent.click(screen.getByRole('button', { name: /^activar$/i }));

    expect(await screen.findByText(/no se pudo activar la biometría/i)).toBeInTheDocument();
    expect(onDescartar).not.toHaveBeenCalled();
  });

  test('"Ahora no" descarta el banner sin activar nada', () => {
    const onDescartar = jest.fn();
    render(<BiometriaOfferBanner credencial={credencial} onDescartar={onDescartar} />);

    fireEvent.click(screen.getByRole('button', { name: /ahora no/i }));

    expect(mockBiometricState.ofrecerEnrolamiento).not.toHaveBeenCalled();
    expect(onDescartar).toHaveBeenCalledTimes(1);
  });
});
