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
   * Returns whether registered virtualizers should temporarily render every row.
   *
   * This is exposed as an external-store contract so virtualizers can react even when the request
   * begins before their layout effects have registered an imperative handle.
   */
  getRenderAllRows: () => boolean;
  /**
   * Returns a version that changes whenever a render-all pass finishes.
   *
   * Virtualizers use this to restore their constrained viewport even if they remount after the
   * render-all pass.
   */
  getRenderAllRowsRestoreVersion: () => number;
  /**
   * Number of non-virtualized items currently registered with the list.
   */
  nonVirtualItemCount: number;
  /**
   * Sets whether registered virtualizers should temporarily render every row.
   */
  setRenderAllRows: (renderAllRows: boolean) => void;
  /**
   * Subscribes to changes to the temporary render-all state.
   */
  subscribeRenderAllRows: (listener: () => void) => () => void;
  /**
   * Imperative handles for the virtualizers currently registered with the list.
   */
  virtualizers: Map<symbol, ListVirtualizerHandle>;
}

/**
 * Creates the virtualization registry owned by a list root.
 */
export function createListVirtualizationRegistry(): ListVirtualizationRegistry {
  const listeners = new Set<() => void>();
  let renderAllRows = false;
  let renderAllRowsRestoreVersion = 0;
  const registry: ListVirtualizationRegistry = {
    getRenderAllRows: () => renderAllRows,
    getRenderAllRowsRestoreVersion: () => renderAllRowsRestoreVersion,
    nonVirtualItemCount: 0,
    setRenderAllRows(nextRenderAllRows) {
      if (renderAllRows === nextRenderAllRows) {
        return;
      }
      renderAllRows = nextRenderAllRows;
      if (!nextRenderAllRows) {
        renderAllRowsRestoreVersion += 1;
      }
      listeners.forEach((listener) => listener());
    },
    subscribeRenderAllRows(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    virtualizers: new Map(),
  };
  return registry;
}

/**
 * Sets the temporary render-all state shared by every virtualizer registered with a list root.
 */
export function setListVirtualizersRenderAllRows(
  registry: ListVirtualizationRegistry,
  renderAllRows: boolean,
) {
  registry.setRenderAllRows(renderAllRows);
}
