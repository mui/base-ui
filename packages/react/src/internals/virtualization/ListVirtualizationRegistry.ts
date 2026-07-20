/**
 * Imperative operations exposed by a list virtualizer to its owning list root.
 */
export interface ListVirtualizerHandle {
  /**
   * Resets the virtualizer's scroll position to the start of the list.
   */
  resetScroll: () => void;
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
   * Imperative handles for the virtualizers currently registered with the list.
   */
  virtualizers: Map<symbol, ListVirtualizerHandle>;
}

/**
 * Creates the virtualization registry owned by a list root.
 */
export function createListVirtualizationRegistry(): ListVirtualizationRegistry {
  return {
    nonVirtualItemCount: 0,
    virtualizers: new Map(),
  };
}
