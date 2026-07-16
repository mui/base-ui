export interface ListVirtualizerHandle {
  resetScroll: () => void;
}

export interface ListVirtualizationRegistry {
  nonVirtualItemCount: number;
  virtualizers: Map<symbol, ListVirtualizerHandle>;
}

export function createListVirtualizationRegistry(): ListVirtualizationRegistry {
  return {
    nonVirtualItemCount: 0,
    virtualizers: new Map(),
  };
}
