'use client';
import * as React from 'react';
import { useStableCallback } from '@base-ui/utils/useStableCallback';
import { createGenericEventDetails } from '../../internals/createBaseUIEventDetails';
import { getHighlightReason } from '../../utils/getHighlightReason';
import { getHighlightedIndex } from '../store';
import type { ListboxStore } from '../store';
import type { ListboxRoot } from '../root/ListboxRoot';

/**
 * Calls `onItemHighlighted` when the highlighted item changes.
 *
 * Subscribes to the store's highlighted item (the hovered item, or the focused item when the pointer
 * isn't over an item), resolves its value, and derives the reason from the event recorded by the
 * store.
 */
export function useHighlightChangeNotifier<Value>(params: {
  store: ListboxStore;
  onItemHighlighted:
    | ((itemValue: Value | undefined, eventDetails: ListboxRoot.HighlightEventDetails) => void)
    | undefined;
}): void {
  const { store, onItemHighlighted } = params;

  const notify = useStableCallback((index: number, value: Value | undefined) => {
    const event = store.context.highlightEvent;
    onItemHighlighted?.(
      value,
      createGenericEventDetails(getHighlightReason(event), event, {
        index,
      }) as ListboxRoot.HighlightEventDetails,
    );
  });

  const hasListener = onItemHighlighted != null;

  React.useEffect(() => {
    if (!hasListener) {
      return undefined;
    }

    // The item at a position can change without the position changing, so the value is compared
    // too. Nothing is highlighted at position `-1`, which has no value.
    let lastIndex = getHighlightedIndex(store.state) ?? -1;
    let lastValue = store.getValueAt(lastIndex);

    return store.subscribe(() => {
      const index = getHighlightedIndex(store.state) ?? -1;
      const value = store.getValueAt(index);
      if (index === lastIndex && Object.is(value, lastValue)) {
        return;
      }
      lastIndex = index;
      lastValue = value;
      notify(index, value);
    });
  }, [store, hasListener, notify]);
}
