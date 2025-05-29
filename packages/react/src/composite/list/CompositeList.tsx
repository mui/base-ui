/* eslint-disable no-bitwise */
'use client';
import * as React from 'react';
import { CompositeListContext } from './CompositeListContext';
import { useModernLayoutEffect } from '../../utils/useModernLayoutEffect';

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

export type CompositeMetadata<CustomMetadata> = { index?: number | null } & CustomMetadata;

/**
 * Provides context for a list of items in a composite component.
 * @internal
 */
export function CompositeList<Metadata>(props: CompositeList.Props<Metadata>) {
  const { children, elementsRef, labelsRef, onMapChange } = props;

  const [map, setMap] = React.useState(
    () => new Map<Element, CompositeMetadata<Metadata> | null>(),
  );

  const register = React.useCallback((node: Element, metadata: Metadata) => {
    setMap((prevMap) => new Map(prevMap).set(node, metadata ?? null));
  }, []);

  const unregister = React.useCallback((node: Element) => {
    setMap((prevMap) => {
      const nextMap = new Map(prevMap);
      nextMap.delete(node);
      return nextMap;
    });
  }, []);

  const sortedMap = React.useMemo(() => {
    const newMap = new Map<Element, CompositeMetadata<Metadata>>();
    const sortedNodes = Array.from(map.keys()).sort(sortByDocumentPosition);

    sortedNodes.forEach((node, index) => {
      const metadata = map.get(node) ?? ({} as CompositeMetadata<Metadata>);
      newMap.set(node, { ...metadata, index });
    });

    return newMap;
  }, [map]);

  useModernLayoutEffect(() => {
    if (elementsRef.current.length !== sortedMap.size) {
      elementsRef.current.length = sortedMap.size;
    }
    if (labelsRef && labelsRef.current.length !== sortedMap.size) {
      labelsRef.current.length = sortedMap.size;
    }
    onMapChange?.(sortedMap);
  }, [sortedMap, onMapChange, elementsRef, labelsRef]);

  const contextValue = React.useMemo(
    () => ({ register, unregister, map: sortedMap, elementsRef, labelsRef }),
    [register, unregister, sortedMap, elementsRef, labelsRef],
  );

  return (
    <CompositeListContext.Provider value={contextValue}>{children}</CompositeListContext.Provider>
  );
}

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
