'use client';
import * as React from 'react';
import { useStableCallback } from '@base-ui/utils/useStableCallback';
import { createGenericEventDetails } from '../../internals/createBaseUIEventDetails';
import { getHighlightReason } from '../../utils/getHighlightReason';
import type { ListboxStore } from '../store';
import type { ListboxRoot } from '../root/ListboxRoot';

interface ResolvedHighlight<Value> {
  index: number;
  value: Value | undefined;
}

/**
 * Calls `onItemHighlighted` when the highlighted item changes.
 *
 * Subscribes to the store's `activeIndex`, resolves the highlighted item's value,
 * and derives the reason from the event recorded by `store.setActiveIndex()`.
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
    const activeIndex = store.state.activeIndex;

    if (activeIndex == null) {
      return { index: -1, value: undefined };
    }

    return {
      index: activeIndex,
      value: store.context.valuesRef.current[activeIndex] as Value | undefined,
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
        }),
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
