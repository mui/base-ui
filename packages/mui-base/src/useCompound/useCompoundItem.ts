'use client';
import * as React from 'react';
import { unstable_useEnhancedEffect as useEnhancedEffect } from '@mui/utils';
import type { UseCompoundItemParameters, UseCompoundItemReturnValue } from './useCompound.types';

/**
 * Registers a child component with the parent component.
 *
 * @param key A unique key for the child component. If the `id` is `undefined`, the registration logic will not run (this can sometimes be the case during SSR).
 *   This can be either a value, or a function that generates a value based on already registered siblings' ids.
 *   If a function, it's called with the set of the ids of all the items that have already been registered.
 *   Return `existingKeys.size` if you want to use the index of the new item as the id.
 * @param itemMetadata Arbitrary metadata to pass to the parent component. This should be a stable reference (for example a memoized object), to avoid unnecessary re-registrations.
 *
 * @ignore - internal hook.
 */
export function useCompoundItem<Key, Subitem extends { ref: any }>(
  parameters: UseCompoundItemParameters<Key, Subitem>,
): UseCompoundItemReturnValue<Key> {
  const { key: keyParam, keyGenerator, itemMetadata, parentContext } = parameters;
  const { registerItem, getRegisteredItemCount } = parentContext;
  const [key, setKey] = React.useState<Key | undefined>(keyParam);
  const [index, setIndex] = React.useState<number>(-1);

  useEnhancedEffect(() => {
    if (keyParam == null && keyGenerator != null) {
      const registeredItemsCount = getRegisteredItemCount();
      const generatedKey = keyGenerator(registeredItemsCount);
      setKey(generatedKey);
      const { deregister, index: itemIndex } = registerItem(generatedKey, itemMetadata);
      setIndex(itemIndex);
      return deregister;
    }

    const { deregister } = registerItem(keyParam, itemMetadata);
    return deregister;
  }, [registerItem, itemMetadata, keyParam, getRegisteredItemCount, keyGenerator]);

  return React.useMemo(() => ({ key, index }), [key, index]);
}
