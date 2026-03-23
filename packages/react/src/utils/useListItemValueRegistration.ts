'use client';
import * as React from 'react';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
import type { Store } from '@base-ui/utils/store';
import { compareItemEquality } from './itemEquality';

/**
 * Shared hook used by both ListboxItem and SelectItem to register an item's
 * value into the parent's `valuesRef` array and keep `selectedIndex` in sync.
 *
 * Two effects are needed:
 * 1. Write the item's value to `valuesRef[index]` so the parent can map
 *    indices to values (for form serialization, typeahead, shift-click range, etc.).
 * 2. Sync `selectedIndex` on mount. The root component also maintains
 *    `selectedIndex`, but items mount asynchronously — `valuesRef` may still be
 *    empty when the root's effect first runs. This item-level effect covers
 *    that timing race.
 */
export function useListItemValueRegistration(params: UseItemValueRegistrationParams) {
  const { store, index, itemValue, isItemEqualToValue, multiple, hasRegistered, valuesRef } =
    params;

  useIsoLayoutEffect(() => {
    if (!hasRegistered) {
      return undefined;
    }

    const values = valuesRef.current;
    values[index] = itemValue;

    return () => {
      delete values[index];
    };
  }, [hasRegistered, index, itemValue, valuesRef]);

  useIsoLayoutEffect(() => {
    if (!hasRegistered) {
      return undefined;
    }

    const selectedValue = store.state.value;

    let selectedCandidate = selectedValue;
    if (multiple && Array.isArray(selectedValue) && selectedValue.length > 0) {
      selectedCandidate = selectedValue[selectedValue.length - 1];
    }

    if (
      selectedCandidate !== undefined &&
      compareItemEquality(itemValue, selectedCandidate, isItemEqualToValue)
    ) {
      store.set('selectedIndex', index);
    }
    return undefined;
  }, [hasRegistered, index, multiple, isItemEqualToValue, store, itemValue]);
}

interface UseItemValueRegistrationParams {
  store: Store<{ value: any; selectedIndex: number | null }>;
  index: number;
  itemValue: any;
  isItemEqualToValue: (a: any, b: any) => boolean;
  multiple: boolean;
  hasRegistered: boolean;
  valuesRef: React.RefObject<Array<any>>;
}
