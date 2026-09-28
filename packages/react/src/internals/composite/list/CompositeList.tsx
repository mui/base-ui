/* eslint-disable no-bitwise */
'use client';
import * as React from 'react';
import { useRefWithInit } from '@base-ui/utils/useRefWithInit';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
import {
  CompositeListContext,
  type CompositeListContextValue,
  type CompositeListRegistration,
} from './CompositeListContext';

export type CompositeMetadata<CustomMetadata> = {
  index: number;
} & CustomMetadata;

interface CompositeListItem<Metadata> {
  index: number;
  element: HTMLElement;
  registration: CompositeListRegistration<Metadata>;
}

interface CompositeListRegistry<Metadata> {
  // Mirrored from the parameters on every commit so a flush never reads stale ones.
  elementsRef: React.RefObject<Array<HTMLElement | null>>;
  labelsRef: React.RefObject<Array<string | null>> | undefined;
  onMapChange: ((newMap: Map<Element, CompositeMetadata<Metadata>>) => void) | undefined;
  /** Allocated by the first registration. */
  registrations: Map<Element, CompositeListRegistration<Metadata>> | null;
  /** Allocated by the first subscription. */
  listeners: Set<Function> | null;
  /** The last flushed snapshot, or `null` before the first flush. */
  items: readonly CompositeListItem<Metadata>[] | null;
  /** The render-order index reserved for the next item that guesses. */
  nextIndex: number;
  /** Starts dirty so the mount commit flushes the registrations collected while mounting. */
  dirty: boolean;
  observer: MutationObserver | null;
  requestFlush: () => void;
  context: CompositeListContextValue<Metadata>;
}

/**
 * Tracks the items registered through the returned context and keeps `elementsRef` and
 * `labelsRef` ordered by index. Render the value with `CompositeListContext.Provider`.
 */
export function useCompositeList<Metadata>(
  params: UseCompositeListParameters<Metadata>,
): CompositeListContextValue<Metadata> {
  const { elementsRef, labelsRef, onMapChange } = params;

  const [, requestFlush] = React.useReducer(increment, 0);
  const registry = useRefWithInit(() =>
    createRegistry<Metadata>(elementsRef, labelsRef, requestFlush),
  ).current;

  // Item refs attach before this effect runs, so flushing here rebuilds the refs before paint
  // and while the originating React event is still inside `act()` in tests.
  useIsoLayoutEffect(() => {
    registry.onMapChange = onMapChange;

    if (registry.elementsRef !== elementsRef || registry.labelsRef !== labelsRef) {
      clearRefs(registry);
      registry.elementsRef = elementsRef;
      registry.labelsRef = labelsRef;
      registry.dirty = true;
    }

    if (registry.dirty) {
      flush(registry);
    }
  });

  useIsoLayoutEffect(() => {
    return () => {
      disconnectObserver(registry);
      clearRefs(registry);
      // React 18 Strict Mode replays effects without replaying callback refs.
      // Mark the retained registrations dirty so the replay rebuilds refs and observation.
      registry.dirty = true;
    };
  }, [registry]);

  return registry.context;
}

/**
 * Provides context for a list of items in a composite component.
 */
export function CompositeList<Metadata>(props: CompositeList.Props<Metadata>) {
  const context = useCompositeList(props);

  return (
    <CompositeListContext.Provider value={context}>{props.children}</CompositeListContext.Provider>
  );
}

function increment(count: number) {
  return count + 1;
}

function createRegistry<Metadata>(
  elementsRef: CompositeListRegistry<Metadata>['elementsRef'],
  labelsRef: CompositeListRegistry<Metadata>['labelsRef'],
  requestFlush: () => void,
): CompositeListRegistry<Metadata> {
  const registry: CompositeListRegistry<Metadata> = {
    elementsRef,
    labelsRef,
    onMapChange: undefined,
    registrations: null,
    listeners: null,
    items: null,
    nextIndex: 0,
    dirty: true,
    observer: null,
    requestFlush,
    context: {
      register(node, registration) {
        registry.registrations ??= new Map();
        registry.registrations.set(node, registration);
        markDirty(registry);
      },
      unregister(node) {
        if (registry.registrations?.delete(node)) {
          markDirty(registry);
        }
      },
      subscribeMapChange(fn) {
        registry.listeners ??= new Set();
        const listeners = registry.listeners;
        listeners.add(fn);
        return () => {
          listeners.delete(fn);
        };
      },
      guessIndex() {
        const index = registry.nextIndex;
        registry.nextIndex += 1;
        return index;
      },
    },
  };

  return registry;
}

// Item refs can attach without their list rendering. Request one synchronous list update
// for the whole commit so the flush runs from the list's layout effect.
function markDirty<Metadata>(registry: CompositeListRegistry<Metadata>) {
  if (registry.dirty) {
    return;
  }

  registry.dirty = true;
  registry.requestFlush();
}

function flush<Metadata>(registry: CompositeListRegistry<Metadata>) {
  registry.dirty = false;

  const previousItems = registry.items;
  const [items, automaticNodes] = getCompositeListSnapshot(registry.registrations);
  const nextMap = syncRefs(registry, items);

  const changed =
    !previousItems ||
    previousItems.length !== items.length ||
    items.some((item, index) => {
      const previousItem = previousItems[index];
      return (
        item.index !== previousItem.index ||
        item.element !== previousItem.element ||
        item.registration.index !== previousItem.registration.index ||
        item.registration.metadata !== previousItem.registration.metadata
      );
    });

  observe(registry, automaticNodes);
  registry.items = items;

  if (!changed) {
    return;
  }

  registry.listeners?.forEach((listener) => listener(nextMap));
  registry.onMapChange?.(nextMap);
}

function syncRefs<Metadata>(
  registry: CompositeListRegistry<Metadata>,
  items: readonly CompositeListItem<Metadata>[],
) {
  const nextMap = new Map<Element, CompositeMetadata<Metadata>>();
  const elements = registry.elementsRef.current;
  const labels = registry.labelsRef?.current;

  elements.length = 0;
  if (labels) {
    labels.length = 0;
  }

  items.forEach((item) => {
    nextMap.set(item.element, {
      ...(item.registration.metadata ?? ({} as Metadata)),
      index: item.index,
    });

    elements[item.index] = item.element;

    if (labels) {
      labels[item.index] = getLabel(item);
    }
  });

  registry.nextIndex = elements.length;

  return nextMap;
}

function clearRefs<Metadata>(registry: CompositeListRegistry<Metadata>) {
  registry.elementsRef.current = [];
  if (registry.labelsRef) {
    registry.labelsRef.current = [];
  }
}

function getLabel<Metadata>(item: CompositeListItem<Metadata>) {
  const { label, textRef } = item.registration;
  if (label !== undefined) {
    return label;
  }
  return textRef?.current?.textContent ?? item.element.textContent;
}

function observe<Metadata>(registry: CompositeListRegistry<Metadata>, sortedNodes: HTMLElement[]) {
  disconnectObserver(registry);

  // A single item can't reorder.
  if (typeof MutationObserver !== 'function' || sortedNodes.length < 2) {
    return;
  }

  const observer = new MutationObserver((entries) => {
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
        disconnectObserver(registry);
        markDirty(registry);
        return;
      }

      previousConnectedNode = node;
    }
  });

  registry.observer = observer;

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

  roots.forEach((root) => observer.observe(root, { childList: true }));
}

function disconnectObserver<Metadata>(registry: CompositeListRegistry<Metadata>) {
  registry.observer?.disconnect();
  registry.observer = null;
}

function getCompositeListSnapshot<Metadata>(
  registrations: Map<Element, CompositeListRegistration<Metadata>> | null,
) {
  const reservedIndices = new Set<number>();
  const items: CompositeListItem<Metadata>[] = [];
  const automaticItems: CompositeListItem<Metadata>[] = [];

  registrations?.forEach((registration, node) => {
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

export interface UseCompositeListParameters<Metadata> {
  /**
   * A ref to the list of HTML elements, ordered by their index.
   * Explicit indexes can leave empty slots in the array.
   * `useListNavigation`'s `listRef` prop.
   */
  elementsRef: React.RefObject<Array<HTMLElement | null>>;
  /**
   * A ref to the list of element labels, ordered by their index.
   * `useTypeahead`'s `listRef` prop.
   */
  labelsRef?: React.RefObject<Array<string | null>> | undefined;
  onMapChange?: ((newMap: Map<Element, CompositeMetadata<Metadata>>) => void) | undefined;
}

export interface CompositeListProps<Metadata> extends UseCompositeListParameters<Metadata> {
  children: React.ReactNode;
}

export namespace CompositeList {
  export type State = CompositeListState;
  export type Props<Metadata> = CompositeListProps<Metadata>;
}
