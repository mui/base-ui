/* eslint-disable no-bitwise */
'use client';
import * as React from 'react';
import { fastObjectShallowCompare } from '../../utils/fastObjectShallowCompare';
import { useEnhancedEffect } from '../../utils/useEnhancedEffect';
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

export type CompositeMetadata<CustomMetadata> = { index?: number | null } & CustomMetadata;

function areMapsEqual<Metadata>(
  map1: Map<Node, CompositeMetadata<Metadata> | null>,
  map2: Map<Node, CompositeMetadata<Metadata> | null>,
) {
  if (map1.size !== map2.size) {
    return false;
  }
  for (const [key, value] of map1.entries()) {
    const value2 = map2.get(key);
    // compare the index before comparing everything else
    if (value?.index !== value2?.index) {
      return false;
    }
    if (value2 !== undefined && !fastObjectShallowCompare(value, value2)) {
      return false;
    }
  }
  return true;
}

/**
 * Provides context for a list of items in a composite component.
 * @ignore - internal component.
 */
function CompositeList<Metadata>(props: CompositeList.Props<Metadata>) {
  const { children, elementsRef, labelsRef, onMapChange } = props;

  const [map, setMap] = React.useState(() => new Map<Node, CompositeMetadata<Metadata> | null>());

  const register = React.useCallback((node: Node, metadata: Metadata) => {
    setMap((prevMap) => new Map(prevMap).set(node, metadata ?? null));
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
      const metadata = map.get(node) ?? ({} as CompositeMetadata<Metadata>);

      newMap.set(node, { ...metadata, index });
    });

    if (!areMapsEqual(map, newMap)) {
      setMap(newMap);
      onMapChange?.(newMap);
    }
  }, [map, onMapChange]);

  const contextValue = React.useMemo(
    () => ({ register, unregister, map, elementsRef, labelsRef }),
    [register, unregister, map, elementsRef, labelsRef],
  );

  return (
    <CompositeListContext.Provider value={contextValue}>{children}</CompositeListContext.Provider>
  );
}

namespace CompositeList {
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
    onMapChange?: (newMap: Map<Node, CompositeMetadata<Metadata> | null>) => void;
  }
}

export { CompositeList };
