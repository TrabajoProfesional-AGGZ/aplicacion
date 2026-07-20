import { render, screen, fireEvent } from '@testing-library/react';
import { ModalOverlay } from './ModalOverlay';

function renderModal(onClose = jest.fn()) {
  return render(
    <div>
      <button type="button">Fuera del modal</button>
      <ModalOverlay onClose={onClose}>
        <button type="button">Adentro</button>
      </ModalOverlay>
    </div>
  );
}

describe('ModalOverlay', () => {
  test('cierra al presionar Escape', () => {
    const onClose = jest.fn();
    renderModal(onClose);
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  test('cierra al hacer click fuera del contenido pero no adentro', () => {
    const onClose = jest.fn();
    renderModal(onClose);

    fireEvent.click(screen.getByText('Adentro'));
    expect(onClose).not.toHaveBeenCalled();

    fireEvent.click(screen.getByText('Adentro').closest('.csf-overlay'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  describe('historial del navegador (back gesture)', () => {
    let pushStateSpy;
    let backSpy;

    beforeEach(() => {
      pushStateSpy = jest.spyOn(window.history, 'pushState');
      backSpy = jest.spyOn(window.history, 'back').mockImplementation(() => {});
    });

    afterEach(() => {
      pushStateSpy.mockRestore();
      backSpy.mockRestore();
    });

    test('empuja una entrada de historial al montar', () => {
      const { unmount } = renderModal();
      expect(pushStateSpy).toHaveBeenCalledTimes(1);
      unmount();
    });

    test('un evento popstate (gesto de atrás) cierra el modal', () => {
      const onClose = jest.fn();
      const { unmount } = renderModal(onClose);
      window.dispatchEvent(new PopStateEvent('popstate'));
      expect(onClose).toHaveBeenCalledTimes(1);
      unmount();
    });

    test('cerrar con Escape consume la entrada de historial pusheada (history.back)', () => {
      const onClose = jest.fn();
      const { unmount } = renderModal(onClose);
      fireEvent.keyDown(document, { key: 'Escape' });
      unmount();
      expect(backSpy).toHaveBeenCalledTimes(1);
    });

    test('un popstate tras un cierre por Escape no vuelve a llamar onClose', () => {
      const onClose = jest.fn();
      const { unmount } = renderModal(onClose);
      fireEvent.keyDown(document, { key: 'Escape' });
      unmount();
      window.dispatchEvent(new PopStateEvent('popstate'));
      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });
});
