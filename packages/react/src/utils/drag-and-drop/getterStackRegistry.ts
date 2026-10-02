/**
 * Per-element getter stacks, shared by the engine's registries of draggables,
 * drop targets and auto-scrollers.
 *
 * Each element holds a stack of parameter getters, one per registration whose
 * ref is attached to the node, for example through merged refs. Storing getters
 * instead of snapshots lets the React layer register once while the engine reads
 * the latest callbacks on each dispatch. The last-pushed getter is the active one,
 * so a re-registration takes over with fresh closures. Each hold removes its own
 * getter by identity, so releasing an older hold can't remove the getter of a
 * hook that is still mounted.
 */

import { onceCleanup } from './utils';

interface GetterStackEntries<TElement, TGetter> {
  get(element: TElement): TGetter[] | undefined;
  set(element: TElement, getters: TGetter[]): void;
  delete(element: TElement): boolean;
}

export interface GetterStackRegistry<TElement, TGetter> {
  /** Push a hold onto the element's stack. */
  add(element: TElement, getter: TGetter): void;
  /**
   * Release one hold. Removing the last hold runs `onLastRemove`, then
   * `beforeDelete`, and only then deletes the entry, so the getter stays
   * readable in both callbacks.
   *
   * `beforeDelete` also runs when removing the active hold promotes another one,
   * because the element's effective parameters change then too.
   */
  remove(element: TElement, getter: TGetter, beforeDelete?: () => void): void;
  /** `add`, returning a run-once cleanup that releases the hold. */
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

  function add(element: TElement, getter: TGetter): void {
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
  }

  function remove(element: TElement, getter: TGetter, beforeDelete?: () => void): void {
    const getters = entries.get(element);
    if (getters === undefined) {
      return;
    }
    // Last hold. Run the side effects while the entry is still readable, then
    // remove it. The drop-target lifecycle reads the entry to dispatch this
    // target's leave events, so deleting it first would lose the leave.
    if (getters.length <= 1 && getters[0] === getter) {
      try {
        onLastRemove?.(element);
        beforeDelete?.();
      } finally {
        // `beforeDelete` dispatches consumer callbacks, which may throw. The
        // caller's cleanup runs only once, so a step skipped here never runs.
        //
        // A target that remounts from its own leave handler calls `add()`, which
        // finds this entry still present and pushes onto it. Deleting the entry
        // unconditionally would drop that re-registration. Remove only the
        // retiring getter. If something re-registered, keep the entry and redo
        // the first-add side effects that `onLastRemove` just undid.
        //
        // This branch started with exactly one hold at index 0, so remove only
        // that occurrence. A callback above may have pushed the same stable
        // getter again, and filtering by value would remove the new hold too.
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
    // Other holds remain. Remove this hold's own getter by identity, not the
    // last-pushed one.
    const index = getters.lastIndexOf(getter);
    if (index !== -1) {
      const wasActive = index === getters.length - 1;
      getters.splice(index, 1);
      // Removing the last-pushed hold promotes another getter, so the element's
      // effective `accept`, `payload` or `disabled` may change while it stays
      // registered. Callers refresh the lifecycle from `beforeDelete`. Without
      // it, the stack would keep the removed hold's values until the next input.
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
