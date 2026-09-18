import { describe, it, expect, vi } from 'vitest';
import { createDndRenderer } from '#test-utils';
import { setupDragEngineTests, createElement, lift } from '../../../../test/dnd';
import { dragPreviewStore } from '../overlay/dragPreviewStore';
import { dragSessionStore } from '../dragSessionStore';

setupDragEngineTests();

describe('sensor session startup', () => {
  const { renderDnd } = createDndRenderer();

  it.each(['payload', 'modifier', 'preview'])(
    'honors cancellation in the %s callback',
    async (callback) => {
      const { engine } = await renderDnd();
      const source = createElement();
      const onMoveStart = vi.fn();
      engine.registerDraggable(source, {
        getPayload: () => {
          if (callback === 'payload') {
            engine.cancelDrag();
          }
          return 'item';
        },
        modifiers: ({ point }) => {
          if (callback === 'modifier') {
            engine.cancelDrag();
          }
          return point;
        },
        dragPreview: {
          render: () => {
            if (callback === 'preview') {
              engine.cancelDrag();
            }
            return 'Preview';
          },
        },
        onMoveStart,
      });
      await lift(source, { expectNoDrag: true });
      expect(onMoveStart).not.toHaveBeenCalled();
      expect(dragSessionStore.state).toBeNull();
      expect(dragPreviewStore.state).toBeNull();
      expect(document.querySelector('[data-drag-preview]')).toBeNull();
      expect(source).not.toHaveAttribute('data-dragging');
    },
  );
});
