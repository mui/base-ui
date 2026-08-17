export interface VirtualizerRowMetrics {
  /**
   * Logical offset from the start of the virtualized content.
   */
  offset: number;
  /**
   * Logical row size, including estimates for rows that have not been measured yet.
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
   * Scrolls an item into view by its logical collection index.
   */
  scrollToIndex: (index: number, options?: VirtualizerScrollToIndexOptions) => void;
}

/**
 * Imperative operations exposed by a list virtualizer to its owning list root.
 */
export interface VirtualizerHandle {
  /**
   * Returns the logical geometry for a row, including when it is outside the rendered window.
   */
  getRowMetrics: (rowIndex: number) => VirtualizerRowMetrics | null;
  /**
   * Scrolls an item into view by its logical collection index.
   */
  scrollToIndex: (index: number, options?: VirtualizerScrollToIndexOptions) => void;
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
