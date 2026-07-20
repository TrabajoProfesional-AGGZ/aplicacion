import { useEffect, useRef } from 'react';

let stepHistoryIdCounter = 0;

/**
 * Ties a multi-screen flow's current step to browser history so the phone's
 * back gesture/button steps back exactly one screen at a time, instead of
 * either doing nothing (no router) or exiting the whole flow in one gesture
 * (which is what useBackToRoot does, deliberately, for single-level "screen"
 * state — the wrong shape for a linear wizard).
 *
 * `stepOrder` defines depth via `stepOrder.indexOf(step)`. Moving to a
 * deeper step pushes one history entry per level advanced (normally one,
 * since navigation here is always a single screen forward). Moving to a
 * shallower step some way *other* than a hardware back (e.g. a "Cancelar"
 * button jumping straight from step 4 back to step 1) consumes the
 * corresponding entries with a single `history.go(-n)` rather than n
 * separate `history.back()` calls, avoiding races between overlapping async
 * navigations. A hardware back only ever consumes one entry per gesture (a
 * `popstate` is exactly that) and calls `onBack(previousStep)`.
 *
 * At depth 0 nothing is ever pushed, so a hardware back there falls through
 * untouched to whatever consumes history one level up (e.g. useBackToRoot
 * on the page's own root `vista`) — composes for free, no extra wiring.
 *
 * `stepOrder` should be a stable (module-level) array — a fresh array
 * literal every render just means an extra no-op effect run, not a bug.
 */
export function useStepHistory(step, stepOrder, onBack) {
  const onBackRef = useRef(onBack);
  const stepOrderRef = useRef(stepOrder);
  const stackRef = useRef([]);
  const depthRef = useRef(stepOrder.indexOf(step));
  const poppedRef = useRef(false);

  useEffect(() => {
    onBackRef.current = onBack;
    stepOrderRef.current = stepOrder;
  }, [onBack, stepOrder]);

  useEffect(() => {
    const depth = stepOrder.indexOf(step);
    const prevDepth = depthRef.current;

    if (depth > prevDepth) {
      for (let i = prevDepth; i < depth; i++) {
        const state = { stepHistory: true, id: Date.now() + '-' + (stepHistoryIdCounter++) };
        stackRef.current.push(state);
        window.history.pushState(state, '');
      }
    } else if (depth < prevDepth) {
      if (poppedRef.current) {
        // This decrease is the result of our own popstate handler already
        // having consumed one entry below — nothing left to do.
        poppedRef.current = false;
      } else {
        const n = prevDepth - depth;
        stackRef.current.splice(stackRef.current.length - n, n);
        window.history.go(-n);
      }
    }

    depthRef.current = depth;
  }, [step, stepOrder]);

  useEffect(() => {
    const handlePopState = () => {
      if (stackRef.current.length === 0) return;

      const top = stackRef.current[stackRef.current.length - 1];
      // Still on our own top entry means a nested consumer above us (e.g. a
      // modal) popped its own entry — our segment hasn't been exited.
      if (window.history.state?.id === top.id) return;

      stackRef.current.pop();
      poppedRef.current = true;
      const newDepth = stackRef.current.length;
      depthRef.current = newDepth;
      onBackRef.current(stepOrderRef.current[newDepth]);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);
}
