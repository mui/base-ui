/* eslint-disable no-bitwise */
'use client';
import * as React from 'react';
import { CompositeListContext } from './CompositeListContext';
import { useLazyRef } from '../../utils/useLazyRef';
import { useEventCallback } from '../../utils/useEventCallback';
import { useModernLayoutEffect } from '../../utils/useModernLayoutEffect';

export type CompositeMetadata<CustomMetadata> = { index?: number | null } & CustomMetadata;

/**
 * Provides context for a list of items in a composite component.
 * @internal
 */
export function CompositeList<Metadata>(props: CompositeList.Props<Metadata>) {
  const { children, elementsRef, labelsRef, onMapChange } = props;

  const nextIndexRef = React.useRef(0);
  const listeners = useLazyRef(createListeners).current;

  const map = useLazyRef(createMap<Metadata>).current;
  const [mapTick, setMapTick] = React.useState(0);

  const register = useEventCallback((node: Element, metadata: Metadata) => {
    map.set(node, metadata ?? null);
    setMapTick(increment);
  });

  const unregister = useEventCallback((node: Element) => {
    map.delete(node);
    setMapTick(increment);
  });

  const sortedMap = React.useMemo(() => {
    // `mapTick` is the `useMemo` trigger as `map` is stable.
    disableEslintWarning(mapTick);

    const newMap = new Map<Element, CompositeMetadata<Metadata>>();
    const sortedNodes = Array.from(map.keys()).sort(sortByDocumentPosition);

    sortedNodes.forEach((node, index) => {
      const metadata = map.get(node) ?? ({} as CompositeMetadata<Metadata>);
      newMap.set(node, { ...metadata, index });
    });

    return newMap;
  }, [map, mapTick]);

  useModernLayoutEffect(() => {
    onMapChange?.(sortedMap)
  }, [onMapChange, sortedMap])

  const subscribeMapChange = useEventCallback((fn) => {
    listeners.add(fn);
    return () => {
      listeners.delete(fn);
    };
  });

  useModernLayoutEffect(() => {
    listeners.forEach((l) => l(sortedMap));
  }, [listeners, sortedMap]);

  const contextValue = React.useMemo(
    () => ({ register, unregister, subscribeMapChange, elementsRef, labelsRef, nextIndexRef }),
    [register, unregister, subscribeMapChange, elementsRef, labelsRef, nextIndexRef],
  );

  return (
    <CompositeListContext.Provider value={contextValue}>{children}</CompositeListContext.Provider>
  );
}

function createMap<Metadata>() {
  return new Map<Element, CompositeMetadata<Metadata> | null>();
}

function createListeners() {
  return new Set<Function>();
}

function increment(t: number) {
  return t + 1;
}

function sortByDocumentPosition(a: Element, b: Element) {
  const position = a.compareDocumentPosition(b);

  if (
    position & Node.DOCUMENT_POSITION_FOLLOWING ||
    position & Node.DOCUMENT_POSITION_CONTAINED_BY
  ) {
    return -1;
  }

  if (position & Node.DOCUMENT_POSITION_PRECEDING || position & Node.DOCUMENT_POSITION_CONTAINS) {
    return 1;
  }

  return 0;
}

function disableEslintWarning(_: any) {};

export namespace CompositeList {
  export interface Props<Metadata> {
    children: React.ReactNode;
    /**
     * A ref to the list of HTML elements, ordered by their index.
     * `useListNavigation`'s `listRef` prop.
     */
    elementsRef: React.RefObject<Array<HTMLElement | null>>;
    /**
     * A ref to the list of element labels, ordered by their index.
     * `useTypeahead`'s `listRef` prop.
     */
    labelsRef?: React.RefObject<Array<string | null>>;
    onMapChange?: (newMap: Map<Element, CompositeMetadata<Metadata> | null>) => void;
  }
}
