/* eslint-disable no-bitwise */
'use client';
import * as React from 'react';
import { useRefWithInit } from '@base-ui/utils/useRefWithInit';
import { useStableCallback } from '@base-ui/utils/useStableCallback';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
import { CompositeListContext, type CompositeListRegistration } from './CompositeListContext';

export type CompositeMetadata<CustomMetadata> = {
  index: number;
} & CustomMetadata;

interface CompositeListItem<Metadata> {
  index: number;
  element: HTMLElement;
  registration: CompositeListRegistration<Metadata>;
}

/**
 * Provides context for a list of items in a composite component.
 * @internal
 */
export function CompositeList<Metadata>(props: CompositeList.Props<Metadata>) {
  const {
    children,
    elementsRef,
    itemCount: itemCountProp,
    labelsRef,
    onMapChange: onMapChangeProp,
  } = props;

  const onMapChange = useStableCallback(onMapChangeProp);

  const [, setMapTick] = React.useState(false);

  const listeners = useRefWithInit(createListeners).current;
  const map = useRefWithInit(createMap<Metadata>).current;
  const nextIndexRef = React.useRef(0);
  const isDirtyRef = React.useRef(true);
  const itemsRef = React.useRef<readonly CompositeListItem<Metadata>[]>([]);
  const mutationObserverRef = React.useRef<MutationObserver | null>(null);

  // Item effects can run without their parent rendering. Schedule one synchronous
  // parent update for the whole commit so refs are rebuilt before paint and while
  // the originating React event is still inside `act()` in tests.
  const scheduleMapUpdate = useStableCallback(() => {
    if (isDirtyRef.current) {
      return;
    }

    isDirtyRef.current = true;
    setMapTick((tick) => !tick);
  });

  const register = useStableCallback(
    (node: Element, registration: CompositeListRegistration<Metadata>) => {
      map.set(node, registration);
      scheduleMapUpdate();
    },
  );

  const unregister = useStableCallback((node: Element) => {
    map.delete(node);
    scheduleMapUpdate();
  });

  const syncRefs = useStableCallback((items: readonly CompositeListItem<Metadata>[]) => {
    const nextMap = new Map<Element, CompositeMetadata<Metadata>>();

    elementsRef.current.length = 0;
    if (labelsRef) {
      labelsRef.current.length = 0;
    }

    items.forEach((item) => {
      nextMap.set(item.element, {
        ...(item.registration.metadata ?? ({} as Metadata)),
        index: item.index,
      });

      elementsRef.current[item.index] = item.element;

      if (labelsRef) {
        labelsRef.current[item.index] =
          item.registration.label !== undefined
            ? item.registration.label
            : (item.registration.textRef?.current?.textContent ?? item.element.textContent);
      }
    });

    const itemCount = Math.max(itemCountProp ?? 0, elementsRef.current.length);
    elementsRef.current.length = itemCount;
    if (labelsRef) {
      labelsRef.current.length = itemCount;
    }
    nextIndexRef.current = itemCount;

    return nextMap;
  });

  function observe(sortedNodes: HTMLElement[]) {
    mutationObserverRef.current?.disconnect();
    mutationObserverRef.current = null;

    // A single item can't reorder.
    if (typeof MutationObserver !== 'function' || sortedNodes.length < 2) {
      return;
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
          scheduleMapUpdate();
          return;
        }

        previousConnectedNode = node;
      }
    });

    mutationObserverRef.current = mutationObserver;

    // A reorder that changes item indexes must invert at least one adjacent pair
    // from the previous sorted order. Observing each pair's common parent catches
    // both direct item moves and ancestor wrapper moves at the boundary.
    const roots = new Set<Element>();
    for (let i = 1; i < sortedNodes.length; i += 1) {
      const root = getCommonAncestor(sortedNodes[i - 1], sortedNodes[i]);
      if (root) {
        roots.add(root);
      }
    }

    roots.forEach((root) => mutationObserver.observe(root, { childList: true }));
  }

  const flush = useStableCallback(() => {
    const [items, automaticNodes] = getCompositeListSnapshot(map);
    const nextMap = syncRefs(items);

    observe(automaticNodes);
    itemsRef.current = items;
    isDirtyRef.current = false;

    listeners.forEach((listener) => listener(nextMap));
    onMapChange(nextMap);
  });

  useIsoLayoutEffect(() => {
    // Re-copy the last committed snapshot when the ref objects change or Strict Mode replays
    // effects without reattaching callback refs.
    if (!isDirtyRef.current) {
      syncRefs(itemsRef.current);
    }

    return () => {
      elementsRef.current = [];
      if (labelsRef) {
        labelsRef.current = [];
      }
    };
  }, [elementsRef, itemCountProp, labelsRef, syncRefs]);

  useIsoLayoutEffect(() => {
    if (isDirtyRef.current) {
      flush();
    }
  });

  useIsoLayoutEffect(() => {
    return () => {
      mutationObserverRef.current?.disconnect();
      // React 18 Strict Mode replays effects without replaying callback refs.
      // Mark the retained map dirty so the replay rebuilds refs and observation.
      isDirtyRef.current = true;
    };
  }, []);

  const subscribeMapChange = useStableCallback((fn) => {
    listeners.add(fn);
    return () => {
      listeners.delete(fn);
    };
  });

  const contextValue = React.useMemo(
    () => ({ register, unregister, subscribeMapChange, nextIndexRef }),
    [register, unregister, subscribeMapChange, nextIndexRef],
  );

  return (
    <CompositeListContext.Provider value={contextValue}>{children}</CompositeListContext.Provider>
  );
}

function createMap<Metadata>() {
  return new Map<Element, CompositeListRegistration<Metadata>>();
}

function createListeners() {
  return new Set<Function>();
}

function getCompositeListSnapshot<Metadata>(
  map: Map<Element, CompositeListRegistration<Metadata>>,
) {
  const reservedIndices = new Set<number>();
  const items: CompositeListItem<Metadata>[] = [];
  const automaticItems: CompositeListItem<Metadata>[] = [];

  map.forEach((registration, node) => {
    if (!node.isConnected) {
      return;
    }

    const index = registration.index;
    const item = {
      index: index ?? -1,
      element: node as HTMLElement,
      registration,
    };

    if (index === null) {
      automaticItems.push(item);
    } else if (index >= 0) {
      reservedIndices.add(index);
      items.push(item);
    }
  });

  let nextAutomaticIndex = 0;
  automaticItems.sort((a, b) => sortByDocumentPosition(a.element, b.element));

  automaticItems.forEach((item) => {
    while (reservedIndices.has(nextAutomaticIndex)) {
      nextAutomaticIndex += 1;
    }

    item.index = nextAutomaticIndex;
    items.push(item);
    nextAutomaticIndex += 1;
  });

  if (reservedIndices.size > 0) {
    items.sort((a, b) => a.index - b.index);
  }

  return [items, automaticItems.map((item) => item.element)] as const;
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
  for (const entry of entries) {
    for (let i = 0; i < entry.removedNodes.length; i += 1) {
      if (entry.removedNodes[i].isConnected) {
        return true;
      }
    }
  }

  return false;
}

function sortByDocumentPosition(a: Element, b: Element) {
  // `DOCUMENT_POSITION_CONTAINED_BY` is always reported alongside `FOLLOWING`, and `CONTAINS`
  // alongside `PRECEDING`, so testing `FOLLOWING` alone orders siblings and nested items alike.
  return a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1;
}

export interface CompositeListState {}

export interface CompositeListProps<Metadata> {
  children: React.ReactNode;
  /**
   * A ref to the list of HTML elements, ordered by their index.
   * Explicit indexes can leave empty slots in the array.
   * `useListNavigation`'s `listRef` prop.
   */
  elementsRef: React.RefObject<Array<HTMLElement | null>>;
  /**
   * The logical number of items in the collection. This preserves sparse slots when only a
   * window of explicitly indexed items is mounted.
   */
  itemCount?: number | undefined;
  /**
   * A ref to the list of element labels, ordered by their index.
   * `useTypeahead`'s `listRef` prop.
   */
  labelsRef?: React.RefObject<Array<string | null>> | undefined;
  onMapChange?: ((newMap: Map<Element, CompositeMetadata<Metadata>>) => void) | undefined;
}

export namespace CompositeList {
  export type State = CompositeListState;
  export type Props<Metadata> = CompositeListProps<Metadata>;
}
