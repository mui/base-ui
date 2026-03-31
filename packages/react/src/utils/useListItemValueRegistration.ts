'use client';
import * as React from 'react';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';

/**
 * Shared hook used by both ListboxItem and SelectItem to register an item's
 * value into the parent's `valuesRef` array.
 *
 * The parent uses this flat registry to map composite indices back to values
 * for form serialization, typeahead, range selection, and reordering logic.
 */
export function useListItemValueRegistration(params: UseItemValueRegistrationParams) {
  const { index, itemValue, hasRegistered, valuesRef } = params;

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
}

interface UseItemValueRegistrationParams {
  index: number;
  itemValue: any;
  hasRegistered: boolean;
  valuesRef: React.RefObject<Array<any>>;
}
