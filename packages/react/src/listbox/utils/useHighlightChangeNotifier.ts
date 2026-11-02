'use client';
import * as React from 'react';
import { useStableCallback } from '@base-ui/utils/useStableCallback';
import type { ListboxStore } from '../store';

interface ResolvedHighlight<Value> {
  activeIndex: number | null;
  value: Value | null;
  element: HTMLElement | null;
}

/**
 * Manages the `onHighlightChange` callback for the listbox.
 *
 * Subscribes to the store's `activeIndex` and resolves the corresponding
 * item value and DOM element.
 */
export function useHighlightChangeNotifier<Value>(params: {
  store: ListboxStore;
  onHighlightChange: ((value: Value | null, element: HTMLElement | null) => void) | undefined;
}): void {
  const { store, onHighlightChange } = params;

  const stableOnHighlightChange = useStableCallback(
    (highlightedValue: Value | null, highlightedElement: HTMLElement | null) => {
      onHighlightChange?.(highlightedValue, highlightedElement);
    },
  );

  const lastReportedHighlightRef = React.useRef<ResolvedHighlight<Value> | null>(null);

  const resolveHighlightedItem = useStableCallback((): ResolvedHighlight<Value> => {
    const activeIndex = store.state.activeIndex;

    if (activeIndex == null) {
      return { activeIndex: null, value: null, element: null };
    }

    const itemValue = store.context.valuesRef.current[activeIndex] as Value | undefined;
    const listEl = store.state.listElement;
    const element = listEl?.querySelectorAll<HTMLElement>('[role="option"]')[activeIndex] ?? null;

    return {
      activeIndex,
      value: itemValue ?? null,
      element,
    };
  });

  const areHighlightsEqual = useStableCallback(
    (prev: ResolvedHighlight<Value> | null, next: ResolvedHighlight<Value>) => {
      if (prev == null) {
        return false;
      }
      if (prev.activeIndex !== next.activeIndex || prev.element !== next.element) {
        return false;
      }
      if (prev.value == null || next.value == null) {
        return prev.value === next.value;
      }
      return store.state.isItemEqualToValue(prev.value, next.value);
    },
  );

  React.useEffect(() => {
    if (!onHighlightChange) {
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
      stableOnHighlightChange(nextHighlight.value, nextHighlight.element);
    });
  }, [
    store,
    onHighlightChange,
    stableOnHighlightChange,
    resolveHighlightedItem,
    areHighlightsEqual,
  ]);
}
