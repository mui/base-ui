import { Store } from '@base-ui/utils/store';
import type { ReadonlyStore } from '@base-ui/utils/store';
import type * as React from 'react';
import { getSharedSlot } from '../sharedState';
import type { DraggableContextValue } from '../../../draggable/DraggableContext';

/**
 * The active drag's custom preview content, published at drag start from
 * `onGenerateDragPreview` and on each `Draggable.updatePreview()` (the default clone
 * publishes nothing). React renders `node` into the detached `container`; `sync` runs
 * after each commit and copies it into the pointer-following preview in the same frame.
 */
export interface DragPreviewState {
  context: DraggableContextValue;
  node: React.ReactNode;
  container: HTMLElement;
  sync: () => void;
}

const store = getSharedSlot('dragPreview.store', () => new Store<DragPreviewState | null>(null));

/** The active React-rendered preview, shared by every `Draggable.Provider`. */
export const dragPreviewStore: ReadonlyStore<DragPreviewState | null> = store;

/** Publish `state` for the provider whose React tree should render it. */
export function publishDragPreview(
  context: DraggableContextValue,
  state: Omit<DragPreviewState, 'context'>,
): void {
  store.setState({ ...state, context });
}

/** Clears only the React content. The preview element belongs to the active preview handle. */
export function clearPublishedDragPreview(): void {
  store.setState(null);
}
