import * as React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { createDndRenderer, testDragKind } from '#test-utils';
import {
  createElement,
  dragOver,
  flushRaf,
  setupDragEngineTests,
  fireDrag,
} from '../../../test/dnd';
import { useMonitor } from './useMonitor';

setupDragEngineTests();

function Monitor(props: useMonitor.Parameters) {
  useMonitor(props);
  return null;
}

describe('useMonitor', () => {
  const { renderDnd } = createDndRenderer();

  it('registers a monitor that receives events during a drag', async () => {
    const onMoveStart = vi.fn();
    const onMoveEnd = vi.fn();
    const { engine } = await renderDnd(<Monitor onMoveStart={onMoveStart} onMoveEnd={onMoveEnd} />);
    const el = createElement();
    engine.registerSource(el, {});

    fireDrag.dragStart(el);
    await flushRaf();

    expect(onMoveStart).toHaveBeenCalledTimes(1);
    expect(onMoveStart).toHaveBeenCalledWith(
      expect.objectContaining({
        source: expect.objectContaining({ element: el }),
        reason: 'pointer',
      }),
    );

    fireDrag.drop(el);

    expect(onMoveEnd).toHaveBeenCalledTimes(1);
  });

  it('events read the latest callbacks after a re-render', async () => {
    const firstOnDragStart = vi.fn();
    const secondOnDragStart = vi.fn();
    const { rerender, engine } = await renderDnd(<Monitor onMoveStart={firstOnDragStart} />);

    await rerender(<Monitor onMoveStart={secondOnDragStart} />);

    const el = createElement();
    engine.registerSource(el, {});
    fireDrag.dragStart(el);
    await flushRaf();

    expect(firstOnDragStart).not.toHaveBeenCalled();
    expect(secondOnDragStart).toHaveBeenCalledTimes(1);

    fireDrag.drop(el);
  });

  it('fires callbacks once per event under Strict Mode', async () => {
    // Strict Mode runs the registration effect twice (register, clean up,
    // register). A leaked duplicate registration would run every callback once
    // per hold.
    const onMoveStart = vi.fn();
    const onMoveEnd = vi.fn();
    const { engine } = await renderDnd(
      <React.StrictMode>
        <Monitor onMoveStart={onMoveStart} onMoveEnd={onMoveEnd} />
      </React.StrictMode>,
    );

    const el = createElement();
    engine.registerSource(el, {});
    fireDrag.dragStart(el);
    await flushRaf();
    fireDrag.drop(el);

    expect(onMoveStart).toHaveBeenCalledTimes(1);
    expect(onMoveEnd).toHaveBeenCalledTimes(1);
  });

  it('mounted mid-drag, a monitor for the active kind receives the following moves', async () => {
    const onMove = vi.fn();
    const onMoveStart = vi.fn();
    const { rerender, engine } = await renderDnd(<div />);
    const el = createElement();
    engine.registerSource(el, {});

    fireDrag.dragStart(el);
    await flushRaf();

    await rerender(<Monitor accept={testDragKind} onMoveStart={onMoveStart} onMove={onMove} />);

    // The start already happened; only what follows is observed.
    expect(onMoveStart).not.toHaveBeenCalled();
    expect(onMove).not.toHaveBeenCalled();

    await dragOver(el, { clientX: 40, clientY: 40 });

    expect(onMove).toHaveBeenCalledTimes(1);
    expect(onMove.mock.calls[0][0].source.element).toBe(el);

    await dragOver(el, { clientX: 80, clientY: 80 });

    expect(onMove).toHaveBeenCalledTimes(2);

    fireDrag.drop(el);
  });

  it('unmounting the monitor stops it from receiving events', async () => {
    const onMoveStart = vi.fn();
    const { rerender, engine } = await renderDnd(<Monitor onMoveStart={onMoveStart} />);

    await rerender(<div />);

    const el = createElement();
    engine.registerSource(el, {});
    fireDrag.dragStart(el);
    await flushRaf();

    expect(onMoveStart).not.toHaveBeenCalled();

    fireDrag.drop(el);
  });
});
