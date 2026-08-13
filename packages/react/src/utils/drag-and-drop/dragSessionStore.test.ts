import { describe, it, expect, vi } from 'vitest';
import { fireEvent } from '@testing-library/react';
import { createDndRenderer } from '#test-utils';
import { cancel, createElement, flushRaf, setupDragEngineTests } from '../../../test/dnd';
import { dragSessionStore } from './dragSessionStore';

setupDragEngineTests();

describe('dragSessionStore', () => {
  const { renderDnd } = createDndRenderer();

  it('is null by default', () => {
    expect(dragSessionStore.state).toBeNull();
  });

  it('publishes a snapshot at drag start and clears on drop', async () => {
    const { engine } = await renderDnd();
    const source = createElement();
    engine.registerDraggable(source, { payload: () => ({ kind: 'card' }) });
    const target = createElement();
    engine.registerDropTarget(target, {});

    fireEvent.dragStart(source);

    // start() publishes the session snapshot synchronously, just before it
    // dispatches onDragStart.
    const startSnapshot = dragSessionStore.state;
    expect(startSnapshot).not.toBeNull();
    expect(startSnapshot!.source.element).toBe(source);
    expect(startSnapshot!.source.payload).toEqual({ kind: 'card' });
    expect(startSnapshot!.mode).toBe('pointer');

    await flushRaf();

    fireEvent.dragEnter(target);
    fireEvent.dragOver(target);
    await flushRaf();

    fireEvent.drop(target);
    expect(dragSessionStore.state).toBeNull();
  });

  it('publishes a fresh location reference on drop-target stack changes', async () => {
    const { engine } = await renderDnd();
    const source = createElement();
    engine.registerDraggable(source, {});
    const target = createElement();
    engine.registerDropTarget(target, {});

    fireEvent.dragStart(source);
    await flushRaf();

    const beforeEnter = dragSessionStore.state;
    expect(beforeEnter).not.toBeNull();
    expect(beforeEnter!.location.current.dropTargets.length).toBe(0);

    fireEvent.dragEnter(target);
    fireEvent.dragOver(target);
    await flushRaf();

    const afterEnter = dragSessionStore.state;
    expect(afterEnter).not.toBe(beforeEnter);
    expect(afterEnter!.location.current.dropTargets.length).toBe(1);
    expect(afterEnter!.location.current.dropTargets[0].element).toBe(target);

    fireEvent.drop(target);
    expect(dragSessionStore.state).toBeNull();
  });

  it('cancel via dragend clears the store', async () => {
    const { engine } = await renderDnd();
    const source = createElement();
    engine.registerDraggable(source, {});
    const target = createElement();
    engine.registerDropTarget(target, {});

    fireEvent.dragStart(source);
    await flushRaf();
    fireEvent.dragEnter(target);
    fireEvent.dragOver(target);
    await flushRaf();
    expect(dragSessionStore.state).not.toBeNull();

    cancel(target);
    expect(dragSessionStore.state).toBeNull();
  });

  it('notifies subscribers when an active drop target unregisters mid-drag', async () => {
    const { engine } = await renderDnd();
    const source = createElement();
    engine.registerDraggable(source, {});
    const target = createElement();
    const cleanup = engine.registerDropTarget(target, {});

    fireEvent.dragStart(source);
    await flushRaf();
    fireEvent.dragEnter(target);
    fireEvent.dragOver(target);
    await flushRaf();

    expect(dragSessionStore.state!.location.current.dropTargets.length).toBe(1);

    const listener = vi.fn();
    const unsubscribe = dragSessionStore.subscribe(listener);

    cleanup();

    expect(listener).toHaveBeenCalledTimes(1);
    expect(dragSessionStore.state!.location.current.dropTargets.length).toBe(0);

    unsubscribe();
    fireEvent.dragEnd(window);
  });

  it('gives each snapshot its own copy of the initial location', async () => {
    const { engine } = await renderDnd();
    const source = createElement();
    engine.registerDraggable(source, {});
    const target = createElement();
    engine.registerDropTarget(target, {});

    fireEvent.dragStart(source);
    await flushRaf();
    fireEvent.dragEnter(target);
    fireEvent.dragOver(target);
    await flushRaf();

    const snapshot = dragSessionStore.state!;
    const record = snapshot.location.current.dropTargets[0];
    expect(record.element).toBe(target);
    // A consumer mutating its snapshot's `initial` must corrupt neither the
    // engine's bookkeeping nor later snapshots built from it. The array is
    // typed `readonly`; the runtime clone is the guarantee for consumers that
    // bypass the types, which is what this exercises.
    // @ts-expect-error -- deliberate mutation of a readonly-typed array
    snapshot.location.initial.dropTargets.push(record);

    fireEvent.dragLeave(target);
    await flushRaf();

    const next = dragSessionStore.state!;
    expect(next).not.toBe(snapshot);
    expect(next.location.initial.dropTargets).toEqual([]);

    cancel(target);
  });

  it('subscribers receive every published snapshot', async () => {
    const { engine } = await renderDnd();
    const source = createElement();
    engine.registerDraggable(source, {});
    const target = createElement();
    engine.registerDropTarget(target, {});

    const seen: Array<unknown> = [];
    const unsubscribe = dragSessionStore.subscribe((state) => {
      seen.push(state);
    });

    fireEvent.dragStart(source);
    await flushRaf();
    fireEvent.dragEnter(target);
    fireEvent.dragOver(target);
    await flushRaf();
    fireEvent.drop(target);

    // start, target-change, teardown.
    expect(seen.length).toBeGreaterThanOrEqual(3);
    expect(seen[seen.length - 1]).toBeNull();

    unsubscribe();
  });
});
