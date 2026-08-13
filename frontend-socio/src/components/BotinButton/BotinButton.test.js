import { render, screen, fireEvent } from '@testing-library/react';
import { BotinButton } from './BotinButton';

describe('BotinButton', () => {
  test('no muestra el diálogo de confirmación al renderizar', () => {
    render(<BotinButton />);
    expect(screen.queryByText('Iniciar chat con BotIn?')).not.toBeInTheDocument();
  });

  test('click en el botón flotante abre el diálogo de confirmación', () => {
    render(<BotinButton />);
    fireEvent.click(screen.getByRole('button', { name: 'Chatear con BotIn' }));
    expect(screen.getByText('Iniciar chat con BotIn?')).toBeInTheDocument();
  });

  test('click en "Cancelar" cierra el diálogo sin abrir Telegram', () => {
    const openSpy = jest.spyOn(window, 'open').mockImplementation(() => {});
    render(<BotinButton />);
    fireEvent.click(screen.getByRole('button', { name: 'Chatear con BotIn' }));
    fireEvent.click(screen.getByText('Cancelar'));
    expect(screen.queryByText('Iniciar chat con BotIn?')).not.toBeInTheDocument();
    expect(openSpy).not.toHaveBeenCalled();
    openSpy.mockRestore();
  });

  test('click en "Ir al chat" abre el link de Telegram y cierra el diálogo', () => {
    const openSpy = jest.spyOn(window, 'open').mockImplementation(() => {});
    render(<BotinButton />);
    fireEvent.click(screen.getByRole('button', { name: 'Chatear con BotIn' }));
    fireEvent.click(screen.getByText('Ir al chat'));
    expect(openSpy).toHaveBeenCalledWith('https://t.me/sociounido_bot', '_blank', 'noopener,noreferrer');
    expect(screen.queryByText('Iniciar chat con BotIn?')).not.toBeInTheDocument();
    openSpy.mockRestore();
  });
});
