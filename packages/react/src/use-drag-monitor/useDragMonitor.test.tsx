import * as React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { fireEvent } from '@testing-library/react';
import { createDndRenderer } from '#test-utils';
import { createElement, flushRaf, setupDragEngineTests } from '../../test/dnd';
import { useDragMonitor } from './useDragMonitor';
import { monitorRegistry } from '../utils/drag-and-drop/monitor';

setupDragEngineTests();

function Monitor(props: useDragMonitor.Parameters) {
  useDragMonitor(props);
  return null;
}

describe('useDragMonitor', () => {
  const { renderDnd } = createDndRenderer();

  it('registers a monitor that receives events during a drag', async () => {
    const onDragStart = vi.fn();
    const onDragEnd = vi.fn();
    const { engine } = await renderDnd(<Monitor onDragStart={onDragStart} onDragEnd={onDragEnd} />);
    const el = createElement();
    engine.registerDraggable(el, {});

    fireEvent.dragStart(el);
    await flushRaf();

    expect(onDragStart).toHaveBeenCalledTimes(1);
    expect(onDragStart).toHaveBeenCalledWith(
      expect.objectContaining({
        source: expect.objectContaining({ element: el }),
      }),
      expect.objectContaining({ reason: 'pointer' }),
    );

    fireEvent.drop(el);

    expect(onDragEnd).toHaveBeenCalledTimes(1);
  });

  it('re-renders keep the registration but events read the latest callbacks', async () => {
    const firstOnDragStart = vi.fn();
    const secondOnDragStart = vi.fn();
    const { rerender, engine } = await renderDnd(<Monitor onDragStart={firstOnDragStart} />);
    const registrationsBefore = Array.from(monitorRegistry);

    await rerender(<Monitor onDragStart={secondOnDragStart} />);

    // Same getters, same order: the re-render did not re-register the monitor.
    const registrationsAfter = Array.from(monitorRegistry);
    expect(registrationsAfter.length).toBe(registrationsBefore.length);
    registrationsBefore.forEach((getter, index) => {
      expect(registrationsAfter[index]).toBe(getter);
    });

    const el = createElement();
    engine.registerDraggable(el, {});
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
    const onDragStart = vi.fn();
    const onDragEnd = vi.fn();
    const sizeBefore = monitorRegistry.size;
    const { engine } = await renderDnd(
      <React.StrictMode>
        <Monitor onDragStart={onDragStart} onDragEnd={onDragEnd} />
      </React.StrictMode>,
    );

    expect(monitorRegistry.size).toBe(sizeBefore + 1);

    const el = createElement();
    engine.registerDraggable(el, {});
    fireEvent.dragStart(el);
    await flushRaf();
    fireEvent.drop(el);

    expect(onDragStart).toHaveBeenCalledTimes(1);
    expect(onDragEnd).toHaveBeenCalledTimes(1);
  });

  it('unmounting the monitor stops it from receiving events', async () => {
    const onDragStart = vi.fn();
    const { rerender, engine } = await renderDnd(<Monitor onDragStart={onDragStart} />);

    await rerender(<div />);

    const el = createElement();
    engine.registerDraggable(el, {});
    fireEvent.dragStart(el);
    await flushRaf();

    expect(onDragStart).not.toHaveBeenCalled();

    fireEvent.drop(el);
  });
});
