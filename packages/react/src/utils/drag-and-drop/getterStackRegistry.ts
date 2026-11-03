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
   * Release one hold. Returns whether it was the active one, since the element's
   * effective getter then changed or, for the last hold, is gone.
   */
  remove(element: TElement, getter: TGetter): boolean;
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
  /** Last-release side effects, run once the entry is gone. */
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

  function remove(element: TElement, getter: TGetter): boolean {
    const getters = entries.get(element);
    // This hold's own getter, not the last-pushed one.
    const index = getters?.lastIndexOf(getter) ?? -1;
    if (getters === undefined || index === -1) {
      return false;
    }
    getters.splice(index, 1);
    if (getters.length === 0) {
      entries.delete(element);
      onLastRemove?.(element);
    }
    // Whether it was the last-pushed, active one.
    return index === getters.length;
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
