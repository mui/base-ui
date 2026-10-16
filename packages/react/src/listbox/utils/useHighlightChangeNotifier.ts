'use client';
import * as React from 'react';
import { useStableCallback } from '@base-ui/utils/useStableCallback';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
import { useTimeout } from '@base-ui/utils/useTimeout';
import { useAnimationFrame } from '@base-ui/utils/useAnimationFrame';
import type { ListboxStore } from '../store';
import { afterDomSettle } from './afterDomSettle';

interface ResolvedHighlight<Value> {
  activeIndex: number | null;
  value: Value | null;
  element: HTMLElement | null;
}

/**
 * Manages the `onHighlightChange` callback for the listbox.
 *
 * Subscribes to the store's `activeIndex` and resolves the corresponding
 * item value and DOM element. After reorder operations the composite
 * registry needs two render cycles to settle, so the hook defers
 * reporting until the indices are stable.
 */
export function useHighlightChangeNotifier<Value>(params: {
  store: ListboxStore;
  onHighlightChange: ((value: Value | null, element: HTMLElement | null) => void) | undefined;
}): { requestHighlightReconcile: () => void } {
  const { store, onHighlightChange } = params;

  const highlightChangeTimeout = useTimeout();
  const highlightChangeFrame = useAnimationFrame();

  const stableOnHighlightChange = useStableCallback(
    (highlightedValue: Value | null, highlightedElement: HTMLElement | null) => {
      onHighlightChange?.(highlightedValue, highlightedElement);
    },
  );

  // Keyboard and DnD reorders update activeIndex before the composite registry
  // and DOM finish re-indexing items. Mark those transitions so the subscription
  // can skip the provisional callback and only report the settled highlight.
  const highlightReconcileRequestedRef = React.useRef(false);
  const [highlightReconcileVersion, setHighlightReconcileVersion] = React.useState(0);

  const requestHighlightReconcile = useStableCallback(() => {
    highlightReconcileRequestedRef.current = true;
    setHighlightReconcileVersion((prev) => prev + 1);
  });

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

  const reconcileHighlightedItem = useStableCallback(() => {
    if (!onHighlightChange) {
      highlightReconcileRequestedRef.current = false;
      return;
    }

    // After a reorder, the highlighted index may point at stale registry data
    // until the composite finishes re-indexing items. Wait for that work to
    // settle, then re-resolve the highlighted value/element.
    afterDomSettle(highlightChangeTimeout, highlightChangeFrame, () => {
      const nextHighlight = resolveHighlightedItem();
      highlightReconcileRequestedRef.current = false;

      if (areHighlightsEqual(lastReportedHighlightRef.current, nextHighlight)) {
        return;
      }

      lastReportedHighlightRef.current = nextHighlight;
      stableOnHighlightChange(nextHighlight.value, nextHighlight.element);
    });
  });

  React.useEffect(() => {
    if (!onHighlightChange) {
      lastReportedHighlightRef.current = null;
      highlightReconcileRequestedRef.current = false;
      return undefined;
    }

    lastReportedHighlightRef.current = resolveHighlightedItem();

    return store.subscribe(() => {
      const nextHighlight = resolveHighlightedItem();

      if (areHighlightsEqual(lastReportedHighlightRef.current, nextHighlight)) {
        return;
      }

      if (highlightReconcileRequestedRef.current) {
        requestHighlightReconcile();
        return;
      }

      lastReportedHighlightRef.current = nextHighlight;
      stableOnHighlightChange(nextHighlight.value, nextHighlight.element);
    });
  }, [
    store,
    onHighlightChange,
    requestHighlightReconcile,
    stableOnHighlightChange,
    resolveHighlightedItem,
    areHighlightsEqual,
  ]);

  useIsoLayoutEffect(() => {
    if (
      !onHighlightChange ||
      !highlightReconcileRequestedRef.current ||
      lastReportedHighlightRef.current == null
    ) {
      return;
    }

    reconcileHighlightedItem();
  }, [highlightReconcileVersion, onHighlightChange, reconcileHighlightedItem]);

  return { requestHighlightReconcile };
}
