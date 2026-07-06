'use client';
import * as React from 'react';
import { ownerWindow } from '@base-ui/utils/owner';
import { useAnimationFrame } from '@base-ui/utils/useAnimationFrame';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
import { useStableCallback } from '@base-ui/utils/useStableCallback';
import {
  getOffsetForIndex,
  getVirtualizerMeasurements,
  getVirtualizerRange,
  normalizeVirtualizerCount,
  normalizeVirtualizerSize,
} from './virtualizerMath';
import type {
  UseVirtualizerOptions,
  Virtualizer,
  VirtualizerItem,
  VirtualizerOrientation,
  VirtualizerScrollToIndexOptions,
  VirtualizerScrollToOffsetOptions,
} from './types';

interface ScrollState {
  scrollOffset: number;
  viewportSize: number;
}

const EMPTY_SCROLL_STATE: ScrollState = {
  scrollOffset: 0,
  viewportSize: 0,
};

/**
 * Creates virtualized range state and measurement actions for a scrollable collection.
 */
export function useVirtualizer(options: UseVirtualizerOptions): Virtualizer {
  const {
    count,
    estimateSize,
    getItemKey,
    overscan = 1,
    paddingStart = 0,
    paddingEnd = 0,
    scrollPaddingStart = 0,
    scrollPaddingEnd = 0,
    orientation = 'vertical',
    enabled = true,
  } = options;

  const itemCount = normalizeVirtualizerCount(count);
  const getScrollElement = useStableCallback(options.getScrollElement);
  const frame = useAnimationFrame();

  const measuredSizesRef = React.useRef<Map<number, number>>(new Map());
  const itemElementsRef = React.useRef<Map<number, HTMLElement>>(new Map());
  const itemResizeObserversRef = React.useRef<Map<number, ResizeObserver>>(new Map());
  const measureRefCacheRef = React.useRef<Map<number, React.RefCallback<HTMLElement>>>(new Map());

  const [measurementsVersion, forceMeasurementsUpdate] = React.useReducer(
    (version: number) => version + 1,
    0,
  );
  const [scrollState, setScrollState] = React.useState<ScrollState>(EMPTY_SCROLL_STATE);

  const syncScrollState = useStableCallback(() => {
    const scrollElement = getScrollElement();

    if (!enabled || !scrollElement) {
      setScrollState((previousState) =>
        previousState === EMPTY_SCROLL_STATE ? previousState : EMPTY_SCROLL_STATE,
      );
      return;
    }

    const nextScrollState = getScrollState(scrollElement, orientation);

    setScrollState((previousState) => {
      if (
        previousState.scrollOffset === nextScrollState.scrollOffset &&
        previousState.viewportSize === nextScrollState.viewportSize
      ) {
        return previousState;
      }

      return nextScrollState;
    });
  });

  const requestScrollStateSync = useStableCallback(() => {
    frame.request(syncScrollState);
  });

  const measureItemElement = useStableCallback((index: number, element: HTMLElement) => {
    if (index < 0 || index >= itemCount) {
      return;
    }

    const nextSize = getElementSize(element, orientation);
    const previousSize = measuredSizesRef.current.get(index);

    if (previousSize === nextSize) {
      return;
    }

    measuredSizesRef.current.set(index, nextSize);
    forceMeasurementsUpdate();
  });

  const unobserveItem = useStableCallback((index: number) => {
    const resizeObserver = itemResizeObserversRef.current.get(index);
    resizeObserver?.disconnect();
    itemResizeObserversRef.current.delete(index);
    itemElementsRef.current.delete(index);
  });

  const measureItem = useStableCallback((index: number, element: HTMLElement | null) => {
    if (!Number.isInteger(index) || index < 0) {
      return;
    }

    const previousElement = itemElementsRef.current.get(index);

    if (element == null) {
      if (previousElement) {
        unobserveItem(index);
      }
      return;
    }

    if (previousElement === element) {
      measureItemElement(index, element);
      return;
    }

    if (previousElement) {
      unobserveItem(index);
    }

    itemElementsRef.current.set(index, element);
    measureItemElement(index, element);

    const ResizeObserverCtor = ownerWindow(element).ResizeObserver;
    if (typeof ResizeObserverCtor !== 'function') {
      return;
    }

    const resizeObserver = new ResizeObserverCtor(() => {
      measureItemElement(index, element);
    });
    resizeObserver.observe(element);
    itemResizeObserversRef.current.set(index, resizeObserver);
  });

  const measureElement = useStableCallback((element: HTMLElement | null) => {
    if (!element) {
      return;
    }

    const index = Number(element.getAttribute('data-index'));
    measureItem(index, element);
  });

  const measure = useStableCallback(() => {
    syncScrollState();
    itemElementsRef.current.forEach((element, index) => {
      measureItemElement(index, element);
    });
  });

  const resetMeasurements = useStableCallback(() => {
    if (measuredSizesRef.current.size === 0) {
      return;
    }

    measuredSizesRef.current.clear();
    forceMeasurementsUpdate();
  });

  useIsoLayoutEffect(() => {
    if (!enabled) {
      syncScrollState();
      return undefined;
    }

    const scrollElement = getScrollElement();
    if (!scrollElement) {
      syncScrollState();
      return undefined;
    }

    syncScrollState();

    const ResizeObserverCtor = ownerWindow(scrollElement).ResizeObserver;
    const resizeObserver =
      typeof ResizeObserverCtor === 'function'
        ? new ResizeObserverCtor(requestScrollStateSync)
        : null;

    resizeObserver?.observe(scrollElement);
    scrollElement.addEventListener('scroll', requestScrollStateSync, { passive: true });

    return () => {
      resizeObserver?.disconnect();
      scrollElement.removeEventListener('scroll', requestScrollStateSync);
    };
  }, [enabled, getScrollElement, requestScrollStateSync, syncScrollState]);

  useIsoLayoutEffect(() => {
    let measurementsChanged = false;

    itemElementsRef.current.forEach((element, index) => {
      if (index >= itemCount) {
        unobserveItem(index);
        measuredSizesRef.current.delete(index);
        measurementsChanged = true;
        return;
      }

      measureItemElement(index, element);
    });

    if (measurementsChanged) {
      forceMeasurementsUpdate();
    }
  }, [itemCount, measureItemElement, unobserveItem]);

  useIsoLayoutEffect(() => {
    const itemResizeObservers = itemResizeObserversRef.current;
    const itemElements = itemElementsRef.current;

    return () => {
      itemResizeObservers.forEach((resizeObserver) => {
        resizeObserver.disconnect();
      });
      itemResizeObservers.clear();
      itemElements.clear();
    };
  }, []);

  const { measurements, totalSize } = React.useMemo(() => {
    // Measurements live in a ref; this version invalidates the memo when they change.
    void measurementsVersion;

    return getVirtualizerMeasurements({
      count: itemCount,
      estimateSize,
      measuredSizes: measuredSizesRef.current,
      paddingStart,
      paddingEnd,
    });
  }, [itemCount, estimateSize, paddingStart, paddingEnd, measurementsVersion]);

  const range = React.useMemo(
    () =>
      getVirtualizerRange({
        measurements,
        scrollOffset: scrollState.scrollOffset,
        viewportSize: scrollState.viewportSize,
        overscan,
        scrollPaddingStart,
        scrollPaddingEnd,
      }),
    [
      measurements,
      scrollState.scrollOffset,
      scrollState.viewportSize,
      overscan,
      scrollPaddingStart,
      scrollPaddingEnd,
    ],
  );

  const virtualItems = React.useMemo(() => {
    if (range.endIndex < range.startIndex) {
      return [];
    }

    const items: VirtualizerItem[] = [];

    for (let index = range.startIndex; index <= range.endIndex; index += 1) {
      const measurement = measurements[index];

      items.push({
        ...measurement,
        key: getItemKey ? getItemKey(index) : index,
        measureRef: getMeasureRef(measureRefCacheRef.current, index, measureItem),
      });
    }

    return items;
  }, [getItemKey, measureItem, measurements, range.endIndex, range.startIndex]);

  const scrollToOffset = useStableCallback(
    (offset: number, scrollOptions: VirtualizerScrollToOffsetOptions = {}) => {
      const scrollElement = getScrollElement();

      if (!scrollElement) {
        return;
      }

      const viewportSize = getViewportSize(scrollElement, orientation);
      const nextOffset = clampScrollOffset(offset, totalSize, viewportSize);

      if (typeof scrollElement.scrollTo === 'function') {
        const nextScrollOptions =
          orientation === 'horizontal'
            ? { left: nextOffset, behavior: scrollOptions.behavior }
            : { top: nextOffset, behavior: scrollOptions.behavior };

        scrollElement.scrollTo(nextScrollOptions);
      } else if (orientation === 'horizontal') {
        scrollElement.scrollLeft = nextOffset;
      } else {
        scrollElement.scrollTop = nextOffset;
      }

      syncScrollState();
    },
  );

  const scrollToIndex = useStableCallback(
    (index: number, scrollOptions: VirtualizerScrollToIndexOptions = {}) => {
      const scrollElement = getScrollElement();

      if (!scrollElement) {
        return;
      }

      const nextOffset = getOffsetForIndex({
        measurements,
        index,
        align: scrollOptions.align,
        scrollOffset: getScrollOffset(scrollElement, orientation),
        viewportSize: getViewportSize(scrollElement, orientation),
        scrollPaddingStart,
        scrollPaddingEnd,
        totalSize,
      });

      scrollToOffset(nextOffset, scrollOptions);
    },
  );

  const getVirtualItems = React.useCallback(() => virtualItems, [virtualItems]);
  const getTotalSize = React.useCallback(() => totalSize, [totalSize]);

  return {
    virtualItems,
    measurements,
    range,
    totalSize,
    scrollOffset: scrollState.scrollOffset,
    viewportSize: scrollState.viewportSize,
    getVirtualItems,
    getTotalSize,
    measure,
    measureElement,
    measureItem,
    resetMeasurements,
    scrollToIndex,
    scrollToOffset,
  };
}

function getMeasureRef(
  cache: Map<number, React.RefCallback<HTMLElement>>,
  index: number,
  measureItem: (index: number, element: HTMLElement | null) => void,
): React.RefCallback<HTMLElement> {
  const cachedRef = cache.get(index);
  if (cachedRef) {
    return cachedRef;
  }

  const measureRef: React.RefCallback<HTMLElement> = (element) => {
    measureItem(index, element);
  };
  cache.set(index, measureRef);
  return measureRef;
}

function getScrollState(element: HTMLElement, orientation: VirtualizerOrientation): ScrollState {
  return {
    scrollOffset: getScrollOffset(element, orientation),
    viewportSize: getViewportSize(element, orientation),
  };
}

function getScrollOffset(element: HTMLElement, orientation: VirtualizerOrientation): number {
  return normalizeVirtualizerSize(
    orientation === 'horizontal' ? element.scrollLeft : element.scrollTop,
  );
}

function getViewportSize(element: HTMLElement, orientation: VirtualizerOrientation): number {
  return normalizeVirtualizerSize(
    orientation === 'horizontal' ? element.clientWidth : element.clientHeight,
  );
}

function getElementSize(element: HTMLElement, orientation: VirtualizerOrientation): number {
  const rect = element.getBoundingClientRect();
  return normalizeVirtualizerSize(orientation === 'horizontal' ? rect.width : rect.height);
}

function clampScrollOffset(offset: number, totalSize: number, viewportSize: number): number {
  const maxOffset = Math.max(0, normalizeVirtualizerSize(totalSize) - viewportSize);
  return Math.max(0, Math.min(normalizeVirtualizerSize(offset), maxOffset));
}
