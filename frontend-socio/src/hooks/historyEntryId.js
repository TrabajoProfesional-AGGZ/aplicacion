let counter = 0;

/**
 * Shared, monotonically increasing id source for every history entry pushed
 * by useBackToRoot/useModalHistory. Sharing one counter across both hooks
 * (instead of each keeping its own) is what lets a popstate handler tell
 * "an entry pushed after mine" (a nested consumer, still stacked above me)
 * apart from "an entry pushed before mine" (an outer consumer, e.g. another
 * useBackToRoot higher up a page chain) — two independent counters starting
 * at 0 couldn't be compared for order.
 */
export function nextHistoryEntryId() {
  return counter++;
}
