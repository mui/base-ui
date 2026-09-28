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
      // `warn()` logs each message once, and the log resets before each test, so
      // re-mounts can't raise the count.
      expect(warnSpy).toHaveBeenCalledTimes(1);
      expect(warnSpy.mock.calls[0][0]).toMatch(/more than one mounted Draggable\.Handle/);

      // After handle A unmounts, pickup is restricted to handle B instead of the
      // whole card.
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

  it('keeps the gesture styles through a handle swap mid-drag and re-registers on the new handle', async () => {
    function Card({ handleId }: { handleId: string }) {
      return (
        <Draggable.Root kind={testDragKind} data-testid="card">
          <span data-testid="body">content</span>
          <Draggable.Handle key={handleId} data-testid={handleId}>
            grip
          </Draggable.Handle>
        </Draggable.Root>
      );
    }

    const { rerender } = await renderDnd(<Card handleId="handle-a" />);
    const card = screen.getByTestId('card');
    card.getBoundingClientRect = () => new DOMRect(0, 0, 200, 100);
    const handleA = screen.getByTestId('handle-a');

    // The static setup targets the handle rather than the root.
    expect(handleA.style.userSelect).toBe('none');
    expect(handleA.style.touchAction).toBe('manipulation');
    expect(card.style.userSelect).toBe('');

    await lift(handleA);
    expect(dragSessionStore.getSnapshot()?.source.element).toBe(card);

    // Swapping the handle while the root is the active source must not tear down
    // the registration during the gesture. The old handle keeps its styles and
    // the drag continues.
    await rerender(<Card handleId="handle-b" />);
    const handleB = screen.getByTestId('handle-b');

    expect(dragSessionStore.getSnapshot()?.source.element).toBe(card);
    expect(card).toHaveAttribute('data-dragging');
    expect(handleA.style.userSelect).toBe('none');
    expect(handleA.style.touchAction).toBe('manipulation');

    cancel();
    await flushRaf();

    // The deferred reconcile runs once the drag ends. The new handle gets the
    // static setup and is the only pickup point.
    expect(dragSessionStore.getSnapshot()).toBeNull();
    expect(handleB.style.userSelect).toBe('none');
    expect(handleB.style.touchAction).toBe('manipulation');

    await lift(screen.getByTestId('body'), { expectNoDrag: true });
    expect(dragSessionStore.getSnapshot()).toBeNull();

    await lift(handleB);
    expect(dragSessionStore.getSnapshot()?.source.element).toBe(card);

    cancel();
    await flushRaf();
  });

  it('resolves className and style callbacks from the disabled state', async () => {
    const className = (state: Draggable.Handle.State) =>
      state.disabled ? 'is-disabled' : 'is-enabled';
    const style = (state: Draggable.Handle.State) => ({
      cursor: state.disabled ? 'not-allowed' : 'grab',
    });
    function Card({ disabled }: { disabled?: boolean }) {
      return (
        <Draggable.Root kind={testDragKind} disabled={disabled}>
          <Draggable.Handle data-testid="handle" className={className} style={style}>
            grip
          </Draggable.Handle>
        </Draggable.Root>
      );
    }

    const { rerender } = await renderDnd(<Card />);
    const handle = screen.getByTestId('handle');

    expect(handle).toHaveClass('is-enabled');
    expect(handle.style.cursor).toBe('grab');

    await rerender(<Card disabled />);

    expect(handle).toHaveClass('is-disabled');
    expect(handle.style.cursor).toBe('not-allowed');
    expect(handle).toHaveAttribute('data-disabled');
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
