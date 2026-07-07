/* eslint-disable no-bitwise */
'use client';
import * as React from 'react';
import { error } from '@base-ui/utils/error';
import { useRefWithInit } from '@base-ui/utils/useRefWithInit';
import { useStableCallback } from '@base-ui/utils/useStableCallback';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
import { type CompositeMetadata, CompositeListContext } from './CompositeListContext';

/**
 * Provides context for a list of items in a composite component.
 * @internal
 */
export function CompositeList<Metadata>(props: CompositeList.Props<Metadata>) {
  const { children, elementsRef, labelsRef, onMapChange, itemCount } = props;

  const nextIndexRef = React.useRef(0);
  // Whether item indexes are controlled (`index` props) or derived from DOM order. The mode is
  // intentionally fixed to the first registered item and never reset so that during development
  // any runtime mode switch surfaces an uncontrolled/controlled mixing error.
  const controlledRef = React.useRef<boolean | null>(null);
  const listeners = useRefWithInit(createListeners).current;
  // We use a stable `map` to avoid O(n^2) re-allocation costs for large lists.
  // `mapTick` is our re-render trigger mechanism.
  const map = useRefWithInit(createMap<Metadata>).current;
  // `mapTick` uses a counter rather than objects for low precision-loss risk and better memory efficiency
  const [mapTick, setMapTick] = React.useState(0);
  // The sorted map is kept in a ref so registration flushes can publish the
  // current ordering immediately.
  const sortedMapRef = useRefWithInit(createMap<Metadata>);
  const isDirtyRef = React.useRef(false);

  const register = useStableCallback((node: HTMLElement, metadata: CompositeMetadata<Metadata>) => {
    const isControlled = metadata.index !== undefined;

    if (controlledRef.current === null) {
      controlledRef.current = isControlled;
    } else if (process.env.NODE_ENV !== 'production' && controlledRef.current !== isControlled) {
      error(
        `A CompositeList is mixing controlled and uncontrolled indexes.`,
        `Decide between using a controlled or uncontrolled index prop for all items in the CompositeList.`,
        'Changing mode after registration leaves indexes inconsistent, which breaks navigation and highlighting.',
        'The indexing mode is fixed by the first registered item for the list instance.',
        'An item is considered controlled when its index prop is not `undefined`.',
      );
    }

    map.set(node, metadata);
    if (!isDirtyRef.current) {
      isDirtyRef.current = true;
      setMapTick((tick) => tick + 1);
    }
  });

  const unregister = useStableCallback((node: HTMLElement) => {
    map.delete(node);
    if (!isDirtyRef.current) {
      isDirtyRef.current = true;
      setMapTick((tick) => tick + 1);
    }
  });

  const syncRefs = useStableCallback((nextMap: Map<HTMLElement, CompositeMetadata<Metadata>>) => {
    // Rebuild from the sorted map, but keep the arrays sparse so a large
    // controlled index doesn't allocate a dense array up to it.
    elementsRef.current = [];
    if (labelsRef) {
      labelsRef.current = [];
    }

    nextMap.forEach((metadata, node) => {
      if (metadata.index != null && metadata.index > -1) {
        elementsRef.current[metadata.index] = node;
        if (labelsRef && metadata.labelRef) {
          labelsRef.current[metadata.index] = metadata.labelRef.current;
        }
      }
    });

    // Lists that render a subset of items (windowing) declare the total length so
    // list navigation can reach indexes that have no rendered element yet.
    if (itemCount != null) {
      elementsRef.current.length = itemCount;
      if (labelsRef) {
        labelsRef.current.length = itemCount;
      }
    }

    nextIndexRef.current = elementsRef.current.length;
  });

  const flush = useStableCallback(() => {
    const sortedMap = sortMap(map, controlledRef.current === true);
    syncRefs(sortedMap);
    onMapChange?.(sortedMap);
    listeners.forEach((l) => l(sortedMap));
    sortedMapRef.current = sortedMap;
    isDirtyRef.current = false;
  });

  // React runs parent layout effects after child layout effects, so all item
  // registrations from this commit are already in `map`. We flush before the
  // observer effect so it can observe the latest sorted map without another render.
  useIsoLayoutEffect(() => {
    if (isDirtyRef.current) {
      flush();
    }
  }, [mapTick, flush]);

  // Apply `itemCount` changes that arrive without a registration change (for example,
  // the filtered set shrinks while the rendered window stays the same).
  useIsoLayoutEffect(() => {
    syncRefs(sortedMapRef.current);
  }, [itemCount, sortedMapRef, syncRefs]);

  useIsoLayoutEffect(() => {
    const isControlled = controlledRef.current === true;
    const sortedMap = sortedMapRef.current;
    if (isControlled || typeof MutationObserver !== 'function' || sortedMap.size < 2) {
      return undefined;
    }

    // `sortedMap` is populated in sorted order, so its keys are the last known
    // document order of the items.
    const sortedNodes = Array.from(sortedMap.keys());

    // Rather than observing the whole composite container, observe the smallest
    // direct-child lists whose order can affect registered item order. For flat
    // lists this is the item parent; for grouped lists this includes the group
    // wrapper boundary between adjacent items.
    const roots = getAdjacentNodeRoots(sortedNodes);
    if (roots.size === 0) {
      return undefined;
    }

    const mutationObserver = new MutationObserver((entries) => {
      // Only verify the order after a move: a node that was removed and later
      // re-added within the same batch. Additions and removals alone can't
      // change the relative order of the remaining items, and items that mount
      // or unmount re-sort through `register`/`unregister`.
      if (!hasMovedNode(entries)) {
        return;
      }

      let previousConnectedNode: Element | null = null;

      // If any connected node now appears before the previous connected node,
      // wrappers/items moved and the index map needs to be rebuilt.
      for (const node of sortedNodes) {
        if (!node.isConnected) {
          continue;
        }

        if (previousConnectedNode && sortByDocumentPosition(previousConnectedNode, node) > 0) {
          mutationObserver.disconnect();
          flush();
          setMapTick((tick) => tick + 1);
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
  }, [sortedMapRef, flush, mapTick]);

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
    // Delayed items need the latest snapshot when they subscribe, otherwise
    // they can stay on a guessed index until another list change happens.
    fn(sortedMapRef.current);
    return () => {
      listeners.delete(fn);
    };
  });

  const contextValue = React.useMemo(
    () => ({ register, unregister, subscribeMapChange, elementsRef, labelsRef, nextIndexRef }),
    [register, unregister, subscribeMapChange, elementsRef, labelsRef, nextIndexRef],
  );

  return (
    <CompositeListContext.Provider value={contextValue}>{children}</CompositeListContext.Provider>
  );
}

function createMap<Metadata>() {
  return new Map<HTMLElement, CompositeMetadata<Metadata>>();
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

  // The `parentElement` walk cannot cross shadow boundaries, so the native
  // `contains` is sufficient here.
  while (ancestor && !ancestor.contains(lastNode)) {
    ancestor = ancestor.parentElement;
  }

  return ancestor;
}

function hasMovedNode(entries: MutationRecord[]) {
  const removed = new Set<Node>();

  // The records are chronological: an addition following a removal is a move,
  // while a removal following an addition is a net removal.
  for (const entry of entries) {
    for (let i = 0; i < entry.addedNodes.length; i += 1) {
      if (removed.has(entry.addedNodes[i])) {
        return true;
      }
    }

    for (let i = 0; i < entry.removedNodes.length; i += 1) {
      removed.add(entry.removedNodes[i]);
    }
  }

  // A removed node that is still connected was reparented into a container
  // this observer doesn't watch.
  for (const node of removed) {
    if (node.isConnected) {
      return true;
    }
  }

  return false;
}

function sortMap<Metadata>(
  map: Map<HTMLElement, CompositeMetadata<Metadata>>,
  isControlled: boolean,
) {
  const sortedMap = new Map<HTMLElement, CompositeMetadata<Metadata>>();
  // Filter out disconnected elements before sorting to avoid inconsistent
  // compareDocumentPosition results when elements are detached from the DOM.
  const sortedEntries = Array.from(map).filter(([node]) => node.isConnected);

  if (isControlled) {
    sortedEntries
      .sort((a, b) => (a[1].index ?? 0) - (b[1].index ?? 0))
      .forEach(([node, metadata]) => sortedMap.set(node, metadata));
  } else {
    sortedEntries
      .sort(([a], [b]) => sortByDocumentPosition(a, b))
      .forEach(([node, metadata], index) => sortedMap.set(node, { ...metadata, index }));
  }

  return sortedMap;
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
  onMapChange?: ((newMap: Map<Element, CompositeMetadata<Metadata>>) => void) | undefined;
  /**
   * The total number of items in the list. Sets the authoritative length of
   * `elementsRef`/`labelsRef` so navigation can target indexes beyond the rendered window.
   */
  itemCount?: number | undefined;
}

export namespace CompositeList {
  export type State = CompositeListState;
  export type Props<Metadata> = CompositeListProps<Metadata>;
}
