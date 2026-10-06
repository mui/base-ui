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
  fireDrag,
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

/** The engine sets `data-dragging`, so tests read `state.dragging` through `className`. */
function draggingClass(state: Draggable.Root.State) {
  return state.dragging ? 'dragging' : 'idle';
}

function TestDraggable<TPayload = undefined>(props: {
  options?: Partial<Draggable.Root.Props<TPayload>>;
  testId?: string;
}) {
  const { options, testId = 'drag' } = props;
  // `Draggable.Root` requires `payload` once `TPayload` is declared. Most fixtures
  // pass no payload, so this helper widens the props type instead of making each
  // fixture declare one. `kind` defaults to the shared test kind. Fixtures that
  // test kind matching or a typed payload pass their own.
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

  it('applies the gesture styles once attached', async () => {
    await renderDnd(<TestDraggable />);
    const el = screen.getByTestId('drag');
    // The engine applies gesture styles to the handle so a press can't select
    // text or fire the touch callout.
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

  it('exposes state.dragging reflecting the active drag session', async () => {
    const { engine } = await renderDnd(<TestDraggable />);
    const source = screen.getByTestId('drag');
    expect(source).toHaveClass('idle');

    // Pin element bounds so the engine can resolve a pointer location.
    source.getBoundingClientRect = () => new DOMRect(0, 0, 200, 100);
    const target = createElement();
    engine.registerTarget(target, {});

    fireDrag.dragStart(source);
    await flushRaf();

    expect(source).toHaveClass('dragging');

    fireDrag.dragEnter(target);
    fireDrag.dragOver(target);
    await flushRaf();

    fireDrag.drop(target);
    await flushRaf();

    expect(source).toHaveClass('idle');
  });

  it('blocks the drag when onBeforeMoveStart cancels', async () => {
    const onMoveStart = vi.fn();
    await renderDnd(
      <TestDraggable
        options={{ onBeforeMoveStart: (eventDetails) => eventDetails.cancel(), onMoveStart }}
      />,
    );
    const source = screen.getByTestId('drag');

    fireDrag.dragStart(source);
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

    fireDrag.dragStart(source);
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
    fireDrag.dragStart(source);
    await flushRaf();
    fireDrag.dragOver(source, { clientX: 40, clientY: 40 });
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
    // The root keeps `payload` out of the spread props. Otherwise it would render
    // as a `payload` attribute.
    expect(source.hasAttribute('payload')).toBe(false);

    fireDrag.dragStart(source);
    await flushRaf();

    expect(onMoveStart).toHaveBeenCalledTimes(1);
    expect(onMoveStart.mock.calls[0][0].source.payload).toEqual({ token: 'abc' });
  });

  it('keeps the registration stable across re-renders and calls the latest callbacks', async () => {
    const firstOnMoveStart = vi.fn();
    const secondOnMoveStart = vi.fn();

    const { rerender } = await renderDnd(
      <TestDraggable options={{ onMoveStart: firstOnMoveStart }} />,
    );
    const source = screen.getByTestId('drag');
    // Registration applies the gesture styles, which prove the element is registered.
    expect(source.style.touchAction).toBe('manipulation');
    const getParameters = getRegistration(source)!;
    const firstParameters = getParameters();
    // Repeated engine dispatches within one render reuse the normalized
    // registration instead of rebuilding it every time.
    expect(getParameters()).toBe(firstParameters);

    // Re-render with a new onMoveStart function. The registration must stay in
    // place, and only the wrapped callback reads the new prop.
    await rerender(<TestDraggable options={{ onMoveStart: secondOnMoveStart }} />);
    // Same DOM node, still registered, so no re-registration happened.
    expect(screen.getByTestId('drag')).toBe(source);
    expect(source.style.touchAction).toBe('manipulation');
    const secondParameters = getParameters();
    expect(secondParameters).not.toBe(firstParameters);
    expect(getParameters()).toBe(secondParameters);

    fireDrag.dragStart(source);
    await flushRaf();

    expect(firstOnMoveStart).not.toHaveBeenCalled();
    expect(secondOnMoveStart).toHaveBeenCalledTimes(1);
  });

  it('does not expose parameters from a suspended render', async () => {
    const committedOnMoveStart = vi.fn();
    const suspendedOnMoveStart = vi.fn();
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
              options={{ onMoveStart: suspend ? suspendedOnMoveStart : committedOnMoveStart }}
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

    fireDrag.dragStart(screen.getByTestId('drag'));
    await flushRaf();

    expect(committedOnMoveStart).toHaveBeenCalledTimes(1);
    expect(suspendedOnMoveStart).not.toHaveBeenCalled();
  });

  it('re-registers when the element behind the ref is swapped without remounting', async () => {
    function Swappable({ swapped }: { swapped: boolean }) {
      // The key is on the rendered node, not on the root. This component and its
      // registration stay mounted while React swaps the DOM node behind the ref,
      // as when a virtualizer recycles a row.
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
    // The old node was unregistered and its gesture styles restored. The new node
    // is registered, so the draggable still works after the swap.
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

    fireDrag.dragStart(first);
    await flushRaf();
    expect(first).toHaveClass('dragging');
    expect(dragSessionStore.getSnapshot()?.source.element).toBe(first);

    // Recycle the row mid-drag. The session must switch from the detached node to
    // the new one, so `state.dragging` and every closure reading `source.element`
    // see the new node.
    await rerender(<Swappable swapped />);
    const second = screen.getByTestId('b');
    expect(dragSessionStore.getSnapshot()?.source.element).toBe(second);
    // `state.dragging` and the engine's `data-dragging` are now on the new node,
    // not the detached one.
    expect(second).toHaveClass('dragging');
    expect(second).toHaveAttribute('data-dragging');
    expect(first).not.toHaveAttribute('data-dragging');
  });

  it('defers a disabled flip mid-drag: the drag survives, the setup lands at drag end', async () => {
    // A reconcile input change while this element is the active source must not
    // tear down the gesture. The re-registration runs at drag end.
    const { rerender } = await renderDnd(<Draggable.Root kind={testDragKind} data-testid="drag" />);
    const el = screen.getByTestId('drag');
    el.getBoundingClientRect = () => new DOMRect(0, 0, 200, 100);

    fireDrag.dragStart(el);
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

    // The skipped reconcile ran, so the gesture styles now reflect `disabled`.
    expect(dragSessionStore.getSnapshot()).toBeNull();
    expect(el.style.userSelect).toBe('');
    expect(el.style.touchAction).toBe('');
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

    fireDrag.dragStart(source);
    await flushRaf();
    expect(source).toHaveClass('dragging');

    await rerender(<Inline tick={1} />);

    // The rendered node is unchanged. The clone shares its `data-testid`, so assert
    // on the node captured before the drag instead of querying again.
    expect(source).toHaveAttribute('data-tick', '1');
    expect(source).toHaveClass('dragging');
    expect(source).toHaveAttribute('data-dragging');
    expect(source.style.userSelect).toBe('none');
    expect(dragSessionStore.getSnapshot()?.source.element).toBe(source);

    // The drag still completes, so re-registration didn't unbind the sensors
    // during the gesture.
    fireDrag.dragEnter(target);
    fireDrag.dragOver(target);
    await flushRaf();
    fireDrag.drop(target);
    await flushRaf();

    expect(onMoveEnd).toHaveBeenCalledTimes(1);
    expect(onDrop).toHaveBeenCalledTimes(1);
    expect(source).toHaveClass('idle');
  });

  it('still lands the drop after the source unmounted mid-drag', async () => {
    const onMoveEnd = vi.fn();
    const onDrop = vi.fn();
    // No clone preview. With the source gone before the drop, a clone would have
    // nothing to settle onto and would outlive the test in a real browser.
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

    fireDrag.dragStart(source);
    await flushRaf();
    // A list re-rendering on pickup can unmount the very row being dragged.
    await rerender(<Source mounted={false} />);
    await flushRaf();

    // `fireDrag` dispatches on the source, which is now detached, so drive the rest
    // of the gesture with raw pointer events at the target.
    const hitTest = vi.spyOn(document, 'elementFromPoint').mockImplementation(() => target);
    registerCleanup(() => hitTest.mockRestore());
    const pointer = { pointerType: 'mouse', pointerId: 1, clientX: 100, clientY: 250 } as const;
    firePointer.move(target, { ...pointer, buttons: 1, timeStamp: 100 });
    await flushRaf();
    firePointer.up(target, { ...pointer, button: 0, buttons: 0, timeStamp: 120 });

    expect(onDrop).toHaveBeenCalledTimes(1);
    expect(onMoveEnd).toHaveBeenCalledTimes(1);
    expect(onMoveEnd.mock.calls[0][0].reason).toBe('drop');
    expect(onMoveEnd.mock.calls[0][0].target?.element).toBe(target);
  });

  it('survives unmount mid-drag', async () => {
    const onMoveEnd = vi.fn();
    const { unmount } = await renderDnd(<TestDraggable options={{ onMoveEnd }} />);
    const source = screen.getByTestId('drag');
    source.getBoundingClientRect = () => new DOMRect(0, 0, 200, 100);

    fireDrag.dragStart(source);
    await flushRaf();

    unmount();
    // Unmount runs the registration cleanup, which restores the gesture styles.
    // The temporary `draggable="false"` belongs to the drag session and is
    // restored when the session ends.
    expect(source.style.touchAction).toBe('');
    expect(source.style.userSelect).toBe('');

    // Unregistering the source doesn't end the session. The pointer is still
    // down, so the drag lasts until it is released or canceled.
    expect(dragSessionStore.getSnapshot()?.source.element).toBe(source);
    expect(onMoveEnd).not.toHaveBeenCalled();

    cancel();
    await flushRaf();

    expect(dragSessionStore.getSnapshot()).toBeNull();
    expect(onMoveEnd).toHaveBeenCalledTimes(1);
    expect(onMoveEnd.mock.calls[0][0].target).toBeNull();
    expect(onMoveEnd.mock.calls[0][0].reason).toBe('escape-key');

    // The engine isn't stuck. A new draggable starts a new drag.
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

      fireDrag.dragStart(source);
      await flushRaf();
      fireDrag.dragEnter(target);
      fireDrag.dragOver(target);
      await flushRaf();
      fireDrag.drop(target);
      await flushRaf();

      // A double-mounted registration would run the handlers once per hold.
      expect(onMoveStart).toHaveBeenCalledTimes(1);
      expect(onMoveEnd).toHaveBeenCalledTimes(1);
      // `onDrop` confirms it was a committed drop.
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

      // `lift` moves about 6px, short of the 40px threshold, so the forwarded
      // `activation` keeps the drag from starting.
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

      // A press with no movement at all. The default mouse activation would wait
      // for 5px of travel.
      const pointer = { pointerType: 'mouse', pointerId: 1, clientX: 10, clientY: 10 } as const;
      act(() => {
        firePointer.down(el, { ...pointer, button: 0, buttons: 1, timeStamp: 100 });
      });
      await flushRaf();
      expect(onMoveStart).toHaveBeenCalledTimes(1);

      act(() => {
        firePointer.up(el, { ...pointer, button: 0, buttons: 0, timeStamp: 120 });
      });
      expect(dragSessionStore.getSnapshot()).toBeNull();
    });

    it('forwards modifiers: a root-level axis lock constrains a pointer drag', async () => {
      // Root-level modifiers apply to the committed input, which the hit-test point
      // and the preview follow. A vertical-axis lock must keep every reported x
      // fixed while y follows the pointer.
      const moves: Array<{ x: number; y: number }> = [];
      await renderDnd(
        <Draggable.Root
          kind={testDragKind}
          data-testid="drag"
          modifiers={Draggable.restrictToVerticalAxis}
          onMove={({ location }) => {
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
      // Every committed x stays at the drag-start point, which is the 100px press
      // plus the `DRAG_ACTIVATION_DISTANCE_PX` move from `lift`. It never reaches
      // the pointer's 180, while y follows the pointer to 90. Checking the exact
      // value catches a lock anchored to the wrong reference point.
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

      fireDrag.dragStart(source);
      await flushRaf();
      expect(onTargetChange).not.toHaveBeenCalled();

      fireDrag.dragEnter(target);
      fireDrag.dragOver(target);
      await flushRaf();

      expect(onTargetChange).toHaveBeenCalledTimes(1);
      const eventDetails = onTargetChange.mock.calls[0][0];
      expect(eventDetails.target?.element).toBe(target);
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
      // The cursor lock is deferred past the frame that paints the lift.
      await flushRaf();

      // The sensor sets the cursor for the whole document through a rule keyed on
      // this class and variable. The forwarded value must end up in the variable.
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
      // The cursor lock is deferred past the frame that paints the lift.
      await flushRaf();
      expect(document.documentElement).toHaveClass('baseui-dragging');
      expect(document.documentElement).not.toHaveClass('baseui-dragging-styles');
      cancel();
      await flushRaf();

      act(() => setStyleElementsDisabled(false));
      await lift(el);
      await flushRaf();

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
      // The ref callback runs before the layout effect that updates the params
      // ref. A keyed remount that also changes props could register the new node
      // with the previous render's parameters.
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
      fireDrag.drop(target, { clientY: 250 });
      await flushRaf();

      expect(stale).not.toHaveBeenCalled();
      expect(onDrop).toHaveBeenCalledTimes(1);
      expect(onDrop.mock.calls[0][0].currentTarget.payload).toEqual({ slot: 2 });
    });
  });

  describe('default clone preview', () => {
    function PlainDraggable() {
      return (
        <Draggable.Root kind={testDragKind} data-testid="drag" className="Card">
          Card
        </Draggable.Root>
      );
    }

    it('clones the source in place, so the app CSS still applies to the preview', () => {
      rtlRender(<PlainDraggable />);
      const source = screen.getByTestId('drag');
      source.getBoundingClientRect = () => new DOMRect(0, 0, 200, 100);

      expect(document.querySelector('[data-drag-preview]')).toBeNull();

      fireDrag.dragStart(source);

      // The clone lives in the source's own parent, keeps its classes, and is
      // marked so consumers can style it with `.Card[data-drag-preview]`.
      const clone = document.querySelector('[data-drag-preview]') as HTMLElement;
      expect(clone).not.toBeNull();
      expect(clone).toHaveClass('Card');
      // The clone is a sibling of the source, with no wrapper, so the cascade still applies.
      expect(clone.parentElement).toBe(source.parentElement);
    });

    it('marks the source with data-dragging, and never the clone', async () => {
      await renderDnd(<PlainDraggable />);
      const source = screen.getByTestId('drag');
      source.getBoundingClientRect = () => new DOMRect(0, 0, 200, 100);

      fireDrag.dragStart(source);

      // `[data-dragging] { opacity: .4 }` must dim only the source. If the clone
      // carried the attribute, the preview would fade too.
      expect(source).toHaveAttribute('data-dragging');
      expect(document.querySelector('[data-drag-preview]')).not.toHaveAttribute('data-dragging');
    });

    it('reports settling in its state while the preview settles after the drop', async () => {
      // `[data-dragging]` stays on the source until the preview has settled. A
      // component that renders it from React needs `dragging || settling`.
      const states: Draggable.Root.State[] = [];
      await renderDnd(
        <Draggable.Root
          kind={testDragKind}
          data-testid="drag"
          className={(state) => {
            states.push(state);
            return undefined;
          }}
        />,
      );
      const source = screen.getByTestId('drag');
      source.getBoundingClientRect = () => new DOMRect(0, 0, 200, 100);

      await lift(source);
      expect(states.at(-1)).toMatchObject({ dragging: true, settling: false });

      act(() => fireDrag.drop(source));
      expect(source).toHaveAttribute('data-settling');
      expect(states.at(-1)).toMatchObject({ dragging: false, settling: true });

      await flushRaf();
      expect(source).not.toHaveAttribute('data-settling');
      expect(states.at(-1)).toMatchObject({ dragging: false, settling: false });
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

      fireDrag.dragStart(source);
      expect(document.querySelector('[data-drag-preview]')).not.toBeNull();

      cancel();
      await flushRaf();

      expect(document.querySelector('[data-drag-preview]')).toBeNull();
      expect(source).not.toHaveAttribute('data-dragging');
    });

    it('retargets the settling clone to a root remounted with the same previewKey', async () => {
      // A cross-container move remounts the card as a new React subtree with a new
      // payload object. `previewKey` connects the settling clone to the new node.
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

      fireDrag.dragStart(first);
      await flushRaf();
      fireDrag.dragEnter(target);
      fireDrag.dragOver(target);
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

      fireDrag.drop(target);
      expect(clone.isConnected).toBe(true);
      expect(first).toHaveAttribute('data-dragging');

      await rerender(<Card mountKey="b" payload={{ id: 'a' }} />);
      const second = getSource();
      expect(second).not.toBe(first);
      // The clone now settles onto the new node, and the source attributes moved with it.
      expect(second).toHaveAttribute('data-dragging');
      expect(second).toHaveAttribute('data-settling');
      expect(first).not.toHaveAttribute('data-dragging');
      expect(clone.isConnected).toBe(true);

      await flushRaf();
      expect(clone).toHaveAttribute('data-ending-style');
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

      fireDrag.dragStart(source);
      await flushRaf();
      expect(document.querySelector('[data-drag-preview]')).not.toBeNull();

      fireDrag.dragEnter(target);
      fireDrag.dragOver(target);
      await flushRaf();
      fireDrag.drop(target);

      // A clone gets an ending frame so an authored transition can settle it into
      // the source. With no transition, it is gone before that frame paints.
      expect(document.querySelector('[data-drag-preview]')).not.toBeNull();
      await flushRaf();
      expect(document.querySelector('[data-drag-preview]')).toBeNull();
      expect(source).not.toHaveAttribute('data-dragging');
    });

    it.each([
      ['a drop on a target', true],
      ['a release outside every target', false],
    ])('tells the ending preview whether it ends after %s', async (_name, onTarget) => {
      vi.stubGlobal('BASE_UI_ANIMATIONS_DISABLED', false);
      registerCleanup(() => vi.unstubAllGlobals());
      const { engine } = await renderDnd(<PlainDraggable />);
      const source = screen.getByTestId('drag');
      source.getBoundingClientRect = () => new DOMRect(0, 0, 200, 100);
      const target = createElement();
      if (onTarget) {
        engine.registerTarget(target, {});
      }

      fireDrag.dragStart(source);
      await flushRaf();
      fireDrag.dragEnter(target);
      fireDrag.dragOver(target);
      await flushRaf();
      // An authored ending transition keeps the clone mounted to inspect it.
      const clone = document.querySelector('[data-drag-preview]') as HTMLElement;
      let finishAnimation!: () => void;
      const finished = new Promise<void>((resolve) => {
        finishAnimation = resolve;
      });
      registerCleanup(() => finishAnimation());
      clone.getAnimations = () =>
        [{ effect: { getTiming: () => ({ iterations: 1 }) }, finished }] as unknown as Animation[];
      fireDrag.drop(target);
      await flushRaf();

      expect(clone).toHaveAttribute('data-ending-style');
      expect(clone.hasAttribute('data-dropped')).toBe(onTarget);
      finishAnimation();
      await finished;
      await flushRaf();
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

      // Configuring the preview must not turn it into a host. It is still the clone
      // and carries the source's class.
      const clone = document.querySelector('[data-drag-preview]') as HTMLElement;
      expect(clone).toHaveClass('Card');
      // `'pointer'` anchors it to the pointer instead of the grab point `'source'` keeps.
      expect(clone.style.translate).toBe('100px 120px');
    });

    it('resolves an offset callback against the clone, immediately', async () => {
      // A clone publishes nothing to the overlay store, so the renderer never runs
      // and nothing re-anchors it later. Unlike a host's, the callback has to
      // resolve at drag start.
      const offsetSpy = vi.fn((_params: { container: HTMLElement }) => ({ x: 10, y: 20 }));
      await renderDnd(<ClonedPreviewDraggable previewProps={{ offset: offsetSpy }} />);
      const source = screen.getByTestId('drag');
      source.getBoundingClientRect = () => new DOMRect(0, 0, 200, 100);

      await lift(source, { clientX: 30, clientY: 40 });
      await dragOver(source, { clientX: 80, clientY: 90 });

      const clone = document.querySelector('[data-drag-preview]') as HTMLElement;
      expect(offsetSpy).toHaveBeenCalledTimes(1);
      // Measured against the clone itself, since there is no host.
      expect(offsetSpy.mock.calls[0][0].container).toBe(clone);
      // Pointer (80, 90) minus the returned offset (10, 20).
      expect(clone.style.translate).toBe('70px 70px');
    });

    it('shows no preview at all when disabled', async () => {
      await renderDnd(<ClonedPreviewDraggable previewProps={{ disabled: true }} />);
      const source = screen.getByTestId('drag');
      source.getBoundingClientRect = () => new DOMRect(0, 0, 200, 100);

      fireDrag.dragStart(source);

      expect(document.querySelector('[data-drag-preview]')).toBeNull();
      // The source is still marked, so it can be styled while it is being dragged.
      expect(source).toHaveAttribute('data-dragging');
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

      // Drag far past the bottom-right corner. The clone stops at the edge, 200
      // minus its 50x30 size, instead of following the pointer out.
      await dragOver(source, { clientX: 500, clientY: 500 });
      expect(clone.style.translate).toBe('150px 170px');

      // Back inside, it follows the pointer again instead of staying at the edge.
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

      fireDrag.dragStart(source);

      // A declared clone must not be mistaken for custom content and wait for React.
      const clone = document.querySelector('.Card[data-drag-preview]') as HTMLElement;
      expect(clone).not.toBeNull();
      // The provider renders no element, so it moves nothing. The clone stays where
      // the app's contextual CSS still reaches it. Only `container` moves a preview.
      expect(clone.parentElement).toBe(source.parentElement);
    });

    it('warns rather than throwing when a draggable declares two previews', () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      try {
        // A wrapper can add its own preview next to one the consumer passed.
        // Crashing production over that mistake is too harsh, and a duplicate
        // `Handle` only warns as well.
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

    it('renders a single preview part under Strict Mode', async () => {
      // Strict Mode runs the declaring layout effect, its cleanup, then the effect
      // again. Only the identity guard in the cleanup keeps that from triggering the
      // one-preview warning on mount.
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

      fireDrag.dragStart(source);

      expect(screen.getByTestId('preview')).toHaveTextContent('x');
    });

    it('swaps between the two preview parts in a single commit', async () => {
      // The outgoing part's cleanup has to run before the incoming part declares,
      // or a valid swap would trigger the one-preview check.
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

      fireDrag.dragStart(source);

      // The clone carries the source's class. A host never does.
      expect(document.querySelector('.Card[data-drag-preview]')).not.toBeNull();
    });

    it('swaps back to a Draggable.Preview in a single commit', async () => {
      // The reverse order, with a host declaring after a clone's cleanup.
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

      fireDrag.dragStart(source);

      expect(screen.getByTestId('preview')).toHaveTextContent('x');
      expect(document.querySelector('.Card[data-drag-preview]')).toBeNull();
    });
  });

  describe('Draggable.Preview', () => {
    function DraggableWithPreview(props: {
      options?: Partial<Draggable.Root.Props<any>>;
      preview?: Draggable.Preview.Props['children'];
      previewProps?: Omit<Draggable.Preview.Props, 'children'>;
    }) {
      const { options, preview, previewProps } = props;
      return (
        <Draggable.Root kind={testDragKind} {...options} data-testid="drag">
          <Draggable.Preview {...previewProps}>{preview}</Draggable.Preview>
        </Draggable.Root>
      );
    }

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

      fireDrag.dragStart(source);

      expect(screen.getByTestId('preview')).toBeInTheDocument();
      // No clone of the source. Declaring content turns cloning off, so two
      // previews never follow the pointer.
      expect(source.parentElement!.querySelector('.Card[data-drag-preview]')).toBeNull();
    });

    it('keeps the preview mounted during the drag and clears it when the drag ends', async () => {
      await renderDnd(<DraggableWithPreview preview={<span data-testid="preview">hello</span>} />);
      const source = screen.getByTestId('drag');
      source.getBoundingClientRect = () => new DOMRect(0, 0, 200, 100);
      expect(screen.queryByTestId('preview')).toBeNull();

      // The overlay commits synchronously inside the dragstart handler.
      fireDrag.dragStart(source);
      expect(screen.getByTestId('preview')).toBeInTheDocument();

      // The engine positions the preview each frame, so it stays mounted for the
      // whole active drag.
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

      fireDrag.dragStart(source);

      expect(document.querySelector('[data-drag-preview]')).toBeNull();
      expect(screen.queryByTestId('preview')).toBeNull();
      expect(source).toHaveAttribute('data-dragging');
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

      fireDrag.dragStart(source);

      const element = screen.getByTestId('preview').parentElement as HTMLElement;
      // The content renders off-document, so its id doesn't collide with anything and
      // the copy keeps it.
      expect(element).toHaveAttribute('id', 'chip');
      expect(element).toHaveAttribute('data-chip', 'yes');
      expect(element).toHaveAttribute('aria-label', 'Card chip');
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

      fireDrag.dragStart(source);
      expect(screen.getByTestId('preview')).toHaveTextContent('dark');
      // Both hold at once. The content reads the app's context, and the element
      // stays where contextual CSS such as `.dark .Card` still matches it.
      expect(screen.getByTestId('preview').closest('[data-drag-preview]')!.parentElement).toBe(
        source.parentElement,
      );
    });

    it('applies className to the preview element', async () => {
      rtlRender(
        <DraggableWithPreview
          preview={<span data-testid="preview">chip</span>}
          previewProps={{ className: 'Ghost' }}
        />,
      );
      const source = screen.getByTestId('drag');
      source.getBoundingClientRect = () => new DOMRect(0, 0, 200, 100);

      fireDrag.dragStart(source);

      // The part's element is the preview the engine positions, with no host around
      // it, and it carries the public styling hook.
      const element = screen.getByTestId('preview').parentElement as HTMLElement;
      expect(element).toHaveClass('Ghost');
      expect(element).toHaveAttribute('data-drag-preview', '');
      expect(element).toHaveAttribute('data-base-ui-drag-preview', 'content');
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

      fireDrag.dragStart(source);

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

      // Pointer (100, 120) minus the declared offset (5, 6). The `'source'` default
      // would have anchored to the grab point.
      const host = document.querySelector('[data-base-ui-drag-preview]') as HTMLElement;
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

      fireDrag.dragStart(source);

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

      fireDrag.dragStart(source);

      // Called once, with the element the content rendered into. A consumer
      // centering on `container.offsetWidth` must measure that element.
      expect(offsetSpy).toHaveBeenCalledTimes(1);
      expect(offsetSpy.mock.calls[0][0].container).toBe(
        document.querySelector('[data-base-ui-drag-preview]'),
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

      const overlay = screen
        .getByTestId('preview')
        .closest('[data-base-ui-drag-preview]') as HTMLElement;
      // Pointer (80, 90) minus the returned offset (10, 20).
      expect(overlay.style.translate).toBe('70px 70px');
    });

    it('exposes the source size as CSS variables on the overlay element', async () => {
      await renderDnd(<DraggableWithPreview preview={<span data-testid="preview">x</span>} />);
      const source = screen.getByTestId('drag');
      source.getBoundingClientRect = () => new DOMRect(0, 0, 200, 100);

      fireDrag.dragStart(source);

      // The documented `--drag-source-*` variables must be set on the overlay the
      // React preview renders into, not only on the vanilla synthetic container.
      const overlay = screen
        .getByTestId('preview')
        .closest('[data-base-ui-drag-preview]') as HTMLElement;
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
              onMove={({ location }) => {
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
      const overlay = screen
        .getByTestId('preview')
        .closest('[data-base-ui-drag-preview]') as HTMLElement;
      overlay.getBoundingClientRect = () => new DOMRect(0, 0, 50, 30);

      // Drag far past the bottom-right corner. The preview stops at the edge, 200
      // minus its 50x30 size, instead of following the pointer out.
      await dragOver(source, { clientX: 500, clientY: 500 });
      expect(overlay.style.translate).toBe('150px 170px');
      await flushRaf();
      // Only the preview is constrained. Hit-testing and the reported input keep
      // the pointer's real position.
      expect(committedPoints.at(-1)).toEqual({ x: 500, y: 500 });

      // Back inside the bounds, the preview tracks the pointer normally.
      await dragOver(source, { clientX: 80, clientY: 90 });
      expect(overlay.style.translate).toBe('80px 90px');
    });

    it('renders the preview next to the source, so the app CSS applies to it', async () => {
      await renderDnd(<DraggableWithPreview preview={<span data-testid="preview">x</span>} />);
      const source = screen.getByTestId('drag');
      source.getBoundingClientRect = () => new DOMRect(0, 0, 200, 100);

      fireDrag.dragStart(source);

      // The content is copied into the source's parent, where a cloned preview also
      // goes. A provider supplies the React tree but moves nothing.
      const preview = screen
        .getByTestId('preview')
        .closest('[data-base-ui-drag-preview]') as HTMLElement;
      expect(preview).not.toBeNull();
      expect(preview.parentElement).toBe(source.parentElement);
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

      fireDrag.dragStart(source);

      // `container` is the only thing that relocates a preview.
      const host = screen
        .getByTestId('preview')
        .closest('[data-base-ui-drag-preview]') as HTMLElement;
      expect(host.parentElement).toBe(screen.getByTestId('container'));
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

      fireDrag.dragStart(source);

      // The callback form reaches a container the caller has no ref to.
      const host = screen
        .getByTestId('preview')
        .closest('[data-base-ui-drag-preview]') as HTMLElement;
      expect(host.parentElement).toBe(screen.getByTestId('board'));
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

      fireDrag.dragStart(source);

      // The preview part configures the engine-built clone without custom content.
      const clone = document.querySelector('.Card[data-drag-preview]') as HTMLElement;
      expect(clone).not.toBeNull();
      expect(clone.parentElement).toBe(screen.getByTestId('container'));
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

      fireDrag.dragStart(source);

      const clone = document.querySelector('.Card[data-drag-preview]') as HTMLElement;
      expect(clone.parentElement).toBe(screen.getByTestId('late-container'));
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

      fireDrag.dragStart(source);

      expect(screen.getByTestId('preview')).toBeInTheDocument();
      // Exactly one preview. The declaration must replace the clone, not race it.
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

      const host = screen
        .getByTestId('preview')
        .closest('[data-base-ui-drag-preview]') as HTMLElement;
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

      fireDrag.dragStart(source);

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

        fireDrag.dragStart(source);

        expect(host.querySelector('[data-drag-preview]')).not.toBeNull();
      } finally {
        host.remove();
      }
    });

    it('injects custom preview content into an explicit preview.container', async () => {
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

        fireDrag.dragStart(source);

        expect(host.contains(screen.getByTestId('preview'))).toBe(true);
      } finally {
        host.remove();
      }
    });
  });

  describe('parts outside the root', () => {
    // A misplaced part throws instead of configuring nothing.
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
