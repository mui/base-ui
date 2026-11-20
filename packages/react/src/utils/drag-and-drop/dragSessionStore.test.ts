import { describe, it, expect, vi } from 'vitest';
import { createDndRenderer } from '../../../test/dndEngine';
import {
  cancel,
  createElement,
  flushRaf,
  setupDragEngineTests,
  fireDrag,
  dragOver,
} from '../../../test/dnd';
import { dragSessionStore, dragSourceStore } from './dragSessionStore';
import { retargetDragSource } from './dragSource';

setupDragEngineTests();

describe('dragSessionStore', () => {
  const { renderDnd } = createDndRenderer();

  it('publishes a snapshot at drag start and clears on drop', async () => {
    const { engine } = await renderDnd();
    const source = createElement();
    engine.registerSource(source, { payload: { kind: 'card' } });
    const target = createElement();
    engine.registerTarget(target, {});

    fireDrag.dragStart(source);

    // start() publishes the session snapshot synchronously, just before it
    // dispatches onMoveStart.
    const startSnapshot = dragSessionStore.state;
    expect(startSnapshot).not.toBeNull();
    expect(startSnapshot!.source.element).toBe(source);
    expect(startSnapshot!.source.payload).toEqual({ kind: 'card' });

    await flushRaf();

    fireDrag.dragEnter(target);
    await dragOver(target);

    fireDrag.drop(target);
    expect(dragSessionStore.state).toBeNull();
  });

  it('publishes a fresh location reference on drop-target stack changes', async () => {
    const { engine } = await renderDnd();
    const source = createElement();
    engine.registerSource(source, {});
    const target = createElement();
    engine.registerTarget(target, {});

    fireDrag.dragStart(source);
    await flushRaf();

    const beforeEnter = dragSessionStore.state;
    expect(beforeEnter).not.toBeNull();
    expect(beforeEnter!.location.current.targets.length).toBe(0);

    fireDrag.dragEnter(target);
    await dragOver(target);

    const afterEnter = dragSessionStore.state;
    expect(afterEnter).not.toBe(beforeEnter);
    expect(afterEnter!.location.current.targets.length).toBe(1);
    expect(afterEnter!.location.current.targets[0].element).toBe(target);

    fireDrag.drop(target);
    expect(dragSessionStore.state).toBeNull();
  });

  it('notifies subscribers when an active drop target unregisters mid-drag', async () => {
    const { engine } = await renderDnd();
    const source = createElement();
    engine.registerSource(source, {});
    const target = createElement();
    const cleanup = engine.registerTarget(target, {});

    fireDrag.dragStart(source);
    await flushRaf();
    fireDrag.dragEnter(target);
    await dragOver(target);

    expect(dragSessionStore.state!.location.current.targets.length).toBe(1);

    const listener = vi.fn();
    const unsubscribe = dragSessionStore.subscribe(listener);

    cleanup();

    expect(listener).toHaveBeenCalledTimes(1);
    expect(dragSessionStore.state!.location.current.targets.length).toBe(0);

    unsubscribe();
    fireDrag.dragEnd();
  });

  it('gives each snapshot its own copy of the initial location', async () => {
    const { engine } = await renderDnd();
    const source = createElement();
    engine.registerSource(source, {});
    const target = createElement();
    engine.registerTarget(target, {});

    fireDrag.dragStart(source);
    await flushRaf();
    fireDrag.dragEnter(target);
    await dragOver(target);

    const snapshot = dragSessionStore.state!;
    const record = snapshot.location.current.targets[0];
    expect(record.element).toBe(target);
    // Covers consumers that bypass the `readonly` type: only the runtime clone
    // keeps the engine's bookkeeping and later snapshots safe from this mutation.
    // @ts-expect-error -- deliberate mutation of a readonly-typed array
    snapshot.location.initial.targets.push(record);

    fireDrag.dragLeave();
    await flushRaf();

    const next = dragSessionStore.state!;
    expect(next).not.toBe(snapshot);
    expect(next.location.initial.targets).toEqual([]);

    cancel();
  });

  it('keeps the session source identity across a retarget while republishing the source store', async () => {
    const { engine } = await renderDnd();
    const source = createElement();
    engine.registerSource(source, {});

    fireDrag.dragStart(source);
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

    // Every event of this drag reports this object, so it is mutated, not replaced.
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

    fireDrag.dragStart(source);
    await flushRaf();
    expect(listener).toHaveBeenCalledTimes(1);

    fireDrag.dragEnter(target);
    await dragOver(target);
    expect(listener).toHaveBeenCalledTimes(1);

    fireDrag.drop(target);
    expect(listener).toHaveBeenCalledTimes(2);
    expect(dragSourceStore.state).toBeNull();
    unsubscribe();
  });
});
