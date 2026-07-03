'use client';
import * as React from 'react';

export type CompositeMetadata<CustomMetadata> = {
  index?: number | null | undefined;
  labelRef?: React.RefObject<string | null> | undefined;
} & CustomMetadata;

export interface CompositeListContextValue<Metadata> {
  register: (node: HTMLElement, metadata: CompositeMetadata<Metadata>) => void;
  unregister: (node: HTMLElement) => void;
  subscribeMapChange: (
    fn: (map: Map<HTMLElement, CompositeMetadata<Metadata>>) => void,
  ) => () => void;
  elementsRef: React.RefObject<Array<HTMLElement | null>>;
  labelsRef?: React.RefObject<Array<string | null>> | undefined;
  nextIndexRef: React.RefObject<number>;
}

export const CompositeListContext = React.createContext<CompositeListContextValue<any>>({
  register: () => {},
  unregister: () => {},
  subscribeMapChange: () => {
    return () => {};
  },
  elementsRef: { current: [] },
  nextIndexRef: { current: 0 },
});

export function useCompositeListContext() {
  return React.useContext(CompositeListContext);
}
