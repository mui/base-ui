import * as React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { act, fireEvent, screen } from '@testing-library/react';
import { createDndRenderer, describeConformance } from '#test-utils';
import { Draggable } from '@base-ui/react/draggable';
import {
  cancel,
  createElement,
  dragEnter,
  flushRaf,
  lift,
  registerCleanup,
  setupDragEngineTests,
  fireDrag,
} from '../../../test/dnd';
import { touchDown, touchUp } from '../../../test/syntheticPointer';
import { dragSessionStore } from '../../utils/drag-and-drop/dragSessionStore';
import type { DraggableTargetRecord } from './DraggableTarget';

setupDragEngineTests();

const cardKind = Draggable.createKind<{ id: string }>('card');
const columnKind = Draggable.createKind('column');
const itemKind = Draggable.createKind('item');
const slotKind = Draggable.createKind<{ id: string }>('slot');

describe('Draggable.Target', () => {
  const { renderDnd } = createDndRenderer();

  describeConformance(<Draggable.Target accept={Draggable.anyKind} />, () => ({
    refInstanceof: window.HTMLDivElement,
    render(node) {
      return renderDnd(node);
    },
  }));

  it('tracks hover on a replacement ref during a drag', async () => {
    function Swappable({ swapped }: { swapped: boolean }) {
      return (
        <Draggable.Target
          accept={Draggable.anyKind}
          data-testid={swapped ? 'b' : 'a'}
          render={(props) => <div key={swapped ? 'b' : 'a'} {...props} />}
        />
      );
    }
    const { engine, rerender } = await renderDnd(<Swappable swapped={false} />);
    const source = createElement();
    engine.registerSource(source, {});
    const first = screen.getByTestId('a');
    fireDrag.dragStart(source);
    fireDrag.dragEnter(first);
    await flushRaf();
    expect(first).toHaveAttribute('data-drag-over');

    await rerender(<Swappable swapped />);
    const second = screen.getByTestId('b');
    expect(first).not.toHaveAttribute('data-base-ui-drop-target');
    expect(second).toHaveAttribute('data-base-ui-drop-target');
    fireDrag.dragEnter(second);
    await flushRaf();
    expect(second).toHaveAttribute('data-drag-over');

    fireDrag.dragOver(source);
    await flushRaf();
    expect(second).not.toHaveAttribute('data-drag-over');
    fireDrag.dragEnter(second);
    await flushRaf();
    expect(second).toHaveAttribute('data-drag-over');
    fireDrag.dragEnd();
    expect(second).not.toHaveAttribute('data-drag-over');
  });

  it('warns when a target has a kind but no accept', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    try {
      await renderDnd(<Draggable.Target kind={columnKind} />);
      expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('has a `kind` but no `accept`'));
    } finally {
      warnSpy.mockRestore();
    }
  });

  it('does not warn when a target declares both kind and accept', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    try {
      await renderDnd(<Draggable.Target kind={columnKind} accept={cardKind} />);
      expect(warnSpy).not.toHaveBeenCalled();
    } finally {
      warnSpy.mockRestore();
    }
  });

  it('marks the element as a drop target once attached', async () => {
    await renderDnd(<Draggable.Target accept={Draggable.anyKind} data-testid="target" />);
    const el = screen.getByTestId('target');
    expect(el).toHaveAttribute('data-base-ui-drop-target', '');
  });

  it('removes the drop-target attribute on unmount', async () => {
    const { unmount } = await renderDnd(
      <Draggable.Target accept={Draggable.anyKind} data-testid="target" />,
    );
    const el = screen.getByTestId('target');
    unmount();
    expect(el).not.toHaveAttribute('data-base-ui-drop-target');
  });

  it('unregisters when its render component removes the element on its own', async () => {
    let hide = () => {};
    const Host = React.forwardRef(function Host(
      props: React.ComponentProps<'div'>,
      ref: React.ForwardedRef<HTMLDivElement>,
    ) {
      const [visible, setVisible] = React.useState(true);
      hide = () => setVisible(false);
      return visible ? <div ref={ref} {...props} /> : null;
    });
    await renderDnd(
      <Draggable.Target accept={Draggable.anyKind} data-testid="target" render={<Host />} />,
    );
    const el = screen.getByTestId('target');
    expect(el).toHaveAttribute('data-base-ui-drop-target', '');

    // Only `Host` re-renders, so the target's own layout effects don't run.
    await act(async () => hide());
    expect(el).not.toHaveAttribute('data-base-ui-drop-target');
  });

  it('does not forward engine parameters to the DOM element', async () => {
    await renderDnd(
      <Draggable.Target
        data-testid="target"
        kind={slotKind}
        accept={cardKind}
        payload={{ id: 'slot-1' }}
        trackDragOver={false}
        disabled
        canDrop={() => true}
        snap={{ y: 4 }}
        onDraggableDrop={() => {}}
      />,
    );
    const el = screen.getByTestId('target');
    // Engine parameters are destructured out, so they can't land as attributes.
    expect(el).not.toHaveAttribute('kind');
    expect(el).not.toHaveAttribute('accept');
    expect(el).not.toHaveAttribute('trackDragOver');
    expect(el).not.toHaveAttribute('disabled');
    expect(el).not.toHaveAttribute('payload');
    expect(el).not.toHaveAttribute('canDrop');
    expect(el).not.toHaveAttribute('snap');
  });

  it('forwards every engine parameter to the registration', async () => {
    // The component relists each parameter by hand into a cast object, so a dropped
    // entry is invisible to the type checker. `onDraggableStart` is absent here because
    // it only fires for a source nested inside the target. The next test covers it.
    const calls: string[] = [];
    const record = (name: string) => () => {
      calls.push(name);
    };
    let observed: { kind?: symbol; data?: unknown; snapped?: number } = {};

    const { engine } = await renderDnd(
      <Draggable.Target
        data-testid="target"
        kind={slotKind}
        accept={cardKind}
        canDrop={() => {
          calls.push('canDrop');
          return true;
        }}
        payload={{ id: 'slot-1' }}
        snap={() => {
          calls.push('snap');
          return { y: 4 };
        }}
        onDraggableMove={record('onMove')}
        onDraggableEnter={record('onDraggableEnter')}
        onDraggableLeave={record('onDraggableLeave')}
        onDraggableDrop={({ currentTarget }) => {
          calls.push('onDrop');
          observed = {
            kind: currentTarget.kind,
            data: currentTarget.payload.id,
            // 35 / 100 of the stub rect, quantized to 4 steps. The raw fraction
            // (0.35) here would mean `snap` never reached the registration.
            snapped: currentTarget.getSnappedLocalPoint().y,
          };
        }}
      />,
    );
    const source = createElement();
    engine.registerSource(source, { kind: cardKind, payload: { id: 'a' } });
    const target = screen.getByTestId('target');
    target.getBoundingClientRect = () => new DOMRect(0, 0, 200, 100);

    fireDrag.dragStart(source);
    await flushRaf();
    fireDrag.dragEnter(target, { clientY: 35 });
    fireDrag.dragOver(target, { clientY: 35 });
    await flushRaf();
    fireDrag.drop(target, { clientY: 35 });

    expect(observed.kind).toBe(slotKind.id);
    expect(observed.data).toBe('slot-1');
    expect(observed.snapped).toBe(0.25);
    // `onDraggableLeave` fires terminally on the drop, so the drop drives every entry.
    for (const name of [
      'canDrop',
      'snap',
      'onDraggableEnter',
      'onMove',
      'onDrop',
      'onDraggableLeave',
    ]) {
      expect(calls).toContain(name);
    }
  });

  it('receives onDraggableStart for a source nested inside it, and not for one outside', async () => {
    // A target only sees `onDraggableStart` when it is already in the stack as the
    // drag begins, which is the nested-source case.
    const nestedStart = vi.fn();
    const outsideStart = vi.fn();
    const { engine } = await renderDnd(
      <React.Fragment>
        <Draggable.Target
          accept={Draggable.anyKind}
          data-testid="wrapper"
          onDraggableStart={nestedStart}
        >
          <div data-testid="nested-source" />
        </Draggable.Target>
        <Draggable.Target
          accept={Draggable.anyKind}
          data-testid="elsewhere"
          onDraggableStart={outsideStart}
        />
      </React.Fragment>,
    );

    const wrapper = screen.getByTestId('wrapper');
    const nestedSource = screen.getByTestId('nested-source') as HTMLElement;
    wrapper.getBoundingClientRect = () => new DOMRect(0, 0, 200, 100);
    nestedSource.getBoundingClientRect = () => new DOMRect(0, 0, 200, 100);
    engine.registerSource(nestedSource, {
      kind: cardKind,
      payload: { id: 'a' },
      activation: { touch: { type: 'immediate' } },
    });

    // Raw pointer events rather than `fireDrag`, which starts every drag with
    // nothing under the pointer. This test needs a target under the pickup point.
    const hitTest = vi.spyOn(document, 'elementFromPoint').mockReturnValue(nestedSource);
    registerCleanup(() => hitTest.mockRestore());

    touchDown(nestedSource, 10, 10);
    await flushRaf();

    expect(nestedStart).toHaveBeenCalledTimes(1);
    const eventDetails = nestedStart.mock.calls[0][0];
    expect(eventDetails.source.element).toBe(nestedSource);
    expect(eventDetails.currentTarget.element).toBe(wrapper);
    // The unrelated target was never in the stack, so it saw nothing.
    expect(outsideStart).not.toHaveBeenCalled();

    touchUp(10, 10);
  });

  it('reports the target under the pickup point as `target` to the source and monitor onMoveStart', async () => {
    const { engine } = await renderDnd(
      <Draggable.Target accept={Draggable.anyKind} data-testid="pickup-target">
        <div data-testid="pickup-source" />
      </Draggable.Target>,
    );

    const wrapper = screen.getByTestId('pickup-target');
    const nestedSource = screen.getByTestId('pickup-source') as HTMLElement;
    wrapper.getBoundingClientRect = () => new DOMRect(0, 0, 200, 100);
    nestedSource.getBoundingClientRect = () => new DOMRect(0, 0, 200, 100);
    const sourceStart = vi.fn();
    const monitorStart = vi.fn();
    engine.registerSource(nestedSource, {
      kind: cardKind,
      payload: { id: 'a' },
      activation: { touch: { type: 'immediate' } },
      onMoveStart: sourceStart,
    });
    engine.registerMonitor({ onMoveStart: monitorStart });

    // Raw pointer events, because `fireDrag` starts every drag with nothing under the pointer.
    const hitTest = vi.spyOn(document, 'elementFromPoint').mockReturnValue(nestedSource);
    registerCleanup(() => hitTest.mockRestore());

    touchDown(nestedSource, 10, 10);
    await flushRaf();

    expect(sourceStart).toHaveBeenCalledTimes(1);
    const sourceDetails = sourceStart.mock.calls[0][0];
    expect(sourceDetails.target?.element).toBe(wrapper);
    expect(sourceDetails.target).toBe(sourceDetails.location.current.targets[0]);
    expect(monitorStart).toHaveBeenCalledTimes(1);
    expect(monitorStart.mock.calls[0][0].target?.element).toBe(wrapper);

    touchUp(10, 10);
  });

  it('fires onDraggableEnter and onDrop exactly once when mounted under Strict Mode', async () => {
    // Strict Mode double-invokes the registration effect (register → cleanup →
    // register). A leaked duplicate hold would run the callbacks once per hold.
    const onDraggableEnter = vi.fn();
    const onDrop = vi.fn();
    const { engine } = await renderDnd(
      <React.StrictMode>
        <Draggable.Target
          accept={Draggable.anyKind}
          data-testid="target"
          onDraggableEnter={onDraggableEnter}
          onDraggableDrop={onDrop}
        />
      </React.StrictMode>,
    );
    const source = createElement();
    engine.registerSource(source, {});
    const target = screen.getByTestId('target');
    target.getBoundingClientRect = () => new DOMRect(0, 0, 200, 100);

    fireDrag.dragStart(source);
    await flushRaf();
    fireDrag.dragEnter(target);
    fireDrag.dragOver(target);
    await flushRaf();
    fireDrag.drop(target);

    expect(onDraggableEnter).toHaveBeenCalledTimes(1);
    expect(onDrop).toHaveBeenCalledTimes(1);
  });

  it('resolves the new params when a hovered target remounts with changed params in one commit', async () => {
    // A key swap and a param change land in the same commit. The new node
    // registers mid-drag, and the refresh that resolves it must read the new
    // render's params, not the previous ones.
    const enterBefore = vi.fn();
    const enterAfter = vi.fn();
    const log: string[] = [];
    function Fixture({ swapped }: { swapped: boolean }) {
      return (
        <Draggable.Target
          accept={Draggable.anyKind}
          key={swapped ? 'after' : 'before'}
          data-testid="target"
          payload={{ id: swapped ? 'after' : 'before' }}
          onDraggableEnter={(eventDetails) => {
            log.push(`enter:${(eventDetails.currentTarget.payload as any).id}`);
            (swapped ? enterAfter : enterBefore)(eventDetails);
          }}
          onDraggableLeave={(eventDetails) =>
            log.push(`leave:${(eventDetails.currentTarget.payload as any).id}`)
          }
        />
      );
    }

    const { rerender, engine } = await renderDnd(<Fixture swapped={false} />);
    const source = createElement();
    engine.registerSource(source, {});
    const first = screen.getByTestId('target');
    first.getBoundingClientRect = () => new DOMRect(0, 0, 200, 100);

    fireDrag.dragStart(source);
    await flushRaf();
    fireDrag.dragEnter(first);
    fireDrag.dragOver(first);
    await flushRaf();
    expect(enterBefore).toHaveBeenCalledTimes(1);
    expect(first).toHaveAttribute('data-drag-over');

    // `fireDrag`'s hit test latches the exact node the last drag step named,
    // which is about to be unmounted. Re-point it at whichever node currently
    // renders the testid so the mid-drag refresh resolves the remounted element.
    const seen: Element[] = [];
    const hitTest = vi.spyOn(document, 'elementFromPoint').mockImplementation(() => {
      const el = screen.queryByTestId('target');
      if (el && el !== first && !seen.includes(el)) {
        seen.push(el);
      }
      return el;
    });
    registerCleanup(() => hitTest.mockRestore());

    await rerender(<Fixture swapped />);
    await flushRaf();

    const second = screen.getByTestId('target');
    expect(second).not.toBe(first);
    // The next event reads the new render's params, not the previous ones.
    expect(enterAfter).toHaveBeenCalledTimes(1);
    const eventDetails = enterAfter.mock.calls[0][0];
    expect(eventDetails.currentTarget.element).toBe(second);
    expect(eventDetails.currentTarget.payload).toEqual({ id: 'after' });
    // The old node is unmounted. React never updates a detached node's attributes,
    // so the test can only assert that it is disconnected.
    expect(first.isConnected).toBe(false);
    expect(second).toHaveAttribute('data-drag-over');

    fireDrag.drop(second);
  });

  it('releases outside when the hovered target unmounted before the drop', async () => {
    const onDrop = vi.fn();
    const onMoveEnd = vi.fn();
    function Fixture({ mounted }: { mounted: boolean }) {
      return mounted ? (
        <Draggable.Target
          accept={Draggable.anyKind}
          data-testid="target"
          onDraggableDrop={onDrop}
        />
      ) : null;
    }
    const { rerender, engine } = await renderDnd(<Fixture mounted />);
    const source = createElement();
    engine.registerSource(source, {});
    engine.registerMonitor({ onMoveEnd });
    const target = screen.getByTestId('target');
    target.getBoundingClientRect = () => new DOMRect(0, 0, 200, 100);

    fireDrag.dragStart(source);
    await flushRaf();
    fireDrag.dragEnter(target);
    fireDrag.dragOver(target);
    await flushRaf();
    expect(target).toHaveAttribute('data-drag-over');

    // A virtualizer recycles the hovered row, and the pointer releases where it was.
    await rerender(<Fixture mounted={false} />);
    await flushRaf();
    fireDrag.drop(document.body);

    expect(onDrop).not.toHaveBeenCalled();
    expect(onMoveEnd).toHaveBeenCalledTimes(1);
    expect(onMoveEnd.mock.calls[0][0].reason).toBe('outside-release');
    expect(onMoveEnd.mock.calls[0][0].target).toBeNull();
  });

  it('fires consumer callbacks with stable references across re-renders', async () => {
    const firstOnDragEnter = vi.fn();
    const secondOnDragEnter = vi.fn();
    const { rerender, engine } = await renderDnd(
      <Draggable.Target
        accept={Draggable.anyKind}
        data-testid="target"
        onDraggableEnter={firstOnDragEnter}
      />,
    );
    const source = createElement();
    engine.registerSource(source, {});
    const target = screen.getByTestId('target');
    target.getBoundingClientRect = () => new DOMRect(0, 0, 200, 100);

    await rerender(
      <Draggable.Target
        accept={Draggable.anyKind}
        data-testid="target"
        onDraggableEnter={secondOnDragEnter}
      />,
    );

    fireDrag.dragStart(source);
    await flushRaf();
    fireDrag.dragEnter(target);
    fireDrag.dragOver(target);
    await flushRaf();

    expect(firstOnDragEnter).not.toHaveBeenCalled();
    expect(secondOnDragEnter).toHaveBeenCalledTimes(1);

    fireDrag.drop(target);
  });

  it('does not expose parameters from a suspended render', async () => {
    const committedCanDrop = vi.fn(() => true);
    const suspendedCanDrop = vi.fn(() => false);
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
            <Draggable.Target
              accept={Draggable.anyKind}
              canDrop={suspend ? suspendedCanDrop : committedCanDrop}
              data-testid="target"
            />
            {suspend && <SuspendingChild />}
          </React.Suspense>
        </React.Fragment>
      );
    }

    const { engine } = await renderDnd(<App />);
    const source = createElement();
    engine.registerSource(source, {});
    const target = screen.getByTestId('target');
    target.getBoundingClientRect = () => new DOMRect(0, 0, 200, 100);

    fireEvent.click(screen.getByRole('button', { name: 'Suspend update' }));
    await act(async () => Promise.resolve());
    expect(suspendedRender).toHaveBeenCalled();

    fireDrag.dragStart(source);
    await flushRaf();
    fireDrag.dragEnter(target);
    await flushRaf();

    expect(committedCanDrop).toHaveBeenCalled();
    expect(suspendedCanDrop).not.toHaveBeenCalled();
    fireDrag.drop(target);
  });

  it('fires onDraggableLeave when a hovered target unregisters mid-drag', async () => {
    const onDraggableEnter = vi.fn();
    const onDraggableLeave = vi.fn();
    const { rerender, engine } = await renderDnd(
      <Draggable.Target
        accept={Draggable.anyKind}
        data-testid="target"
        onDraggableEnter={onDraggableEnter}
        onDraggableLeave={onDraggableLeave}
      />,
    );
    const source = createElement();
    engine.registerSource(source, {});
    const target = screen.getByTestId('target');
    target.getBoundingClientRect = () => new DOMRect(0, 0, 200, 100);

    fireDrag.dragStart(source);
    await flushRaf();
    fireDrag.dragEnter(target);
    fireDrag.dragOver(target);
    await flushRaf();
    expect(onDraggableEnter).toHaveBeenCalledTimes(1);

    // Unmount the hovered target mid-drag, as a virtualizer recycling its row would.
    // The leave must still fire while the target's registry entry is removed. The
    // registration is kept until after the re-resolve for this reason.
    await rerender(<div data-testid="placeholder" />);

    expect(onDraggableLeave).toHaveBeenCalledTimes(1);

    cancel();
  });

  it('keeps a hovered target registered when an inline ref changes identity', async () => {
    // A new ref callback on every render makes React detach and re-attach the
    // same node. Re-registering it would make the target leave and re-enter, and
    // handlers that set state would re-render with another new ref, forever.
    const onDraggableEnter = vi.fn();
    const onDraggableLeave = vi.fn();
    function Slot() {
      const [over, setOver] = React.useState(false);
      return (
        <Draggable.Target
          accept={Draggable.anyKind}
          data-testid="target"
          data-over={over}
          ref={() => {}}
          onDraggableEnter={() => {
            onDraggableEnter();
            // Bounded, so a regression fails the assertions below instead of hanging.
            if (onDraggableEnter.mock.calls.length < 20) {
              setOver(true);
            }
          }}
          onDraggableLeave={() => {
            onDraggableLeave();
            if (onDraggableLeave.mock.calls.length < 20) {
              setOver(false);
            }
          }}
        />
      );
    }
    const { engine } = await renderDnd(<Slot />);
    const source = createElement();
    engine.registerSource(source, {});
    const target = screen.getByTestId('target');
    target.getBoundingClientRect = () => new DOMRect(0, 0, 200, 100);

    await lift(source);
    await dragEnter(target);
    await flushRaf();
    expect(onDraggableEnter).toHaveBeenCalledTimes(1);
    expect(onDraggableLeave).not.toHaveBeenCalled();
    expect(target).toHaveAttribute('data-over', 'true');
    expect(target).toHaveAttribute('data-drag-over');

    fireDrag.dragLeave();
    await flushRaf();
    expect(onDraggableLeave).toHaveBeenCalledTimes(1);
    expect(target).toHaveAttribute('data-over', 'false');
    expect(target).not.toHaveAttribute('data-drag-over');
    cancel();
  });

  it('a drop target registered under the pointer mid-drag joins the active stack', async () => {
    // The registration-time refresh is coalesced to a microtask (one stack
    // re-resolve per commit, not per registered target), so the new target must
    // still be in the stack once the tick flushes.
    const { engine } = await renderDnd();
    const source = createElement();
    engine.registerSource(source, {});
    const outer = createElement();
    const inner = document.createElement('div');
    outer.appendChild(inner);
    engine.registerTarget(outer, {});

    fireDrag.dragStart(source);
    await flushRaf();
    fireDrag.dragEnter(inner);
    fireDrag.dragOver(inner);
    await flushRaf();

    // Only the outer target is registered so far.
    expect(dragSessionStore.getSnapshot()?.location.current.targets[0]?.element).toBe(outer);

    // The inner target registers mid-drag, under the pointer.
    engine.registerTarget(inner, {});
    await flushRaf();

    expect(dragSessionStore.getSnapshot()?.location.current.targets[0]?.element).toBe(inner);

    fireDrag.drop(inner);
  });

  it('a hovered target disabled mid-drag leaves the stack without pointer movement, and re-enters on re-enable', async () => {
    // A `disabled` flip schedules an eager drop-target refresh from a layout
    // effect. With a stationary pointer there is no next move to re-resolve on,
    // so the flip itself must deliver the leave, and the re-enable the enter.
    const onDraggableEnter = vi.fn();
    const onDraggableLeave = vi.fn();
    function Fixture({ disabled }: { disabled?: boolean }) {
      return (
        <Draggable.Target
          accept={Draggable.anyKind}
          data-testid="target"
          disabled={disabled}
          onDraggableEnter={onDraggableEnter}
          onDraggableLeave={onDraggableLeave}
        />
      );
    }

    const { rerender, engine } = await renderDnd(<Fixture />);
    const source = createElement();
    engine.registerSource(source, {});
    const target = screen.getByTestId('target');
    target.getBoundingClientRect = () => new DOMRect(0, 0, 200, 100);

    fireDrag.dragStart(source);
    await flushRaf();
    fireDrag.dragEnter(target);
    fireDrag.dragOver(target);
    await flushRaf();
    expect(onDraggableEnter).toHaveBeenCalledTimes(1);
    expect(target).toHaveAttribute('data-drag-over');

    // Disable while hovered. No pointer event follows.
    await rerender(<Fixture disabled />);

    expect(onDraggableLeave).toHaveBeenCalledTimes(1);
    expect(target).not.toHaveAttribute('data-drag-over');
    expect(target).not.toHaveAttribute('data-drag-over-innermost');

    // Re-enable. The pointer never left, so the eager refresh re-enters it.
    await rerender(<Fixture />);

    expect(onDraggableEnter).toHaveBeenCalledTimes(2);
    expect(target).toHaveAttribute('data-drag-over');

    fireDrag.drop(target);
  });

  it('a hovered target whose accept narrows mid-drag leaves the stack without pointer movement', async () => {
    // Like the `disabled` flip above. `accept` is declarative and comparable, so
    // narrowing it away from the live source under a stationary pointer must
    // deliver the leave now. Otherwise the target would advertise a valid drop
    // until an `outside-release` at drop time. `accept` is compared by content,
    // so a new inline array on every render doesn't churn the stack.
    const onDraggableEnter = vi.fn();
    const onDraggableLeave = vi.fn();
    function Fixture({
      accepted,
      revision = 0,
    }: {
      accepted: 'both' | 'columnOnly';
      revision?: number;
    }) {
      return (
        <Draggable.Target
          accept={accepted === 'both' ? [cardKind, columnKind] : [columnKind]}
          data-testid="target"
          data-revision={revision}
          onDraggableEnter={onDraggableEnter}
          onDraggableLeave={onDraggableLeave}
        />
      );
    }

    const { rerender, engine } = await renderDnd(<Fixture accepted="both" />);
    const source = createElement();
    engine.registerSource(source, { kind: cardKind });
    const target = screen.getByTestId('target');
    target.getBoundingClientRect = () => new DOMRect(0, 0, 200, 100);

    fireDrag.dragStart(source);
    await flushRaf();
    fireDrag.dragEnter(target);
    fireDrag.dragOver(target);
    await flushRaf();
    expect(onDraggableEnter).toHaveBeenCalledTimes(1);
    expect(target).toHaveAttribute('data-drag-over');

    // A normal rerender allocates a new inline array with the same contents.
    // It must not churn the live target stack.
    await rerender(<Fixture accepted="both" revision={1} />);
    expect(onDraggableEnter).toHaveBeenCalledTimes(1);
    expect(onDraggableLeave).not.toHaveBeenCalled();
    expect(target).toHaveAttribute('data-drag-over');

    // Narrow `accept` while hovered. No pointer event follows.
    await rerender(<Fixture accepted="columnOnly" revision={1} />);

    expect(onDraggableLeave).toHaveBeenCalledTimes(1);
    expect(target).not.toHaveAttribute('data-drag-over');

    // Widen it back. The pointer never left, so the eager refresh re-enters it.
    await rerender(<Fixture accepted="both" revision={1} />);

    expect(onDraggableEnter).toHaveBeenCalledTimes(2);
    expect(target).toHaveAttribute('data-drag-over');

    fireDrag.drop(target);
  });

  it('data-drag-over-innermost is absent on the outer target while a nested target is active', async () => {
    const { engine } = await renderDnd(
      <Draggable.Target accept={Draggable.anyKind} data-testid="outer">
        <Draggable.Target accept={Draggable.anyKind} data-testid="inner" />
      </Draggable.Target>,
    );
    const source = createElement();
    engine.registerSource(source, {});
    const outer = screen.getByTestId('outer');
    const inner = screen.getByTestId('inner');
    outer.getBoundingClientRect = () => new DOMRect(0, 0, 200, 200);
    inner.getBoundingClientRect = () => new DOMRect(50, 50, 100, 100);

    fireDrag.dragStart(source);
    await flushRaf();

    // Over the outer only.
    fireDrag.dragEnter(outer);
    fireDrag.dragOver(outer);
    await flushRaf();

    expect(outer).toHaveAttribute('data-drag-over');
    expect(outer).toHaveAttribute('data-drag-over-innermost');
    expect(inner).not.toHaveAttribute('data-drag-over');

    // Now over the inner target, nested inside the outer. The outer stays `over`
    // but is no longer the innermost active target.
    fireDrag.dragEnter(inner);
    fireDrag.dragOver(inner);
    await flushRaf();

    expect(outer).toHaveAttribute('data-drag-over');
    expect(outer).not.toHaveAttribute('data-drag-over-innermost');
    expect(inner).toHaveAttribute('data-drag-over');
    expect(inner).toHaveAttribute('data-drag-over-innermost');

    // Back out to the outer only. It becomes innermost again, and the inner
    // loses its drag-over state.
    fireDrag.dragEnter(outer);
    fireDrag.dragOver(outer);
    await flushRaf();

    expect(outer).toHaveAttribute('data-drag-over');
    expect(outer).toHaveAttribute('data-drag-over-innermost');
    expect(inner).not.toHaveAttribute('data-drag-over');
    expect(inner).not.toHaveAttribute('data-drag-over-innermost');

    fireDrag.drop(outer);
  });

  describe('target and currentTarget', () => {
    async function renderNestedTargets() {
      const handlers = {
        outerEnter: vi.fn(),
        outerMove: vi.fn(),
        outerLeave: vi.fn(),
        innerEnter: vi.fn(),
        innerMove: vi.fn(),
        innerLeave: vi.fn(),
        innerDrop: vi.fn(),
      };
      const { engine } = await renderDnd(
        <Draggable.Target
          accept={Draggable.anyKind}
          data-testid="outer"
          payload="outer"
          onDraggableEnter={handlers.outerEnter}
          onDraggableMove={handlers.outerMove}
          onDraggableLeave={handlers.outerLeave}
        >
          <Draggable.Target
            accept={Draggable.anyKind}
            data-testid="inner"
            payload="inner"
            onDraggableEnter={handlers.innerEnter}
            onDraggableMove={handlers.innerMove}
            onDraggableLeave={handlers.innerLeave}
            onDraggableDrop={handlers.innerDrop}
          />
        </Draggable.Target>,
      );
      const source = createElement();
      engine.registerSource(source, {});
      return {
        handlers,
        source,
        outer: screen.getByTestId('outer'),
        inner: screen.getByTestId('inner'),
      };
    }

    it('reports the innermost target as `target` and the handling target as `currentTarget`', async () => {
      const { handlers, source, outer, inner } = await renderNestedTargets();

      await lift(source);
      await dragEnter(inner);

      const outerEnter = handlers.outerEnter.mock.calls[0][0];
      expect(outerEnter.target.element).toBe(inner);
      expect(outerEnter.target.payload).toBe('inner');
      expect(outerEnter.currentTarget.element).toBe(outer);
      expect(outerEnter.currentTarget.payload).toBe('outer');
      const outerMove = handlers.outerMove.mock.lastCall![0];
      expect(outerMove.target.element).toBe(inner);
      expect(outerMove.currentTarget.element).toBe(outer);
      // The same record the source and the monitors receive as `target`.
      expect(outerMove.target).toBe(outerMove.location.current.targets[0]);

      const innerEnter = handlers.innerEnter.mock.calls[0][0];
      expect(innerEnter.target.element).toBe(inner);
      expect(innerEnter.currentTarget.element).toBe(inner);
      const innerMove = handlers.innerMove.mock.lastCall![0];
      expect(innerMove.target.element).toBe(inner);
      expect(innerMove.currentTarget.element).toBe(inner);

      cancel();
    });

    it('reports the target that received the drop as both `target` and `currentTarget`', async () => {
      const { handlers, source, inner } = await renderNestedTargets();

      await lift(source);
      await dragEnter(inner);
      fireDrag.drop(inner);

      expect(handlers.innerDrop).toHaveBeenCalledTimes(1);
      const details = handlers.innerDrop.mock.calls[0][0];
      expect(details.currentTarget.element).toBe(inner);
      expect(details.target).toBe(details.currentTarget);
    });

    it('reports the target still under the pointer as `target` on a leave', async () => {
      const { handlers, source, outer, inner } = await renderNestedTargets();

      await lift(source);
      await dragEnter(inner);
      await dragEnter(outer);

      expect(handlers.innerLeave).toHaveBeenCalledTimes(1);
      const details = handlers.innerLeave.mock.calls[0][0];
      expect(details.target.element).toBe(outer);
      expect(details.currentTarget.element).toBe(inner);

      cancel();
    });

    it('reports a `null` target on the leave that ends a canceled drag', async () => {
      const { handlers, source, outer, inner } = await renderNestedTargets();

      await lift(source);
      await dragEnter(inner);
      // Cancel while both targets are hovered, so each gets its terminal leave.
      fireDrag.dragEnd();

      expect(handlers.outerLeave).toHaveBeenCalledTimes(1);
      const outerLeave = handlers.outerLeave.mock.calls[0][0];
      expect(outerLeave.reason).toBe('escape-key');
      expect(outerLeave.target).toBeNull();
      expect(outerLeave.currentTarget.element).toBe(outer);
      expect(handlers.innerLeave).toHaveBeenCalledTimes(1);
      const innerLeave = handlers.innerLeave.mock.calls[0][0];
      expect(innerLeave.target).toBeNull();
      expect(innerLeave.currentTarget.element).toBe(inner);
    });
  });

  it('flips drag-over state off and fires onDraggableLeave when the pointer leaves for empty space, then re-enters', async () => {
    const onDraggableEnter = vi.fn();
    const onDraggableLeave = vi.fn();
    const { engine } = await renderDnd(
      <Draggable.Target
        accept={Draggable.anyKind}
        data-testid="target"
        onDraggableEnter={onDraggableEnter}
        onDraggableLeave={onDraggableLeave}
      />,
    );
    const source = createElement();
    engine.registerSource(source, {});
    const target = screen.getByTestId('target');
    target.getBoundingClientRect = () => new DOMRect(0, 0, 200, 100);

    fireDrag.dragStart(source);
    await flushRaf();
    fireDrag.dragEnter(target);
    fireDrag.dragOver(target);
    await flushRaf();
    expect(onDraggableEnter).toHaveBeenCalledTimes(1);
    expect(target).toHaveAttribute('data-drag-over');
    expect(target).toHaveAttribute('data-drag-over-innermost');

    // Off the target into empty space. The drag stays live with no hovered target.
    fireDrag.dragLeave();
    await flushRaf();

    expect(onDraggableLeave).toHaveBeenCalledTimes(1);
    expect(target).not.toHaveAttribute('data-drag-over');
    expect(target).not.toHaveAttribute('data-drag-over-innermost');

    // Back onto the same target. This is a new enter, not a resumed hover.
    fireDrag.dragEnter(target);
    fireDrag.dragOver(target);
    await flushRaf();

    expect(onDraggableEnter).toHaveBeenCalledTimes(2);
    expect(target).toHaveAttribute('data-drag-over');
    expect(target).toHaveAttribute('data-drag-over-innermost');

    fireDrag.drop(target);
  });

  it('lets canDrop accept only part of the target through its local point', async () => {
    // Only the top half of the target takes the drop. The pointer lands on its
    // element either way, so the local point is what tells the halves apart.
    const { engine } = await renderDnd(
      <Draggable.Target
        accept={Draggable.anyKind}
        data-testid="target"
        snap={{ y: 4 }}
        canDrop={(context) =>
          context.getLocalPoint().y < 0.5 && context.getSnappedLocalPoint().y <= 0.5
        }
      />,
    );
    const source = createElement();
    engine.registerSource(source, {});
    const target = screen.getByTestId('target');
    target.getBoundingClientRect = () => new DOMRect(0, 0, 200, 100);

    fireDrag.dragStart(source);
    fireDrag.dragEnter(target, { clientY: 20 });
    fireDrag.dragOver(target, { clientY: 20 });
    await flushRaf();
    expect(target).toHaveAttribute('data-drag-over');

    fireDrag.dragOver(target, { clientY: 80 });
    await flushRaf();
    expect(target).not.toHaveAttribute('data-drag-over');

    fireDrag.drop(target, { clientY: 80 });
  });

  it('reflects a rejecting canDrop as data-rejected while hovered, and clears it on leave', async () => {
    // A rejection leaves the stack empty before and after, so `data-rejected`
    // relies on the session publishing the flip on its own.
    const { engine } = await renderDnd(
      <Draggable.Target
        accept={Draggable.anyKind}
        data-testid="target"
        canDrop={() => 'reject'}
        className={(state) => (state.rejected ? 'rejected' : 'open')}
      />,
    );
    const source = createElement();
    engine.registerSource(source, {});
    const target = screen.getByTestId('target');
    target.getBoundingClientRect = () => new DOMRect(0, 0, 200, 100);

    fireDrag.dragStart(source);
    await flushRaf();
    expect(target).not.toHaveAttribute('data-rejected');
    expect(target).toHaveClass('open');

    fireDrag.dragEnter(target);
    fireDrag.dragOver(target);
    await flushRaf();
    expect(target).toHaveAttribute('data-rejected');
    expect(target).toHaveClass('rejected');
    expect(target).not.toHaveAttribute('data-drag-over');

    fireDrag.dragLeave();
    await flushRaf();
    expect(target).not.toHaveAttribute('data-rejected');
    expect(target).toHaveClass('open');

    // Still rejecting on re-entry, and cleared with the drag.
    fireDrag.dragEnter(target);
    fireDrag.dragOver(target);
    await flushRaf();
    expect(target).toHaveAttribute('data-rejected');

    fireDrag.drop(target);
    expect(target).not.toHaveAttribute('data-rejected');
  });

  it('re-resolves a stationary hovered target when canDrop changes', async () => {
    const onDraggableEnter = vi.fn();
    const onDraggableLeave = vi.fn();
    function Fixture({ allowed }: { allowed: boolean }) {
      return (
        <Draggable.Target
          accept={Draggable.anyKind}
          data-testid="target"
          canDrop={() => allowed}
          onDraggableEnter={onDraggableEnter}
          onDraggableLeave={onDraggableLeave}
        />
      );
    }

    const { rerender, engine } = await renderDnd(<Fixture allowed />);
    const source = createElement();
    engine.registerSource(source, {});
    const target = screen.getByTestId('target');
    target.getBoundingClientRect = () => new DOMRect(0, 0, 200, 100);

    fireDrag.dragStart(source);
    await flushRaf();
    fireDrag.dragEnter(target);
    fireDrag.dragOver(target);
    await flushRaf();
    expect(target).toHaveAttribute('data-drag-over');

    const hitTest = vi.spyOn(document, 'elementFromPoint').mockReturnValue(null);
    await rerender(<Fixture allowed={false} />);
    // A parameter-only refresh must re-resolve from the last event target. A
    // new hit test can observe layout changed by an onMove state update and
    // recursively enter another target during the same React commit.
    expect(hitTest).not.toHaveBeenCalled();
    expect(onDraggableLeave).toHaveBeenCalledTimes(1);
    expect(target).not.toHaveAttribute('data-drag-over');

    await rerender(<Fixture allowed />);
    expect(onDraggableEnter).toHaveBeenCalledTimes(2);
    expect(target).toHaveAttribute('data-drag-over');
  });

  it('does not resolve the active stack when only an unrelated target changes', async () => {
    const canDrop = vi.fn(() => true);
    function Fixture({ allowed }: { allowed: boolean }) {
      return (
        <React.Fragment>
          <Draggable.Target accept={Draggable.anyKind} data-testid="active" canDrop={canDrop} />
          <Draggable.Target accept={Draggable.anyKind} canDrop={() => allowed} />
        </React.Fragment>
      );
    }
    const { rerender, engine } = await renderDnd(<Fixture allowed />);
    const source = createElement();
    engine.registerSource(source, {});
    const target = screen.getByTestId('active');
    fireDrag.dragStart(source);
    await flushRaf();
    fireDrag.dragEnter(target);
    fireDrag.dragOver(target);
    await flushRaf();

    canDrop.mockClear();
    await rerender(<Fixture allowed={false} />);
    expect(canDrop).not.toHaveBeenCalled();
    fireDrag.drop(target);
  });

  it('coalesces inline canDrop changes from one render into one resolution', async () => {
    const canDrop = vi.fn(() => true);
    function Fixture({ revision }: { revision: number }) {
      return (
        <div data-revision={revision}>
          {Array.from({ length: 20 }, (_, index) => (
            <Draggable.Target
              key={index}
              accept={Draggable.anyKind}
              data-testid={`target-${index}`}
              canDrop={() => canDrop()}
            />
          ))}
        </div>
      );
    }

    const { rerender, engine } = await renderDnd(<Fixture revision={0} />);
    const source = createElement();
    engine.registerSource(source, {});
    const target = screen.getByTestId('target-0');

    fireDrag.dragStart(source);
    await flushRaf();
    fireDrag.dragEnter(target);
    fireDrag.dragOver(target);
    await flushRaf();

    canDrop.mockClear();
    await rerender(<Fixture revision={1} />);

    expect(canDrop).toHaveBeenCalledTimes(1);
    fireDrag.drop(target);
  });

  it('does not re-render on drag activity when trackDragOver is false', async () => {
    // Count renders inside each target. A function `className` runs on every
    // render of the Draggable.Target itself, where the drag-over subscription
    // lives. A spy in a parent component would miss store-driven re-renders.
    const trackedRenders = vi.fn(() => 'tracked');
    const untrackedRenders = vi.fn(() => 'untracked');
    const { engine } = await renderDnd(
      <React.Fragment>
        <Draggable.Target
          accept={Draggable.anyKind}
          data-testid="tracked"
          className={trackedRenders}
        />
        <Draggable.Target
          accept={Draggable.anyKind}
          trackDragOver={false}
          data-testid="untracked"
          className={untrackedRenders}
        />
      </React.Fragment>,
    );
    const source = createElement();
    engine.registerSource(source, {});
    const tracked = screen.getByTestId('tracked');
    const untracked = screen.getByTestId('untracked');
    tracked.getBoundingClientRect = () => new DOMRect(0, 0, 200, 100);
    untracked.getBoundingClientRect = () => new DOMRect(0, 100, 200, 100);

    const trackedBefore = trackedRenders.mock.calls.length;
    const untrackedBefore = untrackedRenders.mock.calls.length;

    fireDrag.dragStart(source);
    await flushRaf();
    fireDrag.dragEnter(tracked);
    fireDrag.dragOver(tracked);
    await flushRaf();

    // The tracked target re-renders for its own enter...
    expect(trackedRenders.mock.calls.length).toBeGreaterThan(trackedBefore);

    // ...while the untracked target's constant selector never flips, even across
    // its own enter and the drop.
    fireDrag.dragEnter(untracked);
    fireDrag.dragOver(untracked);
    await flushRaf();
    fireDrag.drop(untracked);

    expect(untrackedRenders.mock.calls.length).toBe(untrackedBefore);
  });

  it('does not re-render a tracked target when its accepting state stays false', async () => {
    const acceptingRenders = vi.fn(() => 'accepting');
    const rejectingRenders = vi.fn(() => 'rejecting');
    const { engine } = await renderDnd(
      <React.Fragment>
        <Draggable.Target accept={cardKind} className={acceptingRenders} />
        <Draggable.Target accept={columnKind} className={rejectingRenders} />
      </React.Fragment>,
    );
    const source = createElement();
    engine.registerSource(source, { kind: cardKind });
    const acceptingBefore = acceptingRenders.mock.calls.length;
    const rejectingBefore = rejectingRenders.mock.calls.length;

    fireDrag.dragStart(source);
    await flushRaf();

    expect(acceptingRenders.mock.calls.length).toBeGreaterThan(acceptingBefore);
    expect(rejectingRenders.mock.calls.length).toBe(rejectingBefore);

    cancel();
    await flushRaf();

    expect(rejectingRenders.mock.calls.length).toBe(rejectingBefore);
  });

  it('does not re-render unrelated targets while the pointer moves', async () => {
    const hoveredRenders = vi.fn(() => 'hovered');
    const unrelatedRenders = vi.fn(() => 'unrelated');
    const { engine } = await renderDnd(
      <React.Fragment>
        <Draggable.Target
          accept={Draggable.anyKind}
          data-testid="hovered"
          className={hoveredRenders}
        />
        <Draggable.Target
          accept={Draggable.anyKind}
          data-testid="unrelated"
          className={unrelatedRenders}
        />
      </React.Fragment>,
    );
    const source = createElement();
    engine.registerSource(source, {});
    const hovered = screen.getByTestId('hovered');
    hovered.getBoundingClientRect = () => new DOMRect(0, 0, 200, 100);

    fireDrag.dragStart(source);
    await flushRaf();
    const hoveredAfterStart = hoveredRenders.mock.calls.length;
    const unrelatedAfterStart = unrelatedRenders.mock.calls.length;

    fireDrag.dragEnter(hovered);
    fireDrag.dragOver(hovered);
    await flushRaf();

    expect(hovered).toHaveAttribute('data-drag-over');
    expect(hoveredRenders.mock.calls.length).toBeGreaterThan(hoveredAfterStart);
    expect(unrelatedRenders).toHaveBeenCalledTimes(unrelatedAfterStart);
  });

  it('still fires callbacks when trackDragOver is false', async () => {
    const onDrop = vi.fn();
    const { engine } = await renderDnd(
      <Draggable.Target
        accept={Draggable.anyKind}
        trackDragOver={false}
        data-testid="target"
        onDraggableDrop={onDrop}
      />,
    );
    const source = createElement();
    engine.registerSource(source, {});
    const target = screen.getByTestId('target');
    target.getBoundingClientRect = () => new DOMRect(0, 0, 200, 100);

    fireDrag.dragStart(source);
    await flushRaf();
    fireDrag.dragEnter(target);
    fireDrag.dragOver(target);
    await flushRaf();
    fireDrag.drop(target);

    // Skipping the drag-over subscription must not skip the registration. The
    // element is still a drop target that renders no feedback.
    expect(onDrop).toHaveBeenCalledTimes(1);
    expect(target).not.toHaveAttribute('data-drag-over');
  });

  it('keeps its payload out of another registration on the same element', async () => {
    const otherKind = Draggable.createKind<string>('other');
    const { engine, rerender } = await renderDnd(
      <Draggable.Target accept={Draggable.anyKind} data-testid="target" payload="target" />,
    );
    const element = screen.getByTestId('target');
    const source = createElement();
    engine.registerSource(source, {});
    let current: DraggableTargetRecord<string> | undefined;
    // Registered after the Target, so it is the element's active registration.
    engine.registerTarget(element, {
      accept: Draggable.anyKind,
      kind: otherKind,
      payload: 'other',
      onDraggableEnter: ({ currentTarget }) => {
        current = currentTarget;
      },
    });

    await lift(source);
    await dragEnter(element);
    current!.updatePayload('override');
    await rerender(
      <Draggable.Target accept={Draggable.anyKind} data-testid="target" payload="changed" />,
    );
    cancel();

    await lift(source);
    await dragEnter(element);
    expect(current!.payload).toBe('override');
    cancel();
  });

  describe('composed onto a Draggable.Root', () => {
    it('registers both roles on a single element', async () => {
      await renderDnd(
        <Draggable.Root
          kind={cardKind}
          payload={{ id: 'a' }}
          render={<Draggable.Target accept={cardKind} />}
        >
          Card
        </Draggable.Root>,
      );

      const el = screen.getByText('Card');
      // One node carries both registrations: the drop target attribute and the
      // gesture setup the engine applies to a drag source.
      expect(el).toHaveAttribute('data-base-ui-drop-target', '');
      expect(el.style.touchAction).toBe('manipulation');
    });

    it('reflects the drop target drag-over state on the composed element', async () => {
      const { engine } = await renderDnd(
        <Draggable.Root
          kind={cardKind}
          payload={{ id: 'a' }}
          render={<Draggable.Target data-testid="item" accept={cardKind} />}
        />,
      );
      const source = createElement();
      engine.registerSource(source, { kind: cardKind, payload: { id: 'a' } });
      const item = screen.getByTestId('item');
      item.getBoundingClientRect = () => new DOMRect(0, 0, 200, 100);

      fireDrag.dragStart(source);
      await flushRaf();
      fireDrag.dragEnter(item);
      fireDrag.dragOver(item);
      await flushRaf();

      expect(item).toHaveAttribute('data-drag-over');

      fireDrag.drop(item);
      expect(item).not.toHaveAttribute('data-drag-over');
    });

    it('keeps the engine-owned data-dragging when the drop target re-renders mid-drag', async () => {
      // The engine writes `data-dragging` straight to the DOM and the draggable's
      // state mapping suppresses React's copy, so a re-render driven by the inner
      // drop target's drag-over state must not clobber it.
      await renderDnd(
        <React.Fragment>
          <Draggable.Root
            kind={itemKind}
            render={<Draggable.Target data-testid="a" accept={itemKind} />}
          />
          <Draggable.Root
            kind={itemKind}
            render={<Draggable.Target data-testid="b" accept={itemKind} />}
          />
        </React.Fragment>,
      );
      const a = screen.getByTestId('a');
      const b = screen.getByTestId('b');
      a.getBoundingClientRect = () => new DOMRect(0, 0, 200, 50);
      b.getBoundingClientRect = () => new DOMRect(0, 50, 200, 50);

      fireDrag.dragStart(a);
      await flushRaf();
      expect(a).toHaveAttribute('data-dragging');

      fireDrag.dragEnter(b);
      fireDrag.dragOver(b);
      await flushRaf();

      expect(b).toHaveAttribute('data-drag-over');
      expect(a).toHaveAttribute('data-dragging');
      expect(a).not.toHaveAttribute('data-drag-over');

      fireDrag.drop(b);
      expect(a).toHaveAttribute('data-settling');
      await flushRaf();
      expect(a).not.toHaveAttribute('data-dragging');
    });
  });
});
