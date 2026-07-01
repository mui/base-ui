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
  const { children, elementsRef, labelsRef, onMapChange: onMapChangeProp } = props;

  const onMapChange = useStableCallback(onMapChangeProp);

  const nextIndexRef = React.useRef(0);
  const controlledRef = React.useRef<boolean | null>(null);
  const listeners = useRefWithInit(createListeners).current;

  // We use a stable `map` to avoid O(n^2) re-allocation costs for large lists.
  // `mapTick` is our re-render trigger mechanism.
  const map = useRefWithInit(createMap<Metadata>).current;
  // `mapTick` uses a counter rather than objects for low precision-loss risk and better memory efficiency
  const [mapTick, setMapTick] = React.useState(0);
  // The sorted map is kept in a ref so registration flushes can publish the
  // current ordering immediately.
  const sortedMapRef = React.useRef(createMap<Metadata>());
  const isDirtyRef = React.useRef(false);

  const register = useStableCallback((node: Element, metadata: CompositeMetadata<Metadata>) => {
    const isControlled = metadata.index !== undefined;

    if (controlledRef.current === null) {
      controlledRef.current = isControlled;
    } else if (controlledRef.current !== isControlled) {
      error(
        `A CompositeList is mixing controlled and uncontrolled indexes.`,
        `Decide between using a controlled or uncontrolled index prop for all items in the CompositeList.`,
        "The nature of the state is determined during the first render. It's considered controlled if the value is not `undefined`.",
        'More info: https://fb.me/react-controlled-components',
      );
    }

    map.set(node, metadata);
    isDirtyRef.current = true;
  });

  const unregister = useStableCallback((node: Element) => {
    map.delete(node);
    isDirtyRef.current = true;

    if (map.size === 0) {
      controlledRef.current = null;
    }
  });

  const syncRefs = useStableCallback((nextMap: Map<Element, CompositeMetadata<Metadata>>) => {
    // Rebuild from the sorted map, but keep the arrays sparse so a large
    // controlled index doesn't allocate a dense array up to it.
    elementsRef.current = [];
    if (labelsRef) {
      labelsRef.current = [];
    }

    nextMap.forEach((metadata, node) => {
      if (metadata.index != null) {
        elementsRef.current[metadata.index] = node as HTMLElement;

        if (labelsRef) {
          labelsRef.current[metadata.index] =
            metadata.label ?? metadata.textRef?.current?.textContent ?? node.textContent ?? null;
        }
      }
    });

    nextIndexRef.current = elementsRef.current.length;
  });

  const flush = useStableCallback(() => {
    const nextSortedMap = sortMap(map, controlledRef.current === true);
    syncRefs(nextSortedMap);
    setMapTick((tick) => tick + 1);
    onMapChange(nextSortedMap);
    listeners.forEach((l) => l(nextSortedMap));
    sortedMapRef.current = nextSortedMap;
    isDirtyRef.current = false;
  });

  useIsoLayoutEffect(() => {
    const isControlled = controlledRef.current === true;
    const sortedMap = sortedMapRef.current;
    if (isControlled || typeof MutationObserver !== 'function' || sortedMap.size === 0) {
      return undefined;
    }

    const mutationObserver = new MutationObserver((entries) => {
      const diff = new Set<Node>();
      const updateDiff = (node: Node) => (diff.has(node) ? diff.delete(node) : diff.add(node));
      entries.forEach((entry) => {
        entry.removedNodes.forEach(updateDiff);
        entry.addedNodes.forEach(updateDiff);
      });
      if (diff.size === 0) {
        flush();
      }
    });

    sortedMap.forEach((_, node) => {
      if (node.parentElement) {
        mutationObserver.observe(node.parentElement, { childList: true });
      }
    });

    return () => {
      mutationObserver.disconnect();
    };
  }, [flush, mapTick]);

  // React runs parent layout effects after child layout effects, so all item
  // registrations from this commit are already in `map`. We flush here to
  // make sure elementsRef/labelsRef updates are not coupled to an extra render.
  useIsoLayoutEffect(() => {
    if (isDirtyRef.current) {
      flush();
    }
  });

  useIsoLayoutEffect(() => {
    return () => {
      elementsRef.current = [];
      if (labelsRef) {
        labelsRef.current = [];
      }
    };
  }, [elementsRef, labelsRef]);

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
  return new Map<Element, CompositeMetadata<Metadata>>();
}

function createListeners() {
  return new Set<Function>();
}

function sortMap<Metadata>(map: Map<Element, CompositeMetadata<Metadata>>, isControlled: boolean) {
  const newMap = new Map<Element, CompositeMetadata<Metadata>>();

  if (isControlled) {
    const sortedNodes = Array.from(map.entries())
      .filter(([node]) => node.isConnected)
      .sort((a, b) => (a[1]?.index ?? 0) - (b[1]?.index ?? 0));

    return new Map(sortedNodes);
  }

  // Filter out disconnected elements before sorting to avoid inconsistent
  // compareDocumentPosition results when elements are detached from the DOM.
  const sortedNodes = Array.from(map.keys())
    .filter((node) => node.isConnected)
    .sort(sortByDocumentPosition);

  sortedNodes.forEach((node, index) => {
    const metadata = map.get(node) ?? ({} as CompositeMetadata<Metadata>);
    newMap.set(node, { ...metadata, index });
  });

  return newMap;
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
  onMapChange?: ((newMap: Map<Element, CompositeMetadata<Metadata> | null>) => void) | undefined;
}

export namespace CompositeList {
  export type State = CompositeListState;
  export type Props<Metadata> = CompositeListProps<Metadata>;
}
