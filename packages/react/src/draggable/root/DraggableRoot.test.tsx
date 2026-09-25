import * as React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { act, fireEvent, screen, render as rawRender } from '@testing-library/react';
import { createDndRenderer, describeConformance, firePointer, testDragKind } from '#test-utils';
import { Draggable } from '@base-ui/react/draggable';
import {
  cancel,
  createElement,
  dragOver,
  flushRaf,
  lift,
  registerCleanup,
  setupDragEngineTests,
  splitEnd,
} from '../../../test/dnd';
import { dragSessionStore } from '../../utils/drag-and-drop/dragSessionStore';
import { getRegistration } from '../../utils/drag-and-drop/draggableRegistry';
import { DraggableProvider } from '../DraggableProvider';
import { CSPProvider } from '../../csp-provider';

setupDragEngineTests();

function rtlRender(ui: React.ReactElement) {
  return rawRender(ui, { wrapper: Draggable.Provider });
}

/** Kind for the fixtures that carry a payload, so its type reaches their handlers. */
const cardKind = Draggable.createKind<{ id: string }>('card');

/** `data-dragging` is owned by the engine, so `state.dragging` is probed through
 * `className` instead. */
function draggingClass(state: Draggable.Root.State) {
  return state.dragging ? 'dragging' : 'idle';
}

function TestDraggable<TPayload = undefined>(props: {
  options?: Partial<Draggable.Root.Props<TPayload>>;
  mounted?: boolean;
  testId?: string;
}) {
  const { options, mounted = true, testId = 'drag' } = props;
  if (!mounted) {
    return null;
  }
  // `Draggable.Root`'s overloads need `payload` to be statically present once
  // `TPayload` is declared. This helper forwards whatever a fixture hands it — most
  // pass no payload at all — so widen past the overloads rather than making every
  // fixture declare one. `kind` defaults to the shared test kind, and a fixture
  // exercising kind matching (or a typed payload) passes its own.
  const Root = Draggable.Root as React.ComponentType<any>;
  return <Root kind={testDragKind} {...options} data-testid={testId} className={draggingClass} />;
}

describe('Draggable.Root', () => {
  const { renderDnd } = createDndRenderer();

  describeConformance(<Draggable.Root kind={testDragKind} />, () => ({
    refInstanceof: window.HTMLDivElement,
    render(node) {
      return renderDnd(node);
    },
  }));

  it('warns when a root has no kind inside a collision provider', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    try {
      await renderDnd(
        <Draggable.CollisionProvider kind={cardKind}>
          <Draggable.Root />
        </Draggable.CollisionProvider>,
      );
      expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('has no explicit kind'));
    } finally {
      warnSpy.mockRestore();
    }
  });

  it('clones the source inside the required provider', async () => {
    // The clone is engine-built and touches no React, so the provider requirement
    // is scoped to custom content.
    rtlRender(
      <Draggable.Root kind={testDragKind} data-testid="bare">
        <Draggable.Preview />
      </Draggable.Root>,
    );
    const source = screen.getByTestId('bare');
    source.getBoundingClientRect = () => new DOMRect(0, 0, 200, 100);

    fireEvent.dragStart(source);

    const clone = source.parentElement!.querySelector('[data-drag-preview]');
    expect(clone).not.toBeNull();
  });

  it('applies the gesture styles once attached', async () => {
    await renderDnd(<TestDraggable />);
    const el = screen.getByTestId('drag');
    // Registration no longer marks the element `draggable` (the native path is
    // gone); the synthetic engine applies gesture styles to the handle so a
    // press can't select text or fire the touch callout.
    expect(el.style.touchAction).toBe('manipulation');
    expect(el.style.userSelect).toBe('none');
  });

  it('restores the gesture styles on unmount', async () => {
    const { unmount } = await renderDnd(<TestDraggable />);
    const el = screen.getByTestId('drag');
    expect(el.style.touchAction).toBe('manipulation');
    unmount();
    expect(el.style.touchAction).toBe('');
    expect(el.style.userSelect).toBe('');
  });

  it('applies the static setup to a handle swapped mid-drag once the drag ends', async () => {
    // Swapping the handle node during the element's own drag skips the
    // re-registration (tearing the gesture styles down would disrupt the live
    // drag); the skipped reconcile must flush when the drag ends, or the new
    // handle never receives the gesture styles / a11y attributes.
    function Card({ handleKey }: { handleKey: string }) {
      return (
        <Draggable.Root kind={testDragKind} data-testid="card">
          <Draggable.Handle key={handleKey} render={<button type="button" />} data-testid="handle">
            grip
          </Draggable.Handle>
        </Draggable.Root>
      );
    }

    const { rerender } = await renderDnd(<Card handleKey="a" />);
    const card = screen.getByTestId('card');
    card.getBoundingClientRect = () => new DOMRect(0, 0, 200, 100);
    const firstHandle = screen.getByTestId('handle');

    fireEvent.dragStart(firstHandle);
    await flushRaf();
    expect(dragSessionStore.getSnapshot()?.source.element).toBe(card);

    // Remount the handle to a fresh node mid-drag. Queried within the live card
    // (the engine's clone preview duplicates the test id).
    await rerender(<Card handleKey="b" />);
    const secondHandle = card.querySelector('[data-testid="handle"]') as HTMLElement;
    expect(secondHandle).not.toBe(firstHandle);

    cancel();
    await flushRaf();

    expect(secondHandle.style.touchAction).toBe('manipulation');
  });

  it('exposes state.dragging reflecting the active drag session', async () => {
    const { engine } = await renderDnd(<TestDraggable />);
    const source = screen.getByTestId('drag');
    expect(source).toHaveClass('idle');

    // Pin element bounds so the engine can resolve a pointer location.
    source.getBoundingClientRect = () => new DOMRect(0, 0, 200, 100);
    const target = createElement();
    engine.registerTarget(target, {});

    fireEvent.dragStart(source);
    await flushRaf();

    expect(source).toHaveClass('dragging');

    fireEvent.dragEnter(target);
    fireEvent.dragOver(target);
    await flushRaf();

    fireEvent.drop(target);
    await flushRaf();

    expect(source).toHaveClass('idle');
  });

  it('resets state.dragging when the drag is cancelled (no drop target hit)', async () => {
    await renderDnd(<TestDraggable />);
    const source = screen.getByTestId('drag');
    source.getBoundingClientRect = () => new DOMRect(0, 0, 200, 100);

    fireEvent.dragStart(source);
    await flushRaf();
    expect(source).toHaveClass('dragging');

    // Cancel the drag with no drop target hit. The synthetic engine treats a
    // `dragend` without a preceding `drop` as a cancel.
    cancel();
    await flushRaf();

    expect(source).toHaveClass('idle');
  });

  it('blocks the drag when onBeforeMoveStart cancels', async () => {
    const onMoveStart = vi.fn();
    await renderDnd(
      <TestDraggable
        options={{ onBeforeMoveStart: (_, eventDetails) => eventDetails.cancel(), onMoveStart }}
      />,
    );
    const source = screen.getByTestId('drag');

    fireEvent.dragStart(source);
    await flushRaf();

    expect(onMoveStart).not.toHaveBeenCalled();
    expect(source).toHaveClass('idle');
  });

  it('reports the Draggable.Handle element as source.handle', async () => {
    const onBeforeMoveStart = vi.fn();
    const onMoveStart = vi.fn();
    await renderDnd(
      <Draggable.Root
        kind={testDragKind}
        onBeforeMoveStart={onBeforeMoveStart}
        onMoveStart={onMoveStart}
      >
        <Draggable.Handle data-testid="handle" />
      </Draggable.Root>,
    );
    const handle = screen.getByTestId('handle');

    await lift(handle);

    expect(onBeforeMoveStart.mock.calls[0][0].source.handle).toBe(handle);
    expect(onMoveStart.mock.calls[0][0].source.handle).toBe(handle);
    cancel();
  });

  it('reports a null source.handle without a Draggable.Handle', async () => {
    const onBeforeMoveStart = vi.fn();
    const onMoveStart = vi.fn();
    await renderDnd(<TestDraggable options={{ onBeforeMoveStart, onMoveStart }} />);

    await lift(screen.getByTestId('drag'));

    expect(onBeforeMoveStart.mock.calls[0][0].source.handle).toBeNull();
    expect(onMoveStart.mock.calls[0][0].source.handle).toBeNull();
    cancel();
  });

  it('blocks the drag when disabled', async () => {
    const onMoveStart = vi.fn();
    await renderDnd(<TestDraggable options={{ disabled: true, onMoveStart }} />);
    const source = screen.getByTestId('drag');

    fireEvent.dragStart(source);
    await flushRaf();

    expect(onMoveStart).not.toHaveBeenCalled();
    expect(source).toHaveClass('idle');
  });

  it('reflects disabled in state as data-disabled', async () => {
    await renderDnd(
      <div>
        <TestDraggable options={{ disabled: true }} testId="disabled" />
        <TestDraggable testId="enabled" />
      </div>,
    );

    expect(screen.getByTestId('disabled')).toHaveAttribute('data-disabled');
    expect(screen.getByTestId('enabled')).not.toHaveAttribute('data-disabled');
  });

  it('updates the payload from onMoveStart', async () => {
    const tokenKind = Draggable.createKind<{ token: string }>('token');
    const onMove = vi.fn();
    await renderDnd(
      <TestDraggable<{ token: string }>
        options={{
          kind: tokenKind,
          payload: { token: 'initial' },
          onMoveStart: ({ source }) => source.updatePayload({ token: 'abc' }),
          onMove,
        }}
      />,
    );
    const source = screen.getByTestId('drag');
    fireEvent.dragStart(source);
    await flushRaf();
    fireEvent.dragOver(source, { clientX: 40, clientY: 40 });
    await flushRaf();
    expect(onMove.mock.lastCall?.[0].source.payload).toEqual({ token: 'abc' });
  });

  it('forwards a static payload value, keeping it off the DOM element', async () => {
    const tokenKind = Draggable.createKind<{ token: string }>('static-token');
    const onMoveStart = vi.fn();
    await renderDnd(
      <TestDraggable<{ token: string }>
        options={{ kind: tokenKind, payload: { token: 'abc' }, onMoveStart }}
      />,
    );
    const source = screen.getByTestId('drag');
    // The engine parameter is plucked from the spread props; a miss would land
    // here as a `payload` attribute.
    expect(source.hasAttribute('payload')).toBe(false);

    fireEvent.dragStart(source);
    await flushRaf();

    expect(onMoveStart).toHaveBeenCalledTimes(1);
    expect(onMoveStart.mock.calls[0][0].source.payload).toEqual({ token: 'abc' });
  });

  it('keeps the registration stable across re-renders and calls the latest callbacks', async () => {
    const firstOnDragStart = vi.fn();
    const secondOnDragStart = vi.fn();

    const { rerender } = await renderDnd(
      <TestDraggable options={{ onMoveStart: firstOnDragStart }} />,
    );
    const source = screen.getByTestId('drag');
    // Registration applies the gesture styles; they prove the element is
    // registered without relying on the removed native `draggable` attribute.
    expect(source.style.touchAction).toBe('manipulation');
    const getParameters = getRegistration(source)!;
    const firstParameters = getParameters();
    // Repeated engine dispatches within one render reuse both normalization
    // layers instead of rebuilding the registration object every time.
    expect(getParameters()).toBe(firstParameters);

    // Re-render with a brand-new onMoveStart function reference. The
    // registration must NOT tear down and re-register — only the wrapped
    // callback should read the fresh prop.
    await rerender(<TestDraggable options={{ onMoveStart: secondOnDragStart }} />);
    // Same DOM node, still registered — no re-registration happened.
    expect(screen.getByTestId('drag')).toBe(source);
    expect(source.style.touchAction).toBe('manipulation');
    const secondParameters = getParameters();
    expect(secondParameters).not.toBe(firstParameters);
    expect(getParameters()).toBe(secondParameters);

    fireEvent.dragStart(source);
    await flushRaf();

    expect(firstOnDragStart).not.toHaveBeenCalled();
    expect(secondOnDragStart).toHaveBeenCalledTimes(1);
  });

  it('does not expose parameters from a suspended render', async () => {
    const committedOnDragStart = vi.fn();
    const suspendedOnDragStart = vi.fn();
    const never = new Promise<void>(() => {});
    const suspendedRender = vi.fn();

    function SuspendingChild(): React.JSX.Element {
      suspendedRender();
      throw never;
    }

    function App() {
      const [suspend, setSuspend] = React.useState(false);
      const [, startTransition] = React.useTransition();
      return (
        <React.Fragment>
          <button
            type="button"
            onClick={() => {
              startTransition(() => setSuspend(true));
            }}
          >
            Suspend update
          </button>
          <React.Suspense fallback="Loading">
            <TestDraggable
              options={{ onMoveStart: suspend ? suspendedOnDragStart : committedOnDragStart }}
            />
            {suspend && <SuspendingChild />}
          </React.Suspense>
        </React.Fragment>
      );
    }

    await renderDnd(<App />);
    fireEvent.click(screen.getByRole('button', { name: 'Suspend update' }));
    await act(async () => Promise.resolve());
    expect(suspendedRender).toHaveBeenCalled();

    fireEvent.dragStart(screen.getByTestId('drag'));
    await flushRaf();

    expect(committedOnDragStart).toHaveBeenCalledTimes(1);
    expect(suspendedOnDragStart).not.toHaveBeenCalled();
  });

  it('re-registers when the element behind the ref is swapped without remounting', async () => {
    function Swappable({ swapped }: { swapped: boolean }) {
      // The key sits on the rendered node, not on the root, so this component —
      // and its registration — stays mounted while React swaps the DOM node
      // behind the ref, as a virtualizer recycling a row does.
      return (
        <Draggable.Root
          kind={testDragKind}
          data-testid={swapped ? 'b' : 'a'}
          render={(props) => <div key={swapped ? 'b' : 'a'} {...props} />}
        />
      );
    }

    const { rerender } = await renderDnd(<Swappable swapped={false} />);
    const first = screen.getByTestId('a');
    expect(first.style.touchAction).toBe('manipulation');

    await rerender(<Swappable swapped />);
    const second = screen.getByTestId('b');
    // The old node was deregistered (gesture styles restored) and the new node
    // registered, so the draggable follows the swap instead of going dead.
    expect(first.style.touchAction).toBe('');
    expect(second.style.touchAction).toBe('manipulation');
  });

  it('keeps state.dragging true when the source node is swapped mid-drag', async () => {
    function Swappable({ swapped }: { swapped: boolean }) {
      // The key sits on the rendered node, so React detaches the old node
      // (`ref(null)`) and attaches the new one while the registration lives on.
      return (
        <Draggable.Root
          kind={testDragKind}
          data-testid={swapped ? 'b' : 'a'}
          className={draggingClass}
          render={(props) => <div key={swapped ? 'b' : 'a'} {...props} />}
        />
      );
    }

    const { rerender } = await renderDnd(<Swappable swapped={false} />);
    const first = screen.getByTestId('a');
    first.getBoundingClientRect = () => new DOMRect(0, 0, 200, 100);

    fireEvent.dragStart(first);
    await flushRaf();
    expect(first).toHaveClass('dragging');
    expect(dragSessionStore.getSnapshot()?.source.element).toBe(first);

    // Recycle the row mid-drag. The session must re-point from the detached node
    // to the fresh one so `isDragging` and every in-flight closure reading
    // `source.element` track the swap instead of going stale (previously the
    // interposed `ref(null)` hid the swap and the session kept pointing at the
    // detached node).
    await rerender(<Swappable swapped />);
    const second = screen.getByTestId('b');
    expect(dragSessionStore.getSnapshot()?.source.element).toBe(second);
    // The titled behavior: `state.dragging` — and the engine-owned marker — now
    // sit on the fresh node, not the detached one.
    expect(second).toHaveClass('dragging');
    expect(second).toHaveAttribute('data-dragging');
    expect(first).not.toHaveAttribute('data-dragging');
  });

  it('defers a disabled flip mid-drag: the drag survives, the setup lands at drag end', async () => {
    // A reconcile-input change while this element is the active source must not
    // tear down the live gesture; the re-registration flushes at drag end.
    const { rerender } = await renderDnd(<Draggable.Root kind={testDragKind} data-testid="drag" />);
    const el = screen.getByTestId('drag');
    el.getBoundingClientRect = () => new DOMRect(0, 0, 200, 100);

    fireEvent.dragStart(el);
    await flushRaf();
    expect(dragSessionStore.getSnapshot()?.source.element).toBe(el);

    await rerender(<Draggable.Root kind={testDragKind} data-testid="drag" disabled />);

    // The session and the gesture styles survive the flip.
    expect(dragSessionStore.getSnapshot()?.source.element).toBe(el);
    expect(el.style.userSelect).toBe('none');
    expect(el.style.touchAction).toBe('manipulation');
    expect(el).toHaveAttribute('data-dragging');

    cancel();
    await flushRaf();

    // The skipped reconcile flushed: the gesture styles now reflect `disabled`.
    expect(dragSessionStore.getSnapshot()).toBeNull();
    expect(el.style.userSelect).toBe('');
    expect(el.style.touchAction).toBe('');
    expect(el).not.toHaveAttribute('aria-roledescription');
    expect(el).not.toHaveAttribute('aria-describedby');
  });

  it('survives a re-render mid-drag when `ref` has a new identity each time', async () => {
    // `useMergedRefs` rebuilds its callback whenever an entry's identity changes,
    // so an inline `ref` arrow makes React detach and re-attach the node on every
    // render, re-running the registration mid-gesture.
    const onMoveEnd = vi.fn();
    const onDrop = vi.fn();
    function Inline({ tick }: { tick: number }) {
      return (
        <Draggable.Root
          kind={testDragKind}
          data-testid="drag"
          data-tick={tick}
          className={draggingClass}
          onMoveEnd={splitEnd(onDrop, onMoveEnd)}

          ref={(node) => {
            void node;
          }}
        />
      );
    }

    const { rerender, engine } = await renderDnd(<Inline tick={0} />);
    const source = screen.getByTestId('drag');
    source.getBoundingClientRect = () => new DOMRect(0, 0, 200, 100);
    const target = createElement();
    engine.registerTarget(target, {});

    fireEvent.dragStart(source);
    await flushRaf();
    expect(source).toHaveClass('dragging');

    await rerender(<Inline tick={1} />);

    // The rendered node is unchanged (the clone shares its `data-testid`, so
    // assert on the node captured before the drag rather than re-querying).
    expect(source).toHaveAttribute('data-tick', '1');
    expect(source).toHaveClass('dragging');
    expect(source).toHaveAttribute('data-dragging');
    expect(source.style.userSelect).toBe('none');
    expect(dragSessionStore.getSnapshot()?.source.element).toBe(source);

    // The drag still completes: re-registration must not have unbound the sensors
    // out from under the live gesture.
    fireEvent.dragEnter(target);
    fireEvent.dragOver(target);
    await flushRaf();
    fireEvent.drop(target);
    await flushRaf();

    expect(onMoveEnd).toHaveBeenCalledTimes(1);
    expect(onDrop).toHaveBeenCalledTimes(1);
    expect(source).toHaveClass('idle');
  });

  it('still lands the drop after the source unmounted mid-drag', async () => {
    const onMoveEnd = vi.fn();
    const onDrop = vi.fn();
    // No clone preview: with the source gone before the drop, a clone would have
    // nothing to settle back onto and would outlive the test in a real browser.
    function Source({ mounted }: { mounted: boolean }) {
      return mounted ? (
        <Draggable.Root kind={testDragKind} data-testid="drag">
          <Draggable.Preview disabled />
        </Draggable.Root>
      ) : null;
    }
    const { engine, rerender } = await renderDnd(<Source mounted />);
    engine.registerMonitor({ onMoveEnd });
    const target = createElement({ top: 200, height: 100 });
    engine.registerTarget(target, { onDraggableDrop: onDrop });
    const source = screen.getByTestId('drag');
    source.getBoundingClientRect = () => new DOMRect(0, 0, 200, 100);

    fireEvent.dragStart(source);
    await flushRaf();
    // A list re-rendering on pickup can unmount the very row being dragged.
    await rerender(<Source mounted={false} />);
    await flushRaf();

    // The bridge replays releases on the (now detached) source, so drive the
    // rest of the gesture with raw pointer events at the target.
    const hitTest = vi.spyOn(document, 'elementFromPoint').mockImplementation(() => target);
    registerCleanup(() => hitTest.mockRestore());
    const pointer = { pointerType: 'mouse', pointerId: 1, clientX: 100, clientY: 250 } as const;
    firePointer.move(target, { ...pointer, buttons: 1, timeStamp: 100 });
    await flushRaf();
    firePointer.up(target, { ...pointer, button: 0, buttons: 0, timeStamp: 120 });

    expect(onDrop).toHaveBeenCalledTimes(1);
    expect(onMoveEnd).toHaveBeenCalledTimes(1);
    expect(onMoveEnd.mock.calls[0][1].reason).toBe('drop');
    expect(onMoveEnd.mock.calls[0][0].target?.element).toBe(target);
  });

  it('cleanup is idempotent and survives unmount mid-drag', async () => {
    const onMoveEnd = vi.fn();
    const { unmount } = await renderDnd(<TestDraggable options={{ onMoveEnd }} />);
    const source = screen.getByTestId('drag');
    source.getBoundingClientRect = () => new DOMRect(0, 0, 200, 100);

    fireEvent.dragStart(source);
    await flushRaf();

    expect(() => unmount()).not.toThrow();
    // Unmount runs the registration cleanup, which restores the gesture styles
    // it applied. (The active gesture's temporary `draggable="false"` is owned
    // by the live drag session and is restored when that session ends.)
    expect(source.style.touchAction).toBe('');
    expect(source.style.userSelect).toBe('');

    // Unregistering the source does not end the session: the gesture is still
    // held, so the engine keeps it live until the pointer releases or cancels.
    expect(dragSessionStore.getSnapshot()?.source.element).toBe(source);
    expect(onMoveEnd).not.toHaveBeenCalled();

    cancel();
    await flushRaf();

    expect(dragSessionStore.getSnapshot()).toBeNull();
    expect(onMoveEnd).toHaveBeenCalledTimes(1);
    expect(onMoveEnd.mock.calls[0][0].target).toBeNull();
    expect(onMoveEnd.mock.calls[0][1].reason).toBe('escape-key');

    // The engine is not wedged: a fresh draggable starts a new drag.
    await renderDnd(<TestDraggable testId="next" />);
    const next = screen.getByTestId('next');
    next.getBoundingClientRect = () => new DOMRect(0, 0, 200, 100);

    await lift(next);

    expect(dragSessionStore.getSnapshot()?.source.element).toBe(next);
  });

  it('resolves className and style callbacks from the disabled and dragging state', async () => {
    const className = (state: Draggable.Root.State) =>
      [state.disabled ? 'is-disabled' : 'is-enabled', state.dragging ? 'is-dragging' : 'is-idle']
        .filter(Boolean)
        .join(' ');
    const style = (state: Draggable.Root.State) => ({
      opacity: state.dragging ? '0.5' : '1',
      cursor: state.disabled ? 'not-allowed' : 'grab',
    });
    const { rerender } = await renderDnd(
      <Draggable.Root kind={testDragKind} data-testid="drag" className={className} style={style} />,
    );
    const source = screen.getByTestId('drag');
    source.getBoundingClientRect = () => new DOMRect(0, 0, 200, 100);

    expect(source).toHaveClass('is-enabled', 'is-idle');
    expect(source.style.opacity).toBe('1');
    expect(source.style.cursor).toBe('grab');

    await lift(source);

    expect(source).toHaveClass('is-enabled', 'is-dragging');
    expect(source.style.opacity).toBe('0.5');

    cancel();
    await flushRaf();

    expect(source).toHaveClass('is-idle');
    expect(source.style.opacity).toBe('1');

    await rerender(
      <Draggable.Root
        kind={testDragKind}
        data-testid="drag"
        className={className}
        style={style}
        disabled
      />,
    );

    expect(source).toHaveClass('is-disabled', 'is-idle');
    expect(source.style.cursor).toBe('not-allowed');
  });

  describe('Strict Mode', () => {
    it('fires onMoveStart, onDrop and onMoveEnd exactly once for a full drag', async () => {
      const onMoveStart = vi.fn();
      const onMoveEnd = vi.fn();
      const onDrop = vi.fn();
      const { engine } = await renderDnd(
        <React.StrictMode>
          <TestDraggable
            options={{
              onMoveStart,
              onMoveEnd: splitEnd(onDrop, onMoveEnd),
            }}
          />
        </React.StrictMode>,
      );
      const source = screen.getByTestId('drag');
      source.getBoundingClientRect = () => new DOMRect(0, 0, 200, 100);
      const target = createElement();
      engine.registerTarget(target, {});

      fireEvent.dragStart(source);
      await flushRaf();
      fireEvent.dragEnter(target);
      fireEvent.dragOver(target);
      await flushRaf();
      fireEvent.drop(target);
      await flushRaf();

      // A double-mounted registration would run the handlers once per hold.
      expect(onMoveStart).toHaveBeenCalledTimes(1);
      expect(onMoveEnd).toHaveBeenCalledTimes(1);
      // And it was a committed drop, which `onDrop` says on its own.
      expect(onDrop).toHaveBeenCalledTimes(1);
    });
  });

  describe('configuration forwarding', () => {
    it('forwards activation to the sensor: a raised distance defers the pickup', async () => {
      const onMoveStart = vi.fn();
      await renderDnd(
        <Draggable.Root
          kind={testDragKind}
          data-testid="drag"
          activation={{ mouse: { type: 'distance', distance: 40 } }}
          onMoveStart={onMoveStart}
        />,
      );
      const el = screen.getByTestId('drag');
      el.getBoundingClientRect = () => new DOMRect(0, 0, 200, 100);

      // The bridge nudges ~6px, well short of the configured 40px threshold, so
      // a forwarded `activation` keeps the drag from starting here.
      await lift(el, { expectNoDrag: true });
      expect(onMoveStart).not.toHaveBeenCalled();
      expect(dragSessionStore.getSnapshot()).toBeNull();
    });

    it('forwards activation to the sensor: immediate picks up with no travel', async () => {
      const onMoveStart = vi.fn();
      await renderDnd(
        <Draggable.Root
          kind={testDragKind}
          data-testid="drag"
          activation={{ type: 'immediate' }}
          onMoveStart={onMoveStart}
        />,
      );
      const el = screen.getByTestId('drag');
      el.getBoundingClientRect = () => new DOMRect(0, 0, 200, 100);

      await lift(el);
      expect(onMoveStart).toHaveBeenCalledTimes(1);

      cancel();
    });

    it('forwards modifiers: a root-level axis lock constrains a pointer drag', async () => {
      // Root-level modifiers govern the committed input (the hit-test point and
      // the preview follow it), so a vertical-axis lock must pin every reported
      // x while y keeps tracking the pointer.
      const moves: Array<{ x: number; y: number }> = [];
      await renderDnd(
        <Draggable.Root
          kind={testDragKind}
          data-testid="drag"
          modifiers={Draggable.restrictToVerticalAxis}
          onMove={(_, { location }) => {
            moves.push({
              x: location.current.input.clientX,
              y: location.current.input.clientY,
            });
          }}
        />,
      );
      const el = screen.getByTestId('drag');
      el.getBoundingClientRect = () => new DOMRect(0, 0, 200, 100);

      await lift(el, { clientX: 100, clientY: 50 });
      await dragOver(el, { clientX: 180, clientY: 90 });
      // `onMove` is rAF-throttled on top of the sensor's frame, so the move
      // committed above is delivered one frame later.
      await flushRaf();

      expect(moves.length).toBeGreaterThan(0);
      // Every committed x sits at the drag-start anchor — the 100px press plus
      // the bridge's activation nudge (`DRAG_ACTIVATION_DISTANCE_PX`), where the
      // drag committed — never at the pointer's 180 — while the vertical axis
      // followed the pointer to 90. Pinned to the exact constant so a lock wired
      // to the wrong reference point can't slip through as "some stable x".
      expect(moves.every((move) => move.x === 106)).toBe(true);
      expect(moves.at(-1)!.y).toBe(90);

      cancel();
      await flushRaf();
    });

    it('forwards onTargetChange: it fires with the entered target', async () => {
      const onTargetChange = vi.fn();
      const { engine } = await renderDnd(<TestDraggable options={{ onTargetChange }} />);
      const source = screen.getByTestId('drag');
      source.getBoundingClientRect = () => new DOMRect(0, 0, 200, 100);
      const target = createElement();
      engine.registerTarget(target, {});

      fireEvent.dragStart(source);
      await flushRaf();
      expect(onTargetChange).not.toHaveBeenCalled();

      fireEvent.dragEnter(target);
      fireEvent.dragOver(target);
      await flushRaf();

      expect(onTargetChange).toHaveBeenCalledTimes(1);
      const [value, eventDetails] = onTargetChange.mock.calls[0];
      expect(value.target?.element).toBe(target);
      expect(
        eventDetails.location.current.targets.map((record: { element: Element }) => record.element),
      ).toEqual([target]);

      cancel();
      await flushRaf();
    });

    it('forwards dragCursor to the pointer sensor cursor lock', async () => {
      await renderDnd(<Draggable.Root kind={testDragKind} data-testid="drag" dragCursor="copy" />);
      const el = screen.getByTestId('drag');
      el.getBoundingClientRect = () => new DOMRect(0, 0, 200, 100);

      await lift(el);

      // The sensor pins the cursor document-wide through a scoped rule driven by
      // this class/variable pair; the forwarded value must land in the variable.
      const root = document.documentElement;
      expect(root.classList.contains('baseui-dragging')).toBe(true);
      expect(root.style.getPropertyValue('--drag-cursor')).toBe('copy');

      cancel();
      await flushRaf();
      expect(root.classList.contains('baseui-dragging')).toBe(false);
    });

    it('reads the live CSP provider configuration for the cursor stylesheet', async () => {
      let setStyleElementsDisabled!: React.Dispatch<React.SetStateAction<boolean>>;

      function DynamicCSPProvider({ children }: { children?: React.ReactNode }) {
        const [disabled, setDisabled] = React.useState(true);
        setStyleElementsDisabled = setDisabled;
        return (
          <CSPProvider nonce="drag-nonce" disableStyleElements={disabled}>
            {children}
          </CSPProvider>
        );
      }

      await renderDnd(<Draggable.Root kind={testDragKind} data-testid="drag" />, {
        wrapper: DynamicCSPProvider,
      });
      const el = screen.getByTestId('drag');
      el.getBoundingClientRect = () => new DOMRect(0, 0, 200, 100);

      await lift(el);
      expect(document.documentElement).toHaveClass('baseui-dragging');
      expect(document.documentElement).not.toHaveClass('baseui-dragging-styles');
      cancel();
      await flushRaf();

      act(() => setStyleElementsDisabled(false));
      await lift(el);

      expect(document.documentElement).toHaveClass('baseui-dragging', 'baseui-dragging-styles');
      const cursorStyle = Array.from(document.head.querySelectorAll('style')).find(
        (style) =>
          style.nonce === 'drag-nonce' &&
          Array.from(style.sheet?.cssRules ?? []).some((rule) =>
            rule.cssText.includes('baseui-dragging-styles'),
          ),
      );
      expect(cursorStyle?.nonce).toBe('drag-nonce');

      cancel();
      await flushRaf();
    });

    it('preserves inline gesture styles changed while disabling', async () => {
      const { rerender } = await renderDnd(
        <Draggable.Root
          kind={testDragKind}
          data-testid="drag"
          style={{ touchAction: 'pan-y', userSelect: 'text' }}
        />,
      );
      const el = screen.getByTestId('drag');
      expect(el.style.touchAction).toBe('manipulation');
      expect(el.style.userSelect).toBe('none');

      await rerender(
        <Draggable.Root
          kind={testDragKind}
          data-testid="drag"
          disabled
          style={{ touchAction: 'none', userSelect: 'auto' }}
        />,
      );

      expect(el.style.touchAction).toBe('none');
      expect(el.style.userSelect).toBe('auto');
    });
  });

  describe('same-commit node swap', () => {
    it('registers the new draggable node with the same commit’s parameters', async () => {
      // The ref callback runs earlier in a commit than the layout effect that
      // commits the params ref, so a keyed remount that also changes props would
      // register the new node against the *previous* render's parameters.
      const onMoveStart = vi.fn();
      const first = vi.fn();
      const { rerender } = await renderDnd(
        <Draggable.Root kind={testDragKind} key="a" data-testid="drag" onMoveStart={first} />,
      );
      const before = screen.getByTestId('drag');

      await rerender(
        <Draggable.Root kind={testDragKind} key="b" data-testid="drag" onMoveStart={onMoveStart} />,
      );
      const after = screen.getByTestId('drag');
      expect(after).not.toBe(before);

      after.getBoundingClientRect = () => new DOMRect(0, 0, 200, 100);
      await lift(after);

      expect(first).not.toHaveBeenCalled();
      expect(onMoveStart).toHaveBeenCalledTimes(1);
    });

    it('applies the same commit’s disabled to the new draggable node', async () => {
      const onMoveStart = vi.fn();
      const { rerender } = await renderDnd(
        <Draggable.Root kind={testDragKind} key="a" data-testid="drag" onMoveStart={onMoveStart} />,
      );

      await rerender(
        <Draggable.Root
          kind={testDragKind}
          key="b"
          data-testid="drag"
          disabled
          onMoveStart={onMoveStart}
        />,
      );
      const after = screen.getByTestId('drag');
      after.getBoundingClientRect = () => new DOMRect(0, 0, 200, 100);

      // A stale registration would still read the previous render's enabled state.
      expect(after).not.toHaveAttribute('tabindex');
      await lift(after, { expectNoDrag: true });
      expect(onMoveStart).not.toHaveBeenCalled();
    });

    it('registers the new drop-target node with the same commit’s parameters', async () => {
      const onDrop = vi.fn();
      const stale = vi.fn();
      const { engine, rerender } = await renderDnd(
        <Draggable.Target
          accept={Draggable.anyKind}
          key="a"
          data-testid="target"
          payload={{ slot: 1 }}
          onDraggableDrop={stale}
        />,
      );
      const source = createElement();
      engine.registerSource(source, {});

      await rerender(
        <Draggable.Target
          accept={Draggable.anyKind}
          key="b"
          data-testid="target"
          payload={{ slot: 2 }}
          onDraggableDrop={onDrop}
        />,
      );
      const target = screen.getByTestId('target');
      target.getBoundingClientRect = () => new DOMRect(0, 200, 200, 100);

      await lift(source);
      await dragOver(target, { clientY: 250 });
      fireEvent.drop(target, { clientY: 250 });
      await flushRaf();

      expect(stale).not.toHaveBeenCalled();
      expect(onDrop).toHaveBeenCalledTimes(1);
      expect(onDrop.mock.calls[0][0].target.payload).toEqual({ slot: 2 });
    });
  });

  describe('default clone preview', () => {
    function PlainDraggable(props: { options?: Partial<Draggable.Root.Props> }) {
      return (
        <Draggable.Root kind={testDragKind} {...props.options} data-testid="drag" className="Card">
          Card
        </Draggable.Root>
      );
    }

    it('clones the source in place, so the app CSS still applies to the preview', () => {
      // No `Draggable.Provider`: the clone stays in the source's own parent.
      rtlRender(<PlainDraggable />);
      const source = screen.getByTestId('drag');
      source.getBoundingClientRect = () => new DOMRect(0, 0, 200, 100);

      expect(document.querySelector('[data-drag-preview]')).toBeNull();

      fireEvent.dragStart(source);

      // The clone lives in the source's own parent, keeps its classes, and is
      // marked so consumers can style it with `.Card[data-drag-preview]`.
      const clone = document.querySelector('[data-drag-preview]') as HTMLElement;
      expect(clone).not.toBeNull();
      expect(clone).toHaveClass('Card');
      // Through the engine-owned top-layer wrapper, whose placement carries the cascade.
      expect(clone.parentElement!.parentElement).toBe(source.parentElement);
    });

    it('marks the source with data-dragging, and never the clone', async () => {
      await renderDnd(<PlainDraggable />);
      const source = screen.getByTestId('drag');
      source.getBoundingClientRect = () => new DOMRect(0, 0, 200, 100);

      fireEvent.dragStart(source);

      // `[data-dragging] { opacity: .4 }` must dim the source alone — if the clone
      // carried the attribute the preview would fade with it.
      expect(source).toHaveAttribute('data-dragging');
      expect(document.querySelector('[data-drag-preview]')).not.toHaveAttribute('data-dragging');
    });

    it('anchors the clone at the grab point and moves it with the pointer', async () => {
      await renderDnd(<PlainDraggable />);
      const source = screen.getByTestId('drag');
      source.getBoundingClientRect = () => new DOMRect(0, 0, 200, 100);

      await lift(source, { clientX: 30, clientY: 40 });
      await dragOver(source, { clientX: 100, clientY: 120 });

      // The offset defaults to `'source'`, so the clone keeps the original press point. The
      // distance-activation nudge used by `lift` must not leak into this offset.
      const clone = document.querySelector('[data-drag-preview]') as HTMLElement;
      expect(clone.style.translate).toBe('70px 80px');
    });

    it('tears the clone down and unmarks the source when the drag ends', async () => {
      await renderDnd(<PlainDraggable />);
      const source = screen.getByTestId('drag');
      source.getBoundingClientRect = () => new DOMRect(0, 0, 200, 100);

      fireEvent.dragStart(source);
      expect(document.querySelector('[data-drag-preview]')).not.toBeNull();

      cancel();
      await flushRaf();

      expect(document.querySelector('[data-drag-preview]')).toBeNull();
      expect(source).not.toHaveAttribute('data-dragging');
    });

    it('retargets the settling clone to a root remounted with the same previewKey', async () => {
      // A cross-container move remounts the card as a new React subtree with a
      // fresh payload object; `previewKey` is what connects the settling clone
      // to the new node.
      vi.stubGlobal('BASE_UI_ANIMATIONS_DISABLED', false);
      registerCleanup(() => vi.unstubAllGlobals());
      function Card({ mountKey, payload }: { mountKey: string; payload: { id: string } }) {
        return (
          <Draggable.Root
            key={mountKey}
            kind={cardKind}
            payload={payload}
            previewKey="card-a"
            data-testid="drag"
          >
            Card
          </Draggable.Root>
        );
      }
      // The clone copies the test id, so query the live source explicitly.
      const getSource = () =>
        document.querySelector<HTMLElement>('[data-testid="drag"]:not([data-drag-preview])')!;
      const { engine, rerender } = await renderDnd(<Card mountKey="a" payload={{ id: 'a' }} />);
      const first = getSource();
      first.getBoundingClientRect = () => new DOMRect(0, 0, 200, 100);
      const target = createElement();
      engine.registerTarget(target, {});

      fireEvent.dragStart(first);
      await flushRaf();
      fireEvent.dragEnter(target);
      fireEvent.dragOver(target);
      await flushRaf();

      // An authored drop transition keeps the clone settling past the drop.
      const clone = document.querySelector('[data-drag-preview]') as HTMLElement;
      let finishAnimation!: () => void;
      const finished = new Promise<void>((resolve) => {
        finishAnimation = resolve;
      });
      // Let the clone settle even if an assertion below fails, so it can't
      // outlive this test.
      registerCleanup(() => finishAnimation());
      clone.getAnimations = () =>
        [{ effect: { getTiming: () => ({ iterations: 1 }) }, finished }] as unknown as Animation[];

      fireEvent.drop(target);
      expect(clone).toHaveAttribute('data-ending-style');
      expect(first).toHaveAttribute('data-dragging');

      await rerender(<Card mountKey="b" payload={{ id: 'a' }} />);
      const second = getSource();
      expect(second).not.toBe(first);
      // The clone now settles onto the new node: the source marking moved with it.
      expect(second).toHaveAttribute('data-dragging');
      expect(second).toHaveAttribute('data-settling');
      expect(first).not.toHaveAttribute('data-dragging');
      expect(clone.isConnected).toBe(true);

      await flushRaf();
      expect(clone.isConnected).toBe(true);
      finishAnimation();
      await finished;
      await flushRaf();
      expect(clone.isConnected).toBe(false);
      expect(second).not.toHaveAttribute('data-dragging');
      expect(second).not.toHaveAttribute('data-settling');
    });

    it('clears the clone and data-dragging after a real drop', async () => {
      const { engine } = await renderDnd(<PlainDraggable />);
      const source = screen.getByTestId('drag');
      source.getBoundingClientRect = () => new DOMRect(0, 0, 200, 100);
      const target = createElement();
      engine.registerTarget(target, {});

      fireEvent.dragStart(source);
      await flushRaf();
      expect(document.querySelector('[data-drag-preview]')).not.toBeNull();

      fireEvent.dragEnter(target);
      fireEvent.dragOver(target);
      await flushRaf();
      fireEvent.drop(target);

      // A clone gets an ending-style frame so an authored transition can settle
      // it into the source. With no transition, it is gone before that frame paints.
      expect(document.querySelector('[data-drag-preview]')).toHaveAttribute('data-ending-style');
      await flushRaf();
      expect(document.querySelector('[data-drag-preview]')).toBeNull();
      expect(source).not.toHaveAttribute('data-dragging');
    });
  });

  describe('Draggable.Preview clone', () => {
    function ClonedPreviewDraggable(props: { previewProps?: Draggable.Preview.Props }) {
      return (
        <Draggable.Root kind={testDragKind} data-testid="drag" className="Card">
          Card
          <Draggable.Preview {...props.previewProps} />
        </Draggable.Root>
      );
    }

    it('still clones the source, and applies the offset to the clone', async () => {
      await renderDnd(<ClonedPreviewDraggable previewProps={{ offset: 'pointer' }} />);
      const source = screen.getByTestId('drag');
      source.getBoundingClientRect = () => new DOMRect(0, 0, 200, 100);

      await lift(source, { clientX: 30, clientY: 40 });
      await dragOver(source, { clientX: 100, clientY: 120 });

      // Configuring the preview must not turn it into a host: it is still the
      // clone, carrying the source's own class.
      const clone = document.querySelector('[data-drag-preview]') as HTMLElement;
      expect(clone).toHaveClass('Card');
      // `'pointer'` pins it to the pointer, rather than the grab point `'source'` keeps.
      expect(clone.style.translate).toBe('100px 120px');
    });

    it('resolves an offset callback against the clone, immediately', async () => {
      // A clone publishes nothing to the overlay store, so the renderer never runs
      // and nothing would re-anchor it later: the callback has to resolve at drag
      // start, unlike a host's.
      const offsetSpy = vi.fn((_params: { container: HTMLElement }) => ({ x: 10, y: 20 }));
      await renderDnd(<ClonedPreviewDraggable previewProps={{ offset: offsetSpy }} />);
      const source = screen.getByTestId('drag');
      source.getBoundingClientRect = () => new DOMRect(0, 0, 200, 100);

      await lift(source, { clientX: 30, clientY: 40 });
      await dragOver(source, { clientX: 80, clientY: 90 });

      const clone = document.querySelector('[data-drag-preview]') as HTMLElement;
      expect(offsetSpy).toHaveBeenCalledTimes(1);
      // Measured against the clone itself — there is no host to measure.
      expect(offsetSpy.mock.calls[0][0].container).toBe(clone);
      // Pointer (80, 90) minus the returned offset (10, 20).
      expect(clone.style.translate).toBe('70px 70px');
    });

    it('shows no preview at all when disabled', async () => {
      await renderDnd(<ClonedPreviewDraggable previewProps={{ disabled: true }} />);
      const source = screen.getByTestId('drag');
      source.getBoundingClientRect = () => new DOMRect(0, 0, 200, 100);

      fireEvent.dragStart(source);

      expect(document.querySelector('[data-drag-preview]')).toBeNull();
      // The source is still marked, so it can be styled while it is being dragged.
      expect(source).toHaveAttribute('data-dragging');
    });

    it('uses the DOM clone inside the required provider', async () => {
      // A clone is built entirely by the engine, so it must not require the
      // provider a declared preview does — nor throw for the want of one.
      rtlRender(<ClonedPreviewDraggable />);
      const source = screen.getByTestId('drag');
      source.getBoundingClientRect = () => new DOMRect(0, 0, 200, 100);

      fireEvent.dragStart(source);

      expect(document.querySelector('.Card[data-drag-preview]')).not.toBeNull();
    });

    it('clamps the clone to a modifiers element when the pointer leaves it', async () => {
      function BoundedDraggable() {
        const boundsRef = React.useRef<HTMLDivElement>(null);
        return (
          <React.Fragment>
            <div ref={boundsRef} data-testid="bounds" />
            <Draggable.Root kind={testDragKind} data-testid="drag" className="Card">
              {/* Pin the preview to the pointer so the assertions below read the
                  clamp alone, not the grab offset the `'source'` default would add. */}
              <Draggable.Preview
                modifiers={Draggable.restrictToElement(boundsRef)}
                offset="pointer"
              />
            </Draggable.Root>
          </React.Fragment>
        );
      }

      await renderDnd(<BoundedDraggable />);
      const source = screen.getByTestId('drag');
      source.getBoundingClientRect = () => new DOMRect(0, 0, 200, 100);
      // A 200×200 bounds element anchored at the viewport origin.
      screen.getByTestId('bounds').getBoundingClientRect = () => new DOMRect(0, 0, 200, 200);

      await lift(source, { clientX: 10, clientY: 10 });

      // jsdom doesn't lay out, so stub the preview's measured size the clamp reads.
      const clone = document.querySelector('[data-drag-preview]') as HTMLElement;
      clone.getBoundingClientRect = () => new DOMRect(0, 0, 50, 30);

      // Drag far past the bottom-right corner: the clone sticks to the edge
      // (200 − clone size: 200−50=150, 200−30=170) instead of following out.
      await dragOver(source, { clientX: 500, clientY: 500 });
      expect(clone.style.translate).toBe('150px 170px');

      // Back inside, it tracks the pointer again — the clamp pins, it doesn't stick.
      await dragOver(source, { clientX: 80, clientY: 90 });
      expect(clone.style.translate).toBe('80px 90px');
    });

    it('keeps the clone next to the source inside a Provider', async () => {
      function Wiring() {
        return (
          <DraggableProvider>
            <ClonedPreviewDraggable previewProps={{ offset: 'pointer' }} />
          </DraggableProvider>
        );
      }

      await renderDnd(<Wiring />);
      const source = screen.getByTestId('drag');
      source.getBoundingClientRect = () => new DOMRect(0, 0, 200, 100);

      fireEvent.dragStart(source);

      // The React layer reports only *hosts* as the active preview, so a declared
      // clone must not be mistaken for "no preview" and torn down.
      const clone = document.querySelector('.Card[data-drag-preview]') as HTMLElement;
      expect(clone).not.toBeNull();
      // The provider renders no element of its own, so it relocates nothing: the
      // clone stays where the app's contextual CSS still reaches it. Only
      // `container` moves a preview.
      expect(clone.parentElement!.parentElement).toBe(source.parentElement);
    });

    it('warns rather than throwing when a draggable declares two previews', () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      try {
        // A wrapper composing its own preview around a consumer-passed one is a
        // plausible mistake; white-screening production over it is not
        // proportionate, and the duplicate-`Handle` slip only warns.
        expect(() =>
          rtlRender(
            <Draggable.Root kind={testDragKind} data-testid="drag">
              <Draggable.Preview>
                <span>x</span>
              </Draggable.Preview>
              <Draggable.Preview />
            </Draggable.Root>,
          ),
        ).not.toThrow();
        expect(String(warnSpy.mock.calls[0][0])).toMatch(/more than one preview part/);
      } finally {
        warnSpy.mockRestore();
      }
    });

    it('does not throw for two parts of the same kind either', () => {
      // The likelier slip than one of each.
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      try {
        expect(() =>
          rtlRender(
            <Draggable.Root kind={testDragKind} data-testid="drag">
              <Draggable.Preview>
                <span>x</span>
              </Draggable.Preview>
              <Draggable.Preview>
                <span>y</span>
              </Draggable.Preview>
            </Draggable.Root>,
          ),
        ).not.toThrow();
      } finally {
        warnSpy.mockRestore();
      }
    });

    it('renders a single preview part under Strict Mode', async () => {
      // Strict Mode double-invokes the declaring layout effect (declare → cleanup →
      // declare). Only the identity guard in the cleanup keeps that from tripping
      // the one-preview throw on mount.
      rtlRender(
        <React.StrictMode>
          <Draggable.Root kind={testDragKind} data-testid="drag">
            <Draggable.Preview>
              <span data-testid="preview">x</span>
            </Draggable.Preview>
          </Draggable.Root>
        </React.StrictMode>,
      );
      const source = screen.getByTestId('drag');
      source.getBoundingClientRect = () => new DOMRect(0, 0, 200, 100);

      fireEvent.dragStart(source);
      // eslint-disable-next-line testing-library/no-unnecessary-act -- flushing the detached fallback root, not the RTL tree
      await act(async () => {});

      expect(screen.getByTestId('preview')).toHaveTextContent('x');
    });

    it('swaps between the two preview parts in a single commit', async () => {
      // The outgoing part's cleanup has to run before the incoming part declares,
      // or a legitimate swap would trip the one-preview check.
      function Swappable(props: { cloned: boolean }) {
        return (
          <Draggable.Root kind={testDragKind} data-testid="drag" className="Card">
            {props.cloned ? (
              <Draggable.Preview />
            ) : (
              <Draggable.Preview>
                <span data-testid="preview">x</span>
              </Draggable.Preview>
            )}
          </Draggable.Root>
        );
      }

      const { setProps } = await renderDnd(<Swappable cloned={false} />);
      await setProps({ cloned: true });

      const source = screen.getByTestId('drag');
      source.getBoundingClientRect = () => new DOMRect(0, 0, 200, 100);

      fireEvent.dragStart(source);

      // The clone carries the source's class; a host never does.
      expect(document.querySelector('.Card[data-drag-preview]')).not.toBeNull();
    });

    it('swaps back to a Draggable.Preview in a single commit', async () => {
      // The reverse order: a host declaring after a clone's cleanup.
      function Swappable(props: { cloned: boolean }) {
        return (
          <Draggable.Root kind={testDragKind} data-testid="drag" className="Card">
            {props.cloned ? (
              <Draggable.Preview />
            ) : (
              <Draggable.Preview>
                <span data-testid="preview">x</span>
              </Draggable.Preview>
            )}
          </Draggable.Root>
        );
      }

      const { setProps } = await renderDnd(<Swappable cloned />);
      await setProps({ cloned: false });

      const source = screen.getByTestId('drag');
      source.getBoundingClientRect = () => new DOMRect(0, 0, 200, 100);

      fireEvent.dragStart(source);

      expect(screen.getByTestId('preview')).toHaveTextContent('x');
      expect(document.querySelector('.Card[data-drag-preview]')).toBeNull();
    });
  });

  describe('Draggable.Preview', () => {
    function DraggableWithPreview(props: {
      options?: Partial<Draggable.Root.Props<any>>;
      preview?: Draggable.Preview.Props['children'];
      previewProps?: Omit<Draggable.Preview.Props, 'children'>;
      testId?: string;
    }) {
      const { options, preview, previewProps, testId = 'drag' } = props;
      return (
        <Draggable.Root kind={testDragKind} {...options} data-testid={testId}>
          <Draggable.Preview {...previewProps}>{preview}</Draggable.Preview>
        </Draggable.Root>
      );
    }

    it('renders the preview content into the overlay on dragstart', async () => {
      await renderDnd(<DraggableWithPreview preview={<span data-testid="preview">hello</span>} />);
      const source = screen.getByTestId('drag');
      source.getBoundingClientRect = () => new DOMRect(0, 0, 200, 100);

      expect(screen.queryByTestId('preview')).toBeNull();

      fireEvent.dragStart(source);

      // The overlay committed synchronously inside the dragstart handler.
      expect(screen.getByTestId('preview')).toHaveTextContent('hello');
    });

    it('renders custom content without cloning the source', async () => {
      function CardWithPreview() {
        return (
          <Draggable.Root kind={testDragKind} data-testid="drag" className="Card">
            <Draggable.Preview>
              <span data-testid="preview">chip</span>
            </Draggable.Preview>
          </Draggable.Root>
        );
      }

      await renderDnd(<CardWithPreview />);
      const source = screen.getByTestId('drag');
      source.getBoundingClientRect = () => new DOMRect(0, 0, 200, 100);

      fireEvent.dragStart(source);

      expect(screen.getByTestId('preview')).toBeInTheDocument();
      // No clone of the source: declaring content opts out of cloning entirely,
      // so the two previews can never both follow the pointer.
      expect(source.parentElement!.querySelector('.Card[data-drag-preview]')).toBeNull();
    });

    it('keeps the preview mounted during the drag and clears it when the drag ends', async () => {
      await renderDnd(<DraggableWithPreview preview={<span data-testid="preview">hello</span>} />);
      const source = screen.getByTestId('drag');
      source.getBoundingClientRect = () => new DOMRect(0, 0, 200, 100);

      fireEvent.dragStart(source);
      expect(screen.getByTestId('preview')).toBeInTheDocument();

      // The synthetic engine positions the preview each frame, so it stays
      // mounted for the whole active drag (no native snapshot-and-discard).
      await flushRaf();
      expect(screen.getByTestId('preview')).toBeInTheDocument();

      // Ending the drag clears the store, unmounting the overlay preview.
      cancel();
      await flushRaf();
      expect(screen.queryByTestId('preview')).toBeNull();
    });

    it('shows no preview at all when disabled', async () => {
      rtlRender(
        <Draggable.Root kind={testDragKind} data-testid="drag" className="Card">
          <Draggable.Preview disabled>
            <span data-testid="preview">x</span>
          </Draggable.Preview>
        </Draggable.Root>,
      );
      const source = screen.getByTestId('drag');
      source.getBoundingClientRect = () => new DOMRect(0, 0, 200, 100);

      fireEvent.dragStart(source);
      // eslint-disable-next-line testing-library/no-unnecessary-act -- would flush a fallback root, if one existed
      await act(async () => {});

      expect(document.querySelector('[data-drag-preview]')).toBeNull();
      expect(screen.queryByTestId('preview')).toBeNull();
      expect(source).toHaveAttribute('data-dragging');
      // Nothing renders, so the content never needs a React root either.
      expect(document.querySelector('[data-base-ui-drag-overlay]')).toBeNull();
    });

    it('clones the source when children are omitted', async () => {
      await renderDnd(
        <Draggable.Root kind={testDragKind} data-testid="drag" className="Card">
          <Draggable.Preview />
        </Draggable.Root>,
      );
      const source = screen.getByTestId('drag');
      source.getBoundingClientRect = () => new DOMRect(0, 0, 200, 100);

      fireEvent.dragStart(source);

      expect(document.querySelector('[data-drag-preview]')).toHaveClass('Card');
    });

    it('forwards its remaining props onto the rendered element', async () => {
      rtlRender(
        <Draggable.Root kind={testDragKind} data-testid="drag">
          <Draggable.Preview id="chip" data-chip="yes" aria-label="Card chip">
            <span data-testid="preview">chip</span>
          </Draggable.Preview>
        </Draggable.Root>,
      );
      const source = screen.getByTestId('drag');
      source.getBoundingClientRect = () => new DOMRect(0, 0, 200, 100);

      fireEvent.dragStart(source);

      const element = screen.getByTestId('preview').parentElement as HTMLElement;
      expect(element).toHaveAttribute('id', 'chip');
      expect(element).toHaveAttribute('data-chip', 'yes');
      expect(element).toHaveAttribute('aria-label', 'Card chip');
    });

    it('keeps the preview settings off the rendered element', async () => {
      const boundsRef = React.createRef<HTMLDivElement>();
      rtlRender(
        <Draggable.Root kind={testDragKind} data-testid="drag">
          <Draggable.Preview offset="pointer" modifiers={Draggable.restrictToElement(boundsRef)}>
            <span data-testid="preview">chip</span>
          </Draggable.Preview>
        </Draggable.Root>,
      );
      const source = screen.getByTestId('drag');
      source.getBoundingClientRect = () => new DOMRect(0, 0, 200, 100);

      fireEvent.dragStart(source);

      // The settings belong to the engine; only the rendering props reach the DOM.
      // (`modifiers` is function-valued and never serializes to an attribute, so
      // its pluck is covered by the unknown-prop console error instead.)
      const element = screen.getByTestId('preview').parentElement as HTMLElement;
      expect(element).not.toHaveAttribute('offset');
      expect(element).not.toHaveAttribute('disabled');
    });

    it('reads React context from above the provider, without leaving the source', async () => {
      const ThemeContext = React.createContext('default');
      function PreviewReader() {
        const theme = React.useContext(ThemeContext);
        return <span data-testid="preview">{theme}</span>;
      }

      // The provider sits inside the theme context, so the content it renders
      // inherits it.
      await renderDnd(
        <ThemeContext.Provider value="dark">
          <DraggableProvider>
            <DraggableWithPreview preview={<PreviewReader />} />
          </DraggableProvider>
        </ThemeContext.Provider>,
      );
      const source = screen.getByTestId('drag');
      source.getBoundingClientRect = () => new DOMRect(0, 0, 200, 100);

      fireEvent.dragStart(source);
      expect(screen.getByTestId('preview')).toHaveTextContent('dark');
      // Both at once, which is the point of separating the two: the content reads
      // the app's context *and* the element stays where the app's contextual CSS
      // (`.dark .Card`) still matches it. Reaching for context used to cost this.
      expect(
        screen.getByTestId('preview').closest('[data-drag-preview]')!.parentElement!.parentElement,
      ).toBe(source.parentElement);
    });

    it('applies className to its own element, inside the engine-owned host', async () => {
      rtlRender(
        <DraggableWithPreview
          preview={<span data-testid="preview">chip</span>}
          previewProps={{ className: 'Ghost' }}
        />,
      );
      const source = screen.getByTestId('drag');
      source.getBoundingClientRect = () => new DOMRect(0, 0, 200, 100);

      fireEvent.dragStart(source);

      // `className` styles the part, not the host the engine transforms — so the
      // host keeps owning geometry while the consumer owns the look.
      const element = screen.getByTestId('preview').parentElement as HTMLElement;
      expect(element).toHaveClass('Ghost');
      expect(element.parentElement).toHaveAttribute('data-drag-preview', '');
    });

    it('renders the element the render prop returns, with no wrapper of its own', async () => {
      rtlRender(
        <DraggableWithPreview
          preview={<span data-testid="preview">chip</span>}
          previewProps={{ render: <section className="Chip" /> }}
        />,
      );
      const source = screen.getByTestId('drag');
      source.getBoundingClientRect = () => new DOMRect(0, 0, 200, 100);

      fireEvent.dragStart(source);

      const element = screen.getByTestId('preview').parentElement as HTMLElement;
      expect(element.tagName).toBe('SECTION');
      expect(element).toHaveClass('Chip');
    });

    it('places the preview at the offset it declares', async () => {
      rtlRender(
        <DraggableWithPreview
          preview={<span data-testid="preview">x</span>}
          previewProps={{ offset: { x: 5, y: 6 } }}
        />,
      );
      const source = screen.getByTestId('drag');
      source.getBoundingClientRect = () => new DOMRect(0, 0, 200, 100);

      await lift(source, { clientX: 30, clientY: 40 });
      await dragOver(source, { clientX: 100, clientY: 120 });

      // Pointer (100, 120) minus the declared offset (5, 6) — not the `'source'`
      // default, which would have anchored to the grab point.
      const host = document.querySelector('[data-drag-preview]') as HTMLElement;
      expect(host.style.translate).toBe('95px 114px');
    });

    it('builds the preview from the drag payload when the children are a function', async () => {
      rtlRender(
        <DraggableWithPreview
          preview={({ source }) => <span data-testid="preview">{source.payload as string}</span>}
          options={{ payload: 'card-1' }}
        />,
      );
      const source = screen.getByTestId('drag');
      source.getBoundingClientRect = () => new DOMRect(0, 0, 200, 100);

      fireEvent.dragStart(source);
      // eslint-disable-next-line testing-library/no-unnecessary-act -- flushing the detached fallback root, not the RTL tree
      await act(async () => {});

      expect(screen.getByTestId('preview')).toHaveTextContent('card-1');
    });

    it('invokes an offset callback with the overlay element', async () => {
      const offsetSpy = vi.fn((_params: { container: HTMLElement }) => ({ x: 10, y: 20 }));
      await renderDnd(
        <DraggableWithPreview
          preview={<span>preview</span>}
          previewProps={{ offset: offsetSpy }}
        />,
      );
      const source = screen.getByTestId('drag');
      source.getBoundingClientRect = () => new DOMRect(0, 0, 200, 100);

      fireEvent.dragStart(source);

      // Exactly once, and against the element the content actually rendered into —
      // a consumer centering on `container.offsetWidth` must not measure some other box.
      expect(offsetSpy).toHaveBeenCalledTimes(1);
      expect(offsetSpy.mock.calls[0][0].container).toBe(
        document.querySelector('[data-drag-preview]'),
      );
    });

    it('applies the offset callback result to the overlay position', async () => {
      await renderDnd(
        <DraggableWithPreview
          preview={<span data-testid="preview">x</span>}
          previewProps={{ offset: () => ({ x: 10, y: 20 }) }}
        />,
      );
      const source = screen.getByTestId('drag');
      source.getBoundingClientRect = () => new DOMRect(0, 0, 200, 100);

      await lift(source, { clientX: 100, clientY: 100 });
      await dragOver(source, { clientX: 80, clientY: 90 });

      const overlay = screen.getByTestId('preview').closest('[data-drag-preview]') as HTMLElement;
      // Pointer (80, 90) minus the returned offset (10, 20).
      expect(overlay.style.translate).toBe('70px 70px');
    });

    it('exposes the source size as CSS variables on the overlay element', async () => {
      await renderDnd(<DraggableWithPreview preview={<span data-testid="preview">x</span>} />);
      const source = screen.getByTestId('drag');
      source.getBoundingClientRect = () => new DOMRect(0, 0, 200, 100);

      fireEvent.dragStart(source);

      // The documented `--drag-source-*` vars must be set on the overlay the
      // React preview renders into (not only the vanilla synthetic container).
      const overlay = screen.getByTestId('preview').closest('[data-drag-preview]') as HTMLElement;
      expect(overlay.style.getPropertyValue('--drag-source-width')).toBe('200px');
      expect(overlay.style.getPropertyValue('--drag-source-height')).toBe('100px');
    });

    it('clamps the preview to a modifiers element when the pointer leaves it', async () => {
      const committedPoints: Array<{ x: number; y: number }> = [];
      function BoundedDraggable() {
        const boundsRef = React.useRef<HTMLDivElement>(null);
        return (
          <React.Fragment>
            <div ref={boundsRef} data-testid="bounds" />
            <Draggable.Root
              kind={testDragKind}
              data-testid="drag"
              onMove={(_, { location }) => {
                committedPoints.push({
                  x: location.current.input.clientX,
                  y: location.current.input.clientY,
                });
              }}
            >
              {/* Pin the preview to the pointer so the assertions below read the
                  clamp alone, not the grab offset the `'source'` default would add. */}
              <Draggable.Preview
                modifiers={Draggable.restrictToElement(boundsRef)}
                offset="pointer"
              >
                <span data-testid="preview">x</span>
              </Draggable.Preview>
            </Draggable.Root>
          </React.Fragment>
        );
      }

      await renderDnd(<BoundedDraggable />);
      const source = screen.getByTestId('drag');
      source.getBoundingClientRect = () => new DOMRect(0, 0, 200, 100);
      // A 200×200 bounds element anchored at the viewport origin.
      screen.getByTestId('bounds').getBoundingClientRect = () => new DOMRect(0, 0, 200, 200);

      await lift(source, { clientX: 10, clientY: 10 });

      // jsdom doesn't lay out, so stub the preview's measured size the clamp reads.
      const overlay = screen.getByTestId('preview').closest('[data-drag-preview]') as HTMLElement;
      overlay.getBoundingClientRect = () => new DOMRect(0, 0, 50, 30);

      // Drag far past the bottom-right corner: the preview sticks to the edge
      // (200 − preview size: 200−50=150, 200−30=170) instead of following out.
      await dragOver(source, { clientX: 500, clientY: 500 });
      expect(overlay.style.translate).toBe('150px 170px');
      await flushRaf();
      // Only the preview is constrained; hit-testing and reported input keep the
      // pointer's real position rather than inheriting the visual clamp.
      expect(committedPoints.at(-1)).toEqual({ x: 500, y: 500 });

      // Back inside the bounds, the preview tracks the pointer normally.
      await dragOver(source, { clientX: 80, clientY: 90 });
      expect(overlay.style.translate).toBe('80px 90px');
    });

    it('renders the preview next to the source, so the app CSS applies to it', async () => {
      await renderDnd(<DraggableWithPreview preview={<span data-testid="preview">x</span>} />);
      const source = screen.getByTestId('drag');
      source.getBoundingClientRect = () => new DOMRect(0, 0, 200, 100);

      fireEvent.dragStart(source);

      // The content is portaled into an engine-owned host that sits in the
      // source's own parent — the same place a cloned preview goes. A provider
      // supplies the React tree, and relocates nothing.
      const host = screen.getByTestId('preview').closest('[data-drag-preview]') as HTMLElement;
      expect(host).not.toBeNull();
      expect(host.parentElement!.parentElement).toBe(source.parentElement);
    });

    it('injects the preview into the part`s own container', async () => {
      function Wiring() {
        const containerRef = React.useRef<HTMLDivElement>(null);
        return (
          <React.Fragment>
            <div ref={containerRef} data-testid="container" />
            <DraggableWithPreview
              preview={<span data-testid="preview">x</span>}
              previewProps={{ container: containerRef }}
            />
          </React.Fragment>
        );
      }

      await renderDnd(<Wiring />);
      const source = screen.getByTestId('drag');
      source.getBoundingClientRect = () => new DOMRect(0, 0, 200, 100);

      fireEvent.dragStart(source);

      // `container` is the only thing that relocates a preview — and it is a part
      // prop now, not imperative-only.
      const host = screen.getByTestId('preview').closest('[data-drag-preview]') as HTMLElement;
      expect(host.parentElement!.parentElement).toBe(screen.getByTestId('container'));
    });

    it('resolves a container callback from the source element', async () => {
      function Wiring() {
        return (
          <div data-testid="board">
            <DraggableWithPreview
              preview={<span data-testid="preview">x</span>}
              previewProps={{
                container: (source: HTMLElement) => source.closest('[data-testid="board"]'),
              }}
            />
          </div>
        );
      }

      await renderDnd(<Wiring />);
      const source = screen.getByTestId('drag');
      source.getBoundingClientRect = () => new DOMRect(0, 0, 200, 100);

      fireEvent.dragStart(source);

      // The callback form reaches a container the caller has no ref to.
      const host = screen.getByTestId('preview').closest('[data-drag-preview]') as HTMLElement;
      expect(host.parentElement!.parentElement).toBe(screen.getByTestId('board'));
    });

    it('relocates the default clone through a preview container', async () => {
      function Wiring() {
        const containerRef = React.useRef<HTMLDivElement>(null);
        return (
          <React.Fragment>
            <div ref={containerRef} data-testid="container" />
            <DraggableProvider>
              <Draggable.Root kind={testDragKind} data-testid="drag" className="Card">
                <Draggable.Preview container={containerRef} />
              </Draggable.Root>
            </DraggableProvider>
          </React.Fragment>
        );
      }

      await renderDnd(<Wiring />);
      const source = screen.getByTestId('drag');
      source.getBoundingClientRect = () => new DOMRect(0, 0, 200, 100);

      fireEvent.dragStart(source);

      // The preview part configures the engine-built clone without custom content.
      const clone = document.querySelector('.Card[data-drag-preview]') as HTMLElement;
      expect(clone).not.toBeNull();
      expect(clone.parentElement!.parentElement).toBe(screen.getByTestId('container'));
    });

    it('resolves the preview container that arrives after mount, at drag start', async () => {
      function Wiring() {
        const [container, setContainer] = React.useState<HTMLElement | null>(null);
        return (
          <React.Fragment>
            <div ref={setContainer} data-testid="late-container" />
            <DraggableProvider>
              <Draggable.Root kind={testDragKind} data-testid="drag" className="Card">
                <Draggable.Preview container={container ?? undefined} />
              </Draggable.Root>
            </DraggableProvider>
          </React.Fragment>
        );
      }

      await renderDnd(<Wiring />);
      const source = screen.getByTestId('drag');
      source.getBoundingClientRect = () => new DOMRect(0, 0, 200, 100);

      fireEvent.dragStart(source);

      const clone = document.querySelector('.Card[data-drag-preview]') as HTMLElement;
      expect(clone.parentElement!.parentElement).toBe(screen.getByTestId('late-container'));
    });

    it('keeps the provider context stable when its parent renders', async () => {
      let rowCommits = 0;
      const Row = React.memo(function Row() {
        rowCommits += 1;
        return <Draggable.Root kind={testDragKind} data-testid="drag" />;
      });

      function Wiring() {
        const [, force] = React.useState(0);
        return (
          <React.Fragment>
            <button type="button" data-testid="force" onClick={() => force((c) => c + 1)} />
            <DraggableProvider>
              <Row />
            </DraggableProvider>
          </React.Fragment>
        );
      }

      await renderDnd(<Wiring />);
      const countAfterMount = rowCommits;

      fireEvent.click(screen.getByTestId('force'));

      expect(rowCommits).toBe(countAfterMount);
    });
  });

  describe('imperative preview', () => {
    // An imperatively registered source has no component to hold a
    // `Draggable.Preview`, so it declares the preview on the registration itself.
    function ImperativeCard() {
      const engine = Draggable.useManager();
      const elementRef = React.useRef<HTMLDivElement>(null);
      React.useEffect(
        () =>
          engine.registerSource(elementRef.current!, () => ({
            kind: cardKind,
            payload: { id: 'a' },
            preview: { render: () => <span data-testid="preview">chip</span> },
          })),
        [engine],
      );
      return <div ref={elementRef} data-testid="drag" className="Card" />;
    }

    it('renders the preview for an imperatively registered source', async () => {
      await renderDnd(
        <DraggableProvider>
          <ImperativeCard />
        </DraggableProvider>,
      );
      const source = screen.getByTestId('drag');
      source.getBoundingClientRect = () => new DOMRect(0, 0, 200, 100);

      fireEvent.dragStart(source);

      expect(screen.getByTestId('preview')).toBeInTheDocument();
      // Exactly one preview: the declaration must suppress the clone, not race it.
      expect(document.querySelectorAll('[data-drag-preview]')).toHaveLength(1);
      expect(document.querySelector('.Card[data-drag-preview]')).toBeNull();
    });

    it('still honours preview.offset for an imperative preview', async () => {
      function OffsetCard() {
        const engine = Draggable.useManager();
        const elementRef = React.useRef<HTMLDivElement>(null);
        React.useEffect(
          () =>
            engine.registerSource(elementRef.current!, () => ({
              kind: cardKind,
              payload: { id: 'a' },
              preview: {
                render: () => <span data-testid="preview">chip</span>,
                offset: { x: 5, y: 6 },
              },
            })),
          [engine],
        );
        return <div ref={elementRef} data-testid="drag" />;
      }

      await renderDnd(
        <DraggableProvider>
          <OffsetCard />
        </DraggableProvider>,
      );
      const source = screen.getByTestId('drag');
      source.getBoundingClientRect = () => new DOMRect(0, 0, 200, 100);

      await lift(source, { clientX: 30, clientY: 40 });
      await dragOver(source, { clientX: 100, clientY: 120 });

      const host = screen.getByTestId('preview').closest('[data-drag-preview]') as HTMLElement;
      expect(host.style.translate).toBe('95px 114px');
    });

    it('shows no preview at all with preview.disabled', async () => {
      function DisabledCard() {
        const engine = Draggable.useManager();
        const elementRef = React.useRef<HTMLDivElement>(null);
        React.useEffect(
          () =>
            engine.registerSource(elementRef.current!, () => ({
              kind: cardKind,
              payload: { id: 'a' },
              preview: { disabled: true },
            })),
          [engine],
        );
        return <div ref={elementRef} data-testid="drag" className="Card" />;
      }

      await renderDnd(<DisabledCard />);
      const source = screen.getByTestId('drag');
      source.getBoundingClientRect = () => new DOMRect(0, 0, 200, 100);

      fireEvent.dragStart(source);

      expect(document.querySelector('[data-drag-preview]')).toBeNull();
      expect(source).toHaveAttribute('data-dragging');
    });

    it('clamps an imperative preview to preview.modifiers', async () => {
      function BoundedCard() {
        const engine = Draggable.useManager();
        const elementRef = React.useRef<HTMLDivElement>(null);
        const boundsRef = React.useRef<HTMLDivElement>(null);
        React.useEffect(
          () =>
            engine.registerSource(elementRef.current!, () => ({
              kind: cardKind,
              payload: { id: 'a' },
              preview: {
                modifiers: Draggable.restrictToElement(boundsRef),
                offset: 'pointer',
              },
            })),
          [engine],
        );
        return (
          <React.Fragment>
            <div ref={boundsRef} data-testid="bounds" />
            <div ref={elementRef} data-testid="drag" className="Card" />
          </React.Fragment>
        );
      }

      await renderDnd(<BoundedCard />);
      const source = screen.getByTestId('drag');
      source.getBoundingClientRect = () => new DOMRect(0, 0, 200, 100);
      screen.getByTestId('bounds').getBoundingClientRect = () => new DOMRect(0, 0, 200, 200);

      await lift(source, { clientX: 10, clientY: 10 });

      const clone = document.querySelector('[data-drag-preview]') as HTMLElement;
      clone.getBoundingClientRect = () => new DOMRect(0, 0, 50, 30);

      await dragOver(source, { clientX: 500, clientY: 500 });
      expect(clone.style.translate).toBe('150px 170px');
    });

    it('injects the clone into an explicit preview.container', async () => {
      const host = document.createElement('div');
      document.body.appendChild(host);
      try {
        function ContainedCard() {
          const engine = Draggable.useManager();
          const elementRef = React.useRef<HTMLDivElement>(null);
          React.useEffect(
            () =>
              engine.registerSource(elementRef.current!, () => ({
                kind: cardKind,
                payload: { id: 'a' },
                preview: { container: host },
              })),
            [engine],
          );
          return <div ref={elementRef} data-testid="drag" className="Card" />;
        }

        await renderDnd(<ContainedCard />);
        const source = screen.getByTestId('drag');
        source.getBoundingClientRect = () => new DOMRect(0, 0, 200, 100);

        fireEvent.dragStart(source);

        expect(host.querySelector('[data-drag-preview]')).not.toBeNull();
      } finally {
        host.remove();
      }
    });

    it('injects the preview into an explicit preview.container over the PreviewProvider', async () => {
      const host = document.createElement('div');
      document.body.appendChild(host);
      try {
        function ContainedCard() {
          const engine = Draggable.useManager();
          const elementRef = React.useRef<HTMLDivElement>(null);
          React.useEffect(
            () =>
              engine.registerSource(elementRef.current!, () => ({
                kind: cardKind,
                payload: { id: 'a' },
                preview: {
                  render: () => <span data-testid="preview">chip</span>,
                  container: host,
                },
              })),
            [engine],
          );
          return <div ref={elementRef} data-testid="drag" />;
        }

        await renderDnd(
          <DraggableProvider>
            <ContainedCard />
          </DraggableProvider>,
        );
        const source = screen.getByTestId('drag');
        source.getBoundingClientRect = () => new DOMRect(0, 0, 200, 100);

        fireEvent.dragStart(source);

        expect(host.contains(screen.getByTestId('preview'))).toBe(true);
      } finally {
        host.remove();
      }
    });
  });

  describe('parts outside the root', () => {
    // The error exists so a misplaced part fails loudly instead of silently
    // configuring nothing; nothing pinned that it actually fires.
    it.each([
      ['Draggable.Handle', <Draggable.Handle key="h" />],
      ['Draggable.Preview', <Draggable.Preview key="c" />],
    ])('throws when %s is rendered outside Draggable.Root', (_name, element) => {
      // React logs the uncaught render error through console.error in dev.
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      try {
        expect(() => rtlRender(element)).toThrow(/DraggableRootContext is missing/);
      } finally {
        errorSpy.mockRestore();
      }
    });
  });
});
