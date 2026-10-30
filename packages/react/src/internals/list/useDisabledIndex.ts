'use client';
import * as React from 'react';
import { isElementDisabled } from '@base-ui/utils/isElementDisabled';
import { useStableCallback } from '@base-ui/utils/useStableCallback';

export interface UseDisabledIndexParameters {
  /**
   * Resolves an index in the navigable collection to the value handed to `isItemDisabled`. How a
   * list maps indices to values is its own business: a Combobox reads a filtered collection when
   * it has one and the registered values otherwise, a Select always reads the registered values.
   */
  getItemValue: (index: number) => unknown;
  /**
   * The consumer's predicate, from the root's `isItemDisabled` prop. Consulted first, because it
   * is the only thing that can classify an item that is not in the DOM.
   */
  isItemDisabled: ((itemValue: any, index: number) => boolean) | undefined;
  /**
   * Whether the list knows its collection independently of the DOM — an `items` prop, as opposed
   * to items discovered as their elements register.
   *
   * This decides what a missing element means. With a known collection an index exists whether or
   * not its element has mounted: it may be outside a virtualizer's window, or not registered yet
   * when the list highlights an item on open. Reading either as disabled would make the index
   * unreachable. Without one, the registered elements are the collection, so a slot with no
   * element is one nothing can navigate to.
   */
  hasItemCollection: boolean;
  /** Item elements in list order, as registered with the list. */
  listRef: React.RefObject<ReadonlyArray<HTMLElement | null>>;
}

export interface DisabledIndex {
  /**
   * The first index that is not disabled, or `null` when every index up to `itemCount` is.
   */
  getFirstEnabledIndex: (itemCount: number) => number | null;
  /**
   * Whether the item at an index is disabled, whether or not it is rendered. Passed to list
   * navigation as `disabledIndices` so unmounted items are classified the same way as mounted ones.
   */
  isIndexDisabled: (index: number) => boolean;
}

/**
 * How a list decides that an index is disabled, for items in and outside the DOM alike.
 *
 * List navigation only sees elements, and a list with a known collection can have indices with
 * none — outside a virtualizer's window, or not yet registered — so the root has to answer for
 * them. Both callbacks read their inputs at call time and are stable, so they can be handed to
 * navigation once.
 */
export function useDisabledIndex(parameters: UseDisabledIndexParameters): DisabledIndex {
  const { getItemValue, hasItemCollection, isItemDisabled, listRef } = parameters;

  const isIndexDisabled = useStableCallback((index: number) => {
    if (isItemDisabled?.(getItemValue(index), index) === true) {
      return true;
    }

    const itemElement = listRef.current[index];
    if (itemElement == null) {
      return !hasItemCollection;
    }

    return isElementDisabled(itemElement);
  });

  const getFirstEnabledIndex = useStableCallback((itemCount: number) => {
    for (let index = 0; index < itemCount; index += 1) {
      if (!isIndexDisabled(index)) {
        return index;
      }
    }

    return null;
  });

  return React.useMemo(
    () => ({ getFirstEnabledIndex, isIndexDisabled }),
    [getFirstEnabledIndex, isIndexDisabled],
  );
}
