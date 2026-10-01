import { Store } from '@base-ui/utils/store';
import type { ReadonlyStore } from '@base-ui/utils/store';
import { getSharedSlot } from './sharedState';
import * as DraggableRootDataAttributes from '../../draggable/root/DraggableRootDataAttributes';

const store = getSharedSlot(
  'dragSettlingSources',
  () => new Store<ReadonlySet<Element>>(new Set<Element>()),
);

/**
 * The sources whose preview is settling into place after a drop. Mirrors
 * `[data-settling]` for React, so a `Draggable.Root` can expose it as `state.settling`.
 */
export const settlingSourcesStore: ReadonlyStore<ReadonlySet<Element>> = store;

/**
 * Mark `element` as settling or not, on the DOM and in the store. The engine is the
 * only writer of `[data-settling]`, so the two always agree.
 */
export function setSourceSettling(element: Element, settling: boolean): void {
  if (settling) {
    element.setAttribute(DraggableRootDataAttributes.settling, '');
  } else {
    element.removeAttribute(DraggableRootDataAttributes.settling);
  }
  if (store.state.has(element) === settling) {
    return;
  }
  const next = new Set(store.state);
  if (settling) {
    next.add(element);
  } else {
    next.delete(element);
  }
  store.setState(next);
}
