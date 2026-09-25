import { describe, it, expect, vi } from 'vitest';
import { fireEvent } from '@testing-library/react';
import { createDndRenderer } from '#test-utils';
import { cancel, createElement, flushRaf, setupDragEngineTests } from '../../../test/dnd';
import { dragSessionStore, dragSourceStore, retargetDragSource } from './dragSessionStore';

setupDragEngineTests();

describe('dragSessionStore', () => {
  const { renderDnd } = createDndRenderer();

  it('is null by default', () => {
    expect(dragSessionStore.state).toBeNull();
  });

  it('publishes a snapshot at drag start and clears on drop', async () => {
    const { engine } = await renderDnd();
    const source = createElement();
    engine.registerSource(source, { payload: { kind: 'card' } });
    const target = createElement();
    engine.registerTarget(target, {});

    fireEvent.dragStart(source);

    // start() publishes the session snapshot synchronously, just before it
    // dispatches onMoveStart.
    const startSnapshot = dragSessionStore.state;
    expect(startSnapshot).not.toBeNull();
    expect(startSnapshot!.source.element).toBe(source);
    expect(startSnapshot!.source.payload).toEqual({ kind: 'card' });

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
    engine.registerSource(source, {});
    const target = createElement();
    engine.registerTarget(target, {});

    fireEvent.dragStart(source);
    await flushRaf();

    const beforeEnter = dragSessionStore.state;
    expect(beforeEnter).not.toBeNull();
    expect(beforeEnter!.location.current.targets.length).toBe(0);

    fireEvent.dragEnter(target);
    fireEvent.dragOver(target);
    await flushRaf();

    const afterEnter = dragSessionStore.state;
    expect(afterEnter).not.toBe(beforeEnter);
    expect(afterEnter!.location.current.targets.length).toBe(1);
    expect(afterEnter!.location.current.targets[0].element).toBe(target);

    fireEvent.drop(target);
    expect(dragSessionStore.state).toBeNull();
  });

  it('cancel via dragend clears the store', async () => {
    const { engine } = await renderDnd();
    const source = createElement();
    engine.registerSource(source, {});
    const target = createElement();
    engine.registerTarget(target, {});

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
    engine.registerSource(source, {});
    const target = createElement();
    const cleanup = engine.registerTarget(target, {});

    fireEvent.dragStart(source);
    await flushRaf();
    fireEvent.dragEnter(target);
    fireEvent.dragOver(target);
    await flushRaf();

    expect(dragSessionStore.state!.location.current.targets.length).toBe(1);

    const listener = vi.fn();
    const unsubscribe = dragSessionStore.subscribe(listener);

    cleanup();

    expect(listener).toHaveBeenCalledTimes(1);
    expect(dragSessionStore.state!.location.current.targets.length).toBe(0);

    unsubscribe();
    fireEvent.dragEnd(window);
  });

  it('gives each snapshot its own copy of the initial location', async () => {
    const { engine } = await renderDnd();
    const source = createElement();
    engine.registerSource(source, {});
    const target = createElement();
    engine.registerTarget(target, {});

    fireEvent.dragStart(source);
    await flushRaf();
    fireEvent.dragEnter(target);
    fireEvent.dragOver(target);
    await flushRaf();

    const snapshot = dragSessionStore.state!;
    const record = snapshot.location.current.targets[0];
    expect(record.element).toBe(target);
    // A consumer mutating its snapshot's `initial` must corrupt neither the
    // engine's bookkeeping nor later snapshots built from it. The array is
    // typed `readonly`; the runtime clone is the guarantee for consumers that
    // bypass the types, which is what this exercises.
    // @ts-expect-error -- deliberate mutation of a readonly-typed array
    snapshot.location.initial.targets.push(record);

    fireEvent.dragLeave(target);
    await flushRaf();

    const next = dragSessionStore.state!;
    expect(next).not.toBe(snapshot);
    expect(next.location.initial.targets).toEqual([]);

    cancel(target);
  });

  it('subscribers receive every published snapshot', async () => {
    const { engine } = await renderDnd();
    const source = createElement();
    engine.registerSource(source, {});
    const target = createElement();
    engine.registerTarget(target, {});

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

  it('keeps the session source identity across a retarget while republishing the source store', async () => {
    const { engine } = await renderDnd();
    const source = createElement();
    engine.registerSource(source, {});

    fireEvent.dragStart(source);
    await flushRaf();

    const sessionSource = dragSessionStore.state!.source;
    const publishedSource = dragSourceStore.state;
    expect(publishedSource).toEqual(sessionSource);
    expect(publishedSource).not.toBe(sessionSource);
    const listener = vi.fn();
    const unsubscribe = dragSourceStore.subscribe(listener);

    // A virtualizer remounting the dragged row: the session follows the new node.
    const replacement = createElement();
    retargetDragSource(source, replacement);

    // The object every event of this drag reports, so it is mutated, not replaced.
    expect(dragSessionStore.state!.source).toBe(sessionSource);
    expect(sessionSource.element).toBe(replacement);
    // Reactive subscribers need a new reference to re-run their selectors.
    expect(listener).toHaveBeenCalledTimes(1);
    expect(dragSourceStore.state).not.toBe(publishedSource);
    expect(dragSourceStore.state!.element).toBe(replacement);

    unsubscribe();
    engine.cancelDrag();
    expect(dragSourceStore.state).toBeNull();
  });

  it('does not notify source-only subscribers when the target stack changes', async () => {
    const { engine } = await renderDnd();
    const source = createElement();
    const target = createElement();
    engine.registerSource(source, {});
    engine.registerTarget(target, {});
    const listener = vi.fn();
    const unsubscribe = dragSourceStore.subscribe(listener);

    fireEvent.dragStart(source);
    await flushRaf();
    expect(listener).toHaveBeenCalledTimes(1);

    fireEvent.dragEnter(target);
    fireEvent.dragOver(target);
    await flushRaf();
    expect(listener).toHaveBeenCalledTimes(1);

    fireEvent.drop(target);
    expect(listener).toHaveBeenCalledTimes(2);
    expect(dragSourceStore.state).toBeNull();
    unsubscribe();
  });
});
