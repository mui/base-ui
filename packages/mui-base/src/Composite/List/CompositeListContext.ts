import * as React from 'react';

export interface CompositeListContextValue {
  register: (node: Node) => void;
  unregister: (node: Node) => void;
  map: Map<Node, number | null>;
  elementsRef: React.MutableRefObject<Array<HTMLElement | null>>;
  labelsRef?: React.MutableRefObject<Array<string | null>>;
}

export const CompositeListContext = React.createContext<CompositeListContextValue>({
  register: () => {},
  unregister: () => {},
  map: new Map(),
  elementsRef: { current: [] },
});

export function useCompositeListContext() {
  return React.useContext(CompositeListContext);
}
