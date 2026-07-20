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
 * via useModalHistory, or a multi-level wizard via useStepHistory) popping
 * one of its own entries, sitting above this hook's entry on the stack,
 * also dispatches a `popstate` that this hook's listener receives. The
 * handler below distinguishes the two by checking where the browser
 * actually landed: any of our tracked entries carries an `id` (this
 * hook's own, or one belonging to a nested consumer still stacked above
 * it) — landing on *any* such entry means the gesture hasn't actually
 * left this segment yet, so `onBack` must NOT fire. Only landing on a
 * plain state with no `id` (the true pre-existing state, from before this
 * hook ever pushed anything) means the gesture got past this hook's own
 * entry and `onBack` should fire.
 *
 * Checking strictly "is this exactly my own entry" (instead of "does the
 * landed entry have an id at all") used to work for a single-level nested
 * consumer like a modal, where popping it always lands exactly back on
 * this hook's entry — but it broke for a multi-level consumer like
 * useStepHistory (one entry per wizard step): going back one step inside
 * the wizard lands on *another* of the wizard's own entries, not this
 * hook's, which the strict check misread as "exited past me" and fired
 * `onBack` on every single in-wizard back navigation.
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

      // Landing on any tracked entry (ours, or a nested consumer's, e.g. a
      // modal or a wizard step still stacked above ours) means we haven't
      // actually exited this segment yet — ignore. Only a landed state with
      // no `id` at all (the true pre-existing state) means the gesture got
      // past us for real.
      if (window.history.state?.id) {
        return;
      }

      poppedRef.current = true;
      onBackRef.current();
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [rootValue]);
}
