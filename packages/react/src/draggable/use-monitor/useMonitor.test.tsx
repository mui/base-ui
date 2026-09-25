import * as React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { fireEvent } from '@testing-library/react';
import { createDndRenderer, testDragKind } from '#test-utils';
import { Draggable } from '@base-ui/react/draggable';
import { createElement, dragOver, flushRaf, setupDragEngineTests } from '../../../test/dnd';
import { useMonitor } from './useMonitor';
import { monitorRegistry } from '../../utils/drag-and-drop/monitor';

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

    fireEvent.dragStart(el);
    await flushRaf();

    expect(onMoveStart).toHaveBeenCalledTimes(1);
    expect(onMoveStart).toHaveBeenCalledWith(
      expect.objectContaining({
        source: expect.objectContaining({ element: el }),
      }),
      expect.objectContaining({ reason: 'pointer' }),
    );

    fireEvent.drop(el);

    expect(onMoveEnd).toHaveBeenCalledTimes(1);
  });

  it('re-renders keep the registration but events read the latest callbacks', async () => {
    const firstOnDragStart = vi.fn();
    const secondOnDragStart = vi.fn();
    const { rerender, engine } = await renderDnd(<Monitor onMoveStart={firstOnDragStart} />);
    const registrationsBefore = Array.from(monitorRegistry);

    await rerender(<Monitor onMoveStart={secondOnDragStart} />);

    // Same getters, same order: the re-render did not re-register the monitor.
    const registrationsAfter = Array.from(monitorRegistry);
    expect(registrationsAfter.length).toBe(registrationsBefore.length);
    registrationsBefore.forEach((getter, index) => {
      expect(registrationsAfter[index]).toBe(getter);
    });

    const el = createElement();
    engine.registerSource(el, {});
    fireEvent.dragStart(el);
    await flushRaf();

    expect(firstOnDragStart).not.toHaveBeenCalled();
    expect(secondOnDragStart).toHaveBeenCalledTimes(1);

    fireEvent.drop(el);
  });

  it('registers exactly once and fires callbacks once per event under Strict Mode', async () => {
    // Strict Mode double-invokes the registration effect (register → cleanup →
    // register); a leaked duplicate registration would run every callback once
    // per hold.
    const onMoveStart = vi.fn();
    const onMoveEnd = vi.fn();
    const sizeBefore = monitorRegistry.size;
    const { engine } = await renderDnd(
      <React.StrictMode>
        <Monitor onMoveStart={onMoveStart} onMoveEnd={onMoveEnd} />
      </React.StrictMode>,
    );

    expect(monitorRegistry.size).toBe(sizeBefore + 1);

    const el = createElement();
    engine.registerSource(el, {});
    fireEvent.dragStart(el);
    await flushRaf();
    fireEvent.drop(el);

    expect(onMoveStart).toHaveBeenCalledTimes(1);
    expect(onMoveEnd).toHaveBeenCalledTimes(1);
  });

  it('mounted mid-drag, a monitor for another kind never fires', async () => {
    const otherKind = Draggable.createKind('use-drag-monitor/other');
    const onMove = vi.fn();
    const onMoveEnd = vi.fn();
    const { rerender, engine } = await renderDnd(<div />);
    const el = createElement();
    engine.registerSource(el, {});

    fireEvent.dragStart(el);
    await flushRaf();

    await rerender(<Monitor accept={otherKind} onMove={onMove} onMoveEnd={onMoveEnd} />);

    await dragOver(el, { clientX: 40, clientY: 40 });
    await dragOver(el, { clientX: 80, clientY: 80 });
    fireEvent.drop(el);
    await flushRaf();

    expect(onMove).not.toHaveBeenCalled();
    expect(onMoveEnd).not.toHaveBeenCalled();
  });

  it('mounted mid-drag, a monitor for the active kind receives the following moves', async () => {
    const onMove = vi.fn();
    const onMoveStart = vi.fn();
    const { rerender, engine } = await renderDnd(<div />);
    const el = createElement();
    engine.registerSource(el, {});

    fireEvent.dragStart(el);
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

    fireEvent.drop(el);
  });

  it('unmounting the monitor stops it from receiving events', async () => {
    const onMoveStart = vi.fn();
    const { rerender, engine } = await renderDnd(<Monitor onMoveStart={onMoveStart} />);

    await rerender(<div />);

    const el = createElement();
    engine.registerSource(el, {});
    fireEvent.dragStart(el);
    await flushRaf();

    expect(onMoveStart).not.toHaveBeenCalled();

    fireEvent.drop(el);
  });
});
