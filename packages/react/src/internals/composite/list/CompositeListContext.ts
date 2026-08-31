'use client';
import * as React from 'react';

export interface CompositeListRegistration<Metadata> {
  metadata: Metadata | null;
  index: number | null;
  label: string | null | undefined;
  textRef: React.RefObject<HTMLElement | null> | undefined;
}

export interface CompositeListContextValue<Metadata> {
  register: (node: Element, registration: CompositeListRegistration<Metadata>) => void;
  unregister: (node: Element) => void;
  subscribeMapChange: (fn: (map: Map<Element, Metadata>) => void) => () => void;
  nextIndexRef: React.RefObject<number>;
  /**
   * Present only on the default value. An item without a `CompositeList` above must not
   * guess an index from `nextIndexRef`: the default ref is a module-level singleton, so
   * consuming from it would leak state across unrelated orphan items.
   */
  orphan?: boolean | undefined;
}

export const CompositeListContext = React.createContext<CompositeListContextValue<any>>({
  register: () => {},
  unregister: () => {},
  subscribeMapChange: () => () => {},
  nextIndexRef: { current: 0 },
  orphan: true,
});

export function useCompositeListContext() {
  return React.useContext(CompositeListContext);
}
