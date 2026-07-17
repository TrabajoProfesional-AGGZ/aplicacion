import { render, screen, fireEvent } from '@testing-library/react';
import { Header } from './Header';

describe('Header', () => {
  test('muestra el logo de SocioUnido', () => {
    render(<Header onPerfil={jest.fn()} />);
    expect(screen.getByAltText('SocioUnido')).toBeInTheDocument();
  });

  test('muestra el botón de notificaciones', () => {
    render(<Header onPerfil={jest.fn()} />);
    expect(screen.getByLabelText('Notificaciones')).toBeInTheDocument();
  });

  test('click en el botón de perfil llama a onPerfil', () => {
    const onPerfil = jest.fn();
    render(<Header onPerfil={onPerfil} />);
    fireEvent.click(screen.getByLabelText('Mi perfil'));
    expect(onPerfil).toHaveBeenCalledTimes(1);
  });

  test('click en el botón de notificaciones llama a onAlertas', () => {
    const onAlertas = jest.fn();
    render(<Header onPerfil={jest.fn()} onAlertas={onAlertas} />);
    fireEvent.click(screen.getByLabelText('Notificaciones'));
    expect(onAlertas).toHaveBeenCalledTimes(1);
  });

  test('no muestra el ícono de perfil cuando mostrarPerfil es false', () => {
    render(<Header onPerfil={jest.fn()} mostrarPerfil={false} />);
    expect(screen.queryByLabelText('Mi perfil')).not.toBeInTheDocument();
  });
});
