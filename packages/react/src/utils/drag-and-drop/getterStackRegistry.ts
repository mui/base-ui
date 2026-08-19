/**
 * Shared get-or-create → push → identity-remove machinery for the engine's
 * per-element registries (draggables, drop targets, auto-scrollers).
 *
 * Each element holds a stack of parameter getters — one per registration whose
 * ref landed on the node (merged-ref composition). Storing getters (rather than
 * snapshots) lets the React layer register once and have the engine read the
 * freshest callbacks on each dispatch; the last-pushed getter is the active one
 * (a re-registration refreshes the closures). Each hold releases *its own*
 * getter by identity, so removing a non-last hold can't strand the surviving
 * hook's getter.
 */

import { onceCleanup } from './utils';

interface GetterStackEntries<TElement, TGetter> {
  get(element: TElement): TGetter[] | undefined;
  set(element: TElement, getters: TGetter[]): void;
  delete(element: TElement): boolean;
}

export interface GetterStackRegistry<TElement, TGetter> {
  /** Push a hold onto the element's stack. Returns `true` on the element's first registration. */
  add(element: TElement, getter: TGetter): boolean;
  /**
   * Release one hold. Removing the last hold runs `onLastRemove`, then
   * `beforeDelete`, and only then deletes the entry — so the getter stays
   * readable through both callbacks. Returns `true` when the element was
   * removed entirely.
   *
   * `beforeDelete` also runs when a surviving hold is promoted to active, since
   * the element's effective parameters change then too.
   */
  remove(element: TElement, getter: TGetter, beforeDelete?: () => void): boolean;
  /** `add` plus a latched cleanup releasing the hold. */
  hold(element: TElement, getter: TGetter): () => void;
  /** The element's active (last-pushed) getter, or `undefined` when none is registered. */
  getActive(element: TElement): TGetter | undefined;
}

export function createGetterStackRegistry<TElement, TGetter>(options: {
  /** Backing store: a `WeakMap` normally, a `Map` when the registry must be iterable. */
  entries: GetterStackEntries<TElement, TGetter>;
  /** First-registration side effects, such as the drop-target attribute. */
  onFirstAdd?: ((element: TElement) => void) | undefined;
  /** Last-release side effects, run while the entry is still present. */
  onLastRemove?: ((element: TElement) => void) | undefined;
}): GetterStackRegistry<TElement, TGetter> {
  const { entries, onFirstAdd, onLastRemove } = options;

  function add(element: TElement, getter: TGetter): boolean {
    let getters = entries.get(element);
    const firstRegistration = getters === undefined;
    if (getters === undefined) {
      getters = [];
      entries.set(element, getters);
    }
    getters.push(getter);
    if (firstRegistration) {
      onFirstAdd?.(element);
    }
    return firstRegistration;
  }

  function remove(element: TElement, getter: TGetter, beforeDelete?: () => void): boolean {
    const getters = entries.get(element);
    if (getters === undefined) {
      return false;
    }
    // Last hold: run the side effects while the entry is still readable (the
    // drop-target lifecycle dispatches this target's leave events from it as it
    // drops out of the stack — deleting first would swallow the leave), and
    // only then remove the entry.
    if (getters.length <= 1 && getters[0] === getter) {
      try {
        onLastRemove?.(element);
        beforeDelete?.();
      } finally {
        // `beforeDelete` dispatches consumer callbacks, which must survive a throw:
        // the caller's cleanup is latched to run once, so anything skipped here is
        // skipped forever.
        //
        // Deleting unconditionally would take a *reentrant* re-registration with it:
        // a target that remounts from its own leave handler calls `add()`, which
        // finds this still-present entry and pushes onto it rather than registering
        // afresh. Drop only the retiring getter, and when something did re-register,
        // keep it and redo the first-add side effects `onLastRemove` just undid.
        const survivors = getters.filter((held) => held !== getter);
        if (survivors.length === 0) {
          entries.delete(element);
        } else {
          entries.set(element, survivors);
          onFirstAdd?.(element);
        }
      }
      return true;
    }
    // A surviving hold remains: drop *this hold's own* getter (by identity),
    // not the most recent one.
    const index = getters.lastIndexOf(getter);
    if (index !== -1) {
      const wasActive = index === getters.length - 1;
      getters.splice(index, 1);
      // Releasing the *last-pushed* hold promotes a different getter to active,
      // so the element's effective `accept`/`payload`/`disabled` just changed
      // even though it stayed registered. Callers use `beforeDelete` to refresh
      // the lifecycle; without this the stack keeps the retired hold's answers
      // until the next input event.
      if (wasActive) {
        beforeDelete?.();
      }
    }
    return false;
  }

  return {
    add,
    remove,
    hold(element: TElement, getter: TGetter): () => void {
      add(element, getter);
      return onceCleanup(() => {
        remove(element, getter);
      });
    },
    getActive(element: TElement): TGetter | undefined {
      const getters = entries.get(element);
      return getters === undefined || getters.length === 0
        ? undefined
        : getters[getters.length - 1];
    },
  };
}
