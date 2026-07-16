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
  subscribeMapChange: (fn: (map: Map<Element, Metadata | null>) => void) => () => void;
  nextIndexRef: React.RefObject<number>;
}

export const CompositeListContext = React.createContext<CompositeListContextValue<any>>({
  register: () => {},
  unregister: () => {},
  subscribeMapChange: () => () => {},
  nextIndexRef: { current: 0 },
});

export function useCompositeListContext() {
  return React.useContext(CompositeListContext);
}
