'use client';
import * as React from 'react';
import { useStableCallback } from '@base-ui/utils/useStableCallback';
import { createGenericEventDetails } from '../../internals/createBaseUIEventDetails';
import { getHighlightReason } from '../../utils/getHighlightReason';
import { getHighlightedIndex } from '../store';
import type { ListboxStore } from '../store';
import type { ListboxRoot } from '../root/ListboxRoot';

interface ResolvedHighlight<Value> {
  index: number;
  value: Value | undefined;
}

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

  const notify = useStableCallback((highlight: ResolvedHighlight<Value>) => {
    const event = store.context.highlightEvent;
    onItemHighlighted?.(
      highlight.value,
      createGenericEventDetails(getHighlightReason(event), event, {
        index: highlight.index,
      }) as ListboxRoot.HighlightEventDetails,
    );
  });

  const hasListener = onItemHighlighted != null;

  React.useEffect(() => {
    if (!hasListener) {
      return undefined;
    }

    function resolveHighlight(): ResolvedHighlight<Value> {
      const index = getHighlightedIndex(store.state);
      return index == null
        ? { index: -1, value: undefined }
        : { index, value: store.getValueAt(index) as Value | undefined };
    }

    // The item at a position can change without the position changing, so the value is compared
    // too.
    let last = resolveHighlight();

    return store.subscribe(() => {
      const next = resolveHighlight();
      if (last.index === next.index && Object.is(last.value, next.value)) {
        return;
      }
      last = next;
      notify(next);
    });
  }, [store, hasListener, notify]);
}
