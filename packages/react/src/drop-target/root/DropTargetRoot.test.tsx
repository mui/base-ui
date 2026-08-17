import * as React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { act, fireEvent, screen } from '@testing-library/react';
import { createDndRenderer, describeConformance } from '#test-utils';
import { Draggable } from '@base-ui/react/draggable';
import { DropTarget } from '@base-ui/react/drop-target';
import {
  cancel,
  createElement,
  flushRaf,
  registerCleanup,
  setupDragEngineTests,
} from '../../../test/dnd';
import { resetTouchTarget, touchDown, touchUp } from '../../../test/syntheticPointer';
import { dragSessionStore } from '../../utils/drag-and-drop/dragSessionStore';

// `resetTouchTarget` per the syntheticPointer contract: the touch helpers latch
// their dispatch target, which must not leak across tests.
setupDragEngineTests({ extraAfterEach: resetTouchTarget });

const cardKind = Draggable.createKind<{ id: string }>('card');
const columnKind = Draggable.createKind('column');
const itemKind = Draggable.createKind('item');
const slotKind = Draggable.createKind<{ id: string }>('slot');

describe('DropTarget.Root', () => {
  const { renderDnd } = createDndRenderer();

  describeConformance(<DropTarget.Root accept={DropTarget.anyKind} />, () => ({
    refInstanceof: window.HTMLDivElement,
    render(node) {
      return renderDnd(node);
    },
  }));

  it('marks the element as a drop target once attached', async () => {
    await renderDnd(<DropTarget.Root accept={DropTarget.anyKind} data-testid="target" />);
    const el = screen.getByTestId('target');
    expect(el).toHaveAttribute('data-drop-target', '');
  });

  it('removes the drop-target attribute on unmount', async () => {
    const { unmount } = await renderDnd(
      <DropTarget.Root accept={DropTarget.anyKind} data-testid="target" />,
    );
    const el = screen.getByTestId('target');
    unmount();
    expect(el).not.toHaveAttribute('data-drop-target');
  });

  it('does not forward engine parameters to the DOM element', async () => {
    await renderDnd(
      <DropTarget.Root
        data-testid="target"
        label="x"
        kind={slotKind}
        accept={cardKind}
        payload={{ id: 'slot-1' }}
        trackDragOver={false}
        disabled={false}
        canDrop={() => true}
        snap={{ y: 4 }}
        onDrop={() => {}}
      />,
    );
    const el = screen.getByTestId('target');
    // Engine parameters are destructured out, so they can't land as attributes.
    expect(el).not.toHaveAttribute('kind');
    expect(el).not.toHaveAttribute('accept');
    expect(el).not.toHaveAttribute('trackDragOver');
    expect(el).not.toHaveAttribute('disabled');
    expect(el).not.toHaveAttribute('label');
    expect(el).not.toHaveAttribute('payload');
    expect(el).not.toHaveAttribute('canDrop');
    expect(el).not.toHaveAttribute('snap');
  });

  it('forwards every engine parameter to the registration', async () => {
    // The component relists each parameter by hand into a cast object, so a dropped
    // entry is invisible to the type checker. `onDragStart` is absent here: it only
    // fires for a source nested inside the target, which the next test pins.
    const calls: string[] = [];
    const record = (name: string) => () => {
      calls.push(name);
    };
    let observed: { kind?: symbol; label?: string; data?: unknown; snapped?: number } = {};

    const { engine } = await renderDnd(
      <DropTarget.Root
        data-testid="target"
        label="Slot one"
        kind={slotKind}
        accept={cardKind}
        canDrop={() => {
          calls.push('canDrop');
          return true;
        }}
        getPayload={() => ({ id: 'slot-1' })}
        snap={() => {
          calls.push('snap');
          return { y: 4 };
        }}
        onDrag={record('onDrag')}
        onDropTargetChange={record('onDropTargetChange')}
        onDragEnter={record('onDragEnter')}
        onDragLeave={record('onDragLeave')}
        onDrop={({ self }) => {
          calls.push('onDrop');
          observed = {
            kind: self.kind,
            label: self.label,
            data: self.payload.id,
            // 35 / 100 of the stub rect, quantized to 4 steps. The raw fraction
            // (0.35) here would mean `snap` never reached the registration.
            snapped: self.getSnappedLocalPoint().y,
          };
        }}
      />,
    );
    const source = createElement();
    engine.registerDraggable(source, { kind: cardKind, payload: { id: 'a' } });
    const target = screen.getByTestId('target');
    target.getBoundingClientRect = () => new DOMRect(0, 0, 200, 100);

    fireEvent.dragStart(source);
    await flushRaf();
    fireEvent.dragEnter(target, { clientY: 35 });
    fireEvent.dragOver(target, { clientY: 35 });
    await flushRaf();
    fireEvent.drop(target, { clientY: 35 });

    expect(observed.kind).toBe(slotKind.id);
    expect(observed.label).toBe('Slot one');
    expect(observed.data).toBe('slot-1');
    expect(observed.snapped).toBe(0.25);
    // `onDragLeave` fires terminally on the drop, so the drop drives every entry.
    for (const name of [
      'canDrop',
      'snap',
      'onDropTargetChange',
      'onDragEnter',
      'onDrag',
      'onDrop',
      'onDragLeave',
    ]) {
      expect(calls).toContain(name);
    }
  });

  it('receives onDragStart for a source nested inside it, and not for one outside', async () => {
    // A target only sees `onDragStart` when it is already in the stack as the
    // drag begins, which is exactly the nested-source case. Existing coverage
    // supplied the callback without ever pinning that it fires.
    const nestedStart = vi.fn();
    const outsideStart = vi.fn();
    const { engine } = await renderDnd(
      <React.Fragment>
        <DropTarget.Root
          accept={DropTarget.anyKind}
          data-testid="wrapper"
          onDragStart={nestedStart}
        >
          <div data-testid="nested-source" />
        </DropTarget.Root>
        <DropTarget.Root
          accept={DropTarget.anyKind}
          data-testid="elsewhere"
          onDragStart={outsideStart}
        />
      </React.Fragment>,
    );

    const wrapper = screen.getByTestId('wrapper');
    const nestedSource = screen.getByTestId('nested-source') as HTMLElement;
    wrapper.getBoundingClientRect = () => new DOMRect(0, 0, 200, 100);
    nestedSource.getBoundingClientRect = () => new DOMRect(0, 0, 200, 100);
    engine.registerDraggable(nestedSource, {
      kind: cardKind,
      payload: { id: 'a' },
      pointerActivation: { touch: { type: 'immediate' } },
    });

    // Raw pointer events rather than the native→synthetic bridge: the bridge
    // starts every drag with nothing under the pointer, which is precisely the
    // state this test needs to not be in.
    const hitTest = vi.spyOn(document, 'elementFromPoint').mockReturnValue(nestedSource);
    registerCleanup(() => hitTest.mockRestore());

    touchDown(nestedSource, 10, 10);
    await flushRaf();

    expect(nestedStart).toHaveBeenCalledTimes(1);
    const payload = nestedStart.mock.calls[0][0];
    expect(payload.source.element).toBe(nestedSource);
    expect(payload.self.element).toBe(wrapper);
    // The unrelated target was never in the stack, so it saw nothing.
    expect(outsideStart).not.toHaveBeenCalled();

    touchUp(10, 10);
  });

  it('fires onDragEnter and onDrop exactly once when mounted under Strict Mode', async () => {
    // Strict Mode double-invokes the registration effect (register → cleanup →
    // register); a leaked duplicate hold would run the callbacks once per hold.
    const onDragEnter = vi.fn();
    const onDrop = vi.fn();
    const { engine } = await renderDnd(
      <React.StrictMode>
        <DropTarget.Root
          accept={DropTarget.anyKind}
          data-testid="target"
          onDragEnter={onDragEnter}
          onDrop={onDrop}
        />
      </React.StrictMode>,
    );
    const source = createElement();
    engine.registerDraggable(source, {});
    const target = screen.getByTestId('target');
    target.getBoundingClientRect = () => new DOMRect(0, 0, 200, 100);

    fireEvent.dragStart(source);
    await flushRaf();
    fireEvent.dragEnter(target);
    fireEvent.dragOver(target);
    await flushRaf();
    fireEvent.drop(target);

    expect(onDragEnter).toHaveBeenCalledTimes(1);
    expect(onDrop).toHaveBeenCalledTimes(1);
  });

  it('re-registers when the element behind the ref is swapped without remounting', async () => {
    function Swappable({ swapped }: { swapped: boolean }) {
      // A distinct key forces React to swap the DOM node behind the same ref
      // callback (as a virtualizer recycling a row does) instead of reusing it.
      return (
        <DropTarget.Root
          accept={DropTarget.anyKind}
          key={swapped ? 'b' : 'a'}
          data-testid={swapped ? 'b' : 'a'}
        />
      );
    }

    const { rerender } = await renderDnd(<Swappable swapped={false} />);
    const first = screen.getByTestId('a');
    expect(first).toHaveAttribute('data-drop-target', '');

    await rerender(<Swappable swapped />);
    const second = screen.getByTestId('b');
    // The old node was deregistered and the new node registered, so the drop
    // target follows the swap instead of going dead on the detached node.
    expect(first).not.toHaveAttribute('data-drop-target');
    expect(second).toHaveAttribute('data-drop-target', '');
  });

  it('resolves the new params when a hovered target remounts with changed params in one commit', async () => {
    // A key swap plus a param change land in the same commit: the new node's
    // registration is read by the mid-drag refresh before the params ref has been
    // committed by its layout effect, which is exactly the window the
    // `next ?? current` getter fallback covers.
    const enterBefore = vi.fn();
    const enterAfter = vi.fn();
    const log: string[] = [];
    function Fixture({ swapped }: { swapped: boolean }) {
      return (
        <DropTarget.Root
          accept={DropTarget.anyKind}
          key={swapped ? 'after' : 'before'}
          data-testid="target"
          payload={{ id: swapped ? 'after' : 'before' }}
          onDragEnter={(event) => {
            log.push(`enter:${(event.self.payload as any).id}`);
            (swapped ? enterAfter : enterBefore)(event);
          }}
          onDragLeave={(event) => log.push(`leave:${(event.self.payload as any).id}`)}
        />
      );
    }

    const { rerender, engine } = await renderDnd(<Fixture swapped={false} />);
    const source = createElement();
    engine.registerDraggable(source, {});
    const first = screen.getByTestId('target');
    first.getBoundingClientRect = () => new DOMRect(0, 0, 200, 100);

    fireEvent.dragStart(source);
    await flushRaf();
    fireEvent.dragEnter(first);
    fireEvent.dragOver(first);
    await flushRaf();
    expect(enterBefore).toHaveBeenCalledTimes(1);
    expect(first).toHaveAttribute('data-drag-over');

    // The bridge's hit test latches the exact node the last drag event targeted,
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
    const event = enterAfter.mock.calls[0][0];
    expect(event.self.element).toBe(second);
    expect(event.self.payload).toEqual({ id: 'after' });
    // The old node is unmounted garbage — React never updates a detached node's
    // attributes, so only its disconnection is assertable.
    expect(first.isConnected).toBe(false);
    expect(second).toHaveAttribute('data-drag-over');

    fireEvent.drop(second);
  });

  it('fires consumer callbacks with stable references across re-renders', async () => {
    const firstOnDragEnter = vi.fn();
    const secondOnDragEnter = vi.fn();
    const { rerender, engine } = await renderDnd(
      <DropTarget.Root
        accept={DropTarget.anyKind}
        data-testid="target"
        onDragEnter={firstOnDragEnter}
      />,
    );
    const source = createElement();
    engine.registerDraggable(source, {});
    const target = screen.getByTestId('target');
    target.getBoundingClientRect = () => new DOMRect(0, 0, 200, 100);

    await rerender(
      <DropTarget.Root
        accept={DropTarget.anyKind}
        data-testid="target"
        onDragEnter={secondOnDragEnter}
      />,
    );

    fireEvent.dragStart(source);
    await flushRaf();
    fireEvent.dragEnter(target);
    fireEvent.dragOver(target);
    await flushRaf();

    expect(firstOnDragEnter).not.toHaveBeenCalled();
    expect(secondOnDragEnter).toHaveBeenCalledTimes(1);

    fireEvent.drop(target);
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
            <DropTarget.Root
              accept={DropTarget.anyKind}
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
    engine.registerDraggable(source, {});
    const target = screen.getByTestId('target');
    target.getBoundingClientRect = () => new DOMRect(0, 0, 200, 100);

    fireEvent.click(screen.getByRole('button', { name: 'Suspend update' }));
    await act(async () => Promise.resolve());
    expect(suspendedRender).toHaveBeenCalled();

    fireEvent.dragStart(source);
    await flushRaf();
    fireEvent.dragEnter(target);
    await flushRaf();

    expect(committedCanDrop).toHaveBeenCalled();
    expect(suspendedCanDrop).not.toHaveBeenCalled();
    fireEvent.drop(target);
  });

  it('fires onDragLeave when a hovered target unregisters mid-drag', async () => {
    const onDragEnter = vi.fn();
    const onDragLeave = vi.fn();
    const { rerender, engine } = await renderDnd(
      <DropTarget.Root
        accept={DropTarget.anyKind}
        data-testid="target"
        onDragEnter={onDragEnter}
        onDragLeave={onDragLeave}
      />,
    );
    const source = createElement();
    engine.registerDraggable(source, {});
    const target = screen.getByTestId('target');
    target.getBoundingClientRect = () => new DOMRect(0, 0, 200, 100);

    fireEvent.dragStart(source);
    await flushRaf();
    fireEvent.dragEnter(target);
    fireEvent.dragOver(target);
    await flushRaf();
    expect(onDragEnter).toHaveBeenCalledTimes(1);

    // Unmount the hovered target mid-drag (e.g. a virtualizer recycling its row).
    // The leave must still fire even though the target's registry entry is being
    // removed — the registration is kept until after the re-resolve for exactly this.
    await rerender(<div data-testid="placeholder" />);

    expect(onDragLeave).toHaveBeenCalledTimes(1);

    cancel();
  });

  it('a drop target registered under the pointer mid-drag joins the active stack', async () => {
    // The registration-time refresh is coalesced to a microtask (one stack
    // re-resolve per commit, not per registered target), so the new target must
    // still be in the stack once the tick flushes.
    const { engine } = await renderDnd();
    const source = createElement();
    engine.registerDraggable(source, {});
    const outer = createElement();
    const inner = document.createElement('div');
    outer.appendChild(inner);
    engine.registerDropTarget(outer, {});

    fireEvent.dragStart(source);
    await flushRaf();
    fireEvent.dragEnter(inner);
    fireEvent.dragOver(inner);
    await flushRaf();

    // Only the outer target is registered so far.
    expect(dragSessionStore.getSnapshot()?.location.current.dropTargets[0]?.element).toBe(outer);

    // The inner target registers mid-drag, under the pointer.
    engine.registerDropTarget(inner, {});
    await flushRaf();

    expect(dragSessionStore.getSnapshot()?.location.current.dropTargets[0]?.element).toBe(inner);

    fireEvent.drop(inner);
  });

  it('canDrop returning false prevents this target from receiving callbacks', async () => {
    const onDragEnter = vi.fn();
    const { engine } = await renderDnd(
      <DropTarget.Root
        accept={DropTarget.anyKind}
        data-testid="target"
        canDrop={() => false}
        onDragEnter={onDragEnter}
      />,
    );
    const source = createElement();
    engine.registerDraggable(source, {});
    const target = screen.getByTestId('target');
    target.getBoundingClientRect = () => new DOMRect(0, 0, 200, 100);

    fireEvent.dragStart(source);
    await flushRaf();
    fireEvent.dragEnter(target);
    fireEvent.dragOver(target);
    await flushRaf();

    expect(onDragEnter).not.toHaveBeenCalled();
    // The target never becomes active, so its drag-over state stays false too.
    expect(target).not.toHaveAttribute('data-drag-over');
    expect(target).not.toHaveAttribute('data-drag-over-innermost');
  });

  it('reflects disabled in state and as data-disabled', async () => {
    const { rerender } = await renderDnd(
      <DropTarget.Root accept={DropTarget.anyKind} data-testid="target" disabled />,
    );
    const target = screen.getByTestId('target');
    expect(target).toHaveAttribute('data-disabled');

    await rerender(<DropTarget.Root accept={DropTarget.anyKind} data-testid="target" />);
    expect(target).not.toHaveAttribute('data-disabled');
  });

  it('a disabled target receives no callbacks and reports no drag-over state', async () => {
    const onDragEnter = vi.fn();
    const onDrop = vi.fn();
    const { engine } = await renderDnd(
      <DropTarget.Root
        accept={DropTarget.anyKind}
        data-testid="target"
        disabled
        onDragEnter={onDragEnter}
        onDrop={onDrop}
      />,
    );
    const source = createElement();
    engine.registerDraggable(source, {});
    const target = screen.getByTestId('target');
    target.getBoundingClientRect = () => new DOMRect(0, 0, 200, 100);

    fireEvent.dragStart(source);
    await flushRaf();
    fireEvent.dragEnter(target);
    fireEvent.dragOver(target);
    await flushRaf();
    fireEvent.drop(target);

    // Like `canDrop: () => false`, a disabled target is skipped entirely.
    expect(onDragEnter).not.toHaveBeenCalled();
    expect(onDrop).not.toHaveBeenCalled();
    expect(target).not.toHaveAttribute('data-drag-over');
  });

  it('a hovered target disabled mid-drag leaves the stack without pointer movement, and re-enters on re-enable', async () => {
    // A `disabled` flip triggers an eager `refreshDropTargets()` from a layout
    // effect: with a stationary pointer there is no next move to re-resolve on,
    // so the flip itself must deliver the leave (and the re-enable the enter).
    const onDragEnter = vi.fn();
    const onDragLeave = vi.fn();
    function Fixture({ disabled }: { disabled?: boolean }) {
      return (
        <DropTarget.Root
          accept={DropTarget.anyKind}
          data-testid="target"
          disabled={disabled}
          onDragEnter={onDragEnter}
          onDragLeave={onDragLeave}
        />
      );
    }

    const { rerender, engine } = await renderDnd(<Fixture />);
    const source = createElement();
    engine.registerDraggable(source, {});
    const target = screen.getByTestId('target');
    target.getBoundingClientRect = () => new DOMRect(0, 0, 200, 100);

    fireEvent.dragStart(source);
    await flushRaf();
    fireEvent.dragEnter(target);
    fireEvent.dragOver(target);
    await flushRaf();
    expect(onDragEnter).toHaveBeenCalledTimes(1);
    expect(target).toHaveAttribute('data-drag-over');

    // Disable while hovered — no pointer event follows.
    await rerender(<Fixture disabled />);

    expect(onDragLeave).toHaveBeenCalledTimes(1);
    expect(target).not.toHaveAttribute('data-drag-over');
    expect(target).not.toHaveAttribute('data-drag-over-innermost');

    // Re-enable: the pointer never left, so the eager refresh re-enters it.
    await rerender(<Fixture />);

    expect(onDragEnter).toHaveBeenCalledTimes(2);
    expect(target).toHaveAttribute('data-drag-over');

    fireEvent.drop(target);
  });

  it('a hovered target whose accept narrows mid-drag leaves the stack without pointer movement', async () => {
    // Like the `disabled` flip above: `accept` is declarative and comparable, so
    // narrowing it away from the live source under a stationary pointer must
    // deliver the leave now — not advertise a valid drop until an
    // `outside-release` at drop time. Compared by content, so the inline array
    // identity changing every render doesn't churn the stack.
    const onDragEnter = vi.fn();
    const onDragLeave = vi.fn();
    function Fixture({
      accepted,
      revision = 0,
    }: {
      accepted: 'both' | 'columnOnly';
      revision?: number;
    }) {
      return (
        <DropTarget.Root
          accept={accepted === 'both' ? [cardKind, columnKind] : [columnKind]}
          data-testid="target"
          data-revision={revision}
          onDragEnter={onDragEnter}
          onDragLeave={onDragLeave}
        />
      );
    }

    const { rerender, engine } = await renderDnd(<Fixture accepted="both" />);
    const source = createElement();
    engine.registerDraggable(source, { kind: cardKind });
    const target = screen.getByTestId('target');
    target.getBoundingClientRect = () => new DOMRect(0, 0, 200, 100);

    fireEvent.dragStart(source);
    await flushRaf();
    fireEvent.dragEnter(target);
    fireEvent.dragOver(target);
    await flushRaf();
    expect(onDragEnter).toHaveBeenCalledTimes(1);
    expect(target).toHaveAttribute('data-drag-over');

    // A normal rerender allocates a fresh inline array with the same contents.
    // It must not churn the live target stack.
    await rerender(<Fixture accepted="both" revision={1} />);
    expect(onDragEnter).toHaveBeenCalledTimes(1);
    expect(onDragLeave).not.toHaveBeenCalled();
    expect(target).toHaveAttribute('data-drag-over');

    // Narrow `accept` while hovered — no pointer event follows.
    await rerender(<Fixture accepted="columnOnly" revision={1} />);

    expect(onDragLeave).toHaveBeenCalledTimes(1);
    expect(target).not.toHaveAttribute('data-drag-over');

    // Widen it back: the pointer never left, so the eager refresh re-enters it.
    await rerender(<Fixture accepted="both" revision={1} />);

    expect(onDragEnter).toHaveBeenCalledTimes(2);
    expect(target).toHaveAttribute('data-drag-over');

    fireEvent.drop(target);
  });

  it('accept filters which source kinds reach the target', async () => {
    const onDragEnter = vi.fn();
    const { engine } = await renderDnd(
      <DropTarget.Root data-testid="target" accept={cardKind} onDragEnter={onDragEnter} />,
    );
    const source = createElement();
    engine.registerDraggable(source, { kind: columnKind });
    const target = screen.getByTestId('target');
    target.getBoundingClientRect = () => new DOMRect(0, 0, 200, 100);

    fireEvent.dragStart(source);
    await flushRaf();
    fireEvent.dragEnter(target);
    fireEvent.dragOver(target);
    await flushRaf();

    expect(onDragEnter).not.toHaveBeenCalled();
    expect(target).not.toHaveAttribute('data-drag-over');

    cancel();
  });

  it('data-drag-over-innermost is absent on the outer target while a nested target is active', async () => {
    const { engine } = await renderDnd(
      <DropTarget.Root accept={DropTarget.anyKind} data-testid="outer">
        <DropTarget.Root accept={DropTarget.anyKind} data-testid="inner" />
      </DropTarget.Root>,
    );
    const source = createElement();
    engine.registerDraggable(source, {});
    const outer = screen.getByTestId('outer');
    const inner = screen.getByTestId('inner');
    outer.getBoundingClientRect = () => new DOMRect(0, 0, 200, 200);
    inner.getBoundingClientRect = () => new DOMRect(50, 50, 100, 100);

    fireEvent.dragStart(source);
    await flushRaf();

    // Over the outer only.
    fireEvent.dragEnter(outer);
    fireEvent.dragOver(outer);
    await flushRaf();

    expect(outer).toHaveAttribute('data-drag-over');
    expect(outer).toHaveAttribute('data-drag-over-innermost');
    expect(inner).not.toHaveAttribute('data-drag-over');

    // Now over the inner (nested inside outer): the outer stays `over` but is no
    // longer the innermost active target.
    fireEvent.dragEnter(inner);
    fireEvent.dragOver(inner);
    await flushRaf();

    expect(outer).toHaveAttribute('data-drag-over');
    expect(outer).not.toHaveAttribute('data-drag-over-innermost');
    expect(inner).toHaveAttribute('data-drag-over');
    expect(inner).toHaveAttribute('data-drag-over-innermost');

    // Back out to the outer only: it regains innermost status and the inner
    // loses its drag-over state entirely.
    fireEvent.dragEnter(outer);
    fireEvent.dragOver(outer);
    await flushRaf();

    expect(outer).toHaveAttribute('data-drag-over');
    expect(outer).toHaveAttribute('data-drag-over-innermost');
    expect(inner).not.toHaveAttribute('data-drag-over');
    expect(inner).not.toHaveAttribute('data-drag-over-innermost');

    fireEvent.drop(outer);
  });

  it('flips drag-over state off and fires onDragLeave when the pointer leaves for empty space, then re-enters', async () => {
    const onDragEnter = vi.fn();
    const onDragLeave = vi.fn();
    const { engine } = await renderDnd(
      <DropTarget.Root
        accept={DropTarget.anyKind}
        data-testid="target"
        onDragEnter={onDragEnter}
        onDragLeave={onDragLeave}
      />,
    );
    const source = createElement();
    engine.registerDraggable(source, {});
    const target = screen.getByTestId('target');
    target.getBoundingClientRect = () => new DOMRect(0, 0, 200, 100);

    fireEvent.dragStart(source);
    await flushRaf();
    fireEvent.dragEnter(target);
    fireEvent.dragOver(target);
    await flushRaf();
    expect(onDragEnter).toHaveBeenCalledTimes(1);
    expect(target).toHaveAttribute('data-drag-over');
    expect(target).toHaveAttribute('data-drag-over-innermost');

    // Off the target into empty space: the drag stays live with no hovered target.
    fireEvent.dragLeave(target);
    await flushRaf();

    expect(onDragLeave).toHaveBeenCalledTimes(1);
    expect(target).not.toHaveAttribute('data-drag-over');
    expect(target).not.toHaveAttribute('data-drag-over-innermost');

    // Back onto the same target: a fresh enter, not a resumed hover.
    fireEvent.dragEnter(target);
    fireEvent.dragOver(target);
    await flushRaf();

    expect(onDragEnter).toHaveBeenCalledTimes(2);
    expect(target).toHaveAttribute('data-drag-over');
    expect(target).toHaveAttribute('data-drag-over-innermost');

    fireEvent.drop(target);
  });

  it('reflects drag-over state across the drag lifecycle by default (trackDragOver defaults to true)', async () => {
    const { engine } = await renderDnd(
      <DropTarget.Root accept={DropTarget.anyKind} data-testid="target" />,
    );
    const source = createElement();
    engine.registerDraggable(source, {});
    const target = screen.getByTestId('target');
    target.getBoundingClientRect = () => new DOMRect(0, 0, 200, 100);

    expect(target).not.toHaveAttribute('data-drag-over');

    fireEvent.dragStart(source);
    await flushRaf();
    fireEvent.dragEnter(target);
    fireEvent.dragOver(target);
    await flushRaf();

    expect(target).toHaveAttribute('data-drag-over');
    expect(target).toHaveAttribute('data-drag-over-innermost');

    fireEvent.drop(target);

    expect(target).not.toHaveAttribute('data-drag-over');
    expect(target).not.toHaveAttribute('data-drag-over-innermost');
  });

  it('re-resolves a stationary hovered target when canDrop changes', async () => {
    const onDragEnter = vi.fn();
    const onDragLeave = vi.fn();
    function Fixture({ allowed }: { allowed: boolean }) {
      return (
        <DropTarget.Root
          accept={DropTarget.anyKind}
          data-testid="target"
          canDrop={() => allowed}
          onDragEnter={onDragEnter}
          onDragLeave={onDragLeave}
        />
      );
    }

    const { rerender, engine } = await renderDnd(<Fixture allowed />);
    const source = createElement();
    engine.registerDraggable(source, {});
    const target = screen.getByTestId('target');
    target.getBoundingClientRect = () => new DOMRect(0, 0, 200, 100);

    fireEvent.dragStart(source);
    await flushRaf();
    fireEvent.dragEnter(target);
    fireEvent.dragOver(target);
    await flushRaf();
    expect(target).toHaveAttribute('data-drag-over');

    const hitTest = vi.spyOn(document, 'elementFromPoint').mockReturnValue(null);
    await rerender(<Fixture allowed={false} />);
    // A parameter-only refresh must re-resolve from the last event target. A
    // fresh hit test can observe layout changed by an onDrag state update and
    // recursively enter another target during the same React commit.
    expect(hitTest).not.toHaveBeenCalled();
    expect(onDragLeave).toHaveBeenCalledTimes(1);
    expect(target).not.toHaveAttribute('data-drag-over');

    await rerender(<Fixture allowed />);
    expect(onDragEnter).toHaveBeenCalledTimes(2);
    expect(target).toHaveAttribute('data-drag-over');
  });

  it('passes the drag-over state to a className callback', async () => {
    const { engine } = await renderDnd(
      <DropTarget.Root
        accept={DropTarget.anyKind}
        data-testid="target"
        className={(state) => (state.dragOver ? 'is-over' : 'idle')}
      />,
    );
    const source = createElement();
    engine.registerDraggable(source, {});
    const target = screen.getByTestId('target');
    target.getBoundingClientRect = () => new DOMRect(0, 0, 200, 100);

    expect(target).toHaveClass('idle');

    fireEvent.dragStart(source);
    await flushRaf();
    fireEvent.dragEnter(target);
    fireEvent.dragOver(target);
    await flushRaf();

    expect(target).toHaveClass('is-over');

    fireEvent.drop(target);
  });

  it('does not re-render on drag activity when trackDragOver is false', async () => {
    // Count renders inside each target: a function `className` runs on every
    // render of the DropTarget.Root itself, where the drag-over subscription
    // lives — a spy in a parent component would miss store-driven re-renders.
    const trackedRenders = vi.fn(() => 'tracked');
    const untrackedRenders = vi.fn(() => 'untracked');
    const { engine } = await renderDnd(
      <React.Fragment>
        <DropTarget.Root
          accept={DropTarget.anyKind}
          data-testid="tracked"
          className={trackedRenders}
        />
        <DropTarget.Root
          accept={DropTarget.anyKind}
          trackDragOver={false}
          data-testid="untracked"
          className={untrackedRenders}
        />
      </React.Fragment>,
    );
    const source = createElement();
    engine.registerDraggable(source, {});
    const tracked = screen.getByTestId('tracked');
    const untracked = screen.getByTestId('untracked');
    tracked.getBoundingClientRect = () => new DOMRect(0, 0, 200, 100);
    untracked.getBoundingClientRect = () => new DOMRect(0, 100, 200, 100);

    const trackedBefore = trackedRenders.mock.calls.length;
    const untrackedBefore = untrackedRenders.mock.calls.length;

    fireEvent.dragStart(source);
    await flushRaf();
    fireEvent.dragEnter(tracked);
    fireEvent.dragOver(tracked);
    await flushRaf();

    // The tracked target re-renders for its own enter...
    expect(trackedRenders.mock.calls.length).toBeGreaterThan(trackedBefore);

    // ...while the untracked target's constant selector never flips, even across
    // its own enter and the drop.
    fireEvent.dragEnter(untracked);
    fireEvent.dragOver(untracked);
    await flushRaf();
    fireEvent.drop(untracked);

    expect(untrackedRenders.mock.calls.length).toBe(untrackedBefore);
  });

  it('does not re-render a tracked target when its accepting state stays false', async () => {
    const acceptingRenders = vi.fn(() => 'accepting');
    const rejectingRenders = vi.fn(() => 'rejecting');
    const { engine } = await renderDnd(
      <React.Fragment>
        <DropTarget.Root accept={cardKind} className={acceptingRenders} />
        <DropTarget.Root accept={columnKind} className={rejectingRenders} />
      </React.Fragment>,
    );
    const source = createElement();
    engine.registerDraggable(source, { kind: cardKind });
    const acceptingBefore = acceptingRenders.mock.calls.length;
    const rejectingBefore = rejectingRenders.mock.calls.length;

    fireEvent.dragStart(source);
    await flushRaf();

    expect(acceptingRenders.mock.calls.length).toBeGreaterThan(acceptingBefore);
    expect(rejectingRenders.mock.calls.length).toBe(rejectingBefore);

    cancel();
    await flushRaf();

    expect(rejectingRenders.mock.calls.length).toBe(rejectingBefore);
  });

  it('does not run unrelated target selectors while the pointer moves', async () => {
    const hoveredRenders = vi.fn(() => 'hovered');
    const unrelatedRenders = vi.fn(() => 'unrelated');
    const { engine } = await renderDnd(
      <React.Fragment>
        <DropTarget.Root
          accept={DropTarget.anyKind}
          data-testid="hovered"
          className={hoveredRenders}
        />
        <DropTarget.Root
          accept={DropTarget.anyKind}
          data-testid="unrelated"
          className={unrelatedRenders}
        />
      </React.Fragment>,
    );
    const source = createElement();
    engine.registerDraggable(source, {});
    const hovered = screen.getByTestId('hovered');
    hovered.getBoundingClientRect = () => new DOMRect(0, 0, 200, 100);

    fireEvent.dragStart(source);
    await flushRaf();
    const unrelatedAfterStart = unrelatedRenders.mock.calls.length;

    fireEvent.dragEnter(hovered);
    fireEvent.dragOver(hovered);
    await flushRaf();

    expect(hoveredRenders.mock.calls.length).toBeGreaterThan(1);
    expect(unrelatedRenders).toHaveBeenCalledTimes(unrelatedAfterStart);
  });

  it('does not re-render for drag-session updates when trackDragOver is false', async () => {
    const className = vi.fn(() => 'target');
    const { engine } = await renderDnd(
      <DropTarget.Root
        accept={DropTarget.anyKind}
        data-testid="target"
        trackDragOver={false}
        className={className}
      />,
    );
    const source = createElement();
    engine.registerDraggable(source, {});
    const rendersBeforeDrag = className.mock.calls.length;

    fireEvent.dragStart(source);
    await flushRaf();

    expect(className).toHaveBeenCalledTimes(rendersBeforeDrag);
  });

  it('still fires callbacks when trackDragOver is false', async () => {
    const onDrop = vi.fn();
    const { engine } = await renderDnd(
      <DropTarget.Root
        accept={DropTarget.anyKind}
        trackDragOver={false}
        data-testid="target"
        onDrop={onDrop}
      />,
    );
    const source = createElement();
    engine.registerDraggable(source, {});
    const target = screen.getByTestId('target');
    target.getBoundingClientRect = () => new DOMRect(0, 0, 200, 100);

    fireEvent.dragStart(source);
    await flushRaf();
    fireEvent.dragEnter(target);
    fireEvent.dragOver(target);
    await flushRaf();
    fireEvent.drop(target);

    // Skipping the drag-over subscription must not skip the registration: the
    // element is still a real drop target, it just renders no feedback.
    expect(onDrop).toHaveBeenCalledTimes(1);
    expect(target).not.toHaveAttribute('data-drag-over');
  });

  it('reads payload back on the drop record', async () => {
    let observed: unknown;
    const { engine } = await renderDnd(
      <DropTarget.Root
        accept={DropTarget.anyKind}
        data-testid="target"
        getPayload={() => ({ id: 'slot-1' })}
        onDrop={({ self }) => {
          observed = self.payload.id;
        }}
      />,
    );
    const source = createElement();
    engine.registerDraggable(source, {});
    const target = screen.getByTestId('target');
    target.getBoundingClientRect = () => new DOMRect(0, 0, 200, 100);

    fireEvent.dragStart(source);
    await flushRaf();
    fireEvent.dragEnter(target);
    fireEvent.dragOver(target);
    await flushRaf();
    fireEvent.drop(target);

    expect(observed).toBe('slot-1');
  });

  describe('composed onto a Draggable.Root', () => {
    it('registers both roles on a single element', async () => {
      await renderDnd(
        <Draggable.Root
          label="card"
          kind={cardKind}
          payload={{ id: 'a' }}
          render={<DropTarget.Root accept={cardKind} />}
        >
          Card
        </Draggable.Root>,
      );

      const el = screen.getByText('Card');
      // One node carries both registrations: the drop target attribute, and the
      // a11y setup the engine applies to a drag source.
      expect(el).toHaveAttribute('data-drop-target', '');
      expect(el).toHaveAttribute('aria-roledescription', 'draggable');
    });

    it('reflects the drop target drag-over state on the composed element', async () => {
      const { engine } = await renderDnd(
        <Draggable.Root
          label="card"
          kind={cardKind}
          payload={{ id: 'a' }}
          render={<DropTarget.Root data-testid="item" accept={cardKind} />}
        />,
      );
      const source = createElement();
      engine.registerDraggable(source, { kind: cardKind, payload: { id: 'a' } });
      const item = screen.getByTestId('item');
      item.getBoundingClientRect = () => new DOMRect(0, 0, 200, 100);

      fireEvent.dragStart(source);
      await flushRaf();
      fireEvent.dragEnter(item);
      fireEvent.dragOver(item);
      await flushRaf();

      expect(item).toHaveAttribute('data-drag-over');

      fireEvent.drop(item);
      expect(item).not.toHaveAttribute('data-drag-over');
    });

    it('keeps the engine-owned data-dragging when the drop target re-renders mid-drag', async () => {
      // The engine writes `data-dragging` straight to the DOM and the draggable's
      // state mapping suppresses React's copy, so a re-render driven by the inner
      // drop target's drag-over state must not clobber it.
      await renderDnd(
        <React.Fragment>
          <Draggable.Root
            label="a"
            kind={itemKind}
            render={<DropTarget.Root data-testid="a" accept={itemKind} />}
          />
          <Draggable.Root
            label="b"
            kind={itemKind}
            render={<DropTarget.Root data-testid="b" accept={itemKind} />}
          />
        </React.Fragment>,
      );
      const a = screen.getByTestId('a');
      const b = screen.getByTestId('b');
      a.getBoundingClientRect = () => new DOMRect(0, 0, 200, 50);
      b.getBoundingClientRect = () => new DOMRect(0, 50, 200, 50);

      fireEvent.dragStart(a);
      await flushRaf();
      expect(a).toHaveAttribute('data-dragging');

      fireEvent.dragEnter(b);
      fireEvent.dragOver(b);
      await flushRaf();

      expect(b).toHaveAttribute('data-drag-over');
      expect(a).toHaveAttribute('data-dragging');
      expect(a).not.toHaveAttribute('data-drag-over');

      fireEvent.drop(b);
      expect(a).toHaveAttribute('data-ending-style');
      await flushRaf();
      expect(a).not.toHaveAttribute('data-dragging');
    });
  });
});
