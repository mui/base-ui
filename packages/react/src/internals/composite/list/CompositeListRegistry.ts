/* eslint-disable no-bitwise */
import type * as React from 'react';
import { EMPTY_ARRAY } from '@base-ui/utils/empty';
import type { CompositeListContextValue, CompositeListRegistration } from './CompositeListContext';

export type CompositeMetadata<CustomMetadata> = {
  index: number;
} & CustomMetadata;

interface CompositeListItem<Metadata> {
  index: number;
  element: HTMLElement;
  registration: CompositeListRegistration<Metadata>;
}

export interface CompositeListRegistryParameters<Metadata> {
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
  /**
   * Schedules a commit of the list's owner, which then calls `flush` from a layout effect.
   * Called once per batch of registrations made while the list is clean.
   */
  requestFlush: () => void;
}

/**
 * The items of one composite list, kept ordered by index in `elementsRef` and `labelsRef`.
 *
 * Items register through `context`, which marks the list dirty. Its owner calls `flush` from a
 * layout effect, and `dispose` when it unmounts. `useCompositeList` is the owner for React
 * components that have none of their own.
 */
export class CompositeListRegistry<Metadata> {
  elementsRef: React.RefObject<Array<HTMLElement | null>>;

  labelsRef: React.RefObject<Array<string | null>> | undefined;

  onMapChange: CompositeListRegistryParameters<Metadata>['onMapChange'];

  /** Starts dirty so the mount commit flushes the registrations collected while mounting. */
  dirty = true;

  readonly context: CompositeListContextValue<Metadata>;

  private readonly requestFlush: () => void;

  private registrations: Map<Element, CompositeListRegistration<Metadata>> | null = null;

  /** Allocated by the first subscription. */
  private listeners: Set<(map: Map<Element, CompositeMetadata<Metadata>>) => void> | null = null;

  /** The last flushed snapshot, or `null` before the first flush. */
  private items: readonly CompositeListItem<Metadata>[] | null = null;

  /** The render-order index reserved for the next item that guesses. */
  private nextIndex = 0;

  private observer: MutationObserver | null = null;

  /** The automatically indexed nodes, in order, that `observer` watches for reorders. */
  private observedNodes: readonly HTMLElement[] = EMPTY_ARRAY;

  constructor(params: CompositeListRegistryParameters<Metadata>) {
    this.elementsRef = params.elementsRef;
    this.labelsRef = params.labelsRef;
    this.onMapChange = params.onMapChange;
    this.requestFlush = params.requestFlush;
    this.context = {
      register: (node, registration) => {
        this.registrations ??= new Map();
        const shadowed = this.registrations.get(node);
        this.registrations.set(
          node,
          shadowed && shadowed.setIndex !== registration.setIndex
            ? shareIndex(shadowed, registration)
            : registration,
        );
        this.markDirty();
      },
      unregister: (node) => {
        if (this.registrations?.delete(node)) {
          this.markDirty();
        }
      },
      subscribeMapChange: (fn) => {
        this.listeners ??= new Set();
        const listeners = this.listeners;
        listeners.add(fn);
        return () => {
          listeners.delete(fn);
        };
      },
      guessIndex: () => {
        const index = this.nextIndex;
        this.nextIndex += 1;
        return index;
      },
    };
  }

  /** Moves the items to new refs on the next flush, emptying the previous ones. */
  setRefs(
    elementsRef: CompositeListRegistry<Metadata>['elementsRef'],
    labelsRef: CompositeListRegistry<Metadata>['labelsRef'],
  ) {
    if (this.elementsRef === elementsRef && this.labelsRef === labelsRef) {
      return;
    }

    this.clearRefs();
    this.elementsRef = elementsRef;
    this.labelsRef = labelsRef;
    this.dirty = true;
  }

  flush() {
    this.dirty = false;

    if (!this.registrations?.size) {
      this.flushEmpty();
      return;
    }

    const previousItems = this.items;
    const [items, automaticNodes] = getCompositeListSnapshot(this.registrations);
    this.items = items;

    this.syncRefs(items);

    if (!isSameNodeOrder(this.observedNodes, automaticNodes)) {
      this.observe(automaticNodes);
    }

    if (previousItems && publishesSameMap(previousItems, items)) {
      return;
    }

    items.forEach((item) => {
      if (item.registration.index === null) {
        item.registration.setIndex(item.index);
      }
    });

    this.publish(items);
  }

  /**
   * Disconnects the observer and empties the refs. The registrations are kept and the list marked
   * dirty: React 18 Strict Mode replays effects without replaying callback refs, so a replayed
   * mount rebuilds the refs and observation from them.
   */
  dispose() {
    this.disconnectObserver();
    this.clearRefs();
    this.dirty = true;
  }

  // Many lists, such as data grid cells, hold no item most of the time. Settling an empty list
  // without sorting or observing keeps them nearly free.
  private flushEmpty() {
    this.nextIndex = 0;

    if (this.items?.length === 0) {
      return;
    }

    this.items = EMPTY_ARRAY;
    this.disconnectObserver();
    this.elementsRef.current.length = 0;
    if (this.labelsRef) {
      this.labelsRef.current.length = 0;
    }
    this.publish(EMPTY_ARRAY);
  }

  private publish(items: readonly CompositeListItem<Metadata>[]) {
    if (!this.listeners?.size && !this.onMapChange) {
      return;
    }

    const map = createMetadataMap(items);
    this.listeners?.forEach((listener) => listener(map));
    this.onMapChange?.(map);
  }

  // Item refs can attach without the owner rendering. Request one commit for the whole batch.
  private markDirty() {
    if (this.dirty) {
      return;
    }

    this.dirty = true;
    this.requestFlush();
  }

  private syncRefs(items: readonly CompositeListItem<Metadata>[]) {
    const elements = this.elementsRef.current;
    const labels = this.labelsRef?.current;

    elements.length = 0;
    if (labels) {
      labels.length = 0;
    }

    items.forEach((item) => {
      elements[item.index] = item.element;

      if (labels) {
        labels[item.index] = getLabel(item);
      }
    });

    this.nextIndex = elements.length;
  }

  private clearRefs() {
    this.elementsRef.current = [];
    if (this.labelsRef) {
      this.labelsRef.current = [];
    }
  }

  private observe(sortedNodes: readonly HTMLElement[]) {
    this.disconnectObserver();
    this.observedNodes = sortedNodes;

    // A single item can't reorder.
    if (typeof MutationObserver !== 'function' || sortedNodes.length < 2) {
      return;
    }

    const observer = new MutationObserver((entries) => {
      // Only verify the order after a move: a node that was removed and later
      // re-added within the same batch. Additions and removals alone can't
      // change the relative order of the remaining items, and items that mount
      // or unmount re-sort through `register`/`unregister`.
      if (hasMovedNode(entries) && !isInDocumentOrder(sortedNodes)) {
        this.disconnectObserver();
        this.markDirty();
      }
    });

    this.observer = observer;

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

  private disconnectObserver() {
    this.observer?.disconnect();
    this.observer = null;
    this.observedNodes = EMPTY_ARRAY;
  }
}

// Nested items can attach to one DOM node. The last attached registration owns the entry,
// but every item attached to the node still renders with the node's index.
function shareIndex<Metadata>(
  shadowed: CompositeListRegistration<Metadata>,
  registration: CompositeListRegistration<Metadata>,
): CompositeListRegistration<Metadata> {
  return {
    ...registration,
    setIndex(index) {
      shadowed.setIndex(index);
      registration.setIndex(index);
    },
  };
}

function getLabel<Metadata>(item: CompositeListItem<Metadata>) {
  const { label, textRef } = item.registration;
  if (label !== undefined) {
    return label;
  }
  return textRef?.current?.textContent ?? item.element.textContent;
}

function publishesSameMap<Metadata>(
  previousItems: readonly CompositeListItem<Metadata>[],
  items: readonly CompositeListItem<Metadata>[],
) {
  return (
    previousItems.length === items.length &&
    items.every((item, index) => {
      const previousItem = previousItems[index];
      return (
        item.index === previousItem.index &&
        item.element === previousItem.element &&
        item.registration.index === previousItem.registration.index &&
        item.registration.metadata === previousItem.registration.metadata
      );
    })
  );
}

function createMetadataMap<Metadata>(items: readonly CompositeListItem<Metadata>[]) {
  const map = new Map<Element, CompositeMetadata<Metadata>>();

  items.forEach((item) => {
    map.set(item.element, {
      ...(item.registration.metadata ?? ({} as Metadata)),
      index: item.index,
    });
  });

  return map;
}

function getCompositeListSnapshot<Metadata>(
  registrations: Map<Element, CompositeListRegistration<Metadata>> | null,
) {
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
      items.push(item);
    }
  });

  automaticItems.sort((a, b) => sortByDocumentPosition(a.element, b.element));
  const automaticNodes = automaticItems.map((item) => item.element);

  if (items.length === 0) {
    automaticItems.forEach((item, index) => {
      item.index = index;
    });
    return [automaticItems, automaticNodes] as const;
  }

  const reservedIndices = new Set(items.map((item) => item.index));
  let nextAutomaticIndex = 0;
  automaticItems.forEach((item) => {
    while (reservedIndices.has(nextAutomaticIndex)) {
      nextAutomaticIndex += 1;
    }

    item.index = nextAutomaticIndex;
    items.push(item);
    nextAutomaticIndex += 1;
  });

  items.sort((a, b) => a.index - b.index);

  return [items, automaticNodes] as const;
}

function isSameNodeOrder(a: readonly HTMLElement[], b: readonly HTMLElement[]) {
  return a.length === b.length && a.every((node, index) => node === b[index]);
}

// A disconnected node has no meaningful document position, so the check skips it.
function isInDocumentOrder(sortedNodes: readonly HTMLElement[]) {
  let previousConnectedNode: Element | null = null;

  for (const node of sortedNodes) {
    if (!node.isConnected) {
      continue;
    }

    if (previousConnectedNode && sortByDocumentPosition(previousConnectedNode, node) > 0) {
      return false;
    }

    previousConnectedNode = node;
  }

  return true;
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
  // Adjacent siblings are the common case for lists that are already in order, and
  // `compareDocumentPosition` scans siblings from the parent's first child, so sorting
  // a long flat list would otherwise be quadratic.
  if (a.nextElementSibling === b) {
    return -1;
  }
  if (b.nextElementSibling === a) {
    return 1;
  }
  // `DOCUMENT_POSITION_CONTAINED_BY` is always reported alongside `FOLLOWING`, and `CONTAINS`
  // alongside `PRECEDING`, so testing `FOLLOWING` alone orders siblings and nested items alike.
  return a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1;
}
