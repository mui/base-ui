/* eslint-disable no-bitwise */
import type * as React from 'react';
import { EMPTY_ARRAY } from '@base-ui/utils/empty';
import type { CompositeListContextValue, CompositeListRegistration } from './CompositeListContext';

export type CompositeMetadata<CustomMetadata> = {
  index: number;
} & CustomMetadata;

const OBSERVER_OPTIONS: MutationObserverInit = { childList: true };

interface CompositeListItem<Metadata> {
  index: number;
  element: HTMLElement;
  registration: CompositeListRegistration<Metadata>;
}

export interface CompositeListModelParameters<Metadata> {
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
 * The items of one composite list, kept ordered by index in `elementsRef` and `labelsRef`. The
 * model is the context value its items register through.
 */
export class CompositeListModel<Metadata> implements CompositeListContextValue<Metadata> {
  // Fields assigned in the constructor are declared rather than initialized, so they are not
  // defined twice: data grids construct one model per cell while rendering.
  declare elementsRef: React.RefObject<Array<HTMLElement | null>>;

  declare labelsRef: React.RefObject<Array<string | null>> | undefined;

  declare onMapChange: CompositeListModelParameters<Metadata>['onMapChange'];

  declare private readonly requestFlush: () => void;

  /** Starts dirty so the mount commit flushes the registrations collected while mounting. */
  dirty = true;

  #registrations: Map<Element, CompositeListRegistration<Metadata>> | null = null;

  /** Allocated by the first subscription. */
  #listeners: Set<(map: Map<Element, CompositeMetadata<Metadata>>) => void> | null = null;

  /** The last flushed snapshot, or `null` before the first flush. */
  #items: readonly CompositeListItem<Metadata>[] | null = null;

  /** The render-order index reserved for the next item that guesses. */
  #nextIndex = 0;

  #observer: MutationObserver | null = null;

  /** The snapshot whose automatically indexed nodes `#observer` watches for reorders. */
  #observedItems: readonly CompositeListItem<Metadata>[] = EMPTY_ARRAY;

  constructor(params: CompositeListModelParameters<Metadata>) {
    this.elementsRef = params.elementsRef;
    this.labelsRef = params.labelsRef;
    this.onMapChange = params.onMapChange;
    this.requestFlush = params.requestFlush;
  }

  register(node: Element, registration: CompositeListRegistration<Metadata>) {
    this.#registrations ??= new Map();
    const shadowed = this.#registrations.get(node);
    this.#registrations.set(
      node,
      shadowed && shadowed.setIndex !== registration.setIndex
        ? shareIndex(shadowed, registration)
        : registration,
    );
    this.#markDirty();
  }

  unregister(node: Element) {
    if (this.#registrations?.delete(node)) {
      this.#markDirty();
    }
  }

  subscribeMapChange(fn: (map: Map<Element, CompositeMetadata<Metadata>>) => void) {
    this.#listeners ??= new Set();
    const listeners = this.#listeners;
    listeners.add(fn);
    return () => {
      listeners.delete(fn);
    };
  }

  guessIndex() {
    const index = this.#nextIndex;
    this.#nextIndex += 1;
    return index;
  }

  /** Moves the items to new refs on the next flush, emptying the previous ones. */
  setRefs(
    elementsRef: CompositeListModel<Metadata>['elementsRef'],
    labelsRef: CompositeListModel<Metadata>['labelsRef'],
  ) {
    if (this.elementsRef === elementsRef && this.labelsRef === labelsRef) {
      return;
    }

    this.#clearRefs();
    this.elementsRef = elementsRef;
    this.labelsRef = labelsRef;
    // The next flush skips an empty list, so it would not empty refs that arrive with content.
    elementsRef.current.length = 0;
    if (labelsRef) {
      labelsRef.current.length = 0;
    }
    this.dirty = true;
  }

  /** Resolves pending registrations. Call it from the owner's layout effect. */
  flush() {
    this.dirty = false;

    if (!this.#registrations?.size) {
      this.#flushEmpty();
      return;
    }

    const previousItems = this.#items;
    const items = getCompositeListSnapshot(this.#registrations);
    this.#items = items;

    this.#syncRefs(items);

    // The observer's roots follow from the nodes' ancestry, which React only changes by
    // remounting them as new nodes, so an unchanged node order keeps the observer.
    if (!hasSameAutomaticNodes(this.#observedItems, items)) {
      this.#observe(items);
    }

    if (previousItems && publishesSameMap(previousItems, items)) {
      return;
    }

    for (let i = 0; i < items.length; i += 1) {
      const { index, registration } = items[i];
      if (receivesIndex(registration)) {
        registration.setIndex(index);
      }
    }

    this.#publish(items);
  }

  /**
   * Disconnects the observer and empties the refs. The registrations are kept and the list marked
   * dirty: React 18 Strict Mode replays effects without replaying callback refs, so a replayed
   * mount rebuilds the refs and observation from them.
   */
  dispose() {
    this.#disconnectObserver();
    this.#clearRefs();
    this.dirty = true;
  }

  // Many lists, such as data grid cells, hold no item most of the time. Settling an empty list
  // without sorting or observing keeps them nearly free.
  #flushEmpty() {
    this.#nextIndex = 0;

    if (this.#items?.length === 0) {
      return;
    }

    this.#items = EMPTY_ARRAY;
    this.#disconnectObserver();
    this.elementsRef.current.length = 0;
    if (this.labelsRef) {
      this.labelsRef.current.length = 0;
    }
    this.#publish(EMPTY_ARRAY);
  }

  #publish(items: readonly CompositeListItem<Metadata>[]) {
    if (!this.#listeners?.size && !this.onMapChange) {
      return;
    }

    const map = createMetadataMap(items);
    this.#listeners?.forEach((listener) => listener(map));
    this.onMapChange?.(map);
  }

  // Item refs can attach without the owner rendering. Request one commit for the whole batch.
  #markDirty() {
    if (this.dirty) {
      return;
    }

    this.dirty = true;
    this.requestFlush();
  }

  #syncRefs(items: readonly CompositeListItem<Metadata>[]) {
    const elements = this.elementsRef.current;
    const labels = this.labelsRef?.current;
    // The snapshot is sorted by index. Emptying the arrays clears stale slots, and they are then
    // sized up front like the snapshot.
    const size = items.length > 0 ? items[items.length - 1].index + 1 : 0;

    elements.length = 0;
    elements.length = size;
    if (labels) {
      labels.length = 0;
      labels.length = size;
    }

    for (let i = 0; i < items.length; i += 1) {
      const item = items[i];
      elements[item.index] = item.element;

      if (labels) {
        labels[item.index] = getLabel(item);
      }
    }

    this.#nextIndex = elements.length;
  }

  #clearRefs() {
    this.elementsRef.current = [];
    if (this.labelsRef) {
      this.labelsRef.current = [];
    }
  }

  #observe(items: readonly CompositeListItem<Metadata>[]) {
    this.#disconnectObserver();
    this.#observedItems = items;

    if (typeof MutationObserver !== 'function') {
      return;
    }

    // A reorder that changes item indexes must invert at least one adjacent pair
    // from the previous sorted order. Observing each pair's common parent catches
    // both direct item moves and ancestor wrapper moves at the boundary.
    let observer: MutationObserver | null = null;
    let previousRoot: Element | null = null;
    let previous = nextAutomaticIndex(items, 0);
    let next = nextAutomaticIndex(items, previous + 1);
    while (next < items.length) {
      const root = getCommonAncestor(items[previous].element, items[next].element);
      // Observing a root again only replaces its options. Adjacent pairs mostly share their
      // parent, so skipping consecutive repeats saves the calls without collecting a set.
      if (root && root !== previousRoot) {
        observer ??= this.#createObserver(items);
        observer.observe(root, OBSERVER_OPTIONS);
        previousRoot = root;
      }
      previous = next;
      next = nextAutomaticIndex(items, next + 1);
    }
  }

  #createObserver(items: readonly CompositeListItem<Metadata>[]) {
    this.#observer = new MutationObserver((entries) => {
      // Only verify the order after a move: a node that was removed and later
      // re-added within the same batch. Additions and removals alone can't
      // change the relative order of the remaining items, and items that mount
      // or unmount re-sort through `register`/`unregister`.
      if (hasMovedNode(entries) && !isInDocumentOrder(items)) {
        this.#disconnectObserver();
        this.#markDirty();
      }
    });
    return this.#observer;
  }

  #disconnectObserver() {
    this.#observer?.disconnect();
    this.#observer = null;
    this.#observedItems = EMPTY_ARRAY;
  }
}

const sharedRegistrations = new WeakSet<CompositeListRegistration<any>>();

// Nested items can attach to one DOM node. The last attached registration owns the entry,
// but every item attached to the node still renders with the node's index, including when the
// owner has an explicit index.
function shareIndex<Metadata>(
  shadowed: CompositeListRegistration<Metadata>,
  registration: CompositeListRegistration<Metadata>,
): CompositeListRegistration<Metadata> {
  const shared: CompositeListRegistration<Metadata> = {
    ...registration,
    setIndex(index) {
      if (receivesIndex(shadowed)) {
        shadowed.setIndex(index);
      }
      if (registration.index === null) {
        registration.setIndex(index);
      }
    },
  };
  sharedRegistrations.add(shared);
  return shared;
}

// An item with an explicit index renders it as is; only automatic items and the items that a
// shared registration shadows need the resolved index.
function receivesIndex<Metadata>(registration: CompositeListRegistration<Metadata>) {
  return registration.index === null || sharedRegistrations.has(registration);
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
  if (previousItems.length !== items.length) {
    return false;
  }

  for (let i = 0; i < items.length; i += 1) {
    const item = items[i];
    const previousItem = previousItems[i];
    if (
      item.index !== previousItem.index ||
      item.element !== previousItem.element ||
      item.registration.index !== previousItem.registration.index ||
      item.registration.metadata !== previousItem.registration.metadata
    ) {
      return false;
    }
  }

  return true;
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
  registrations: Map<Element, CompositeListRegistration<Metadata>>,
) {
  // Sized up front, as appending to an empty array reserves more slots than a short list needs.
  const items: CompositeListItem<Metadata>[] = new Array(registrations.size);
  let count = 0;
  let hasExplicitIndex = false;

  registrations.forEach((registration, node) => {
    const { index } = registration;
    if (!node.isConnected || (index !== null && index < 0)) {
      return;
    }

    hasExplicitIndex ||= index !== null;
    items[count] = { index: index ?? -1, element: node as HTMLElement, registration };
    count += 1;
  });
  items.length = count;

  if (!hasExplicitIndex) {
    items.sort(compareByDocumentPosition);
    for (let i = 0; i < items.length; i += 1) {
      items[i].index = i;
    }
    return items;
  }

  const automaticItems: CompositeListItem<Metadata>[] = [];
  const reservedIndices = new Set<number>();
  for (const item of items) {
    if (isAutomatic(item)) {
      automaticItems.push(item);
    } else {
      reservedIndices.add(item.index);
    }
  }

  automaticItems.sort(compareByDocumentPosition);
  let nextAutomaticIndex = 0;
  for (const item of automaticItems) {
    while (reservedIndices.has(nextAutomaticIndex)) {
      nextAutomaticIndex += 1;
    }

    item.index = nextAutomaticIndex;
    nextAutomaticIndex += 1;
  }

  items.sort((a, b) => a.index - b.index);

  return items;
}

function isAutomatic<Metadata>(item: CompositeListItem<Metadata>) {
  return item.registration.index === null;
}

function nextAutomaticIndex<Metadata>(items: readonly CompositeListItem<Metadata>[], from: number) {
  let index = from;
  while (index < items.length && !isAutomatic(items[index])) {
    index += 1;
  }
  return index;
}

// Automatic items take increasing indexes in document order, so a snapshot, sorted by index,
// lists them in document order.
function hasSameAutomaticNodes<Metadata>(
  a: readonly CompositeListItem<Metadata>[],
  b: readonly CompositeListItem<Metadata>[],
) {
  let i = nextAutomaticIndex(a, 0);
  let j = nextAutomaticIndex(b, 0);
  while (i < a.length && j < b.length) {
    if (a[i].element !== b[j].element) {
      return false;
    }
    i = nextAutomaticIndex(a, i + 1);
    j = nextAutomaticIndex(b, j + 1);
  }
  return i === a.length && j === b.length;
}

// A disconnected node has no meaningful document position, so the check skips it.
function isInDocumentOrder<Metadata>(items: readonly CompositeListItem<Metadata>[]) {
  let previousConnectedNode: Element | null = null;

  for (
    let i = nextAutomaticIndex(items, 0);
    i < items.length;
    i = nextAutomaticIndex(items, i + 1)
  ) {
    const node = items[i].element;
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

function compareByDocumentPosition<Metadata>(
  a: CompositeListItem<Metadata>,
  b: CompositeListItem<Metadata>,
) {
  return sortByDocumentPosition(a.element, b.element);
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
