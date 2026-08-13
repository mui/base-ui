import { describe, it, expect } from 'vitest';
import {
  clearPublishedDragPreview,
  createDragPreviewStore,
  publishDragPreview,
} from './dragPreviewStore';
import type { DragPreviewState } from './dragPreviewStore';

function makeState(label: string): DragPreviewState {
  return { content: label } as unknown as DragPreviewState;
}

describe('dragPreviewStore', () => {
  it('clears the store the last drag published into, not the newest one', () => {
    // Two `Draggable.PreviewProvider`s, each with its own store. A drag whose
    // source lives under the first publishes there; the next drag can only
    // resolve *its own* store, so without tracking the last publisher the stale
    // content stays mounted for the whole of the next drag.
    const first = createDragPreviewStore();
    const second = createDragPreviewStore();

    publishDragPreview(first, makeState('from-first'));
    expect(first.state).not.toBeNull();

    clearPublishedDragPreview();
    expect(first.state).toBeNull();

    // And the tracking follows the most recent publish across providers.
    publishDragPreview(second, makeState('from-second'));
    publishDragPreview(first, makeState('from-first-again'));
    clearPublishedDragPreview();
    expect(first.state).toBeNull();
    expect(second.state).not.toBeNull();
  });

  it('is a no-op when nothing has been published', () => {
    expect(() => clearPublishedDragPreview()).not.toThrow();
  });
});
