import * as React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { act, screen, render as rawRender } from '@testing-library/react';
import { dragRegistrationConformanceTests, firePointer } from '#test-utils';
import { Draggable } from '@base-ui/react/draggable';
import { createDndRenderer, testDragKind } from '../../../test/dndEngine';
import {
  cancel,
  createElement,
  dragOver,
  flushRaf,
  lift,
  mockElementFromPoint,
  registerCleanup,
  setupDragEngineTests,
  fireDrag,
} from '../../../test/dnd';
import { dragSessionStore } from '../../utils/drag-and-drop/dragSessionStore';
import { getRegistration } from '../../utils/drag-and-drop/draggableRegistry';
import { CSPProvider } from '../../csp-provider';

setupDragEngineTests();

const POSITIONER = '[data-base-ui-drag-preview]';

function rtlRender(ui: React.ReactElement) {
  return rawRender(ui, { wrapper: Draggable.Provider });
}

/** Kind for the fixtures that carry a payload, so its type reaches their handlers. */
const cardKind = Draggable.createKind<{ id: string }>('card');

/** The engine sets `data-dragging`, so tests read `state.dragging` through `className`. */
function draggingClass(state: Draggable.Trigger.State) {
  return state.dragging ? 'dragging' : 'idle';
}

function TestDraggable<TPayload = undefined>(props: {
  options?: Partial<Draggable.Root.Props<TPayload>>;
  testId?: string;
}) {
  const { options, testId = 'drag' } = props;
  // `Draggable.Root` requires `payload` once `TPayload` is declared, but most
  // fixtures pass none, so widen the props type.
  const Root = Draggable.Root as React.ComponentType<any>;
  return (
    <Root kind={testDragKind} {...options}>
      <Draggable.Trigger data-testid={testId} className={draggingClass} />
    </Root>
  );
}

describe('Draggable.Root', () => {
  const { renderDnd } = createDndRenderer();

  dragRegistrationConformanceTests({
    render: renderDnd,
    createComponent: ({ key, onEvent, ...props }) => (
      <Draggable.Root
        key={key}
        kind={testDragKind}
        onMoveStart={(eventDetails) => onEvent?.(eventDetails.source.element)}
      >
        <Draggable.Trigger {...props} />
      </Draggable.Root>
    ),
    // The gesture styles are ref-counted, so they stay while any registration holds the node.
    isRegistered: (element) => element.style.touchAction === 'manipulation',
    async startDrag(element) {
      element.getBoundingClientRect = () => new DOMRect(0, 0, 200, 100);
      await lift(element);
    },
  });

  it('warns when a root has no kind inside a collision provider', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    try {
      await renderDnd(
        <Draggable.CollisionProvider kind={cardKind}>
          <Draggable.Root>
            <Draggable.Trigger />
          </Draggable.Root>
        </Draggable.CollisionProvider>,
      );
      expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('has no explicit kind'));
    } finally {
      warnSpy.mockRestore();
    }
  });

  it('applies the gesture styles once attached and restores them on unmount', async () => {
    const { unmount } = await renderDnd(<TestDraggable />);
    const el = screen.getByTestId('drag');
    // The engine applies gesture styles to the handle so a press can't select
    // text or fire the touch callout.
    expect(el.style.touchAction).toBe('manipulation');
    expect(el.style.userSelect).toBe('none');
    unmount();
    expect(el.style.touchAction).toBe('');
    expect(el.style.userSelect).toBe('');
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
        <Draggable.Trigger>
          <Draggable.Handle data-testid="handle" />
        </Draggable.Trigger>
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

  it('forwards a static payload value, keeping it off the DOM element', async () => {
    const tokenKind = Draggable.createKind<{ token: string }>('static-token');
    const onMoveStart = vi.fn();
    await renderDnd(
      <TestDraggable<{ token: string }>
        options={{ kind: tokenKind, payload: { token: 'abc' }, onMoveStart }}
      />,
    );
    const source = screen.getByTestId('drag');
    expect(source.hasAttribute('payload')).toBe(false);

    fireDrag.dragStart(source);
    await flushRaf();

    expect(onMoveStart).toHaveBeenCalledTimes(1);
    expect(onMoveStart.mock.calls[0][0].source.payload).toEqual({ token: 'abc' });
  });

  it('reuses the normalized parameters until a render changes them', async () => {
    const { rerender } = await renderDnd(<TestDraggable options={{ onMoveStart: vi.fn() }} />);
    const getParameters = getRegistration(screen.getByTestId('drag'))!;
    const firstParameters = getParameters();
    expect(getParameters()).toBe(firstParameters);

    await rerender(<TestDraggable options={{ onMoveStart: vi.fn() }} />);
    const secondParameters = getParameters();
    expect(secondParameters).not.toBe(firstParameters);
    expect(getParameters()).toBe(secondParameters);
  });

  it('keeps state.dragging true when the source node is swapped mid-drag', async () => {
    function Swappable({ swapped }: { swapped: boolean }) {
      // The key swaps the DOM node while the registration lives on.
      return (
        <Draggable.Root kind={testDragKind}>
          <Draggable.Trigger
            data-testid={swapped ? 'b' : 'a'}
            className={draggingClass}
            render={(props) => <div key={swapped ? 'b' : 'a'} {...props} />}
          />
        </Draggable.Root>
      );
    }

    const { rerender } = await renderDnd(<Swappable swapped={false} />);
    const first = screen.getByTestId('a');
    first.getBoundingClientRect = () => new DOMRect(0, 0, 200, 100);

    fireDrag.dragStart(first);
    await flushRaf();
    expect(first).toHaveClass('dragging');
    expect(dragSessionStore.getSnapshot()?.source.element).toBe(first);

    // The session must follow the new node, so `state.dragging` and closures
    // reading `source.element` see it.
    await rerender(<Swappable swapped />);
    const second = screen.getByTestId('b');
    expect(dragSessionStore.getSnapshot()?.source.element).toBe(second);
    expect(second).toHaveClass('dragging');
    expect(second).toHaveAttribute('data-dragging');
    expect(first).not.toHaveAttribute('data-dragging');
  });

  it('passes the swapped source node to modifiers mid-drag', async () => {
    const sourceElements: HTMLElement[] = [];
    const probe: Draggable.Root.Modifier = (context) => {
      sourceElements.push(context.sourceElement);
      return context.point;
    };
    function Swappable({ swapped }: { swapped: boolean }) {
      return (
        <Draggable.Root kind={testDragKind} modifiers={probe}>
          <Draggable.Trigger
            data-testid={swapped ? 'b' : 'a'}
            render={(props) => <div key={swapped ? 'b' : 'a'} {...props} />}
          />
        </Draggable.Root>
      );
    }

    const { rerender } = await renderDnd(<Swappable swapped={false} />);
    const first = screen.getByTestId('a');
    first.getBoundingClientRect = () => new DOMRect(0, 0, 200, 100);
    fireDrag.dragStart(first);
    await flushRaf();

    await rerender(<Swappable swapped />);
    const second = screen.getByTestId('b');
    // `fireDrag` dispatches on the first node, which is now detached.
    firePointer.move(second, {
      pointerType: 'mouse',
      pointerId: 1,
      clientX: 60,
      clientY: 60,
      buttons: 1,
      timeStamp: 100,
    });
    await flushRaf();

    expect(sourceElements.at(-1)).toBe(second);
  });

  it('keeps the drag through a disabled flip mid-drag and updates the gesture styles at once', async () => {
    const { rerender } = await renderDnd(
      <Draggable.Root kind={testDragKind}>
        <Draggable.Trigger data-testid="drag" />
      </Draggable.Root>,
    );
    const el = screen.getByTestId('drag');
    el.getBoundingClientRect = () => new DOMRect(0, 0, 200, 100);

    fireDrag.dragStart(el);
    await flushRaf();
    expect(dragSessionStore.getSnapshot()?.source.element).toBe(el);

    await rerender(
      <Draggable.Root kind={testDragKind} disabled>
        <Draggable.Trigger data-testid="drag" />
      </Draggable.Root>,
    );

    expect(dragSessionStore.getSnapshot()?.source.element).toBe(el);
    expect(el).toHaveAttribute('data-dragging');
    expect(el.style.userSelect).toBe('');
    expect(el.style.touchAction).toBe('');

    cancel();
    await flushRaf();

    expect(dragSessionStore.getSnapshot()).toBeNull();
    expect(el.style.userSelect).toBe('');
    expect(el.style.touchAction).toBe('');
  });

  it('survives a re-render mid-drag when `ref` has a new identity each time', async () => {
    // `useMergedRefs` rebuilds its callback when a ref's identity changes, so an
    // inline `ref` re-attaches the node every render, re-running the registration.
    const onMoveEnd = vi.fn();
    function Inline({ tick }: { tick: number }) {
      return (
        <Draggable.Root kind={testDragKind} onMoveEnd={onMoveEnd}>
          <Draggable.Trigger
            data-testid="drag"
            data-tick={tick}
            className={draggingClass}
            ref={(node) => {
              void node;
            }}
          />
        </Draggable.Root>
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

    // The clone shares the `data-testid`, so assert on the node captured before the drag.
    expect(source).toHaveAttribute('data-tick', '1');
    expect(source).toHaveClass('dragging');
    expect(source).toHaveAttribute('data-dragging');
    expect(source.style.userSelect).toBe('none');
    expect(dragSessionStore.getSnapshot()?.source.element).toBe(source);

    // Completing the drop proves re-registration didn't unbind the sensors.
    fireDrag.dragEnter(target);
    await dragOver(target);
    fireDrag.drop(target);
    await flushRaf();

    expect(onMoveEnd).toHaveBeenCalledTimes(1);
    expect(onMoveEnd.mock.calls[0][0].reason).toBe('drop');
    expect(onMoveEnd.mock.calls[0][0].target?.element).toBe(target);
    expect(source).toHaveClass('idle');
  });

  it('still lands the drop after the source unmounted mid-drag', async () => {
    const onMoveEnd = vi.fn();
    const onDrop = vi.fn();
    // No clone: with the source gone, it would have nothing to settle onto and
    // would outlive the test in a real browser.
    function Source({ mounted }: { mounted: boolean }) {
      return mounted ? (
        <Draggable.Root kind={testDragKind}>
          <Draggable.Trigger data-testid="drag"></Draggable.Trigger>
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
    // A list re-rendering on pickup can unmount the row being dragged.
    await rerender(<Source mounted={false} />);
    await flushRaf();

    // `fireDrag` dispatches on the detached source, so finish with raw pointer events.
    mockElementFromPoint(() => target);
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
    // Unmount restores the gesture styles. The session's temporary
    // `draggable="false"` stays until the session ends.
    expect(source.style.touchAction).toBe('');
    expect(source.style.userSelect).toBe('');

    // Unregistering the source doesn't end the session; the pointer is still down.
    expect(dragSessionStore.getSnapshot()?.source.element).toBe(source);
    expect(onMoveEnd).not.toHaveBeenCalled();

    cancel();
    await flushRaf();

    expect(dragSessionStore.getSnapshot()).toBeNull();
    expect(onMoveEnd).toHaveBeenCalledTimes(1);
    expect(onMoveEnd.mock.calls[0][0].target).toBeNull();
    expect(onMoveEnd.mock.calls[0][0].reason).toBe('escape-key');

    // The engine isn't stuck: a new draggable can start a drag.
    await renderDnd(<TestDraggable testId="next" />);
    const next = screen.getByTestId('next');
    next.getBoundingClientRect = () => new DOMRect(0, 0, 200, 100);

    await lift(next);

    expect(dragSessionStore.getSnapshot()?.source.element).toBe(next);
  });

  it('resolves className and style callbacks from the disabled and dragging state', async () => {
    const className = (state: Draggable.Trigger.State) =>
      [state.disabled ? 'is-disabled' : 'is-enabled', state.dragging ? 'is-dragging' : 'is-idle']
        .filter(Boolean)
        .join(' ');
    const style = (state: Draggable.Trigger.State) => ({
      opacity: state.dragging ? '0.5' : '1',
      cursor: state.disabled ? 'not-allowed' : 'grab',
    });
    const { rerender } = await renderDnd(
      <Draggable.Root kind={testDragKind}>
        <Draggable.Trigger data-testid="drag" className={className} style={style} />
      </Draggable.Root>,
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
      <Draggable.Root kind={testDragKind} disabled>
        <Draggable.Trigger data-testid="drag" className={className} style={style} />
      </Draggable.Root>,
    );

    expect(source).toHaveClass('is-disabled', 'is-idle');
    expect(source.style.cursor).toBe('not-allowed');
  });

  describe('configuration forwarding', () => {
    it('forwards activation to the sensor: a raised distance defers the pickup', async () => {
      const onMoveStart = vi.fn();
      await renderDnd(
        <Draggable.Root
          kind={testDragKind}
          activation={{ mouse: { type: 'distance', distance: 40 } }}
          onMoveStart={onMoveStart}
        >
          <Draggable.Trigger data-testid="drag" />
        </Draggable.Root>,
      );
      const el = screen.getByTestId('drag');
      el.getBoundingClientRect = () => new DOMRect(0, 0, 200, 100);

      // `lift` moves 6px, short of the 40px threshold.
      await lift(el, { expectNoDrag: true });
      expect(onMoveStart).not.toHaveBeenCalled();
      expect(dragSessionStore.getSnapshot()).toBeNull();
    });

    it('forwards activation to the sensor: immediate picks up with no travel', async () => {
      const onMoveStart = vi.fn();
      await renderDnd(
        <Draggable.Root
          kind={testDragKind}
          activation={{ type: 'immediate' }}
          onMoveStart={onMoveStart}
        >
          <Draggable.Trigger data-testid="drag" />
        </Draggable.Root>,
      );
      const el = screen.getByTestId('drag');
      el.getBoundingClientRect = () => new DOMRect(0, 0, 200, 100);

      // No movement: the default mouse activation would wait for 5px of travel.
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
      // Root-level modifiers apply to the committed input, which hit-testing and
      // the preview follow.
      const moves: Array<{ x: number; y: number }> = [];
      await renderDnd(
        <Draggable.Root
          kind={testDragKind}
          modifiers={Draggable.restrictToVerticalAxis}
          onMove={({ location }) => {
            moves.push({
              x: location.current.input.clientX,
              y: location.current.input.clientY,
            });
          }}
        >
          <Draggable.Trigger data-testid="drag" />
        </Draggable.Root>,
      );
      const el = screen.getByTestId('drag');
      el.getBoundingClientRect = () => new DOMRect(0, 0, 200, 100);

      await lift(el, { clientX: 100, clientY: 50 });
      await dragOver(el, { clientX: 180, clientY: 90 });
      // `onMove` is rAF-throttled on top of the sensor's frame, so the move
      // committed above is delivered one frame later.
      await flushRaf();

      expect(moves.length).toBeGreaterThan(0);
      // 106 is the drag-start x: the 100px press plus `lift`'s
      // `DRAG_ACTIVATION_DISTANCE_PX` move. The exact value catches a lock anchored
      // to the wrong point.
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
      await dragOver(target);

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
      await renderDnd(
        <Draggable.Root kind={testDragKind} dragCursor="copy">
          <Draggable.Trigger data-testid="drag" />
        </Draggable.Root>,
      );
      const el = screen.getByTestId('drag');
      el.getBoundingClientRect = () => new DOMRect(0, 0, 200, 100);

      await lift(el);
      // The cursor lock is deferred past the frame that paints the lift.
      await flushRaf();

      // The document-wide cursor rule is keyed on this class and variable.
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

      await renderDnd(
        <Draggable.Root kind={testDragKind}>
          <Draggable.Trigger data-testid="drag" />
        </Draggable.Root>,
        {
          wrapper: DynamicCSPProvider,
        },
      );
      const el = screen.getByTestId('drag');
      el.getBoundingClientRect = () => new DOMRect(0, 0, 200, 100);

      await lift(el);
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
        <Draggable.Root kind={testDragKind}>
          <Draggable.Trigger
            data-testid="drag"
            style={{ touchAction: 'pan-y', userSelect: 'text' }}
          />
        </Draggable.Root>,
      );
      const el = screen.getByTestId('drag');
      expect(el.style.touchAction).toBe('manipulation');
      expect(el.style.userSelect).toBe('none');

      await rerender(
        <Draggable.Root kind={testDragKind} disabled>
          <Draggable.Trigger
            data-testid="drag"
            style={{ touchAction: 'none', userSelect: 'auto' }}
          />
        </Draggable.Root>,
      );

      expect(el.style.touchAction).toBe('none');
      expect(el.style.userSelect).toBe('auto');
    });
  });

  describe('prop: previewKey', () => {
    it('settles the preview on a root remounted with the same previewKey', async () => {
      // A cross-container move remounts the card as a new React subtree with a new
      // payload object. `previewKey` connects the settling preview to the new node.
      vi.stubGlobal('BASE_UI_ANIMATIONS_DISABLED', false);
      registerCleanup(() => vi.unstubAllGlobals());
      function Card({ mountKey, payload }: { mountKey: string; payload: { id: string } }) {
        return (
          <Draggable.Root key={mountKey} kind={cardKind} payload={payload} previewKey="card-a">
            <Draggable.Trigger data-testid="drag">Card</Draggable.Trigger>
            <Draggable.Positioner>
              <Draggable.Preview />
            </Draggable.Positioner>
          </Draggable.Root>
        );
      }
      // The preview copies the test id, so query the live source explicitly.
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
      await dragOver(target);

      // An authored drop transition keeps the preview settling past the drop, on
      // whichever positioner shows it.
      let finishAnimation!: () => void;
      const finished = new Promise<void>((resolve) => {
        finishAnimation = resolve;
      });
      // Settle the preview even if an assertion fails, so it can't outlive this test.
      registerCleanup(() => finishAnimation());
      const animation = { effect: { getTiming: () => ({ iterations: 1 }) }, finished };
      const getAnimations = HTMLElement.prototype.getAnimations;
      HTMLElement.prototype.getAnimations = function mockGetAnimations(this: HTMLElement) {
        return (this.matches(POSITIONER) ? [animation] : []) as unknown as Animation[];
      };
      registerCleanup(() => {
        HTMLElement.prototype.getAnimations = getAnimations;
      });

      fireDrag.drop(target);
      expect(document.querySelector(POSITIONER)).not.toBeNull();
      expect(first).toHaveAttribute('data-dragging');

      await rerender(<Card mountKey="b" payload={{ id: 'a' }} />);
      const second = getSource();
      expect(second).not.toBe(first);
      expect(second).toHaveAttribute('data-dragging');
      expect(second).toHaveAttribute('data-settling');
      expect(first).not.toHaveAttribute('data-dragging');
      // The remounted root renders the preview again, which settles onto it.
      expect(document.querySelectorAll(POSITIONER)).toHaveLength(1);
      const positioner = document.querySelector(POSITIONER) as HTMLElement;

      await flushRaf();
      expect(positioner).toHaveAttribute('data-ending-style');
      expect(positioner.isConnected).toBe(true);
      await act(async () => {
        finishAnimation();
        await finished;
      });
      await flushRaf();
      expect(positioner.isConnected).toBe(false);
      expect(second).not.toHaveAttribute('data-dragging');
      expect(second).not.toHaveAttribute('data-settling');
    });
  });

  describe('parts outside the root', () => {
    // A misplaced part throws instead of configuring nothing.
    it.each([
      ['Draggable.Handle', <Draggable.Handle key="h" />],
      ['Draggable.Portal', <Draggable.Portal key="o" />],
      ['Draggable.Positioner', <Draggable.Positioner key="p" />],
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
