import * as React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { describeConformance, dragRegistrationConformanceTests } from '#test-utils';
import { Draggable } from '@base-ui/react/draggable';
import { createDndRenderer, testDragKind } from '../../../test/dndEngine';
import { cancel, dragOver, flushRaf, lift, setupDragEngineTests } from '../../../test/dnd';
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

  dragRegistrationConformanceTests({
    render: renderDnd,
    wrapper: ({ children }) => <Draggable.Root kind={testDragKind}>{children}</Draggable.Root>,
    createComponent: ({ key, ...props }) => <Draggable.Handle key={key} {...props} />,
    // The root moves its gesture styles to its registered handle.
    isRegistered: (element) => element.style.touchAction === 'manipulation',
  });

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
      // `warn()` logs each message once per test, so re-mounts can't raise the count.
      expect(warnSpy).toHaveBeenCalledTimes(1);
      expect(warnSpy.mock.calls[0][0]).toMatch(/more than one mounted Draggable\.Handle/);

      // Pickup falls back to handle B, not the whole card.
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

  it('keeps the drag through a handle swap mid-drag and moves the gesture styles to the new handle', async () => {
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

    await rerender(<Card handleId="handle-b" />);
    const handleB = screen.getByTestId('handle-b');

    expect(dragSessionStore.getSnapshot()?.source.element).toBe(card);
    expect(card).toHaveAttribute('data-dragging');
    expect(handleB.style.userSelect).toBe('none');
    expect(handleB.style.touchAction).toBe('manipulation');

    cancel();
    await flushRaf();

    // The new handle is the only pickup point.
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

  it('does not re-register a hovered root when an inline ref changes identity', async () => {
    // A new ref callback every render makes React re-attach the handle node.
    // Re-registering the root would make it leave and re-enter as a collision item,
    // and handlers that set state would loop forever.
    const kind = Draggable.createKind<string>('handle-collision');
    const changed = vi.fn();
    function List() {
      const [over, setOver] = React.useState<string | null>(null);
      return (
        <Draggable.CollisionProvider
          kind={kind}
          onCollisionChange={({ target }) => {
            changed(target?.payload ?? null);
            // Bounded, so a regression fails the assertions below instead of hanging.
            if (changed.mock.calls.length < 20) {
              setOver(target?.payload ?? null);
            }
          }}
        >
          <Draggable.Root kind={kind} payload="a" data-testid="a">
            <Draggable.Preview disabled />
          </Draggable.Root>
          <Draggable.Root kind={kind} payload="b" data-testid="b" data-over={over === 'b'}>
            <Draggable.Handle ref={() => {}} data-testid="handle-b">
              grip
            </Draggable.Handle>
          </Draggable.Root>
        </Draggable.CollisionProvider>
      );
    }

    await renderDnd(<List />);
    const a = screen.getByTestId('a');
    const b = screen.getByTestId('b');
    b.getBoundingClientRect = () => new DOMRect(0, 100, 100, 100);
    await lift(a);
    await dragOver(b, { clientY: 120 });
    await flushRaf();
    expect(changed.mock.calls).toEqual([['b']]);
    expect(b).toHaveAttribute('data-over', 'true');
    cancel();
    await flushRaf();

    // The handle is still the only pickup point of its root.
    b.getBoundingClientRect = () => new DOMRect(0, 0, 100, 100);
    await lift(b, { expectNoDrag: true });
    expect(dragSessionStore.getSnapshot()).toBeNull();
    await lift(screen.getByTestId('handle-b'));
    expect(dragSessionStore.getSnapshot()?.source.element).toBe(b);
    cancel();
    await flushRaf();
  });

  describe('without Strict Mode', () => {
    // Strict Mode re-attaches a newly mounted handle's ref, which re-registers the
    // root a second time and would hide a stale registration.
    const { renderDnd: renderNonStrict } = createDndRenderer({ strict: false });

    it('applies the static setup to a handle swapped in a commit that changes the root ref', async () => {
      // The root's inline ref detaches and re-attaches its node in the same commit
      // as the handle swap. The re-attach must not keep the registration made
      // while no handle was mounted.
      function Card({ handleId }: { handleId: string }) {
        return (
          <Draggable.Root kind={testDragKind} data-testid="card" ref={() => {}}>
            <span data-testid="body">content</span>
            <Draggable.Handle key={handleId} data-testid={handleId}>
              grip
            </Draggable.Handle>
          </Draggable.Root>
        );
      }

      const { rerender } = await renderNonStrict(<Card handleId="handle-a" />);
      const card = screen.getByTestId('card');
      card.getBoundingClientRect = () => new DOMRect(0, 0, 200, 100);

      await rerender(<Card handleId="handle-b" />);
      const handleB = screen.getByTestId('handle-b');
      expect(handleB.style.userSelect).toBe('none');

      await lift(screen.getByTestId('body'), { expectNoDrag: true });
      expect(dragSessionStore.getSnapshot()).toBeNull();
      await lift(handleB);
      expect(dragSessionStore.getSnapshot()?.source.element).toBe(card);
      cancel();
      await flushRaf();
    });
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
});
