/* eslint-disable no-bitwise */
'use client';
import * as React from 'react';
import PropTypes from 'prop-types';
import { CompositeListContext } from './CompositeListContext';
import { useEnhancedEffect } from '../../utils/useEnhancedEffect';

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

/**
 * Provides context for a list of items in a composite component.
 * @internal
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

  const sortedMap = React.useMemo(() => {
    const newMap = new Map<Node, CompositeMetadata<Metadata>>();
    const sortedNodes = Array.from(map.keys()).sort(sortByDocumentPosition);

    sortedNodes.forEach((node, index) => {
      const metadata = map.get(node) ?? ({} as CompositeMetadata<Metadata>);
      newMap.set(node, { ...metadata, index });
    });

    return newMap;
  }, [map]);

  useEnhancedEffect(() => {
    onMapChange?.(sortedMap);
  }, [sortedMap, onMapChange]);

  const contextValue = React.useMemo(
    () => ({ register, unregister, map: sortedMap, elementsRef, labelsRef }),
    [register, unregister, sortedMap, elementsRef, labelsRef],
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

CompositeList.propTypes /* remove-proptypes */ = {
  // ┌────────────────────────────── Warning ──────────────────────────────┐
  // │ These PropTypes are generated from the TypeScript type definitions. │
  // │ To update them, edit the TypeScript types and run `pnpm proptypes`. │
  // └─────────────────────────────────────────────────────────────────────┘
  /**
   * @ignore
   */
  children: PropTypes.node,
  /**
   * A ref to the list of HTML elements, ordered by their index.
   * `useListNavigation`'s `listRef` prop.
   */
  elementsRef: PropTypes /* @typescript-to-proptypes-ignore */.any,
  /**
   * A ref to the list of element labels, ordered by their index.
   * `useTypeahead`'s `listRef` prop.
   */
  labelsRef: PropTypes.shape({
    current: PropTypes.arrayOf(PropTypes.string).isRequired,
  }),
  /**
   * @ignore
   */
  onMapChange: PropTypes.func,
} as any;
