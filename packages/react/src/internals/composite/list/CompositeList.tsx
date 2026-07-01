/* eslint-disable no-bitwise */
'use client';
import * as React from 'react';
import { useRefWithInit } from '@base-ui/utils/useRefWithInit';
import { useStableCallback } from '@base-ui/utils/useStableCallback';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
import { contains } from '../../shadowDom';
import { CompositeListContext } from './CompositeListContext';
import { isElement } from '@floating-ui/utils/dom';

export type CompositeMetadata<CustomMetadata> = {
  index?: number | null | undefined;
} & CustomMetadata;

/**
 * Provides context for a list of items in a composite component.
 * @internal
 */
export function CompositeList<Metadata>(props: CompositeList.Props<Metadata>) {
  const { children, elementsRef, labelsRef, onMapChange: onMapChangeProp } = props;

  const onMapChange = useStableCallback(onMapChangeProp);

  const nextIndexRef = React.useRef(0);
  const listeners = useRefWithInit(createListeners).current;

  // We use a stable `map` to avoid O(n^2) re-allocation costs for large lists.
  // `mapTick` is our re-render trigger mechanism. We also need to update the
  // elements and label refs, but there's a lot of async work going on and sometimes
  // the effect that handles `onMapChange` gets called after those refs have been
  // filled, and we don't want to lose those values by setting their lengths to `0`.
  // We also need to have them at the proper length because floating-ui uses that
  // information for list navigation.

  const map = useRefWithInit(createMap<Metadata>).current;
  // `mapTick` uses a counter rather than objects for low precision-loss risk and better memory efficiency
  const [mapTick, setMapTick] = React.useState(0);
  const lastTickRef = React.useRef(mapTick);

  const register = useStableCallback((node: Element, metadata: Metadata) => {
    map.set(node, metadata ?? null);
    lastTickRef.current += 1;
    setMapTick(lastTickRef.current);
  });

  const unregister = useStableCallback((node: Element) => {
    map.delete(node);
    lastTickRef.current += 1;
    setMapTick(lastTickRef.current);
  });

  const { sortedMap, sortedNodes } = React.useMemo(() => {
    // `mapTick` is the `useMemo` trigger as `map` is stable.
    disableEslintWarning(mapTick);

    const nextSortedMap = new Map<Element, CompositeMetadata<Metadata>>();
    // Filter out disconnected elements before sorting to avoid inconsistent
    // compareDocumentPosition results when elements are detached from the DOM.
    const nextSortedNodes = Array.from(map.keys())
      .filter((node) => node.isConnected)
      .sort(sortByDocumentPosition);

    nextSortedNodes.forEach((node, index) => {
      const metadata = map.get(node) ?? ({} as CompositeMetadata<Metadata>);
      nextSortedMap.set(node, { ...metadata, index });
    });

    return { sortedMap: nextSortedMap, sortedNodes: nextSortedNodes };
  }, [map, mapTick]);

  useIsoLayoutEffect(() => {
    if (typeof MutationObserver !== 'function' || sortedNodes.length < 2) {
      return undefined;
    }

    // Rather than observing the whole composite container, observe the smallest
    // direct-child lists whose order can affect registered item order. For flat
    // lists this is the item parent; for grouped lists this includes the group
    // wrapper boundary between adjacent items.
    const roots = getAdjacentNodeRoots(sortedNodes);
    if (roots.size === 0) {
      return undefined;
    }

    const mutationObserver = new MutationObserver((entries) => {
      if (!entries.some((entry) => hasSortedNode(entry, sortedNodes))) {
        return;
      }

      let previousConnectedNode: Element | null = null;

      // `sortedNodes` is the last known document order. If any connected node now
      // appears before the previous connected node, wrappers/items moved and the
      // index map needs to be rebuilt.
      for (const node of sortedNodes) {
        if (!node.isConnected) {
          continue;
        }

        if (previousConnectedNode && sortByDocumentPosition(previousConnectedNode, node) > 0) {
          mutationObserver.disconnect();
          lastTickRef.current += 1;
          setMapTick(lastTickRef.current);
          return;
        }

        previousConnectedNode = node;
      }
    });

    roots.forEach((root) => {
      mutationObserver.observe(root, { childList: true });
    });

    return () => {
      mutationObserver.disconnect();
    };
  }, [sortedNodes]);

  useIsoLayoutEffect(() => {
    const shouldUpdateLengths = lastTickRef.current === mapTick;
    if (shouldUpdateLengths) {
      if (elementsRef.current.length !== sortedMap.size) {
        elementsRef.current.length = sortedMap.size;
      }
      if (labelsRef && labelsRef.current.length !== sortedMap.size) {
        labelsRef.current.length = sortedMap.size;
      }
      nextIndexRef.current = sortedMap.size;
    }

    onMapChange(sortedMap);
  }, [onMapChange, sortedMap, elementsRef, labelsRef, mapTick]);

  useIsoLayoutEffect(() => {
    return () => {
      elementsRef.current = [];
    };
  }, [elementsRef]);

  useIsoLayoutEffect(() => {
    return () => {
      if (labelsRef) {
        labelsRef.current = [];
      }
    };
  }, [labelsRef]);

  const subscribeMapChange = useStableCallback((fn) => {
    listeners.add(fn);
    return () => {
      listeners.delete(fn);
    };
  });

  useIsoLayoutEffect(() => {
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

function getAdjacentNodeRoots(nodes: Element[]) {
  const roots = new Set<Element>();

  // A reorder that changes item indexes must invert at least one adjacent pair
  // from the previous sorted order. Observing each pair's common parent catches
  // both direct item moves and ancestor wrapper moves at the boundary.
  for (let i = 1; i < nodes.length; i += 1) {
    const ancestor = getCommonAncestor(nodes[i - 1], nodes[i]);

    if (ancestor) {
      roots.add(ancestor);
    }
  }

  return roots;
}

function getCommonAncestor(firstNode: Element, lastNode: Element) {
  let ancestor = firstNode.parentElement;

  while (ancestor && !contains(ancestor, lastNode)) {
    ancestor = ancestor.parentElement;
  }

  return ancestor;
}

function hasSortedNode(entry: MutationRecord, sortedNodes: Element[]) {
  for (let i = 0; i < entry.addedNodes.length; i += 1) {
    if (containsSortedNode(entry.addedNodes[i], sortedNodes)) {
      return true;
    }
  }

  for (let i = 0; i < entry.removedNodes.length; i += 1) {
    if (containsSortedNode(entry.removedNodes[i], sortedNodes)) {
      return true;
    }
  }

  return false;
}

function containsSortedNode(node: Node, sortedNodes: Element[]) {
  if (!isElement(node)) {
    return false;
  }

  return sortedNodes.some((sortedNode) => contains(node, sortedNode));
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

function disableEslintWarning(_: any) {}

export interface CompositeListState {}

export interface CompositeListProps<Metadata> {
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
  labelsRef?: React.RefObject<Array<string | null>> | undefined;
  onMapChange?: ((newMap: Map<Element, CompositeMetadata<Metadata> | null>) => void) | undefined;
}

export namespace CompositeList {
  export type State = CompositeListState;
  export type Props<Metadata> = CompositeListProps<Metadata>;
}
