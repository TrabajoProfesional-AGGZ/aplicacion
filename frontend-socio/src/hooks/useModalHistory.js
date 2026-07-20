import { useEffect, useRef } from 'react';

let modalHistoryIdCounter = 0;

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
 *
 * The consume-on-cleanup decision is deferred via `queueMicrotask` instead
 * of running synchronously, and cleanup no longer unconditionally pushes a
 * fresh entry on the following re-setup — both exist to survive React 18
 * StrictMode's dev-only double-invoke of mount effects (setup -> cleanup ->
 * setup, synchronously, back-to-back, same component instance, same refs).
 * `pendingConsumeRef` is a same-tick cancellation token: cleanup arms it
 * before queuing the deferred consume check; if a re-setup runs before
 * that check fires (StrictMode's phantom re-mount), it disarms the token
 * and *reuses* the entry cleanup was about to consume instead of pushing a
 * duplicate. Two bugs would otherwise follow from an unconditional
 * push-every-setup: (1) if cleanup called `history.back()` synchronously,
 * it would fire for a phantom unmount that the same-tick re-setup already
 * superseded — but `history.back()` only *requests* a navigation (the
 * actual popstate is dispatched asynchronously), so by the time it
 * resolves the second setup has already pushed a *new* entry on top of
 * the still-unmoved real position, corrupting the stack; (2) even just
 * deferring the consume check without also deduplicating the push leaves
 * the phantom mount's entry permanently un-consumed once the real
 * (surviving) mount reuses a *different* entry — an orphaned history
 * entry that desyncs any outer history consumer (e.g. useBackToRoot)
 * comparing against its own pushed id once this modal is later closed for
 * real. Reusing the same entry across the phantom cycle means exactly one
 * `pushState` happens for the whole double-invoke, matching what a single
 * (production, non-StrictMode) mount would have done.
 */
export function useModalHistory(onClose) {
  const onCloseRef = useRef(onClose);
  const poppedRef = useRef(false);
  const pushedStateRef = useRef(null);
  const pendingConsumeRef = useRef(false);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    let state;
    if (pendingConsumeRef.current) {
      // A same-tick phantom cleanup already pushed an entry and armed its
      // deferred consume check — reuse that entry instead of pushing a
      // duplicate, and disarm the check so the entry survives for this
      // (real) mount.
      state = pushedStateRef.current;
      pendingConsumeRef.current = false;
    } else {
      state = { modalOverlay: true, id: Date.now() + '-' + (modalHistoryIdCounter++) };
      pushedStateRef.current = state;
      window.history.pushState(state, '');
    }

    const handlePopState = () => {
      poppedRef.current = true;
      onCloseRef.current();
    };

    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
      pendingConsumeRef.current = true;
      queueMicrotask(() => {
        // Disarmed means a re-setup already reused this entry — that
        // (real) mount owns it now, don't touch history here.
        if (!pendingConsumeRef.current) return;
        pendingConsumeRef.current = false;
        if (!poppedRef.current && window.history.state?.id === state.id) {
          window.history.back();
        }
      });
    };
  }, []);
}
