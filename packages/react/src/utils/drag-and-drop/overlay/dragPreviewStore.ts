import { Store } from '@base-ui/utils/store';
import type { ReadonlyStore } from '@base-ui/utils/store';
import type * as React from 'react';
import { getSharedSlot } from '../sharedState';
import type { DraggableContextValue } from '../../../draggable/DraggableContext';

/**
 * The active drag's custom preview content, published at drag start from
 * `onGenerateDragPreview` for a `Draggable.Preview` with children or a
 * `registerSource` `preview.render`, and again on each `source.renderPreview()`.
 *
 * `container` is a detached element. React renders the content into it, and the
 * engine copies what it renders into the preview element that follows the pointer.
 * `sync` makes the engine copy the latest content right away, so a commit shows in
 * the same frame. `freeze` stops copying before the content unmounts with its
 * provider.
 *
 * A drag that uses the default clone publishes nothing here, because the engine
 * builds the clone without React.
 */
export interface DragPreviewState {
  context: DraggableContextValue;
  node: React.ReactNode;
  container: HTMLElement;
  sync: () => void;
  /** Stop copying. The preview keeps its last content until the drag ends. */
  freeze: () => void;
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

/**
 * Clear the React-rendered preview content. The preview element itself is managed by
 * the active preview handle instead.
 */
export function clearPublishedDragPreview(): void {
  store.setState(null);
}
