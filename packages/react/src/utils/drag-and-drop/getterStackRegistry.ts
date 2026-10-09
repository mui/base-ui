/**
 * Per-element getter stacks for the draggable, drop-target, and auto-scroller registries,
 * since merged refs can register one node several times. Getters let React register once
 * while the engine reads the latest callbacks. The last-pushed getter is active, and each
 * hold removes its own getter, so releasing an older hold can't drop a mounted hook's.
 */

import { onceCleanup } from './utils';

interface GetterStackEntries<TElement, TGetter> {
  get(element: TElement): TGetter[] | undefined;
  set(element: TElement, getters: TGetter[]): void;
  delete(element: TElement): boolean;
}

export interface GetterStackRegistry<TElement, TGetter> {
  add(element: TElement, getter: TGetter): void;
  /**
   * Release one hold. Removing the last hold runs `onLastRemove`, then `beforeDelete`,
   * then deletes the entry, so the getter stays readable in both callbacks.
   * `beforeDelete` also runs when removing the active hold promotes another one,
   * since the element's effective parameters change then too.
   */
  remove(element: TElement, getter: TGetter, beforeDelete?: () => void): void;
  /** `add`, returning a run-once cleanup that releases the hold. */
  hold(element: TElement, getter: TGetter): () => void;
  /** The last-pushed getter. */
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

  function add(element: TElement, getter: TGetter): void {
    const getters = entries.get(element);
    if (getters) {
      getters.push(getter);
      return;
    }
    entries.set(element, [getter]);
    onFirstAdd?.(element);
  }

  function remove(element: TElement, getter: TGetter, beforeDelete?: () => void): void {
    const getters = entries.get(element);
    if (getters === undefined) {
      return;
    }
    // Last hold. Run the side effects while the entry is still readable: the
    // drop-target lifecycle reads it to dispatch this target's leave events.
    if (getters.length <= 1 && getters[0] === getter) {
      try {
        onLastRemove?.(element);
        beforeDelete?.();
      } finally {
        // Runs even if a consumer callback threw, since the caller's cleanup runs once.
        // A target remounting from its own leave handler pushes onto this entry, maybe
        // the same stable getter, so remove only index 0. If anything re-registered, keep
        // the entry and redo the first-add side effects `onLastRemove` just undid.
        if (getters[0] === getter) {
          getters.splice(0, 1);
        }
        if (getters.length === 0) {
          entries.delete(element);
        } else {
          onFirstAdd?.(element);
        }
      }
      return;
    }
    // Other holds remain. Remove this hold's own getter, not the last-pushed one.
    const index = getters.lastIndexOf(getter);
    if (index !== -1) {
      const wasActive = index === getters.length - 1;
      getters.splice(index, 1);
      // Another getter takes over, so callers refresh the lifecycle from
      // `beforeDelete` instead of keeping stale values until the next input.
      if (wasActive) {
        beforeDelete?.();
      }
    }
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
      return getters?.[getters.length - 1];
    },
  };
}
