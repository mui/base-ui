/* eslint-disable no-bitwise */
'use client';
import * as React from 'react';
import { useEnhancedEffect } from '../../../utils/useEnhancedEffect';
import { CompositeListContext } from './CompositeListContext';

function sortByDocumentPosition(a: Node, b: Node) {
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

function areMapsEqual(map1: Map<Node, number | null>, map2: Map<Node, number | null>) {
  if (map1.size !== map2.size) {
    return false;
  }
  for (const [key, value] of map1.entries()) {
    if (value !== map2.get(key)) {
      return false;
    }
  }
  return true;
}

interface CompositeListProps {
  children: React.ReactNode;
  /**
   * A ref to the list of HTML elements, ordered by their index.
   * `useListNavigation`'s `listRef` prop.
   */
  elementsRef: React.MutableRefObject<Array<HTMLElement | null>>;
  /**
   * A ref to the list of element labels, ordered by their index.
   * `useTypeahead`'s `listRef` prop.
   */
  labelsRef?: React.MutableRefObject<Array<string | null>>;
}

/**
 * Provides context for a list of items in a composite component.
 * @ignore - internal component.
 */
export function CompositeList(props: CompositeListProps) {
  const { children, elementsRef, labelsRef } = props;

  const [map, setMap] = React.useState(() => new Map<Node, number | null>());

  const register = React.useCallback((node: Node) => {
    setMap((prevMap) => new Map(prevMap).set(node, null));
  }, []);

  const unregister = React.useCallback((node: Node) => {
    setMap((prevMap) => {
      const nextMap = new Map(prevMap);
      nextMap.delete(node);
      return nextMap;
    });
  }, []);

  useEnhancedEffect(() => {
    const newMap = new Map(map);
    const nodes = Array.from(newMap.keys()).sort(sortByDocumentPosition);

    nodes.forEach((node, index) => {
      newMap.set(node, index);
    });

    if (!areMapsEqual(map, newMap)) {
      setMap(newMap);
    }
  }, [map]);

  const contextValue = React.useMemo(
    () => ({ register, unregister, map, elementsRef, labelsRef }),
    [register, unregister, map, elementsRef, labelsRef],
  );

  return (
    <CompositeListContext.Provider value={contextValue}>{children}</CompositeListContext.Provider>
  );
}
