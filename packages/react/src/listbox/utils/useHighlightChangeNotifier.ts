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

  const stableOnItemHighlighted = useStableCallback(
    (itemValue: Value | undefined, eventDetails: ListboxRoot.HighlightEventDetails) => {
      onItemHighlighted?.(itemValue, eventDetails);
    },
  );

  const lastReportedHighlightRef = React.useRef<ResolvedHighlight<Value> | null>(null);

  const resolveHighlightedItem = useStableCallback((): ResolvedHighlight<Value> => {
    const highlightedIndex = getHighlightedIndex(store.state);

    if (highlightedIndex == null) {
      return { index: -1, value: undefined };
    }

    return {
      index: highlightedIndex,
      value: store.getValueAt(highlightedIndex) as Value | undefined,
    };
  });

  React.useEffect(() => {
    if (!onItemHighlighted) {
      lastReportedHighlightRef.current = null;
      return undefined;
    }

    lastReportedHighlightRef.current = resolveHighlightedItem();

    return store.subscribe(() => {
      const nextHighlight = resolveHighlightedItem();

      if (areHighlightsEqual(lastReportedHighlightRef.current, nextHighlight)) {
        return;
      }

      lastReportedHighlightRef.current = nextHighlight;

      const event = store.context.highlightEvent;
      stableOnItemHighlighted(
        nextHighlight.value,
        createGenericEventDetails(getHighlightReason(event), event, {
          index: nextHighlight.index,
        }) as ListboxRoot.HighlightEventDetails,
      );
    });
  }, [store, onItemHighlighted, stableOnItemHighlighted, resolveHighlightedItem]);
}

function areHighlightsEqual<Value>(
  prev: ResolvedHighlight<Value> | null,
  next: ResolvedHighlight<Value>,
) {
  return prev != null && prev.index === next.index && Object.is(prev.value, next.value);
}
