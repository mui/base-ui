'use client';
import type * as React from 'react';

/**
 * Axis along which virtual items are measured and scrolled.
 */
export type VirtualizerOrientation = 'vertical' | 'horizontal';

/**
 * Alignment used when scrolling a virtual item into view.
 */
export type VirtualizerScrollAlign = 'start' | 'center' | 'end' | 'nearest';

/**
 * Stable key used to identify a virtual item between renders.
 */
export type VirtualizerItemKey = string | number;

/**
 * Estimated item size, either shared by all items or calculated per item index.
 */
export type VirtualizerEstimateSize = number | ((index: number) => number);

/**
 * Layout metadata for one logical item in the virtual collection.
 */
export interface VirtualizerMeasurement {
  /**
   * Logical index in the full collection.
   */
  index: number;
  /**
   * Distance from the start of the virtual content to the item start.
   */
  start: number;
  /**
   * Measured or estimated item size along the virtualized axis.
   */
  size: number;
  /**
   * Distance from the start of the virtual content to the item end.
   */
  end: number;
}

/**
 * Inclusive range of logical item indices that should be rendered.
 */
export interface VirtualizerRange {
  /**
   * First logical index to render.
   */
  startIndex: number;
  /**
   * Last logical index to render.
   */
  endIndex: number;
}

/**
 * Renderable virtual item metadata for component-specific adapters.
 */
export interface VirtualizerItem extends VirtualizerMeasurement {
  /**
   * Stable key for the item.
   */
  key: VirtualizerItemKey;
  /**
   * Ref callback that measures the rendered item element.
   */
  measureRef: React.RefCallback<HTMLElement>;
}

/**
 * Options for scrolling a logical item index into view.
 */
export interface VirtualizerScrollToIndexOptions {
  /**
   * How the item should be aligned within the scroll viewport.
   * @default 'nearest'
   */
  align?: VirtualizerScrollAlign | undefined;
  /**
   * Browser scroll behavior to use for the scroll operation.
   */
  behavior?: ScrollBehavior | undefined;
}

/**
 * Options for scrolling to an absolute virtualizer offset.
 */
export interface VirtualizerScrollToOffsetOptions {
  /**
   * Browser scroll behavior to use for the scroll operation.
   */
  behavior?: ScrollBehavior | undefined;
}

/**
 * Configuration for the shared virtualizer hook.
 */
export interface UseVirtualizerOptions {
  /**
   * Number of logical items in the full collection.
   */
  count: number;
  /**
   * Returns the scrollable element that owns the virtual viewport.
   */
  getScrollElement: () => HTMLElement | null;
  /**
   * Estimated item size used before item elements have been measured.
   */
  estimateSize: VirtualizerEstimateSize;
  /**
   * Returns a stable key for a logical item index.
   */
  getItemKey?: ((index: number) => VirtualizerItemKey) | undefined;
  /**
   * Number of extra items to render before and after the visible range.
   * @default 1
   */
  overscan?: number | undefined;
  /**
   * Empty space before the first item in the virtual content.
   * @default 0
   */
  paddingStart?: number | undefined;
  /**
   * Empty space after the last item in the virtual content.
   * @default 0
   */
  paddingEnd?: number | undefined;
  /**
   * Start-side viewport padding used when computing visible range and scroll alignment.
   * @default 0
   */
  scrollPaddingStart?: number | undefined;
  /**
   * End-side viewport padding used when computing visible range and scroll alignment.
   * @default 0
   */
  scrollPaddingEnd?: number | undefined;
  /**
   * Axis along which items are virtualized.
   * @default 'vertical'
   */
  orientation?: VirtualizerOrientation | undefined;
  /**
   * Whether scroll and measurement observers should be active.
   * @default true
   */
  enabled?: boolean | undefined;
}

/**
 * Runtime state and actions returned by the shared virtualizer hook.
 */
export interface Virtualizer {
  /**
   * Virtual items that should be rendered for the current scroll state.
   */
  virtualItems: VirtualizerItem[];
  /**
   * Layout metadata for every logical item.
   */
  measurements: VirtualizerMeasurement[];
  /**
   * Inclusive range represented by `virtualItems`.
   */
  range: VirtualizerRange;
  /**
   * Total virtual content size, including virtual padding.
   */
  totalSize: number;
  /**
   * Current scroll offset along the virtualized axis.
   */
  scrollOffset: number;
  /**
   * Current viewport size along the virtualized axis.
   */
  viewportSize: number;
  /**
   * Returns the latest renderable virtual item metadata.
   */
  getVirtualItems: () => VirtualizerItem[];
  /**
   * Returns the latest total virtual content size.
   */
  getTotalSize: () => number;
  /**
   * Re-measures the scroll viewport and all currently mounted items.
   */
  measure: () => void;
  /**
   * Measures a mounted item element using its `data-index` attribute.
   */
  measureElement: (element: HTMLElement | null) => void;
  /**
   * Measures or clears the mounted element for a logical item index.
   */
  measureItem: (index: number, element: HTMLElement | null) => void;
  /**
   * Clears measured item sizes so future layout uses estimates until items mount again.
   */
  resetMeasurements: () => void;
  /**
   * Scrolls the viewport to reveal a logical item index.
   */
  scrollToIndex: (index: number, options?: VirtualizerScrollToIndexOptions) => void;
  /**
   * Scrolls the viewport to an absolute virtualizer offset.
   */
  scrollToOffset: (offset: number, options?: VirtualizerScrollToOffsetOptions) => void;
}
