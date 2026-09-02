export interface VirtualizerItemMetrics {
  /**
   * The scroll position at which the item's start edge meets the start of the scrollport's
   * content box, so it can be passed straight to `scrollTo`. Logical: it includes estimates for
   * items that have not been measured yet, and it accounts for the scrollport's block padding.
   */
  offset: number;
  /**
   * Logical item size, including estimates for items that have not been measured yet.
   */
  size: number;
}

export type VirtualizerScrollAlignment = 'auto' | 'center' | 'end' | 'start';

export interface VirtualizerScrollToIndexOptions {
  /**
   * Where to place the item in the scrollport. `auto` only scrolls when the item is outside the
   * visible area.
   * @default 'auto'
   */
  align?: VirtualizerScrollAlignment | undefined;
}

/**
 * Imperative actions exposed by the `Virtualizer` component.
 */
export interface VirtualizerActions {
  /**
   * Returns the index of the last item starting at or before the given scroll position, or `null`
   * when the collection is empty. Inverse of `getItemMetrics`, for answering which item a scroll
   * position lands on without mounting the items in between.
   */
  getIndexAtOffset: (offset: number) => number | null;
  /**
   * Returns the logical geometry of an item, including when it is outside the rendered window, or
   * `null` when the index is outside the collection.
   */
  getItemMetrics: (index: number) => VirtualizerItemMetrics | null;
  /**
   * Discards the item heights measured so far, so they are taken again against the layout the
   * items are in now. Call it after a change that resizes items without changing the collection,
   * such as crossing a layout breakpoint: items on screen resize on their own, while the heights
   * cached for the rest describe the layout they were last measured in. The scroll position is
   * kept, which is what remounting the virtualizer to clear them loses.
   */
  remeasure: () => void;
  /**
   * Scrolls an item into view by its logical collection index.
   */
  scrollToIndex: (index: number, options?: VirtualizerScrollToIndexOptions) => void;
}

/**
 * Imperative operations exposed by a list virtualizer to its owning list root.
 */
export interface VirtualizerHandle {
  /**
   * Returns the index of the last item starting at or before the given scroll position.
   */
  getIndexAtOffset: (offset: number) => number | null;
  /**
   * Returns the element that scrolls the windowed collection, or `null` before it is attached.
   *
   * A getter rather than a value: the element arrives through a ref, without a render, so a
   * property captured on the handle when it is created would stay `null` for the handle's life.
   * A list needs the element itself to observe scrolling, since a scroll event does not bubble
   * out of the element that scrolls.
   */
  getScrollElement: () => HTMLElement | null;
  /**
   * Returns the logical geometry for an item, including when it is outside the rendered window.
   */
  getItemMetrics: (index: number) => VirtualizerItemMetrics | null;
  /**
   * Scrolls an item into view by its logical collection index.
   */
  scrollToIndex: (index: number, options?: VirtualizerScrollToIndexOptions) => void;
  /**
   * Discards measured item heights so they are taken again against the current layout.
   */
  remeasure: () => void;
  /**
   * Resets the virtualizer's scroll position to the start of the list.
   */
  resetScroll: () => void;
}

/**
 * A virtualizer registered with a list root: its imperative operations, plus the state the root
 * needs to tell which behaviors the virtualizer currently owns.
 */
export interface RegisteredVirtualizer extends VirtualizerHandle {
  /**
   * Whether the virtualizer is currently mounting a window of rows and owning the scroll position.
   * A disabled virtualizer renders the whole collection and behaves like a plain scrolling list.
   */
  enabled: boolean;
}

/**
 * Coordinates virtualized and non-virtualized content rendered by a single list root.
 */
export interface ListVirtualizationRegistry {
  /**
   * Number of non-virtualized items currently registered with the list.
   */
  nonVirtualItemCount: number;
  /**
   * Called when a virtualizer registers, unregisters, or replaces its handle.
   *
   * The `virtualizer` field below is mutable and notifies nobody, which is enough for a list that only reads it
   * from an effect or an event handler: registration happens in the virtualizer's layout effect,
   * and React runs those child-first, so every ancestor effect in the same commit already sees it.
   * A list that must know while *rendering* — to choose a prop rather than to run an effect —
   * needs this instead, and must hold the result in React state rather than in an external store:
   * a state update made from the layout-effect phase is flushed before paint, while a store
   * subscription is installed passively, after it.
   */
  onVirtualizerChange?: ((virtualizer: RegisteredVirtualizer | null) => void) | undefined;
  /**
   * The registered virtualizer. A list supports at most one; the adapter warns when more than one
   * registers.
   */
  virtualizer: RegisteredVirtualizer | null;
}

/**
 * Creates the virtualization registry owned by a list root.
 */
export function createListVirtualizationRegistry(): ListVirtualizationRegistry {
  return {
    nonVirtualItemCount: 0,
    virtualizer: null,
  };
}
