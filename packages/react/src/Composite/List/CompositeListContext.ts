'use client';
import * as React from 'react';

export interface CompositeListContextValue<Metadata> {
  register: (node: Node, metadata: Metadata) => void;
  unregister: (node: Node) => void;
  map: Map<Node, Metadata | null>;
  elementsRef: React.RefObject<Array<HTMLElement | null>>;
  labelsRef?: React.RefObject<Array<string | null>>;
}

export const CompositeListContext = React.createContext<CompositeListContextValue<any>>({
  register: () => {},
  unregister: () => {},
  map: new Map(),
  elementsRef: { current: [] },
});

if (process.env.NODE_ENV !== 'production') {
  CompositeListContext.displayName = 'CompositeListContext';
}

export function useCompositeListContext() {
  return React.useContext(CompositeListContext);
}
