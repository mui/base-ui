import { describe, it, expect, vi } from 'vitest';
import { act } from '@mui/internal-test-utils';
import { createDndRenderer } from '../../../../test/dndEngine';
import {
  cancel,
  createElement,
  flushRaf,
  mockElementFromPoint,
  registerCleanup,
  setupDragEngineTests,
  splitEnd,
  fireDrag,
  dragEnter,
  dragOver,
} from '../../../../test/dnd';
import type { DraggableInput } from '../../../draggable/DraggableProvider';
import type {
  DragDropEventDetails,
  DropTargetChangeEventDetails,
  MoveEndEventDetails,
} from '../types';
import {
  addDropTargetRegistration,
  getDropTargetShadowRootsByHost,
  removeDropTargetRegistration,
} from '../dropTarget';
import { elementFromPointIgnoring } from '../utils';
import { addMonitor, removeMonitor } from '../monitor';
import { registerTarget } from '../registrations';
import { cancelDrag } from '../synthetic/pickupRecognizer';
import { createDragSource } from '../dragSource';
import { dragSessionStore } from '../dragSessionStore';
import { start } from './lifecycleManager';
import { getActiveSession, resetForTests } from './dragSession';
import type { DragSessionController, SourceHandlers } from './lifecycleManager';
import { createKind } from '../dragKind';

setupDragEngineTests();

// The sensor's hit test without a preview to skip.
function hitTest(clientX: number, clientY: number): Element | null {
  return elementFromPointIgnoring(
    document,
    clientX,
    clientY,
    null,
    getDropTargetShadowRootsByHost(),
  );
}

const TEST_KIND = createKind('lifecycle-test');

describe('lifecycle manager', () => {
  const { renderDnd } = createDndRenderer();

  it('preserves the pickup offset across lifecycle events and isolates their snapshots', () => {
    const element = createElement();
    const target = createElement();
    const onDraggableLeave = vi.fn();
    const getTarget = () => ({ accept: TEST_KIND, onDraggableLeave });
    addDropTargetRegistration(target, getTarget);
    const onMoveStart = vi.fn();
    const onMoveEnd = vi.fn();
    const grabOffset = { x: 12, y: 8 };
    const handle = start({
      source: createDragSource(element, TEST_KIND.id, {}, null),
      getSourceHandlers: () => ({ onMoveStart, onMoveEnd }),
      initialInput: makeInput(),
      initialTarget: target,
      startReason: 'pointer',
      grabOffset,
      hitTest,
    });

    expect(onMoveStart.mock.calls[0][0].location.grabOffset).toEqual({ x: 12, y: 8 });
    grabOffset.x = 99;
    onMoveStart.mock.calls[0][0].location.grabOffset.y = 99;
    act(() => handle!.drop(makeInput(), target));

    expect(onMoveEnd.mock.calls[0][0].location.grabOffset).toEqual({ x: 12, y: 8 });
    expect(onDraggableLeave.mock.calls[0][0].location.grabOffset).toEqual({ x: 12, y: 8 });
    expect(onMoveEnd.mock.calls[0][0].canceled).toBe(false);
    // `canceled` belongs to `onMoveEnd` only; the terminal leave has no such flag.
    expect(onDraggableLeave.mock.calls[0][0]).not.toHaveProperty('canceled');
  });

  function makeInput(): DraggableInput {
    return {
      button: 0,
      buttons: 1,
      clientX: 0,
      clientY: 0,
      pageX: 0,
      pageY: 0,
      pointerType: 'mouse',
      ctrlKey: false,
      shiftKey: false,
      altKey: false,
      metaKey: false,
    };
  }

  /**
   * Start a drag with `handlers` as the source handlers, driving the lifecycle
   * without a sensor. Returns what `start()` returns, so a test can assert on a
   * handler that throws or cancels synchronously in `start()`.
   */
  function startDragWithHandlers(
    handlers: SourceHandlers,
    initialTarget: Element | null = null,
    kind: { id: symbol } = TEST_KIND,
  ): DragSessionController | null {
    const element = createElement();
    return start({
      source: createDragSource(element, kind.id, {}, null),
      getSourceHandlers: () => handlers,
      initialInput: makeInput(),
      initialTarget,
      startReason: 'pointer',
      grabOffset: { x: 0, y: 0 },
      hitTest,
    });
  }

  it('delivers remaining terminal leaves when an inner target throws', () => {
    const outer = createElement();
    const inner = createElement();
    outer.append(inner);
    const outerLeave = vi.fn();
    const innerParameters = () => ({
      accept: TEST_KIND,
      onDraggableLeave() {
        throw new Error('leave failed');
      },
    });
    const outerParameters = () => ({ accept: TEST_KIND, onDraggableLeave: outerLeave });
    addDropTargetRegistration(inner, innerParameters);
    addDropTargetRegistration(outer, outerParameters);
    const handle = startDragWithHandlers({}, inner);
    expect(() => handle!.drop(makeInput(), inner)).toThrow('leave failed');
    expect(outerLeave).toHaveBeenCalledTimes(1);
    expect(getActiveSession()).toBe(null);
  });

  it('does not keep a monitor engaged by a pickup its getter canceled', () => {
    const cardKind = createKind('card');
    const fileKind = createKind('file');
    const onMoveEnd = vi.fn();
    let cancelPickup = true;
    const getMonitor = () => {
      if (cancelPickup) {
        cancelPickup = false;
        cancelDrag();
      }
      return { accept: cardKind, onMoveEnd };
    };
    addMonitor(getMonitor);
    registerCleanup(() => removeMonitor(getMonitor));

    startDragWithHandlers({}, null, cardKind);
    expect(getActiveSession()).toBe(null);

    startDragWithHandlers({}, null, fileKind)!.cancel();

    expect(onMoveEnd).not.toHaveBeenCalled();
  });

  it('does not engage a monitor for a drag its getter started instead', () => {
    const cardKind = createKind('card');
    const fileKind = createKind('file');
    const onMoveStart = vi.fn();
    const onMove = vi.fn();
    const onMoveEnd = vi.fn();
    let restartPickup = true;
    let restarted: DragSessionController | null = null;
    const getMonitor = () => {
      if (restartPickup) {
        restartPickup = false;
        cancelDrag();
        restarted = startDragWithHandlers({}, null, fileKind);
      }
      return { accept: cardKind, onMoveStart, onMove, onMoveEnd };
    };
    addMonitor(getMonitor);
    registerCleanup(() => removeMonitor(getMonitor));

    startDragWithHandlers({}, null, cardKind);
    expect(getActiveSession()).not.toBe(null);

    restarted!.update(makeInput(), null, new Event('pointermove'), 'pointer');
    restarted!.cancel();

    expect(onMoveStart).not.toHaveBeenCalled();
    expect(onMove).not.toHaveBeenCalled();
    expect(onMoveEnd).not.toHaveBeenCalled();
  });

  it('delivers recovery end to monitors even if source cleanup also throws', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const monitorEnd = vi.fn();
    const getMonitor = () => ({ onMoveEnd: monitorEnd });
    addMonitor(getMonitor);
    registerCleanup(() => removeMonitor(getMonitor));
    const handle = startDragWithHandlers({
      onMove() {
        throw new Error('move failed');
      },
      onMoveEnd() {
        throw new Error('cleanup failed');
      },
    });
    expect(() => handle!.update(makeInput(), null, new Event('pointermove'), 'pointer')).toThrow(
      'move failed',
    );
    expect(monitorEnd).toHaveBeenCalledTimes(1);
    expect(monitorEnd.mock.calls[0][0].reason).toBe('handler-error');
    expect(monitorEnd.mock.calls[0][0].canceled).toBe(true);
  });

  describe('malformed registrations', () => {
    function registerRawTarget(element: Element, getParameters: () => unknown): void {
      // Plain JS can pass what the types forbid.
      addDropTargetRegistration(
        element,
        getParameters as Parameters<typeof addDropTargetRegistration>[1],
      );
    }

    it('skips a target whose parameters fail to resolve without ending the drag', () => {
      vi.spyOn(console, 'error').mockImplementation(() => {});
      const outer = createElement();
      const inner = createElement();
      outer.append(inner);
      const onDraggableDrop = vi.fn();
      registerRawTarget(outer, () => ({ accept: TEST_KIND, onDraggableDrop }));
      registerRawTarget(inner, () => ({
        get accept(): never {
          throw new Error('accept failed');
        },
      }));
      const handle = startDragWithHandlers({}, inner)!;

      handle.update(makeInput(), inner, new Event('pointermove'), 'pointer');
      expect(getActiveSession()).not.toBe(null);
      handle.drop(makeInput(), inner);

      expect(onDraggableDrop).toHaveBeenCalledTimes(1);
      expect(onDraggableDrop.mock.calls[0][0].currentTarget.element).toBe(outer);
      expect(getActiveSession()).toBe(null);
    });

    it.each([
      [
        'a move',
        (handle: DragSessionController, element: Element) =>
          handle.update(makeInput(), element, new Event('pointermove'), 'pointer'),
      ],
      [
        'the release',
        (handle: DragSessionController, element: Element) => handle.drop(makeInput(), element),
      ],
    ])('ends the drag when resolving the stack for %s throws', (_, resolve) => {
      const onMoveEnd = vi.fn();
      const handle = startDragWithHandlers({ onMoveEnd })!;
      // The walk itself failing, outside any one target's containment.
      const broken = createElement();
      Object.defineProperty(broken, 'hasAttribute', {
        value: () => {
          throw new Error('walk failed');
        },
      });

      expect(() => resolve(handle, broken)).toThrow('walk failed');

      expect(getActiveSession()).toBe(null);
      expect(onMoveEnd).toHaveBeenCalledTimes(1);
      expect(onMoveEnd.mock.calls[0][0].reason).toBe('handler-error');
      expect(startDragWithHandlers({})).not.toBe(null);
    });

    it('starts a drag when a monitor getter returns undefined', () => {
      const getMonitor = (() => undefined) as unknown as Parameters<typeof addMonitor>[0];
      addMonitor(getMonitor);
      registerCleanup(() => removeMonitor(getMonitor));

      expect(startDragWithHandlers({})).not.toBe(null);
      expect(getActiveSession()).not.toBe(null);
    });
  });

  it('closes a hovered target using its previous kind-compatible callback', () => {
    const other = createKind('other');
    const target = createElement();
    const previousLeave = vi.fn();
    const newLeave = vi.fn();
    let changed = false;
    const getTarget = () =>
      changed
        ? { accept: other, onDraggableLeave: newLeave }
        : { accept: TEST_KIND, onDraggableLeave: previousLeave };
    addDropTargetRegistration(target, getTarget);
    const handle = startDragWithHandlers({}, target);
    changed = true;
    handle!.update(makeInput(), target, new Event('pointermove'), 'pointer');
    expect(previousLeave).toHaveBeenCalledTimes(1);
    expect(newLeave).not.toHaveBeenCalled();
    handle!.cancel();
  });

  it('does not deliver the previous local payload to a target with a new kind', () => {
    const originalKind = createKind<{ title: string }>('original');
    const nextKind = createKind<{ count: number }>('next');
    const target = createElement();
    const previousLeave = vi.fn();
    const newLeave = vi.fn();
    let changed = false;
    const getTarget = () =>
      changed
        ? { kind: nextKind, payload: { count: 1 }, onDraggableLeave: newLeave }
        : { kind: originalKind, payload: { title: 'Original' }, onDraggableLeave: previousLeave };
    addDropTargetRegistration(target, getTarget);
    const handle = startDragWithHandlers({}, target);
    changed = true;
    handle!.update(makeInput(), null, new Event('pointermove'), 'pointer');
    expect(previousLeave).toHaveBeenCalledTimes(1);
    expect(previousLeave.mock.calls[0][0].currentTarget.payload).toEqual({ title: 'Original' });
    expect(newLeave).not.toHaveBeenCalled();
    handle!.cancel();
  });

  it('does not deliver an old kind to updated monitor callbacks and still closes the original observer', () => {
    const other = createKind('other');
    const previousEnd = vi.fn();
    const newMove = vi.fn();
    const newEnd = vi.fn();
    let changed = false;
    const getMonitor = () =>
      changed
        ? { accept: other, onMove: newMove, onMoveEnd: newEnd }
        : { accept: TEST_KIND, onMoveEnd: previousEnd };
    addMonitor(getMonitor);
    registerCleanup(() => removeMonitor(getMonitor));
    const handle = startDragWithHandlers({});
    changed = true;
    handle!.update(makeInput(), null, new Event('pointermove'), 'pointer');
    expect(newMove).not.toHaveBeenCalled();
    handle!.cancel();
    expect(previousEnd).toHaveBeenCalledTimes(1);
    expect(newEnd).not.toHaveBeenCalled();
  });

  describe('event ordering', () => {
    it('fires the internal onGenerateDragPreview then onMoveStart synchronously at drag start', () => {
      // The preview hook is internal to the engine (the sensors' preview
      // publisher, see `SourceHandlers`), so only a test driving the lifecycle
      // directly can observe the ordering.
      const order: string[] = [];

      const handle = startDragWithHandlers({
        onGenerateDragPreview: () => order.push('preview'),
        onMoveStart: () => order.push('start'),
      });

      expect(order).toEqual(['preview', 'start']);
      expect(handle).not.toBeNull();
      act(() => {
        resetForTests();
      });
    });

    it('dispatches onMoveStart before onMoveEnd on a same-tick cancel', async () => {
      const { engine } = await renderDnd();
      const el = createElement();
      const order: string[] = [];

      engine.registerSource(el, {
        onMoveStart: () => order.push('start'),
        onMoveEnd: () => order.push('drop'),
      });

      // `onMoveStart` already fired during `dragStart`, so it precedes the cancel's
      // `onMoveEnd`. A collection never sees a drop for a drag it didn't see start.
      fireDrag.dragStart(el);
      cancel();

      expect(order).toEqual(['start', 'drop']);
    });

    it('reports the innermost current target as `target` to source and monitor move handlers', async () => {
      const { engine } = await renderDnd();
      const el = createElement();
      const outer = createElement();
      const inner = createElement();
      outer.append(inner);
      const handlers = {
        sourceMove: vi.fn(),
        sourceTargetChange: vi.fn(),
        monitorMove: vi.fn(),
        monitorTargetChange: vi.fn(),
      };

      engine.registerSource(el, {
        onMove: handlers.sourceMove,
        onTargetChange: handlers.sourceTargetChange,
      });
      engine.registerTarget(outer, {});
      engine.registerTarget(inner, {});
      engine.registerMonitor({
        onMove: handlers.monitorMove,
        onTargetChange: handlers.monitorTargetChange,
      });

      fireDrag.dragStart(el);
      await flushRaf();
      await dragOver(inner);
      // Leave every target, so the stack empties.
      fireDrag.dragLeave();
      await flushRaf();

      for (const handler of Object.values(handlers)) {
        const calls = handler.mock.calls as [DropTargetChangeEventDetails][];
        expect(calls.map(([details]) => details.target?.element ?? null)).toEqual(
          expect.arrayContaining([inner, null]),
        );
        for (const [details] of calls) {
          expect(details.target).toBe(details.location.current.targets[0] ?? null);
        }
      }

      act(() => {
        cancelDrag();
      });
    });

    it('fires onDraggableEnter on the drop targets already under the pointer at pickup', async () => {
      // No `onTargetChange` round diffs the initial stack into existence, yet it
      // is published in the session (`data-over` is set) and gets a
      // terminal `onDraggableLeave`. It needs its own enter to open that pair.
      await renderDnd();
      const under = createElement();
      const onMoveStart = vi.fn();
      const onDraggableEnter = vi.fn();
      const onDraggableLeave = vi.fn();
      const getUnderParams = () => ({
        onDraggableStart: onMoveStart,
        onDraggableEnter,
        onDraggableLeave,
      });
      addDropTargetRegistration(under, getUnderParams);

      const source = createElement();
      under.appendChild(source);
      act(() => {
        start({
          source: createDragSource(source, TEST_KIND.id, {}, null),
          getSourceHandlers: () => ({}),
          initialInput: makeInput(),
          initialTarget: source,
          startReason: 'pointer',
          grabOffset: { x: 0, y: 0 },
          hitTest,
        });
      });

      expect(onDraggableEnter).toHaveBeenCalledTimes(1);
      expect(onDraggableEnter).toHaveBeenCalledWith(
        expect.objectContaining({
          currentTarget: expect.objectContaining({ element: under }),
          reason: 'pointer',
        }),
      );
      // `onMoveStart` stays ahead of every enter, so a collection that keys off it
      // has its dragged-item set built before any target reacts.
      expect(onMoveStart.mock.invocationCallOrder[0]).toBeLessThan(
        onDraggableEnter.mock.invocationCallOrder[0],
      );
      expect(onDraggableLeave).not.toHaveBeenCalled();

      // The terminal leave balances the enter exactly once.
      act(() => {
        cancelDrag();
      });
      expect(onDraggableEnter).toHaveBeenCalledTimes(1);
      expect(onDraggableLeave).toHaveBeenCalledTimes(1);
    });

    it('owes no leave to a target whose initial enter never ran', async () => {
      // The stack is entered one record at a time, so a handler that cancels the
      // drag from its own enter leaves the outer targets un-entered. Only an enter
      // that ran is owed a terminal `onDraggableLeave`.
      await renderDnd();
      const outer = createElement();
      const inner = createElement();
      outer.appendChild(inner);

      const outerEnter = vi.fn();
      const outerLeave = vi.fn();
      const innerEnter = vi.fn(() => cancelDrag());
      const innerLeave = vi.fn();
      // Innermost first, which is the order the stack is resolved and entered in.
      const getInnerParams = () => ({ onDraggableEnter: innerEnter, onDraggableLeave: innerLeave });
      const getOuterParams = () => ({ onDraggableEnter: outerEnter, onDraggableLeave: outerLeave });
      addDropTargetRegistration(inner, getInnerParams);
      addDropTargetRegistration(outer, getOuterParams);

      const source = createElement();
      inner.appendChild(source);
      act(() => {
        start({
          source: createDragSource(source, TEST_KIND.id, {}, null),
          getSourceHandlers: () => ({}),
          initialInput: makeInput(),
          initialTarget: source,
          startReason: 'pointer',
          grabOffset: { x: 0, y: 0 },
          hitTest,
        });
      });

      expect(innerEnter).toHaveBeenCalledTimes(1);
      expect(innerLeave).toHaveBeenCalledTimes(1);
      expect(outerEnter).not.toHaveBeenCalled();
      expect(outerLeave).not.toHaveBeenCalled();
    });

    it('enters and then leaves an initial target that unregisters while the drag starts', async () => {
      // The target unregisters from `onGenerateDragPreview`, before the initial
      // stack is published. It is still entered with that stack, and the leave it
      // is then owed goes out right after `onMoveStart`.
      await renderDnd();
      const under = createElement();
      const order: string[] = [];
      const unregister = registerTarget(under, () => ({
        accept: TEST_KIND,
        onDraggableEnter: () => order.push('enter'),
        onDraggableLeave: () => order.push('leave'),
      }));
      const pickupTarget = createElement();
      under.appendChild(pickupTarget);

      act(() => {
        startDragWithHandlers(
          { onGenerateDragPreview: unregister, onMoveStart: () => order.push('start') },
          pickupTarget,
        );
      });

      expect(order).toEqual(['start', 'enter', 'leave']);
    });
  });

  describe('drop target hierarchy changes', () => {
    it('fires onTargetChange with the new target when moving between sibling targets', async () => {
      const { engine } = await renderDnd();
      const el = createElement();
      const target1 = createElement();
      const target2 = createElement();
      const onTargetChange = vi.fn();

      engine.registerSource(el, {});
      engine.registerTarget(target1, {});
      engine.registerTarget(target2, {});
      engine.registerMonitor({ onTargetChange });

      fireDrag.dragStart(el);
      await flushRaf();

      await dragEnter(target1);
      expect(onTargetChange).toHaveBeenCalledTimes(1);
      expect(onTargetChange.mock.calls[0][0].target?.element).toBe(target1);

      await dragEnter(target2);
      expect(onTargetChange).toHaveBeenCalledTimes(2);
      expect(onTargetChange.mock.calls[1][0].target?.element).toBe(target2);
    });
  });

  describe('mid-drag drop-target refresh', () => {
    it('refreshes an excluded ancestor across a shadow slot', async () => {
      const host = createElement();
      const root = host.attachShadow({ mode: 'open' });
      const target = document.createElement('div');
      const slot = document.createElement('slot');
      root.appendChild(target);
      target.appendChild(slot);
      const child = document.createElement('div');
      host.appendChild(child);
      let disabled = true;
      const getTarget = () => ({ disabled });
      addDropTargetRegistration(target, getTarget);
      let handle: DragSessionController | null = null;
      act(() => {
        handle = startDragWithHandlers({}, child);
      });
      expect(dragSessionStore.getSnapshot()?.location.current.targets).toEqual([]);

      disabled = false;
      getActiveSession()?.scheduleTargetRefresh(target);
      await act(async () => Promise.resolve());
      expect(dragSessionStore.getSnapshot()?.location.current.targets[0]?.element).toBe(target);

      act(() => handle!.cancel());
    });

    it('coalesces registration and parameter refreshes while preserving the hit test', async () => {
      const previousTarget = createElement();
      const newTarget = createElement();
      const canDrop = vi.fn(() => true);
      const getTarget = () => ({ canDrop });
      addDropTargetRegistration(newTarget, getTarget);
      let handle: DragSessionController | null = null;
      act(() => {
        handle = startDragWithHandlers({}, previousTarget);
      });
      const hitTest = vi.spyOn(document, 'elementFromPoint').mockReturnValue(newTarget);

      getActiveSession()?.scheduleTargetRefresh(previousTarget);
      getActiveSession()?.scheduleTargetRefresh(null, true);
      getActiveSession()?.scheduleTargetRefresh(previousTarget);
      await act(async () => Promise.resolve());

      expect(hitTest).toHaveBeenCalledTimes(1);
      expect(canDrop).toHaveBeenCalledTimes(1);
      expect(dragSessionStore.getSnapshot()?.location.current.targets[0]?.element).toBe(newTarget);
      act(() => handle!.cancel());
    });

    it('does not let a stale session suppress a parameter refresh for the next drag', async () => {
      const targetA = createElement();
      const targetB = createElement();
      const getTargetA = vi.fn(() => ({}));
      const getTargetB = vi.fn(() => ({}));
      addDropTargetRegistration(targetA, getTargetA);
      addDropTargetRegistration(targetB, getTargetB);

      let first: DragSessionController | null = null;
      act(() => {
        first = startDragWithHandlers({}, targetA);
        getActiveSession()?.scheduleTargetRefresh(null);
        first!.cancel();
      });

      let second: DragSessionController | null = null;
      act(() => {
        second = startDragWithHandlers({}, targetB);
      });
      const callsAtStart = getTargetB.mock.calls.length;

      getActiveSession()?.scheduleTargetRefresh(null);
      await act(async () => Promise.resolve());

      expect(getTargetB).toHaveBeenCalledTimes(callsAtStart + 1);

      act(() => {
        second!.cancel();
      });
    });

    it('re-hit-tests a parameter refresh whose last target was detached', async () => {
      // A parameter refresh walks up from the last resolved target instead of
      // hit-testing. If a virtualizer removed that node, the walk finds nothing and
      // would leave every hovered target though the pointer never moved.
      await renderDnd();
      const target = createElement();
      const child = document.createElement('div');
      target.appendChild(child);
      const onDraggableLeave = vi.fn();
      const getTarget = () => ({ onDraggableLeave });
      addDropTargetRegistration(target, getTarget);

      let handle: DragSessionController | null = null;
      act(() => {
        handle = startDragWithHandlers({}, child);
      });
      expect(dragSessionStore.getSnapshot()?.location.current.targets[0]?.element).toBe(target);

      child.remove();
      mockElementFromPoint(() => target);
      getActiveSession()?.scheduleTargetRefresh(target);
      await act(async () => Promise.resolve());

      expect(onDraggableLeave).not.toHaveBeenCalled();
      expect(dragSessionStore.getSnapshot()?.location.current.targets[0]?.element).toBe(target);

      act(() => {
        handle!.cancel();
      });
    });

    it('drains a hovered target unregistering inside canDrop without restoring stale hover state', async () => {
      const { engine } = await renderDnd();
      const source = createElement();
      const target = createElement();
      let unregisterDuringResolution = false;
      const onDraggableLeave = vi.fn();
      engine.registerSource(source, {});
      const cleanup = engine.registerTarget(target, {
        canDrop: () => {
          if (unregisterDuringResolution) {
            unregisterDuringResolution = false;
            cleanup();
          }
          return true;
        },
        onDraggableLeave,
      });
      fireDrag.dragStart(source);
      await dragEnter(target);
      expect(dragSessionStore.getSnapshot()?.location.current.targets[0]?.element).toBe(target);

      unregisterDuringResolution = true;
      await dragOver(target, { clientX: 20 });

      expect(dragSessionStore.getSnapshot()?.location.current.targets).toEqual([]);
      expect(onDraggableLeave).toHaveBeenCalledTimes(1);
      fireDrag.dragEnd();
      expect(onDraggableLeave).toHaveBeenCalledTimes(1);
    });

    it('delivers onMove once per frame when a hovered target unregisters during the change round', async () => {
      // The sensor `update` path resolves the stack without the entry `onMove`,
      // since `dispatchDrag()` follows. A handler that unregisters a hovered target
      // mid-round queues a refresh that drains before `dispatchDrag()`. That round
      // must skip the entry `onMove` too, or the targets get it twice in one frame.
      const { engine } = await renderDnd();
      const source = createElement();
      const parent = createElement();
      const child = document.createElement('div');
      parent.appendChild(child);
      const parentOnDrag = vi.fn();
      engine.registerSource(source, {});
      engine.registerTarget(parent, { onDraggableMove: parentOnDrag });
      const cleanupChild = engine.registerTarget(child, {
        onDraggableEnter: () => cleanupChild(),
      });

      fireDrag.dragStart(source);
      await flushRaf();
      expect(parentOnDrag).not.toHaveBeenCalled();

      await dragEnter(child);

      expect(parentOnDrag).toHaveBeenCalledTimes(1);
      const elements = dragSessionStore
        .getSnapshot()
        ?.location.current.targets.map((record) => record.element);
      expect(elements).toEqual([parent]);
    });
  });

  describe('hovered target unregistering', () => {
    it('re-walks from the last target without a hit test when a hovered target unregisters', async () => {
      // A React unmount runs the unregister from the ref cleanup, inside the
      // commit and before the node leaves the DOM. An `elementFromPoint` there
      // forces a synchronous layout, and the walk from the last resolved target
      // already excludes the retiring element.
      const { engine } = await renderDnd();
      const source = createElement();
      const target = createElement();
      const onDraggableLeave = vi.fn();
      engine.registerSource(source, {});
      const cleanup = engine.registerTarget(target, { onDraggableLeave });

      fireDrag.dragStart(source);
      await flushRaf();
      fireDrag.dragEnter(target);
      await dragOver(target);
      expect(dragSessionStore.getSnapshot()?.location.current.targets[0]?.element).toBe(target);

      const hitTest = vi.spyOn(document, 'elementFromPoint');
      try {
        cleanup();
        expect(hitTest).not.toHaveBeenCalled();
      } finally {
        hitTest.mockRestore();
      }
      expect(onDraggableLeave).toHaveBeenCalledTimes(1);
      expect(dragSessionStore.getSnapshot()?.location.current.targets).toEqual([]);

      fireDrag.dragEnd();
    });

    it('delivers the outer terminal leave when the inner leave unregisters it on drop', async () => {
      // The terminal leaves go out one target at a time. After the inner one,
      // the outer must still read as hovered, so its unregister takes the
      // synchronous path that keeps its registration readable for its own leave.
      const { engine } = await renderDnd();
      const source = createElement();
      const outer = createElement();
      const inner = document.createElement('div');
      outer.appendChild(inner);
      const outerLeave = vi.fn();
      engine.registerSource(source, {});
      const cleanupOuter = engine.registerTarget(outer, { onDraggableLeave: outerLeave });
      engine.registerTarget(inner, { onDraggableLeave: () => cleanupOuter() });

      fireDrag.dragStart(source);
      await flushRaf();
      fireDrag.dragEnter(inner);
      await dragOver(inner);
      const elements = dragSessionStore
        .getSnapshot()
        ?.location.current.targets.map((record) => record.element);
      expect(elements).toEqual([inner, outer]);

      fireDrag.drop(inner);

      expect(outerLeave).toHaveBeenCalledTimes(1);
      expect(outerLeave.mock.calls[0][0].reason).toBe('drop');
      expect(dragSessionStore.getSnapshot()).toBeNull();
    });
  });

  describe('drag cancellation', () => {
    it('reports a release over no target as outside-release, not a cancel', async () => {
      const { engine } = await renderDnd();
      const el = createElement();
      const onMoveEnd = vi.fn();
      const onDrop = vi.fn();

      engine.registerSource(el, {});
      engine.registerMonitor({
        onMoveEnd: splitEnd(onDrop, onMoveEnd),
      });

      fireDrag.dragStart(el);
      await flushRaf();

      // A release over no accepting target has no cancel reason, so committing on
      // the reason alone would be wrong. Only a non-null `target` marks a drop.
      fireDrag.drop(el);

      expect(onDrop).not.toHaveBeenCalled();
      expect(onMoveEnd).toHaveBeenCalledTimes(1);
      expect(onMoveEnd).toHaveBeenCalledWith(
        expect.objectContaining({ target: null, reason: 'outside-release', canceled: false }),
      );
    });

    it('does not fire target onDrop when drag is cancelled', async () => {
      const { engine } = await renderDnd();
      const el = createElement();
      const target = createElement();
      const targetOnDrop = vi.fn();
      const targetOnDropTargetChange = vi.fn();
      const targetOnDragLeave = vi.fn();
      const monitorOnDrop = vi.fn();

      engine.registerSource(el, {});
      engine.registerTarget(target, {
        onDraggableDrop: targetOnDrop,
        onDraggableEnter: targetOnDropTargetChange,
        onDraggableLeave: targetOnDragLeave,
      });
      engine.registerMonitor({ onMoveEnd: monitorOnDrop });

      fireDrag.dragStart(el);
      await flushRaf();

      await dragEnter(target);
      expect(targetOnDropTargetChange).toHaveBeenCalledTimes(1);

      fireDrag.dragEnd();

      expect(targetOnDrop).not.toHaveBeenCalled();
      expect(targetOnDropTargetChange).toHaveBeenCalledTimes(1);
      // On the cancel path the terminal leave runs before the source's
      // `onMoveEnd`, so this assertion passes either way. The monitor assertions
      // below are the ones that matter.
      expect(targetOnDragLeave).toHaveBeenCalledTimes(1);
      expect(monitorOnDrop).toHaveBeenCalledTimes(1);
      expect(monitorOnDrop.mock.calls[0][0].target).toBeNull();
      expect(monitorOnDrop.mock.calls[0][0].location.current.targets).toEqual([]);
    });
  });

  describe('drop event handling', () => {
    it('enters a never-hovered target at drop, before its onDrop', async () => {
      const { engine } = await renderDnd();
      const el = createElement();
      const target = createElement();
      const events: string[] = [];

      engine.registerSource(el, { onMoveEnd: () => events.push('end') });
      engine.registerTarget(target, {
        onDraggableEnter: () => events.push('enter'),
        onDraggableDrop: () => events.push('drop'),
      });

      // Lift and release on the target with no hover in between. The stack
      // resolved at drop differs from the last update, so the reconcile sends the
      // target `onDraggableEnter` before the drop.
      fireDrag.dragStart(el);
      await flushRaf();
      fireDrag.drop(target);

      expect(events.indexOf('enter')).toBeGreaterThanOrEqual(0);
      expect(events.indexOf('enter')).toBeLessThan(events.indexOf('drop'));
      expect(events).toContain('end');
    });

    it("delivers the source's end before the target's drop, with a committed drop only, with a non-null target", async () => {
      const { engine } = await renderDnd();
      const el = createElement();
      const target = createElement();
      const events: string[] = [];
      // Typed through the parameter list so `mock.calls[0]` keeps its argument.
      const onDrop = vi.fn((_: DragDropEventDetails) => {
        events.push('source-drop');
      });
      const onMoveEnd = vi.fn((_: MoveEndEventDetails) => {
        events.push('source-end');
      });

      engine.registerSource(el, {
        onMoveEnd: splitEnd(onDrop, onMoveEnd),
      });
      engine.registerTarget(target, { onDraggableDrop: () => events.push('target-drop') });

      fireDrag.dragStart(el);
      await flushRaf();
      fireDrag.drop(target);

      // The commit runs before the cleanup, and the source end still runs before
      // the target drop.
      expect(events).toEqual(['source-drop', 'source-end', 'target-drop']);
      expect(onDrop.mock.calls[0][0].target.element).toBe(target);
      expect(onDrop.mock.calls[0][0].reason).toBe('drop');
      expect(onMoveEnd.mock.calls[0][0].reason).toBe('drop');
      expect(onMoveEnd.mock.calls[0][0].canceled).toBe(false);
    });

    it("pins the source's own onTargetChange payload and ordering", async () => {
      // Covers the source's own `onTargetChange`, which otherwise only the
      // throw-recovery test reaches.
      const { engine } = await renderDnd();
      const el = createElement();
      const target = createElement();
      const order: string[] = [];
      const onTargetChange = vi.fn((_: DropTargetChangeEventDetails) => {
        order.push('source');
      });

      engine.registerSource(el, { onTargetChange });
      engine.registerTarget(target, {
        onDraggableEnter: () => order.push('enter'),
      });

      fireDrag.dragStart(el);
      await flushRaf();
      fireDrag.dragEnter(target);
      await dragOver(target);

      expect(onTargetChange).toHaveBeenCalled();
      const [details] = onTargetChange.mock.calls[0];
      expect(details.source.element).toBe(el);
      expect(details.target?.element).toBe(target);
      expect(details.location.current.targets[0].element).toBe(target);
      // The source hears about the change before any target does.
      expect(order[0]).toBe('source');
      expect(order).toContain('enter');

      act(() => {
        cancelDrag();
      });
    });

    it("reports each drag handler's reason on its details", async () => {
      const { engine } = await renderDnd();
      const el = createElement();
      const target = createElement();
      const reasons: Record<string, string> = {};
      const record = (name: string) => (eventDetails: { reason: string }) => {
        reasons[name] = eventDetails.reason;
      };

      engine.registerSource(el, {
        onMoveStart: record('start'),
        onMove: record('drag'),
        onTargetChange: record('change'),
      });
      engine.registerTarget(target, {
        onDraggableEnter: record('enter'),
        onDraggableLeave: record('leave'),
      });

      fireDrag.dragStart(el);
      await flushRaf();
      fireDrag.dragEnter(target);
      await dragOver(target);
      fireDrag.drop(target);

      expect(reasons.start).toBe('pointer');
      expect(reasons.drag).toBe('pointer');
      expect(reasons.enter).toBe('pointer');
      // The drag ending causes the terminal leave, not an input moving, so its
      // reason is the end reason.
      expect(reasons.leave).toBe('drop');
    });
  });

  describe('force-cleanup', () => {
    it('reset() called mid-drag tears the engine down so a fresh drag can start', async () => {
      const { engine } = await renderDnd();
      const el1 = createElement();
      const el2 = createElement();
      const onDragStart1 = vi.fn();
      const onDragStart2 = vi.fn();
      const onDragEnd1 = vi.fn();

      engine.registerSource(el1, { onMoveStart: onDragStart1, onMoveEnd: onDragEnd1 });
      engine.registerSource(el2, { onMoveStart: onDragStart2 });

      fireDrag.dragStart(el1);
      await flushRaf();
      expect(onDragStart1).toHaveBeenCalledTimes(1);

      // The test suite's afterEach calls `reset()` while a drag may still be
      // in flight.
      act(() => {
        resetForTests();
      });

      // Without the teardown, the lifecycle would stay active and this drag would
      // do nothing.
      fireDrag.dragStart(el2);
      await flushRaf();
      expect(onDragStart2).toHaveBeenCalledTimes(1);
    });

    it.each([
      ['a cancel', () => cancelDrag(), ['release:imperative-action', 'end']],
      [
        'a drop',
        (handle: DragSessionController) => handle.drop(makeInput(), null),
        ['release:', 'end'],
      ],
      // A reset delivers no terminal event, but the sensor still lets go.
      ['a test reset', () => resetForTests(), ['release:handler-error']],
    ] as const)(
      'releases the sensor once, before the terminal events, after %s',
      (_, end, expected) => {
        const element = createElement();
        const order: string[] = [];
        const handle = start({
          source: createDragSource(element, TEST_KIND.id, {}, null),
          getSourceHandlers: () => ({ onMoveEnd: () => order.push('end') }),
          initialInput: makeInput(),
          initialTarget: null,
          startReason: 'pointer',
          grabOffset: { x: 0, y: 0 },
          hitTest,
          sensor: {
            getRawInput: () => null,
            notifyScroll() {},
            release: (cancelReason) => order.push(`release:${cancelReason ?? ''}`),
          },
        });

        act(() => {
          end(handle!);
        });

        // The sensor's listeners, pointer capture, locks and preview go before any
        // terminal event.
        expect(order).toEqual(expected);
        expect(getActiveSession()).toBe(null);
      },
    );
  });

  describe('consumer-throw recovery', () => {
    // The drop, cancel, and update paths tear the session down before rethrowing a
    // consumer error, or every later drag on the page would do nothing. These tests
    // drive the controller directly so the rethrow can be asserted synchronously.
    // Through a real event listener, it surfaces as an unhandled error under jsdom.
    /** After a handler throws, the engine must be inactive and able to start a new drag. */
    function expectEngineRecovered(): void {
      expect(getActiveSession()).toBe(null);
      // A new drag must start, which proves that no state leaked.
      const onMoveStart = vi.fn();
      const handle = startDragWithHandlers({ onMoveStart });
      expect(handle).not.toBeNull();
      expect(getActiveSession()).not.toBe(null);
      act(() => {
        resetForTests();
      });
    }

    it('delivers a best-effort onMoveEnd before tearing down, so start/end still pairs', () => {
      const target = createElement();
      const onMoveEnd = vi.fn();
      const monitorEnd = vi.fn();
      const getTargetParams = () => ({
        onDraggableEnter: () => {
          throw new Error('boom from onDraggableEnter');
        },
      });
      addDropTargetRegistration(target, getTargetParams);
      const getMonitor = () => ({ onMoveEnd: monitorEnd });
      addMonitor(getMonitor);
      registerCleanup(() => removeMonitor(getMonitor));

      const handle = startDragWithHandlers({ onMoveEnd });
      expect(handle).not.toBeNull();

      // A target handler throws mid-drag. The engine tears down either way, but
      // consumer state tied to the start and end pair must still be closed.
      act(() => {
        expect(() =>
          handle!.update(makeInput(), target, new Event('pointermove'), 'pointer'),
        ).toThrow('boom from onDraggableEnter');
      });

      expect(onMoveEnd).toHaveBeenCalledTimes(1);
      expect(onMoveEnd.mock.calls[0][0].target).toBeNull();
      expect(onMoveEnd.mock.calls[0][0].location.current.targets).toEqual([]);
      expect(onMoveEnd.mock.calls[0][0].reason).toBe('handler-error');
      expect(onMoveEnd.mock.calls[0][0].canceled).toBe(true);
      expect(monitorEnd).toHaveBeenCalledTimes(1);
      expect(getActiveSession()).toBe(null);
    });

    it.each([
      { name: 'manager cancellation', end: () => cancelDrag() },
      { name: 'controller cancellation', end: (handle: DragSessionController) => handle.cancel() },
      {
        name: 'controller drop',
        end: (handle: DragSessionController) => handle.drop(makeInput(), null),
      },
    ])('ignores $name from recovery callbacks', ({ end }) => {
      let handle: DragSessionController | null = null;
      let ended = false;
      const onMoveEnd = vi.fn<NonNullable<SourceHandlers['onMoveEnd']>>(() => {
        // Once, so an unguarded end can't recurse.
        if (!ended) {
          ended = true;
          end(handle!);
        }
      });
      const monitorEnd = vi.fn();
      const getMonitor = () => ({ onMoveEnd: monitorEnd });
      addMonitor(getMonitor);
      registerCleanup(() => removeMonitor(getMonitor));
      handle = startDragWithHandlers({
        onMove: () => {
          throw new Error('boom from onMove');
        },
        onMoveEnd,
      });
      act(() => {
        expect(() =>
          handle!.update(makeInput(), null, new Event('pointermove'), 'pointer'),
        ).toThrow('boom from onMove');
      });
      expect(onMoveEnd).toHaveBeenCalledTimes(1);
      expect(onMoveEnd.mock.calls[0][0].reason).toBe('handler-error');
      expect(monitorEnd).toHaveBeenCalledTimes(1);
      expect(monitorEnd.mock.calls[0][0].reason).toBe('handler-error');
      expectEngineRecovered();
    });

    it('delivers a terminal leave to hovered targets before handler-error teardown', () => {
      const target = createElement();
      const onDraggableEnter = vi.fn();
      const onDraggableLeave = vi.fn();
      const getTargetParams = () => ({ onDraggableEnter, onDraggableLeave });
      addDropTargetRegistration(target, getTargetParams);

      const handle = startDragWithHandlers({
        onMove: () => {
          throw new Error('boom from onMove');
        },
      });
      expect(handle).not.toBeNull();

      act(() => {
        expect(() =>
          handle!.update(makeInput(), target, new Event('pointermove'), 'pointer'),
        ).toThrow('boom from onMove');
      });
      expect(onDraggableEnter).toHaveBeenCalledTimes(1);

      expect(onDraggableLeave).toHaveBeenCalledTimes(1);
      expect(onDraggableLeave.mock.calls[0][0].reason).toBe('handler-error');
      expect(onDraggableLeave.mock.calls[0][0]).not.toHaveProperty('canceled');
      expectEngineRecovered();
    });

    it('does not double-dispatch onMoveEnd when onMoveEnd itself throws', () => {
      const onMoveEnd = vi.fn(() => {
        throw new Error('boom from onMoveEnd');
      });
      const handle = startDragWithHandlers({ onMoveEnd });

      act(() => {
        expect(() => handle!.cancel(makeInput())).toThrow('boom from onMoveEnd');
      });

      // The recovery path must not deliver a second terminal event for the same drag.
      expect(onMoveEnd).toHaveBeenCalledTimes(1);
      expect(getActiveSession()).toBe(null);
    });

    it("a throwing source onDrop still lets the target's onDrop and the terminal leave run", () => {
      const target = createElement();
      const targetOnDrop = vi.fn();
      const targetOnDragLeave = vi.fn();
      const monitorDrop = vi.fn();
      const monitorEnd = vi.fn();
      const getTargetParams = () => ({
        onDraggableDrop: targetOnDrop,
        onDraggableLeave: targetOnDragLeave,
      });
      addDropTargetRegistration(target, getTargetParams);
      const getMonitor = () => ({
        onMoveEnd: splitEnd(monitorDrop, monitorEnd),
      });
      addMonitor(getMonitor);
      registerCleanup(() => removeMonitor(getMonitor));

      const sourceOnDragEnd = vi.fn();
      const handle = startDragWithHandlers({
        onMoveEnd: (moveDetails) => {
          try {
            if (moveDetails.reason === 'drop' && moveDetails.target !== null) {
              (() => {
                throw new Error('boom from source onDrop');
              })();
            }
          } finally {
            sourceOnDragEnd(moveDetails);
          }
        },
      });
      expect(handle).not.toBeNull();

      // As elsewhere in the engine, a throwing source terminal handler loses only
      // its own callback. Uncontained, it would skip every later notification,
      // which `dispatchRecoveryEnd` can't replay once `endDispatched` is set. The
      // error still surfaces, but last.
      act(() => {
        expect(() => handle!.drop(makeInput(), target)).toThrow('boom from source onDrop');
      });

      expect(sourceOnDragEnd).toHaveBeenCalledTimes(1);
      expect(targetOnDrop).toHaveBeenCalledTimes(1);
      expect(monitorDrop).toHaveBeenCalledTimes(1);
      expect(monitorEnd).toHaveBeenCalledTimes(1);
      expect(targetOnDragLeave).toHaveBeenCalledTimes(1);
      expectEngineRecovered();
    });

    it('a throwing target onDrop still lets monitors and terminal leaves run', () => {
      const target = createElement();
      const targetOnDragLeave = vi.fn();
      const monitorDrop = vi.fn();
      const monitorEnd = vi.fn();
      const getTargetParams = () => ({
        onDraggableDrop: () => {
          throw new Error('boom from target onDrop');
        },
        onDraggableLeave: targetOnDragLeave,
      });
      addDropTargetRegistration(target, getTargetParams);
      const getMonitor = () => ({
        onMoveEnd: splitEnd(monitorDrop, monitorEnd),
      });
      addMonitor(getMonitor);
      registerCleanup(() => removeMonitor(getMonitor));

      const sourceOnDragEnd = vi.fn();
      const handle = startDragWithHandlers({ onMoveEnd: sourceOnDragEnd });

      act(() => {
        expect(() => handle!.drop(makeInput(), target)).toThrow('boom from target onDrop');
      });

      expect(sourceOnDragEnd).toHaveBeenCalledTimes(1);
      expect(monitorDrop).toHaveBeenCalledTimes(1);
      expect(monitorEnd).toHaveBeenCalledTimes(1);
      expect(targetOnDragLeave).toHaveBeenCalledTimes(1);
      expectEngineRecovered();
    });

    it('a throwing source onMoveEnd on cancel still reaches the monitors', () => {
      const target = createElement();
      const targetOnDragLeave = vi.fn();
      const monitorEnd = vi.fn();
      const getTargetParams = () => ({ onDraggableLeave: targetOnDragLeave });
      addDropTargetRegistration(target, getTargetParams);
      const getMonitor = () => ({ onMoveEnd: monitorEnd });
      addMonitor(getMonitor);
      registerCleanup(() => removeMonitor(getMonitor));

      const handle = startDragWithHandlers({
        onMoveEnd: () => {
          throw new Error('boom from source onMoveEnd');
        },
      });

      // Enter the target so it holds hover state and is owed a terminal leave.
      act(() => {
        handle!.update(makeInput(), target, new Event('pointermove'), 'pointer');
      });
      expect(targetOnDragLeave).not.toHaveBeenCalled();

      act(() => {
        expect(() => handle!.cancel(makeInput())).toThrow('boom from source onMoveEnd');
      });

      expect(monitorEnd).toHaveBeenCalledTimes(1);
      expect(targetOnDragLeave).toHaveBeenCalledTimes(1);
      expectEngineRecovered();
    });

    it('a throwing monitor is contained and does not starve the others', async () => {
      const { engine } = await renderDnd();
      const el = createElement();
      const second = vi.fn();

      engine.registerSource(el, {});
      engine.registerMonitor({
        onMoveStart: () => {
          throw new Error('boom from a monitor');
        },
      });
      engine.registerMonitor({ onMoveStart: second });

      // Contained per monitor, like each drop target's dispatch.
      const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
      fireDrag.dragStart(el);
      await flushRaf();

      expect(second).toHaveBeenCalledTimes(1);
      expect(spy).toHaveBeenCalled();
      spy.mockRestore();
      act(() => {
        cancelDrag();
      });
    });

    it('a throwing onGenerateDragPreview (synchronous in start) tears the session down', () => {
      // `start()` dispatches `onGenerateDragPreview` before it returns a handle. A
      // throw there would leave the engine half-built, still active with live
      // monitors, unless `start()` tears everything down before rethrowing.
      expect(() =>
        startDragWithHandlers({
          onGenerateDragPreview: () => {
            throw new Error('boom from onGenerateDragPreview');
          },
        }),
      ).toThrow('boom from onGenerateDragPreview');
      expectEngineRecovered();
    });

    it('a throwing onMoveStart (synchronous in start) tears the session down', () => {
      expect(() =>
        startDragWithHandlers({
          onMoveStart: () => {
            throw new Error('boom from onMoveStart');
          },
        }),
      ).toThrow('boom from onMoveStart');
      expectEngineRecovered();
    });

    it('a throwing onTargetChange tears the session down', () => {
      // Only a stack change reaches `onTargetChange`, hence the real drop target.
      const targetEl = createElement();
      const getParameters = () => ({});
      addDropTargetRegistration(targetEl, getParameters);

      const handle = startDragWithHandlers({
        onTargetChange: () => {
          throw new Error('boom from onTargetChange');
        },
      });
      expect(handle).not.toBeNull();
      expect(() =>
        handle!.update(makeInput(), targetEl, new Event('pointermove'), 'pointer'),
      ).toThrow('boom from onTargetChange');

      removeDropTargetRegistration(targetEl, getParameters);
      expectEngineRecovered();
    });

    it('a throw after a re-entrant cancel and restart leaves the new drag running', () => {
      // The handler ends its own drag and starts another before throwing, so by
      // the time the throw is recovered a different session owns the engine.
      let second: DragSessionController | null = null;
      const handle = startDragWithHandlers({
        onMove: () => {
          cancelDrag();
          second = startDragWithHandlers({});
          throw new Error('boom from onMove');
        },
      });
      expect(handle).not.toBeNull();

      act(() => {
        expect(() =>
          handle!.update(makeInput(), null, new Event('pointermove'), 'pointer'),
        ).toThrow('boom from onMove');
      });

      expect(second).not.toBeNull();
      expect(getActiveSession()).not.toBe(null);
      expect(dragSessionStore.getSnapshot()).not.toBeNull();

      act(() => {
        second!.cancel();
      });
      expect(getActiveSession()).toBe(null);
    });
  });

  describe('programmatic cancel during start dispatches', () => {
    it('cancelDrag() from a source onMoveStart ends the drag as canceled', async () => {
      // The sensors record their session only after `start()` returns, so a
      // cancel from the synchronous start dispatches can only reach the session
      // through the lifecycle-level fallback.
      const { engine } = await renderDnd();
      const el = createElement();
      const onMoveStart = vi.fn(() => cancelDrag());
      const onMoveEnd = vi.fn();
      const monitorOnDragStart = vi.fn();
      const monitorOnDragEnd = vi.fn();
      engine.registerSource(el, { onMoveStart, onMoveEnd });
      engine.registerMonitor({ onMoveStart: monitorOnDragStart, onMoveEnd: monitorOnDragEnd });

      fireDrag.dragStart(el);

      expect(onMoveStart).toHaveBeenCalledTimes(1);
      expect(onMoveEnd).toHaveBeenCalledTimes(1);
      expect(onMoveEnd.mock.calls[0][0].target).toBeNull();
      expect(onMoveEnd.mock.calls[0][0].reason).toBe('imperative-action');
      expect(onMoveEnd.mock.calls[0][0].canceled).toBe(true);
      expect(monitorOnDragEnd).toHaveBeenCalledTimes(1);
      expect(monitorOnDragEnd.mock.calls[0][0].canceled).toBe(true);
      // The drag ended before the start fan-out reached the monitors. A start
      // after the end would reverse the lifecycle order.
      expect(monitorOnDragStart).not.toHaveBeenCalled();
      expect(getActiveSession()).toBe(null);

      // The sensor released its resources through the refused-session path, so
      // a new drag starts.
      const el2 = createElement();
      const onDragStart2 = vi.fn();
      engine.registerSource(el2, { onMoveStart: onDragStart2 });
      fireDrag.dragStart(el2);
      await flushRaf();
      expect(onDragStart2).toHaveBeenCalledTimes(1);
    });

    it('cancelDrag() from the internal onGenerateDragPreview cancels before onMoveStart', async () => {
      // `start()` runs the engine's preview hook, and with it the consumer's
      // preview `render`, before the sensor records its session. A cancel from it
      // reaches the session only through the lifecycle-level fallback.
      const { engine } = await renderDnd();
      const onMoveStart = vi.fn();
      const onMoveEnd = vi.fn();
      const monitorOnDragStart = vi.fn();
      engine.registerMonitor({ onMoveStart: monitorOnDragStart });

      const handle = startDragWithHandlers({
        onGenerateDragPreview: () => cancelDrag(),
        onMoveStart,
        onMoveEnd,
      });

      expect(handle).toBeNull();
      expect(onMoveStart).not.toHaveBeenCalled();
      expect(monitorOnDragStart).not.toHaveBeenCalled();
      expect(onMoveEnd).toHaveBeenCalledTimes(1);
      expect(onMoveEnd.mock.calls[0][0].target).toBeNull();
      expect(onMoveEnd.mock.calls[0][0].reason).toBe('imperative-action');
      expect(getActiveSession()).toBe(null);
    });

    it('cancelDrag() from an initial-stack canDrop ends the drag before it starts', async () => {
      // The stack under the pickup point runs consumer resolvers inside `start()`,
      // before the sensor records its session. The lifecycle-level cancel hook is
      // armed first, so a cancel there ends the drag instead of being ignored.
      const { engine } = await renderDnd();
      const target = createElement();
      const onMoveStart = vi.fn();
      const onMoveEnd = vi.fn();
      const monitorOnDragStart = vi.fn();
      const monitorOnDragEnd = vi.fn();
      const targetOnDragStart = vi.fn();
      const targetOnDragEnter = vi.fn();
      engine.registerMonitor({ onMoveStart: monitorOnDragStart, onMoveEnd: monitorOnDragEnd });
      engine.registerTarget(target, {
        canDrop: () => {
          cancelDrag();
          return true;
        },
        onDraggableStart: targetOnDragStart,
        onDraggableEnter: targetOnDragEnter,
      });

      let handle: DragSessionController | null = null;
      act(() => {
        handle = startDragWithHandlers({ onMoveStart, onMoveEnd }, target);
      });

      expect(handle).toBeNull();
      expect(onMoveStart).not.toHaveBeenCalled();
      expect(monitorOnDragStart).not.toHaveBeenCalled();
      expect(targetOnDragStart).not.toHaveBeenCalled();
      expect(targetOnDragEnter).not.toHaveBeenCalled();
      expect(onMoveEnd).toHaveBeenCalledTimes(1);
      expect(onMoveEnd.mock.calls[0][0].target).toBeNull();
      expect(onMoveEnd.mock.calls[0][0].reason).toBe('imperative-action');
      expect(monitorOnDragEnd).toHaveBeenCalledTimes(1);
      expect(dragSessionStore.getSnapshot()).toBeNull();
      expect(getActiveSession()).toBe(null);
    });

    it('cancelDrag() from a monitor onMoveStart stops the fan-out to later monitors', async () => {
      const { engine } = await renderDnd();
      const el = createElement();
      const firstMonitorStart = vi.fn(() => cancelDrag());
      const secondMonitorStart = vi.fn();
      const onMoveEnd = vi.fn();
      engine.registerSource(el, {});
      engine.registerMonitor({ onMoveStart: firstMonitorStart, onMoveEnd });
      engine.registerMonitor({ onMoveStart: secondMonitorStart });

      fireDrag.dragStart(el);

      expect(firstMonitorStart).toHaveBeenCalledTimes(1);
      // The cancel cleared the active-monitor list mid-fan-out.
      expect(secondMonitorStart).not.toHaveBeenCalled();
      expect(onMoveEnd).toHaveBeenCalledTimes(1);
      expect(onMoveEnd.mock.calls[0][0].target).toBeNull();
      expect(onMoveEnd.mock.calls[0][0].reason).toBe('imperative-action');
      expect(getActiveSession()).toBe(null);
    });
  });

  describe('re-entrant cancel mid-dispatch', () => {
    it('does not republish a session canceled from canDrop resolution', async () => {
      const { engine } = await renderDnd();
      const source = createElement();
      const target = createElement();
      const onMoveEnd = vi.fn();
      const onTargetChange = vi.fn();
      engine.registerSource(source, { onMoveEnd, onTargetChange });
      engine.registerTarget(target, {
        canDrop: () => {
          cancelDrag();
          return 'reject';
        },
      });

      fireDrag.dragStart(source);
      await flushRaf();
      await dragEnter(target);

      expect(onMoveEnd).toHaveBeenCalledTimes(1);
      expect(onTargetChange).not.toHaveBeenCalled();
      expect(dragSessionStore.getSnapshot()).toBeNull();
      expect(getActiveSession()).toBe(null);
    });

    it('stops final resolution when canDrop cancels during release', async () => {
      const { engine } = await renderDnd();
      const source = createElement();
      const target = createElement();
      const onMoveEnd = vi.fn();
      const onTargetChange = vi.fn();
      let cancelOnResolve = false;
      engine.registerSource(source, { onMoveEnd, onTargetChange });
      engine.registerTarget(target, {
        canDrop: () => {
          if (cancelOnResolve) {
            cancelDrag();
            return 'reject';
          }
          return true;
        },
      });

      fireDrag.dragStart(source);
      await flushRaf();
      await dragEnter(target);
      onTargetChange.mockClear();
      cancelOnResolve = true;

      fireDrag.drop(target);

      expect(onMoveEnd).toHaveBeenCalledTimes(1);
      expect(onMoveEnd.mock.calls[0][0].target).toBeNull();
      expect(onMoveEnd.mock.calls[0][0].reason).toBe('imperative-action');
      // The cancel's terminal leave is the only change round. The final
      // resolution must not dispatch another one after teardown.
      expect(onTargetChange).toHaveBeenCalledTimes(1);
      expect(dragSessionStore.getSnapshot()).toBeNull();
    });

    it('cancelDrag() from onDraggableLeave delivers nothing to the entering target', async () => {
      const { engine } = await renderDnd();
      const el = createElement();
      const targetA = createElement();
      const targetC = createElement();
      const onDragEnterC = vi.fn();
      const onDragC = vi.fn();
      const onMoveEnd = vi.fn();
      engine.registerSource(el, {});
      engine.registerTarget(targetA, { onDraggableLeave: () => cancelDrag() });
      engine.registerTarget(targetC, {
        onDraggableEnter: onDragEnterC,
        onDraggableMove: onDragC,
      });
      engine.registerMonitor({ onMoveEnd });

      fireDrag.dragStart(el);
      await flushRaf();
      await dragEnter(targetA);
      // Moving from A to C runs A's leave during the change dispatch. The cancel
      // it issues must stop the fan-out, so C never hears about a drag that has
      // ended. An enter after teardown would leave C's hover state stuck.
      await dragEnter(targetC);

      expect(onDragEnterC).not.toHaveBeenCalled();
      expect(onDragC).not.toHaveBeenCalled();
      expect(onMoveEnd).toHaveBeenCalledTimes(1);
      expect(onMoveEnd.mock.calls[0][0].target).toBeNull();
      expect(onMoveEnd.mock.calls[0][0].reason).toBe('imperative-action');
      expect(getActiveSession()).toBe(null);

      const el2 = createElement();
      const onDragStart2 = vi.fn();
      engine.registerSource(el2, { onMoveStart: onDragStart2 });
      fireDrag.dragStart(el2);
      await flushRaf();
      expect(onDragStart2).toHaveBeenCalledTimes(1);
    });

    it('cancelDrag() from the innermost onMove stops the fan-out to ancestor targets', async () => {
      const { engine } = await renderDnd();
      const el = createElement();
      const parent = createElement();
      const child = createElement();
      parent.appendChild(child);
      const childOnDrag = vi.fn(() => cancelDrag());
      const parentOnDrag = vi.fn();
      const parentOnDragLeave = vi.fn();
      const onMoveEnd = vi.fn();
      engine.registerSource(el, {});
      engine.registerTarget(parent, {
        onDraggableMove: parentOnDrag,
        onDraggableLeave: parentOnDragLeave,
      });
      engine.registerTarget(child, { onDraggableMove: childOnDrag });
      engine.registerMonitor({ onMoveEnd });

      fireDrag.dragStart(el);
      await flushRaf();
      // Entering the child dispatches the entry `onDraggableMove` synchronously to
      // the stack, innermost first. The child's cancel must stop it there.
      await dragEnter(child);

      expect(childOnDrag).toHaveBeenCalledTimes(1);
      expect(parentOnDrag).not.toHaveBeenCalled();
      // The cancel's terminal dispatch still cleared the ancestor's hover state.
      expect(parentOnDragLeave).toHaveBeenCalledTimes(1);
      expect(onMoveEnd).toHaveBeenCalledTimes(1);
      expect(onMoveEnd.mock.calls[0][0].target).toBeNull();
      expect(onMoveEnd.mock.calls[0][0].reason).toBe('imperative-action');
      expect(getActiveSession()).toBe(null);
    });
  });
});
