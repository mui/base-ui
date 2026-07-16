export interface ListVirtualizerHandle {
  resetScroll: () => void;
}

export interface ListVirtualizationRegistry {
  // Exposed as an external-store contract so virtualizers can react even when the request begins
  // before their layout effects have registered an imperative handle.
  getRenderAllRows: () => boolean;
  nonVirtualItemCount: number;
  setRenderAllRows: (renderAllRows: boolean) => void;
  subscribeRenderAllRows: (listener: () => void) => () => void;
  virtualizers: Map<symbol, ListVirtualizerHandle>;
}

export function createListVirtualizationRegistry(): ListVirtualizationRegistry {
  const listeners = new Set<() => void>();
  let renderAllRows = false;
  const registry: ListVirtualizationRegistry = {
    getRenderAllRows: () => renderAllRows,
    nonVirtualItemCount: 0,
    setRenderAllRows(nextRenderAllRows) {
      if (renderAllRows === nextRenderAllRows) {
        return;
      }
      renderAllRows = nextRenderAllRows;
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

export function setListVirtualizersRenderAllRows(
  registry: ListVirtualizationRegistry,
  renderAllRows: boolean,
) {
  registry.setRenderAllRows(renderAllRows);
}
