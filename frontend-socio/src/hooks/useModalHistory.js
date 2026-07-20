import { useEffect, useRef } from 'react';

/**
 * Ties a modal's lifetime to a browser history entry so the phone's back
 * gesture/button closes the modal instead of the whole app. Pushes one
 * entry on mount; a `popstate` (hardware back) calls `onClose`. If the
 * modal is closed some other way (Escape, click-outside, Cancel), the
 * pushed entry is consumed on unmount so it doesn't linger as a second,
 * unrelated "back" the user would have to press through later — but only
 * if that entry is still the current one: if something else (e.g. a
 * router navigation) already pushed on top of it, going back would undo
 * that instead, so the cleanup skips it and leaves a harmless extra entry.
 */
export function useModalHistory(onClose) {
  const onCloseRef = useRef(onClose);
  const poppedRef = useRef(false);
  const pushedStateRef = useRef(null);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    const state = { modalOverlay: true, id: Date.now() + Math.random() };
    pushedStateRef.current = state;
    window.history.pushState(state, '');

    const handlePopState = () => {
      poppedRef.current = true;
      onCloseRef.current();
    };

    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
      if (!poppedRef.current && window.history.state?.id === pushedStateRef.current?.id) {
        window.history.back();
      }
    };
  }, []);
}
