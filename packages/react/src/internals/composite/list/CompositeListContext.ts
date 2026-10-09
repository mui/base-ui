'use client';
import * as React from 'react';
import { NOOP } from '@base-ui/utils/empty';

export interface CompositeListRegistration<Metadata> {
  metadata: Metadata | null;
  /** The explicit index, or `null` to index the item by its document position. */
  index: number | null;
  label: string | null | undefined;
  textRef: React.RefObject<HTMLElement | null> | undefined;
  /** Receives the document-position index resolved for an item without an explicit `index`. */
  setIndex: (index: number) => void;
}

export interface CompositeListContextValue<Metadata> {
  register: (node: Element, registration: CompositeListRegistration<Metadata>) => void;
  unregister: (node: Element) => void;
  /** Called with each published map, before the list's own `onMapChange`. */
  subscribeMapChange: (fn: (map: Map<Element, Metadata>) => void) => () => void;
  /** Reserves the next render-order index for an item rendering before the list resolves it. */
  guessIndex: () => number;
}

// Items can render without a list, for example combobox items in a virtualized list, so the
// defaults keep them inert: registrations are dropped and guesses stay unresolved.
export const CompositeListContext = React.createContext<CompositeListContextValue<any>>({
  register: NOOP,
  unregister: NOOP,
  subscribeMapChange: () => NOOP,
  guessIndex: () => -1,
});

export function useCompositeListContext() {
  return React.useContext(CompositeListContext);
}
