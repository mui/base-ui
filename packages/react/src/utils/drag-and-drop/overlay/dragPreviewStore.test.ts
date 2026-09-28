import { describe, it, expect } from 'vitest';
import {
  clearPublishedDragPreview,
  dragPreviewStore,
  publishDragPreview,
} from './dragPreviewStore';
import type { DragPreviewState } from './dragPreviewStore';
import type { DraggableContextValue } from '../../../draggable/DraggableContext';
import { createKind } from '../dragKind';

function makeState(label: string): Omit<DragPreviewState, 'context'> {
  return {
    node: label,
    host: document.createElement('div'),
    offset: undefined,
    sourceRect: new DOMRect(),
    input: {
      button: 0,
      buttons: 1,
      clientX: 0,
      clientY: 0,
      pageX: 0,
      pageY: 0,
      pointerType: 'mouse',
      ctrlKey: false,
      shiftKey: false,
      altKey: false,
      metaKey: false,
    },
  };
}

function makeContext(): DraggableContextValue {
  return { defaultKind: createKind<undefined>('default') };
}

describe('dragPreviewStore', () => {
  it('publishes one active preview across providers and clears it', () => {
    const first = makeContext();
    const second = makeContext();
    publishDragPreview(first, makeState('first'));

    expect(dragPreviewStore.state?.context).toBe(first);

    publishDragPreview(second, makeState('second'));

    expect(dragPreviewStore.state?.context).toBe(second);
    clearPublishedDragPreview();
    expect(dragPreviewStore.state).toBeNull();
  });

  it('is a no-op when nothing has been published', () => {
    expect(() => clearPublishedDragPreview()).not.toThrow();
  });
});
