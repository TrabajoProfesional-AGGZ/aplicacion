import { useEffect, useRef } from 'react';
import { nextHistoryEntryId } from './historyEntryId';

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
 * also dispatches a `popstate` that this hook's listener receives. It can
 * also fire because a *different, outer* instance of this same hook is
 * chained above this one (e.g. HomePage's own `useBackToRoot` around
 * `vista`, with a page like NuevaInscripcionPage mounted inside it running
 * a second `useBackToRoot` around its own internal `step`) — one gesture
 * should unwind exactly one level of that chain, not all of them at once.
 *
 * The handler below distinguishes "still inside my own segment" from
 * "exited past me" by comparing ids, not just checking whether one is
 * present: every tracked entry's `id` comes from the shared, monotonically
 * increasing `nextHistoryEntryId()` (see historyEntryId.js), so an id
 * greater than or equal to this hook's own pushed id was necessarily
 * pushed by this hook itself or by something nested *above* it (still
 * within this segment — ignore), while an id smaller than this hook's own,
 * or no id at all (the true pre-existing state), was pushed *before* this
 * hook's own entry — by an outer/ancestor consumer, or never tracked at
 * all — meaning the gesture genuinely got past this hook's own entry, so
 * `onBack` should fire.
 *
 * Two independent counters (one per hook) can't be compared for order,
 * which is why both useBackToRoot and useModalHistory pull ids from the
 * same shared sequence instead of keeping their own.
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
      const state = { backToRoot: true, id: nextHistoryEntryId() };
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

      // Landing on our own entry, or on one pushed after it (a nested
      // consumer, still stacked above ours), means we haven't actually
      // exited this segment yet — ignore. Only landing on an entry pushed
      // *before* ours (an outer consumer) or on a state with no id at all
      // (the true pre-existing state) means the gesture got past us for
      // real.
      const landedId = window.history.state?.id;
      const ownId = pushedStateRef.current?.id;
      if (typeof landedId === 'number' && typeof ownId === 'number' && landedId >= ownId) {
        return;
      }

      poppedRef.current = true;
      onBackRef.current();
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [rootValue]);
}
