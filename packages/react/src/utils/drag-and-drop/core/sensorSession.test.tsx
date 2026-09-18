import * as React from 'react';
import { act, screen } from '@mui/internal-test-utils';
import { describe, it, expect, vi } from 'vitest';
import { createDndRenderer } from '#test-utils';
import { Draggable } from '../../../draggable';
import { setupDragEngineTests, createElement, lift } from '../../../../test/dnd';
import { dragPreviewStore } from '../overlay/dragPreviewStore';
import { dragSessionStore } from '../dragSessionStore';

setupDragEngineTests();

describe('sensor session startup', () => {
  const { renderDnd } = createDndRenderer();

  it('keeps source callbacks compatible when its kind changes mid-drag', async () => {
    const original = Draggable.createKind<string>('original');
    const next = Draggable.createKind<{ id: number }>('next');
    const originalEnd = vi.fn();
    const latestEnd = vi.fn();
    const nextEnd = vi.fn();
    const { rerender, engine } = await renderDnd(
      <Draggable.Root
        data-testid="source"
        kind={original}
        payload="first"
        onMoveEnd={originalEnd}
      />,
    );
    await lift(screen.getByTestId('source'));
    await rerender(
      <Draggable.Root data-testid="source" kind={next} payload={{ id: 1 }} onMoveEnd={nextEnd} />,
    );
    act(() => engine.cancelDrag());
    expect(nextEnd).not.toHaveBeenCalled();
    expect(originalEnd).toHaveBeenCalledTimes(1);
    expect(originalEnd.mock.calls[0][0].source.payload).toBe('first');

    await rerender(
      <Draggable.Root
        data-testid="source"
        kind={original}
        payload="second"
        onMoveEnd={latestEnd}
      />,
    );
    await lift(screen.getByTestId('source'));
    act(() => engine.cancelDrag());
    expect(latestEnd).toHaveBeenCalledTimes(1);
    expect(latestEnd.mock.calls[0][0].source.payload).toBe('second');
  });

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
