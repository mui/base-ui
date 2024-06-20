'use client';
import * as React from 'react';
import { IndexableMap } from '../utils/IndexableMap';
import type { KeyGenerator, UseCompoundParentReturnValue, WithRef } from './useCompound.types';

/**
 * Provides a way for a component to know about its children.
 *
 * Child components register themselves with the `useCompoundItem` hook, passing in arbitrary metadata to the parent.
 *
 * This is a more powerful altervantive to `children` traversal, as child components don't have to be placed
 * directly inside the parent component. They can be anywhere in the tree (and even rendered by other components).
 *
 * The downside is that this doesn't work with SSR as it relies on the useEffect hook.
 *
 * @ignore - internal hook.
 */
export function useCompoundParent<Key, Subitem extends WithRef>(): UseCompoundParentReturnValue<
  Key,
  Subitem
> {
  const [subitems, setSubitems] = React.useState(new IndexableMap<Key, Subitem>());
  const subitemKeys = React.useRef(new Set<Key>());

  const deregisterItem = React.useCallback(function deregisterItem(id: Key) {
    subitemKeys.current.delete(id);
    setSubitems((previousState) => {
      const newState = new IndexableMap(previousState);
      newState.delete(id);
      return newState;
    });
  }, []);

  const registerItem = React.useCallback(
    function registerItem(
      key: Key | KeyGenerator<Key>,
      item: Subitem | ((generatedId: Key) => Subitem),
    ) {
      let providedOrGeneratedKey: Key;

      if (typeof key === 'function') {
        providedOrGeneratedKey = (key as KeyGenerator<Key>)(subitemKeys.current);
      } else {
        providedOrGeneratedKey = key;
      }

      subitemKeys.current.add(providedOrGeneratedKey);
      setSubitems((previousState) => {
        const newState = new IndexableMap(previousState);

        if (typeof item === 'function') {
          item = item(providedOrGeneratedKey);
        }

        newState.set(providedOrGeneratedKey, item);
        return newState;
      });

      return {
        key: providedOrGeneratedKey,
        deregister: () => deregisterItem(providedOrGeneratedKey),
      };
    },
    [deregisterItem],
  );

  const sortedSubitems = React.useMemo(() => sortSubitems(subitems), [subitems]);

  const getItemIndex = React.useCallback(
    function getItemIndex(id: Key) {
      return Array.from(sortedSubitems.keys()).indexOf(id);
    },
    [sortedSubitems],
  );

  return React.useMemo(
    () => ({
      getItemIndex,
      registerItem,
      itemCount: subitems.size,
      subitems: sortedSubitems,
    }),
    [getItemIndex, registerItem, subitems.size, sortedSubitems],
  );
}

/**
 * Sorts the subitems by their position in the DOM.
 */
function sortSubitems<Key, Subitem extends WithRef>(subitems: IndexableMap<Key, Subitem>) {
  const subitemsArray = Array.from(subitems.entries());

  subitemsArray.sort((a, b) => {
    const aNode = a[1].ref.current;
    const bNode = b[1].ref.current;

    if (aNode === null || bNode === null || aNode === bNode) {
      return 0;
    }

    // eslint-disable-next-line no-bitwise
    return aNode.compareDocumentPosition(bNode) & Node.DOCUMENT_POSITION_PRECEDING ? 1 : -1;
  });

  return new IndexableMap(subitemsArray);
}
