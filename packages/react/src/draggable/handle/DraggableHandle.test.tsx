import * as React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { createDndRenderer, describeConformance, testDragKind } from '#test-utils';
import { Draggable } from '@base-ui/react/draggable';
import { cancel, flushRaf, lift, setupDragEngineTests } from '../../../test/dnd';
import { dragSessionStore } from '../../utils/drag-and-drop/dragSessionStore';

setupDragEngineTests();

describe('<Draggable.Handle />', () => {
  const { renderDnd } = createDndRenderer();

  describeConformance(<Draggable.Handle />, () => ({
    refInstanceof: window.HTMLSpanElement,
    render(node) {
      return renderDnd(<Draggable.Root kind={testDragKind}>{node}</Draggable.Root>);
    },
  }));

  it('warns for a second mounted handle, and falls back to the survivor on unmount', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    try {
      function Card({ withFirst }: { withFirst: boolean }) {
        return (
          <Draggable.Root kind={testDragKind} data-testid="card">
            <span data-testid="body">content</span>
            {withFirst && <Draggable.Handle data-testid="handle-a">a</Draggable.Handle>}
            <Draggable.Handle data-testid="handle-b">b</Draggable.Handle>
          </Draggable.Root>
        );
      }

      const { rerender } = await renderDnd(<Card withFirst />);
      // `warn()` dedupes per message process-wide, so this must be the first
      // two-handle mount of the file — and re-mounts can't inflate the count.
      expect(warnSpy).toHaveBeenCalledTimes(1);
      expect(warnSpy.mock.calls[0][0]).toMatch(/more than one mounted Draggable\.Handle/);

      // Unmounting handle A restricts pickup to the surviving handle B, not
      // back to the whole card.
      await rerender(<Card withFirst={false} />);
      const card = screen.getByTestId('card');
      card.getBoundingClientRect = () => new DOMRect(0, 0, 200, 100);

      await lift(screen.getByTestId('body'), { expectNoDrag: true });
      expect(dragSessionStore.getSnapshot()).toBeNull();

      await lift(screen.getByTestId('handle-b'));
      expect(dragSessionStore.getSnapshot()?.source.element).toBe(card);

      cancel();
      await flushRaf();
    } finally {
      warnSpy.mockRestore();
    }
  });

  it('reflects the root disabled state', async () => {
    await renderDnd(
      <Draggable.Root kind={testDragKind} disabled>
        <Draggable.Handle data-testid="handle">grip</Draggable.Handle>
      </Draggable.Root>,
    );
    expect(screen.getByTestId('handle')).toHaveAttribute('data-disabled');
  });
});
