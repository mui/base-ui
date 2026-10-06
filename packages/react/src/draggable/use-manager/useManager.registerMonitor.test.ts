import { describe, it, expect, vi } from 'vitest';
import { Draggable } from '@base-ui/react/draggable';
import { createDndRenderer } from '../../../test/dndEngine';
import {
  createElement,
  flushRaf,
  setupDragEngineTests,
  splitEnd,
  fireDrag,
  dragEnter,
  dragOver,
} from '../../../test/dnd';

setupDragEngineTests();

const cardKind = Draggable.createKind('card');
const columnKind = Draggable.createKind('column');

describe('engine.registerMonitor', () => {
  const { renderDnd } = createDndRenderer();

  it('monitor receives onMoveStart during a drag', async () => {
    const { engine } = await renderDnd();
    const el = createElement();
    const onMoveStart = vi.fn();
    engine.registerSource(el, { kind: cardKind });
    engine.registerMonitor({ onMoveStart });

    fireDrag.dragStart(el);
    await flushRaf();

    expect(onMoveStart).toHaveBeenCalledTimes(1);
    expect(onMoveStart).toHaveBeenCalledWith(
      expect.objectContaining({
        source: expect.objectContaining({ element: el }),
        reason: 'pointer',
      }),
    );
  });

  it('monitor receives onMoveEnd with the drop target when a drop lands on one', async () => {
    const { engine } = await renderDnd();
    const el = createElement();
    const target = createElement({ top: 200, height: 100 });
    const onMoveEnd = vi.fn();
    engine.registerSource(el, { kind: cardKind });
    engine.registerTarget(target, { accept: cardKind });
    engine.registerMonitor({ onMoveEnd });

    fireDrag.dragStart(el);
    await flushRaf();
    fireDrag.dragEnter(target);
    await dragOver(target);
    fireDrag.drop(target);

    expect(onMoveEnd).toHaveBeenCalledTimes(1);
    const [details] = onMoveEnd.mock.calls[0];
    expect(details.reason).toBe('drop');
    expect(details.target?.element).toBe(target);
  });

  it('monitor onMoveEnd fires with no target when the drag is canceled with Escape', async () => {
    const { engine } = await renderDnd();
    const el = createElement();
    const onMoveEnd = vi.fn();
    engine.registerSource(el, { kind: cardKind });
    engine.registerMonitor({ onMoveEnd });

    fireDrag.dragStart(el);
    await flushRaf();
    // Cancel the drag without ever entering a drop target.
    fireDrag.dragEnd();

    expect(onMoveEnd).toHaveBeenCalledTimes(1);
    const [details] = onMoveEnd.mock.calls[0];
    expect(details.location.current.targets).toEqual([]);
    // `fireDrag.dragEnd` ends the drag with an Escape cancel. Handlers read
    // `canceled` and the null target instead of inspecting `targets`.
    expect(details.reason).toBe('escape-key');
    expect(details.canceled).toBe(true);
    expect(details.target).toBeNull();
  });

  it('accept filters the monitor to the kinds it declares', async () => {
    const { engine } = await renderDnd();
    const cardEl = createElement();
    const columnEl = createElement();
    const onMoveStart = vi.fn();

    engine.registerSource(cardEl, { kind: cardKind });
    engine.registerSource(columnEl, { kind: columnKind });
    engine.registerMonitor({ accept: cardKind, onMoveStart });

    fireDrag.dragStart(cardEl);
    await flushRaf();
    fireDrag.drop(cardEl);

    fireDrag.dragStart(columnEl);
    await flushRaf();
    fireDrag.drop(columnEl);

    expect(onMoveStart).toHaveBeenCalledTimes(1);
    expect(onMoveStart).toHaveBeenCalledWith(
      expect.objectContaining({
        source: expect.objectContaining({ kind: cardKind.id }),
        reason: 'pointer',
      }),
    );
  });

  it('observes every source when accept is omitted', async () => {
    const { engine } = await renderDnd();
    const cardEl = createElement();
    const columnEl = createElement();
    const onMoveStart = vi.fn();

    engine.registerSource(cardEl, { kind: cardKind });
    engine.registerSource(columnEl, { kind: columnKind });
    engine.registerMonitor({ onMoveStart });

    fireDrag.dragStart(cardEl);
    await flushRaf();
    fireDrag.drop(cardEl);

    fireDrag.dragStart(columnEl);
    await flushRaf();
    fireDrag.drop(columnEl);

    expect(onMoveStart).toHaveBeenCalledTimes(2);
  });

  it('cleanup during drag stops further events', async () => {
    const { engine } = await renderDnd();
    const el = createElement();
    const onMoveStart = vi.fn();
    const onMoveEnd = vi.fn();
    engine.registerSource(el, {});
    const cleanupMonitor = engine.registerMonitor({ onMoveStart, onMoveEnd });

    fireDrag.dragStart(el);
    await flushRaf();
    expect(onMoveStart).toHaveBeenCalledTimes(1);

    cleanupMonitor();

    fireDrag.drop(el);
    expect(onMoveEnd).not.toHaveBeenCalled();
  });

  it('multiple monitors all receive same events', async () => {
    const { engine } = await renderDnd();
    const el = createElement();
    const onDragStart1 = vi.fn();
    const onDragStart2 = vi.fn();
    engine.registerSource(el, { kind: cardKind });
    engine.registerMonitor({ onMoveStart: onDragStart1 });
    engine.registerMonitor({ onMoveStart: onDragStart2 });

    fireDrag.dragStart(el);
    await flushRaf();

    expect(onDragStart1).toHaveBeenCalledTimes(1);
    expect(onDragStart2).toHaveBeenCalledTimes(1);
  });

  it('monitors iterated via snapshot (removal during event is safe)', async () => {
    const { engine } = await renderDnd();
    const el = createElement();
    const onDragStart2 = vi.fn();
    let cleanupMonitor2: (() => void) | null = null;

    engine.registerSource(el, { kind: cardKind });
    engine.registerMonitor({
      onMoveStart: () => {
        cleanupMonitor2?.();
      },
    });
    cleanupMonitor2 = engine.registerMonitor({ onMoveStart: onDragStart2 });

    fireDrag.dragStart(el);
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

    engine.registerSource(el, {});
    engine.registerTarget(target, {});

    // Start the drag before the monitor exists, so onMoveStart fires without it.
    fireDrag.dragStart(el);
    await flushRaf();

    engine.registerMonitor({
      onMoveStart,
      onMove,
      onTargetChange,
      onMoveEnd: splitEnd(onDrop, onMoveEnd),
    });

    // Later events must reach the late monitor.
    await dragEnter(target);
    await dragOver(target);
    fireDrag.drop(target);

    // The monitor joined after onMoveStart, so it never sees it.
    expect(onMoveStart).not.toHaveBeenCalled();
    // It still observes the rest of the drag.
    expect(onTargetChange).toHaveBeenCalled();
    expect(onMove).toHaveBeenCalled();
    expect(onMoveEnd).toHaveBeenCalledTimes(1);
    // `onDrop` firing confirms a committed drop, so there is no need to also
    // check `target` or `reason`.
    expect(onDrop).toHaveBeenCalledTimes(1);
  });

  it('a mid-drag monitor is filtered by accept against the live active drag', async () => {
    const { engine } = await renderDnd();
    const cardEl = createElement();
    const target = createElement();
    const onMoveEnd = vi.fn();

    engine.registerSource(cardEl, { kind: cardKind });
    engine.registerTarget(target, {});

    fireDrag.dragStart(cardEl);
    await flushRaf();

    // Registered mid-drag with an `accept` that excludes the source kind, so it
    // must not join the 'card' drag in progress.
    engine.registerMonitor({ accept: columnKind, onMoveEnd });

    fireDrag.drop(target);
    expect(onMoveEnd).not.toHaveBeenCalled();
  });

  // The consumer supplies the parameters getter through the imperative API, and
  // `activateMonitors` runs it from `start()`. A throw there is caught and logged.
  // That monitor skips this drag, while the drag and every other monitor keep
  // working.
  it('keeps the drag and sibling monitors working when a parameters getter throws at drag start', async () => {
    const { engine } = await renderDnd();
    const el = createElement();
    const target = createElement();
    const onDragStartSane = vi.fn();
    const onDragEndSane = vi.fn();
    const onDrop = vi.fn();

    engine.registerSource(el, {});
    engine.registerTarget(target, { onDraggableDrop: onDrop });
    engine.registerMonitor(() => {
      throw new Error('monitor getter boom');
    });
    engine.registerMonitor({ onMoveStart: onDragStartSane, onMoveEnd: onDragEndSane });

    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    try {
      fireDrag.dragStart(el);
      await flushRaf();

      // The throw was caught and logged.
      expect(consoleError).toHaveBeenCalled();
      // The other monitor still observes the drag.
      expect(onDragStartSane).toHaveBeenCalledTimes(1);

      fireDrag.dragEnter(target);
      await dragOver(target);
      fireDrag.drop(target);

      // The drag was never aborted and ends with a drop.
      expect(onDrop).toHaveBeenCalledTimes(1);
      expect(onDragEndSane).toHaveBeenCalledTimes(1);
    } finally {
      consoleError.mockRestore();
    }
  });

  // A mid-drag registration runs the getter from `engageMonitorIfDragging`, usually
  // inside a React layout effect. An uncaught throw there would abort the whole
  // commit, not only this monitor.
  it('keeps the drag working when a getter throws at mid-drag registration', async () => {
    const { engine } = await renderDnd();
    const el = createElement();
    const target = createElement();
    const onMoveEnd = vi.fn();

    engine.registerSource(el, { onMoveEnd });
    engine.registerTarget(target, {});

    fireDrag.dragStart(el);
    await flushRaf();

    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    try {
      expect(() =>
        engine.registerMonitor(() => {
          throw new Error('monitor getter boom');
        }),
      ).not.toThrow();
      expect(consoleError).toHaveBeenCalled();

      fireDrag.drop(target);
      expect(onMoveEnd).toHaveBeenCalledTimes(1);
    } finally {
      consoleError.mockRestore();
    }
  });
  it('refreshes callbacks in reused options before accept stops matching', async () => {
    const { engine } = await renderDnd();
    const source = createElement();
    const original = vi.fn();
    const current = vi.fn();
    const options = { accept: cardKind, onMoveEnd: original };
    engine.registerSource(source, { kind: cardKind });
    engine.registerMonitor(() => options);

    fireDrag.dragStart(source);
    await flushRaf();
    fireDrag.drop(source);
    expect(original).toHaveBeenCalledTimes(1);
    original.mockClear();

    // Keep the options identity while changing the callback for the next drag.
    options.onMoveEnd = current;
    fireDrag.dragStart(source);
    await flushRaf();
    options.accept = columnKind;
    fireDrag.drop(source);

    expect(current).toHaveBeenCalledTimes(1);
    expect(original).not.toHaveBeenCalled();
  });
});
