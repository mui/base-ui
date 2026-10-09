import { Store } from '@base-ui/utils/store';
import type { ReadonlyStore } from '@base-ui/utils/store';
import { getSharedSlot } from './sharedState';
import * as DraggableRootDataAttributes from '../../draggable/root/DraggableRootDataAttributes';

const store = getSharedSlot(
  'dragSettlingSources',
  () => new Store<ReadonlySet<Element>>(new Set<Element>()),
);

/**
 * Sources whose preview is settling after a drop. Mirrors `[data-settling]` for
 * `Draggable.Root`'s `state.settling`.
 */
export const settlingSourcesStore: ReadonlyStore<ReadonlySet<Element>> = store;

/** The engine is the only writer of `[data-settling]`, so the DOM and the store agree. */
export function setSourceSettling(element: Element, settling: boolean): void {
  element.toggleAttribute(DraggableRootDataAttributes.settling, settling);
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
