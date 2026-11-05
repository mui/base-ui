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
      value: store.context.valuesRef.current[highlightedIndex] as Value | undefined,
    };
  });

  const areHighlightsEqual = useStableCallback(
    (prev: ResolvedHighlight<Value> | null, next: ResolvedHighlight<Value>) => {
      if (prev == null || prev.index !== next.index) {
        return false;
      }
      if (prev.value == null || next.value == null) {
        return prev.value === next.value;
      }
      return store.state.isItemEqualToValue(prev.value, next.value);
    },
  );

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
  }, [
    store,
    onItemHighlighted,
    stableOnItemHighlighted,
    resolveHighlightedItem,
    areHighlightsEqual,
  ]);
}
