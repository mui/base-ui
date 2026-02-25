'use client';
import { NOOP } from '@base-ui/utils/empty';
import * as React from 'react';

export interface CompositeListContextValue<Metadata> {
  register: (node: Element, metadata: Metadata) => void;
  unregister: (node: Element) => void;
  subscribeMapChange: (fn: (map: Map<Element, Metadata | null>) => void) => () => void;
  elementsRef: React.RefObject<Array<HTMLElement | null>>;
  labelsRef?: React.RefObject<Array<string | null>> | undefined;
  nextIndexRef: React.RefObject<number>;
}

export const CompositeListContext = React.createContext<CompositeListContextValue<any>>({
  register: NOOP,
  unregister: NOOP,
  subscribeMapChange: () => {
    return NOOP;
  },
  elementsRef: { current: [] },
  nextIndexRef: { current: 0 },
});

export function useCompositeListContext() {
  return React.useContext(CompositeListContext);
}
