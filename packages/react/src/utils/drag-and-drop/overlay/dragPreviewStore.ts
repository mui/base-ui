import { Store, type ReadonlyStore } from '@base-ui/utils/store';
import type * as React from 'react';
import { getSharedSlot } from '../sharedState';
import type { DragPreviewOffset, DragInput } from '../../../types/drag';
import type { DragPreviewContext } from './DragPreviewContext';

/**
 * The active drag's custom preview content, published at drag start by the
 * `Draggable.Preview` that declared it.
 *
 * `host` is the element the engine injected next to the source (or into the
 * configured container) and positions each frame; React only fills it. `sourceRect`
 * and `input` are captured at drag start so an offset *callback* can be resolved
 * once the content has rendered and the host has a size.
 *
 * A drag whose preview is the default clone publishes nothing here — the engine
 * builds it without React.
 */
export interface DragPreviewState {
  context: DragPreviewContext;
  node: React.ReactNode;
  host: HTMLElement;
  offset: DragPreviewOffset | undefined;
  sourceRect: DOMRect;
  input: DragInput;
}

const slot = getSharedSlot<{ store: Store<DragPreviewState | null> }>('dragPreview.store', () => ({
  store: new Store<DragPreviewState | null>(null),
}));

/** The active React-rendered preview, shared by every `Draggable.PreviewProvider`. */
export const dragPreviewStore: ReadonlyStore<DragPreviewState | null> = slot.store;

/** Publish `state` for the provider whose React tree should render it. */
export function publishDragPreview(
  context: DragPreviewContext,
  state: Omit<DragPreviewState, 'context'>,
): void {
  slot.store.setState({ ...state, context });
}

/**
 * Clear the React-rendered preview. The engine-owned clone or host is managed by
 * the active preview handle instead.
 */
export function clearPublishedDragPreview(): void {
  slot.store.setState(null);
}
