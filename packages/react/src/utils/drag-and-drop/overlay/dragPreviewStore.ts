import { Store } from '@base-ui/utils/store';
import type { ReadonlyStore } from '@base-ui/utils/store';
import type * as React from 'react';
import { getSharedSlot } from '../sharedState';
import type { DraggableInput } from '../../../draggable/DraggableProvider';
import type { DraggablePreviewOffset } from '../../../draggable/preview/DraggablePreview';
import type { DraggableContextValue } from '../../../draggable/DraggableContext';

/**
 * The active drag's custom preview content, published at drag start from
 * `onGenerateDragPreview` for a `Draggable.Preview` with children or a
 * `registerSource` `preview.render`.
 *
 * `host` is the element the engine inserted next to the source (or into the
 * configured container) and positions each frame. React only fills it. `sourceRect`
 * and `input` are captured at drag start so an offset callback can resolve once
 * the content has rendered and the host has a size.
 *
 * A drag that uses the default clone publishes nothing here, because the engine
 * builds the clone without React.
 */
export interface DragPreviewState {
  context: DraggableContextValue;
  node: React.ReactNode;
  host: HTMLElement;
  offset: DraggablePreviewOffset | undefined;
  sourceRect: DOMRect;
  input: DraggableInput;
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
 * Clear the React-rendered preview. The engine-owned clone or host is managed by
 * the active preview handle instead.
 */
export function clearPublishedDragPreview(): void {
  store.setState(null);
}
