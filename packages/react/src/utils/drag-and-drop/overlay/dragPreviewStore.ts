import { Store } from '@base-ui/utils/store';
import type * as React from 'react';
import { getSharedSlot } from '../sharedState';
import type { DragPreviewOffset, DragInput } from '../../../types/drag';

/**
 * The active drag's custom preview content, published at drag start by the
 * `Draggable.Preview` that declared it.
 *
 * `host` is the element the engine injected next to the source (or into the
 * configured container) and positions each frame; React only fills it. `sourceRect`
 * and `input` are captured at drag start so an offset *callback* can be resolved
 * once the content has rendered and the host has a size.
 *
 * A drag whose preview is a clone publishes nothing here — the engine
 * builds it without React.
 */
export interface DragPreviewState {
  node: React.ReactNode;
  host: HTMLElement;
  offset: DragPreviewOffset | undefined;
  sourceRect: DOMRect;
  input: DragInput;
}

/** Create a drag-preview store. One per `Draggable.PreviewProvider`. */
export function createDragPreviewStore(): Store<DragPreviewState | null> {
  return new Store<DragPreviewState | null>(null);
}

// The store the live (or most recent) drag published its preview into. Shared
// slot so a doubly-bundled engine tracks one, like the sensors' other state.
const lastPublishedSlot = getSharedSlot<{ store: Store<DragPreviewState | null> | null }>(
  'dragPreview.lastPublished',
  () => ({ store: null }),
);

/** Publish `state` and remember the store, for `clearPublishedDragPreview`. */
export function publishDragPreview(
  store: Store<DragPreviewState | null>,
  state: DragPreviewState,
): void {
  lastPublishedSlot.store = store;
  store.setState(state);
}

/**
 * Clear the preview the previous drag published, whichever store it went to.
 *
 * A new drag can only resolve *its own* store, which is not necessarily the one
 * holding the stale content: the previous source may have published into another
 * `Draggable.PreviewProvider`'s store. When a drop and the next pickup land in one
 * React flush, the renderer's clear-on-null effect never runs, so that content
 * would otherwise stay mounted through the whole next drag.
 */
export function clearPublishedDragPreview(): void {
  lastPublishedSlot.store?.setState(null);
  lastPublishedSlot.store = null;
}
