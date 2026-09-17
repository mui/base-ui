import { describe, it, expect, vi } from 'vitest';
import { fireEvent } from '@testing-library/react';
import { createDndRenderer } from '#test-utils';
import { Draggable } from '@base-ui/react/draggable';
import { createElement, flushRaf, setupDragEngineTests } from '../../test/dnd';

setupDragEngineTests();

const cardKind = Draggable.createKind('card');
const columnKind = Draggable.createKind('column');

describe('engine.registerMonitor', () => {
  const { renderDnd } = createDndRenderer();

  it('monitor receives onMoveStart during a drag', async () => {
    const { engine } = await renderDnd();
    const el = createElement();
    const onMoveStart = vi.fn();
    engine.registerDraggable(el, { kind: cardKind });
    engine.registerMonitor({ onMoveStart });

    fireEvent.dragStart(el);
    await flushRaf();

    expect(onMoveStart).toHaveBeenCalledTimes(1);
    expect(onMoveStart).toHaveBeenCalledWith(
      expect.objectContaining({
        source: expect.objectContaining({ element: el }),
      }),
      expect.objectContaining({ reason: 'pointer' }),
    );
  });

  it('monitor receives onMoveEnd when drop occurs', async () => {
    const { engine } = await renderDnd();
    const el = createElement();
    const onMoveEnd = vi.fn();
    engine.registerDraggable(el, { kind: cardKind });
    engine.registerMonitor({ onMoveEnd });

    fireEvent.dragStart(el);
    await flushRaf();
    fireEvent.drop(el);

    expect(onMoveEnd).toHaveBeenCalledTimes(1);
  });

  it('monitor onMoveEnd fires with empty dropTargets when the drag ends outside any target', async () => {
    const { engine } = await renderDnd();
    const el = createElement();
    const onMoveEnd = vi.fn();
    engine.registerDraggable(el, { kind: cardKind });
    engine.registerMonitor({ onMoveEnd });

    fireEvent.dragStart(el);
    await flushRaf();
    // End the drag without ever entering a drop target (cancel / no-target).
    fireEvent.dragEnd(el);

    expect(onMoveEnd).toHaveBeenCalledTimes(1);
    const payload = onMoveEnd.mock.calls[0][0];
    expect(payload.location.current.dropTargets).toEqual([]);
    // A `dragend` with no preceding `drop` is a cancel (see the test bridge), so
    // `canceled` is `true` — handlers rely on it instead of inspecting
    // `dropTargets`.
    expect(payload.canceled).toBe(true);
    expect(payload.dropTarget).toBeNull();
  });

  it('accept filters the monitor to the kinds it declares', async () => {
    const { engine } = await renderDnd();
    const cardEl = createElement();
    const columnEl = createElement();
    const onMoveStart = vi.fn();

    engine.registerDraggable(cardEl, { kind: cardKind });
    engine.registerDraggable(columnEl, { kind: columnKind });
    engine.registerMonitor({ accept: cardKind, onMoveStart });

    fireEvent.dragStart(cardEl);
    await flushRaf();
    fireEvent.drop(cardEl);

    fireEvent.dragStart(columnEl);
    await flushRaf();
    fireEvent.drop(columnEl);

    expect(onMoveStart).toHaveBeenCalledTimes(1);
    expect(onMoveStart).toHaveBeenCalledWith(
      expect.objectContaining({
        source: expect.objectContaining({ kind: cardKind.id }),
      }),
      expect.objectContaining({ reason: 'pointer' }),
    );
  });

  it('observes every source when accept is omitted', async () => {
    const { engine } = await renderDnd();
    const cardEl = createElement();
    const columnEl = createElement();
    const onMoveStart = vi.fn();

    engine.registerDraggable(cardEl, { kind: cardKind });
    engine.registerDraggable(columnEl, { kind: columnKind });
    engine.registerMonitor({ onMoveStart });

    fireEvent.dragStart(cardEl);
    await flushRaf();
    fireEvent.drop(cardEl);

    fireEvent.dragStart(columnEl);
    await flushRaf();
    fireEvent.drop(columnEl);

    expect(onMoveStart).toHaveBeenCalledTimes(2);
  });

  it('cleanup during drag stops further events', async () => {
    const { engine } = await renderDnd();
    const el = createElement();
    const onMoveStart = vi.fn();
    const onMoveEnd = vi.fn();
    engine.registerDraggable(el, {});
    const cleanupMonitor = engine.registerMonitor({ onMoveStart, onMoveEnd });

    fireEvent.dragStart(el);
    await flushRaf();
    expect(onMoveStart).toHaveBeenCalledTimes(1);

    cleanupMonitor();

    fireEvent.drop(el);
    expect(onMoveEnd).not.toHaveBeenCalled();
  });

  it('multiple monitors all receive same events', async () => {
    const { engine } = await renderDnd();
    const el = createElement();
    const onDragStart1 = vi.fn();
    const onDragStart2 = vi.fn();
    engine.registerDraggable(el, { kind: cardKind });
    engine.registerMonitor({ onMoveStart: onDragStart1 });
    engine.registerMonitor({ onMoveStart: onDragStart2 });

    fireEvent.dragStart(el);
    await flushRaf();

    expect(onDragStart1).toHaveBeenCalledTimes(1);
    expect(onDragStart2).toHaveBeenCalledTimes(1);
  });

  it('monitors iterated via snapshot (removal during event is safe)', async () => {
    const { engine } = await renderDnd();
    const el = createElement();
    const onDragStart2 = vi.fn();
    let cleanupMonitor2: (() => void) | null = null;

    engine.registerDraggable(el, { kind: cardKind });
    engine.registerMonitor({
      onMoveStart: () => {
        cleanupMonitor2?.();
      },
    });
    cleanupMonitor2 = engine.registerMonitor({ onMoveStart: onDragStart2 });

    fireEvent.dragStart(el);
    await flushRaf();

    expect(onDragStart2).not.toHaveBeenCalled();
  });

  it('a monitor registered mid-drag joins it: no onMoveStart, but onMove/onTargetChange/onMoveEnd', async () => {
    const { engine } = await renderDnd();
    const el = createElement();
    const target = createElement();
    const onMoveStart = vi.fn();
    const onMove = vi.fn();
    const onTargetChange = vi.fn();
    const onMoveEnd = vi.fn();
    const onDrop = vi.fn();

    engine.registerDraggable(el, {});
    engine.registerDropTarget(target, {});

    // Start the drag BEFORE the monitor exists — its onMoveStart has already fired.
    fireEvent.dragStart(el);
    await flushRaf();

    engine.registerMonitor({ onMoveStart, onMove, onTargetChange, onDrop, onMoveEnd });

    // Subsequent events must reach the late monitor.
    fireEvent.dragEnter(target);
    await flushRaf();
    fireEvent.dragOver(target);
    await flushRaf();
    fireEvent.drop(target);

    // The monitor joined after onMoveStart, so it never sees it...
    expect(onMoveStart).not.toHaveBeenCalled();
    // ...but it observes the remainder of the drag.
    expect(onTargetChange).toHaveBeenCalled();
    expect(onMove).toHaveBeenCalled();
    expect(onMoveEnd).toHaveBeenCalledTimes(1);
    // `onDrop` firing is the committed-drop signal, so the end payload needs no
    // `canceled` / `dropTarget` reading to say the same thing.
    expect(onDrop).toHaveBeenCalledTimes(1);
  });

  it('a mid-drag monitor is filtered by accept against the live active drag', async () => {
    const { engine } = await renderDnd();
    const cardEl = createElement();
    const target = createElement();
    const onMoveEnd = vi.fn();

    engine.registerDraggable(cardEl, { kind: cardKind });
    engine.registerDropTarget(target, {});

    fireEvent.dragStart(cardEl);
    await flushRaf();

    // Registered mid-drag with an `accept` that excludes the live source kind:
    // it must NOT join the in-progress 'card' drag.
    engine.registerMonitor({ accept: columnKind, onMoveEnd });

    fireEvent.drop(target);
    expect(onMoveEnd).not.toHaveBeenCalled();
  });

  // The parameters *getter* itself is consumer-supplied through the imperative
  // API, and `activateMonitors` runs it from `start()`. A throw there is
  // contained: logged, and the monitor sits this drag out while the drag and
  // every sibling monitor keep working.
  it('keeps the drag and sibling monitors working when a parameters getter throws at drag start', async () => {
    const { engine } = await renderDnd();
    const el = createElement();
    const target = createElement();
    const onDragStartSane = vi.fn();
    const onDragEndSane = vi.fn();
    const onDrop = vi.fn();

    engine.registerDraggable(el, {});
    engine.registerDropTarget(target, { onDraggableDrop: onDrop });
    engine.registerMonitor(() => {
      throw new Error('monitor getter boom');
    });
    engine.registerMonitor({ onMoveStart: onDragStartSane, onMoveEnd: onDragEndSane });

    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    try {
      fireEvent.dragStart(el);
      await flushRaf();

      // The throw was contained and logged...
      expect(consoleError).toHaveBeenCalled();
      // ...and the sibling monitor still observes the drag.
      expect(onDragStartSane).toHaveBeenCalledTimes(1);

      fireEvent.dragEnter(target);
      fireEvent.dragOver(target);
      await flushRaf();
      fireEvent.drop(target);

      // The drag itself was never aborted: it ends with a delivered drop.
      expect(onDrop).toHaveBeenCalledTimes(1);
      expect(onDragEndSane).toHaveBeenCalledTimes(1);
    } finally {
      consoleError.mockRestore();
    }
  });

  // The mid-drag path runs the getter from `engageMonitorIfDragging`, typically
  // inside a React layout effect: an uncontained throw there would unwind the
  // commit, not just this monitor.
  it('keeps the drag working when a getter throws at mid-drag registration', async () => {
    const { engine } = await renderDnd();
    const el = createElement();
    const target = createElement();
    const onMoveEnd = vi.fn();

    engine.registerDraggable(el, { onMoveEnd });
    engine.registerDropTarget(target, {});

    fireEvent.dragStart(el);
    await flushRaf();

    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    try {
      expect(() =>
        engine.registerMonitor(() => {
          throw new Error('monitor getter boom');
        }),
      ).not.toThrow();
      expect(consoleError).toHaveBeenCalled();

      fireEvent.drop(target);
      expect(onMoveEnd).toHaveBeenCalledTimes(1);
    } finally {
      consoleError.mockRestore();
    }
  });
});
