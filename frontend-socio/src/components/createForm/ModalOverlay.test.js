import { StrictMode } from 'react';
import { render, screen, fireEvent, renderHook } from '@testing-library/react';
import { ModalOverlay } from './ModalOverlay';
import { useBackToRoot } from '../../hooks/useBackToRoot';

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

    test('cerrar con Escape consume la entrada de historial pusheada (history.back)', async () => {
      const onClose = jest.fn();
      const { unmount } = renderModal(onClose);
      fireEvent.keyDown(document, { key: 'Escape' });
      unmount();
      // El consumo ahora es diferido (queueMicrotask) para sobrevivir al
      // doble-invoke sincrónico de StrictMode — hay que dejar drenar la cola
      // de microtasks antes de verificar.
      await Promise.resolve();
      expect(backSpy).toHaveBeenCalledTimes(1);
    });

    test('un popstate tras un cierre por Escape no vuelve a llamar onClose', async () => {
      const onClose = jest.fn();
      const { unmount } = renderModal(onClose);
      fireEvent.keyDown(document, { key: 'Escape' });
      unmount();
      await Promise.resolve();
      window.dispatchEvent(new PopStateEvent('popstate'));
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    test('el montaje+desmontaje fantasma sincrónico de StrictMode no consume la entrada del montaje real', async () => {
      const onClose = jest.fn();
      const { unmount } = render(
        <StrictMode>
          <ModalOverlay onClose={onClose}>
            <button type="button">Adentro</button>
          </ModalOverlay>
        </StrictMode>
      );

      // Deja drenar el microtask que la cleanup fantasma de StrictMode
      // encoló — antes del fix, esto disparaba un history.back() real
      // sobre la entrada recién pusheada por el segundo montaje real.
      await Promise.resolve();
      expect(backSpy).not.toHaveBeenCalled();
      // El montaje real reutiliza la entrada que el montaje fantasma ya
      // había pusheado, en vez de pushear una segunda — si esto pusheara
      // dos veces, la entrada extra quedaría huérfana (nunca se consume)
      // y desincronizaría a cualquier consumidor de historial externo.
      expect(pushStateSpy).toHaveBeenCalledTimes(1);

      // El modal debe responder con normalidad después del ciclo fantasma.
      window.dispatchEvent(new PopStateEvent('popstate'));
      expect(onClose).toHaveBeenCalledTimes(1);

      unmount();
    });

    test('cerrar (bajo StrictMode) un modal anidado en una pantalla no-raíz de useBackToRoot no vuelve a la raíz', async () => {
      // Reproducción end-to-end del bug reportado: pantalla away-from-root
      // (ej. HomePage con vista='reservas') + modal abierto encima (ej.
      // "Nueva reserva") + StrictMode en dev. Antes del fix del leak de
      // entrada huérfana, cerrar el modal por Cancelar/Escape/click-afuera
      // bounceaba a la raíz aunque el fix del landing-check ya estuviera
      // aplicado, porque el mount fantasma de StrictMode dejaba una
      // entrada de historial sin consumir que desincronizaba el chequeo.
      // Usa el `history.back()` real de jsdom (no el mock no-op de
      // `backSpy`) para que la navegación y el `popstate` resultante sean
      // genuinos — jsdom lo despacha como macrotask, no microtask.
      backSpy.mockRestore();

      const onBack = jest.fn();
      renderHook(() => useBackToRoot('reservas', 'inicio', onBack));

      const onClose = jest.fn();
      const { unmount } = render(
        <StrictMode>
          <ModalOverlay onClose={onClose}>
            <button type="button">Adentro</button>
          </ModalOverlay>
        </StrictMode>
      );
      await Promise.resolve();

      // Cierre real (no popstate): Cancelar/Escape/click-afuera, todos
      // terminan desmontando el ModalOverlay.
      unmount();
      // jsdom despacha el popstate de un back() real con más de un tick de
      // demora — un solo `setTimeout(0)` no alcanza a observarlo.
      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(onBack).not.toHaveBeenCalled();
    });
  });
});
