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

  it('monitor receives onDragStart during a drag', async () => {
    const { engine } = await renderDnd();
    const el = createElement();
    const onDragStart = vi.fn();
    engine.registerDraggable(el, { kind: cardKind });
    engine.registerMonitor({ onDragStart });

    fireEvent.dragStart(el);
    await flushRaf();

    expect(onDragStart).toHaveBeenCalledTimes(1);
    expect(onDragStart).toHaveBeenCalledWith(
      expect.objectContaining({
        source: expect.objectContaining({ element: el }),
      }),
      expect.objectContaining({ reason: 'pointer' }),
    );
  });

  it('monitor receives onDragEnd when drop occurs', async () => {
    const { engine } = await renderDnd();
    const el = createElement();
    const onDragEnd = vi.fn();
    engine.registerDraggable(el, { kind: cardKind });
    engine.registerMonitor({ onDragEnd });

    fireEvent.dragStart(el);
    await flushRaf();
    fireEvent.drop(el);

    expect(onDragEnd).toHaveBeenCalledTimes(1);
  });

  it('monitor onDragEnd fires with empty dropTargets when the drag ends outside any target', async () => {
    const { engine } = await renderDnd();
    const el = createElement();
    const onDragEnd = vi.fn();
    engine.registerDraggable(el, { kind: cardKind });
    engine.registerMonitor({ onDragEnd });

    fireEvent.dragStart(el);
    await flushRaf();
    // End the drag without ever entering a drop target (cancel / no-target).
    fireEvent.dragEnd(el);

    expect(onDragEnd).toHaveBeenCalledTimes(1);
    const payload = onDragEnd.mock.calls[0][0];
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
    const onDragStart = vi.fn();

    engine.registerDraggable(cardEl, { kind: cardKind });
    engine.registerDraggable(columnEl, { kind: columnKind });
    engine.registerMonitor({ accept: cardKind, onDragStart });

    fireEvent.dragStart(cardEl);
    await flushRaf();
    fireEvent.drop(cardEl);

    fireEvent.dragStart(columnEl);
    await flushRaf();
    fireEvent.drop(columnEl);

    expect(onDragStart).toHaveBeenCalledTimes(1);
    expect(onDragStart).toHaveBeenCalledWith(
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
    const onDragStart = vi.fn();

    engine.registerDraggable(cardEl, { kind: cardKind });
    engine.registerDraggable(columnEl, { kind: columnKind });
    engine.registerMonitor({ onDragStart });

    fireEvent.dragStart(cardEl);
    await flushRaf();
    fireEvent.drop(cardEl);

    fireEvent.dragStart(columnEl);
    await flushRaf();
    fireEvent.drop(columnEl);

    expect(onDragStart).toHaveBeenCalledTimes(2);
  });

  it('cleanup during drag stops further events', async () => {
    const { engine } = await renderDnd();
    const el = createElement();
    const onDragStart = vi.fn();
    const onDragEnd = vi.fn();
    engine.registerDraggable(el, {});
    const cleanupMonitor = engine.registerMonitor({ onDragStart, onDragEnd });

    fireEvent.dragStart(el);
    await flushRaf();
    expect(onDragStart).toHaveBeenCalledTimes(1);

    cleanupMonitor();

    fireEvent.drop(el);
    expect(onDragEnd).not.toHaveBeenCalled();
  });

  it('multiple monitors all receive same events', async () => {
    const { engine } = await renderDnd();
    const el = createElement();
    const onDragStart1 = vi.fn();
    const onDragStart2 = vi.fn();
    engine.registerDraggable(el, { kind: cardKind });
    engine.registerMonitor({ onDragStart: onDragStart1 });
    engine.registerMonitor({ onDragStart: onDragStart2 });

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
      onDragStart: () => {
        cleanupMonitor2?.();
      },
    });
    cleanupMonitor2 = engine.registerMonitor({ onDragStart: onDragStart2 });

    fireEvent.dragStart(el);
    await flushRaf();

    expect(onDragStart2).not.toHaveBeenCalled();
  });

  it('a monitor registered mid-drag joins it: no onDragStart, but onDrag/onDropTargetChange/onDragEnd', async () => {
    const { engine } = await renderDnd();
    const el = createElement();
    const target = createElement();
    const onDragStart = vi.fn();
    const onDrag = vi.fn();
    const onDropTargetChange = vi.fn();
    const onDragEnd = vi.fn();
    const onDrop = vi.fn();

    engine.registerDraggable(el, {});
    engine.registerDropTarget(target, {});

    // Start the drag BEFORE the monitor exists — its onDragStart has already fired.
    fireEvent.dragStart(el);
    await flushRaf();

    engine.registerMonitor({ onDragStart, onDrag, onDropTargetChange, onDrop, onDragEnd });

    // Subsequent events must reach the late monitor.
    fireEvent.dragEnter(target);
    await flushRaf();
    fireEvent.dragOver(target);
    await flushRaf();
    fireEvent.drop(target);

    // The monitor joined after onDragStart, so it never sees it...
    expect(onDragStart).not.toHaveBeenCalled();
    // ...but it observes the remainder of the drag.
    expect(onDropTargetChange).toHaveBeenCalled();
    expect(onDrag).toHaveBeenCalled();
    expect(onDragEnd).toHaveBeenCalledTimes(1);
    // `onDrop` firing is the committed-drop signal, so the end payload needs no
    // `canceled` / `dropTarget` reading to say the same thing.
    expect(onDrop).toHaveBeenCalledTimes(1);
  });

  it('a mid-drag monitor is filtered by accept against the live active drag', async () => {
    const { engine } = await renderDnd();
    const cardEl = createElement();
    const target = createElement();
    const onDragEnd = vi.fn();

    engine.registerDraggable(cardEl, { kind: cardKind });
    engine.registerDropTarget(target, {});

    fireEvent.dragStart(cardEl);
    await flushRaf();

    // Registered mid-drag with an `accept` that excludes the live source kind:
    // it must NOT join the in-progress 'card' drag.
    engine.registerMonitor({ accept: columnKind, onDragEnd });

    fireEvent.drop(target);
    expect(onDragEnd).not.toHaveBeenCalled();
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
    engine.registerDropTarget(target, { onDrop });
    engine.registerMonitor(() => {
      throw new Error('monitor getter boom');
    });
    engine.registerMonitor({ onDragStart: onDragStartSane, onDragEnd: onDragEndSane });

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
    const onDragEnd = vi.fn();

    engine.registerDraggable(el, { onDragEnd });
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
      expect(onDragEnd).toHaveBeenCalledTimes(1);
    } finally {
      consoleError.mockRestore();
    }
  });

  // Type-level regression guard. Never executes.
  it.skip('type test: TSourceData narrows via discriminated union in monitor callbacks', async () => {
    interface CardDrag extends Record<string, unknown> {
      kind: 'card';
      cardId: string;
    }
    interface ColumnDrag extends Record<string, unknown> {
      kind: 'column';
      columnId: string;
    }
    const { engine } = await renderDnd();

    engine.registerMonitor<CardDrag | ColumnDrag>({
      onDragEnd: ({ source }) => {
        if (source.payload.kind === 'card') {
          source.payload.cardId.toUpperCase();
        } else {
          source.payload.columnId.toUpperCase();
        }
      },
    });
  });
});
