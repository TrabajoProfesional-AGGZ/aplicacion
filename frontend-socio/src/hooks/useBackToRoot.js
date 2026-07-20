import { useEffect, useRef } from 'react';

let backToRootIdCounter = 0;

/**
 * Ties a "current screen" state value to browser history so the phone's
 * back gesture/button returns straight to `rootValue` instead of closing
 * the app, no matter how many in-app-only transitions happened away from
 * root (only one history entry is ever pushed per root->non-root edge,
 * so back always resolves to root in a single gesture, not a per-step
 * breadcrumb).
 *
 * When leaving the non-root state some way other than a hardware back
 * (e.g. tapping "Inicio"), the pushed entry is consumed via
 * `history.back()` so it doesn't linger — but only if it's still the
 * current entry. If something else (e.g. a router navigation triggered
 * in the same click, like a NavLink that both navigates and closes a
 * drawer) already pushed on top of it, going back would undo that
 * navigation instead, so this is skipped and a harmless extra entry is
 * left behind rather than corrupting unrelated navigation.
 *
 * A `popstate` fires for *any* browser back/forward, not just one that
 * exits this hook's own segment — e.g. a nested history consumer (a modal
 * via useModalHistory) popping its own entry, sitting above this hook's
 * entry on the stack, also dispatches a `popstate` that this hook's
 * listener receives. The handler below distinguishes the two by checking
 * where the browser actually landed: still on this hook's own pushed
 * entry means only something nested above was consumed and `onBack`
 * must NOT fire; landed anywhere else means the real gesture got past
 * this hook's own entry and `onBack` should fire.
 */
export function useBackToRoot(current, rootValue, onBack) {
  const onBackRef = useRef(onBack);
  const currentRef = useRef(current);
  // Deliberately starts false regardless of the initial `current` value: the
  // push/pop effect below treats "false" as "nothing pushed yet", so a
  // component that mounts already away from root still gets its entry
  // pushed on the first effect run instead of that edge being missed.
  const isAwayRef = useRef(false);
  const poppedRef = useRef(false);
  const pushedStateRef = useRef(null);

  useEffect(() => {
    onBackRef.current = onBack;
    currentRef.current = current;
  }, [onBack, current]);

  useEffect(() => {
    const isAway = current !== rootValue;

    if (isAway && !isAwayRef.current) {
      const state = { backToRoot: true, id: Date.now() + '-' + (backToRootIdCounter++) };
      pushedStateRef.current = state;
      window.history.pushState(state, '');
      isAwayRef.current = true;
    } else if (!isAway && isAwayRef.current) {
      isAwayRef.current = false;
      if (!poppedRef.current && window.history.state?.id === pushedStateRef.current?.id) {
        window.history.back();
      }
      poppedRef.current = false;
    }
  }, [current, rootValue]);

  useEffect(() => {
    const handlePopState = () => {
      if (currentRef.current === rootValue) return;

      // Still on our own pushed entry means a nested consumer's entry above
      // ours was the one consumed — our segment hasn't been exited, ignore.
      if (pushedStateRef.current && window.history.state?.id === pushedStateRef.current.id) {
        return;
      }

      poppedRef.current = true;
      onBackRef.current();
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [rootValue]);
}
