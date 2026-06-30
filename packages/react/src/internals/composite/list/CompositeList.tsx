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
    lastTickRef.current += 1;
    setMapTick(lastTickRef.current);
  });

  const unregister = useStableCallback((node: Element) => {
    const metadata = map.get(node);

    if (controlledRef.current === true && metadata?.index != null) {
      // Controlled indexes can leave holes, so clear the unmounted slot explicitly.
      delete elementsRef.current[metadata.index];

      if (labelsRef) {
        delete labelsRef.current[metadata.index];
      }
    }

    map.delete(node);

    if (map.size === 0) {
      controlledRef.current = null;
    }

    lastTickRef.current += 1;
    setMapTick(lastTickRef.current);
  });

  const sortedMap = React.useMemo(() => {
    // `mapTick` is the `useMemo` trigger as `map` is stable.
    disableEslintWarning(mapTick);

    const newMap = new Map<Element, CompositeMetadata<Metadata>>();
    const isControlled = controlledRef.current === true;

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
  }, [map, mapTick]);

  useIsoLayoutEffect(() => {
    const isControlled = controlledRef.current === true;
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
        lastTickRef.current += 1;
        setMapTick(lastTickRef.current);
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
  }, [sortedMap]);

  useIsoLayoutEffect(() => {
    const shouldUpdateLengths = lastTickRef.current === mapTick;
    if (shouldUpdateLengths) {
      const isControlled = controlledRef.current === true;
      const nextLength = isControlled ? getMaxIndexLength(sortedMap) : sortedMap.size;

      if (elementsRef.current.length !== nextLength) {
        elementsRef.current.length = nextLength;
      }
      if (labelsRef && labelsRef.current.length !== nextLength) {
        labelsRef.current.length = nextLength;
      }
      nextIndexRef.current = nextLength;
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
  return new Map<Element, CompositeMetadata<Metadata>>();
}

function createListeners() {
  return new Set<Function>();
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

// Controlled indexes can be sparse if, for example, an item in the middle suspends.
// So, we might receive [0, 2] and length should be 3.
function getMaxIndexLength<Metadata>(map: Map<Element, CompositeMetadata<Metadata>>) {
  let maxIndex = -1;

  map.forEach((metadata) => {
    const index = metadata.index;
    if (index != null && index > maxIndex) {
      maxIndex = index;
    }
  });

  return maxIndex + 1;
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
