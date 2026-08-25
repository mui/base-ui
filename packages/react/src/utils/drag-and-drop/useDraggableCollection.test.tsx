import * as React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { fireEvent, renderHook } from '@testing-library/react';
import { act } from '@mui/internal-test-utils';
import { installDndPolyfill } from '../../../test/dndPolyfill';
import {
  createElement,
  dragEnter,
  dragOver,
  drop,
  flushRaf,
  lift,
  registerCleanup,
  setupDragEngineTests,
} from '../../../test/dnd';
import { setupPlugin as setupPluginBase } from '../../../test/dndCollection';
import { useInnerDragEngine } from './useInnerDragEngine';
import { useDraggableCollection } from './useDraggableCollection';
import { dragSessionStore } from './dragSessionStore';
import { getRegistration } from './draggableRegistry';
import { captureDropTargetRegistration } from './dropTarget';
import { monitorRegistry } from './monitor';
import type { DragKind, DropTargetRecord } from '../../types/drag';
import { createKind } from './dragKind';

const cardsKind = createKind<any>('cards');
const columnsKind = createKind<any>('columns');

installDndPolyfill();

// Drains the `registerCleanup` queue, removes created elements, and force-ends
// any in-flight drag — even when an assertion threw mid-test.
setupDragEngineTests();

/** `setupPlugin` with its teardown routed through the drained cleanup queue, so
 * a failed assertion can't leak the plugin's monitor into later tests. */
function setupPlugin(
  ...args: Parameters<typeof setupPluginBase>
): ReturnType<typeof setupPluginBase> {
  const result = setupPluginBase(...args);
  registerCleanup(result.cleanup);
  return result;
}

/**
 * Register `element` as a drag source that belongs to no collection, through the
 * same drag engine `Draggable.Root` uses.
 */
function setupPlainDraggable(
  element: HTMLElement,
  parameters: { kind: DragKind<any>; payload?: unknown },
) {
  const { result } = renderHook(() => useInnerDragEngine());
  registerCleanup(result.current.registerDraggable(element, () => parameters));
}

describe('useDraggableCollection', () => {
  it('reuses item registration parameters until a dynamic input changes', () => {
    let draggable = true;
    const { plugin } = setupPlugin({ canDrag: () => draggable }, { knownItemIds: ['a'] });
    const element = createElement();
    registerCleanup(plugin.setupItem('a', element));
    const getParameters = getRegistration(element)!;

    const first = getParameters();
    expect(getParameters()).toBe(first);

    draggable = false;
    const second = getParameters();
    expect(second).not.toBe(first);
    expect(second.disabled).toBe(true);
    expect(getParameters()).toBe(second);
  });

  it('reuses collection monitor and drop target registrations', () => {
    const { plugin } = setupPlugin({}, { knownItemIds: ['a'] });
    const element = createElement();
    registerCleanup(plugin.setupItem('a', element));

    const getMonitor = [...monitorRegistry].at(-1)!;
    expect(getMonitor()).toBe(getMonitor());

    const record: DropTargetRecord = {
      element,
      kind: undefined,
      payload: undefined,
      getLocalPoint: () => ({ x: 0, y: 0 }),
      getSnappedLocalPoint: () => ({ x: 0, y: 0 }),
    };
    const getDropTarget = captureDropTargetRegistration(record)!;
    expect(getDropTarget()).toBe(getDropTarget());
  });

  it('adapts collection preview content and placement settings to the draggable', async () => {
    const previewRender = vi.fn(() => <span>Two cards</span>);
    const previewModifier = vi.fn(({ point }) => point);
    const previewContainer = createElement();
    const offset = { x: 7, y: 11 };
    const getSelectedItemIds = vi.fn(() => new Set(['a', 'b']));
    const { plugin, context } = setupPlugin(
      {
        dragPreview: {
          render: previewRender,
          offset,
          modifiers: previewModifier,
          container: previewContainer,
        },
      },
      {
        knownItemIds: ['a', 'b'],
        overrides: { getSelectedItemIds },
      },
    );
    const source = createElement();
    plugin.setupItem('a', source);

    const declaration = getRegistration(source)!().dragPreview!;
    expect(declaration.offset).toBe(offset);
    expect(declaration.modifiers).toBe(previewModifier);
    expect(declaration.container).toBe(previewContainer);

    await lift(source);

    expect(previewRender).toHaveBeenCalledWith({
      itemIds: new Set(['a', 'b']),
      draggedItemId: 'a',
      actions: context,
    });
    // Selection/pruning is shared by the pre-drag geometry snapshot and payload.
    expect(getSelectedItemIds).toHaveBeenCalledTimes(1);
  });

  describe('drop position', () => {
    it('registers a secondary copy as a drop-only target', async () => {
      const onDrop = vi.fn();
      const { plugin } = setupPlugin({ onDrop }, { knownItemIds: ['a', 'b'] });
      const source = createElement({ top: 0, height: 100 });
      const targetCopy = createElement({ top: 200, height: 100 });
      plugin.setupItem('a', source);
      plugin.setupDropTarget('b', targetCopy);

      expect(getRegistration(targetCopy)).toBeUndefined();

      await lift(source);
      await dragEnter(targetCopy, { clientY: 210 });
      await dragOver(targetCopy, { clientY: 210 });
      drop(targetCopy, { clientY: 210 });

      expect(onDrop).toHaveBeenCalledWith(
        expect.objectContaining({ target: { itemId: 'b', position: 'before' } }),
      );
    });

    it('routes onDrop for "before" / "on" / "after" based on pointer Y', async () => {
      const onDrop = vi.fn();
      const { plugin } = setupPlugin({ onDrop }, { knownItemIds: ['a', 'b'] });
      const source = createElement({ top: 0, height: 100 });
      const target = createElement({ top: 200, height: 100 });
      plugin.setupItem('a', source);
      plugin.setupItem('b', target);

      // top 25% → before
      await lift(source);
      await dragEnter(target, { clientY: 210 });
      await dragOver(target, { clientY: 210 });
      drop(target, { clientY: 210 });
      expect(onDrop).toHaveBeenLastCalledWith(
        expect.objectContaining({
          target: { itemId: 'b', position: 'before' },
        }),
      );

      // middle → on
      await lift(source);
      await dragEnter(target, { clientY: 250 });
      await dragOver(target, { clientY: 250 });
      drop(target, { clientY: 250 });
      expect(onDrop).toHaveBeenLastCalledWith(
        expect.objectContaining({
          target: { itemId: 'b', position: 'on' },
        }),
      );

      // bottom 25% → after
      await lift(source);
      await dragEnter(target, { clientY: 290 });
      await dragOver(target, { clientY: 290 });
      drop(target, { clientY: 290 });
      expect(onDrop).toHaveBeenLastCalledWith(
        expect.objectContaining({
          target: { itemId: 'b', position: 'after' },
        }),
      );
    });

    it('uses a 50/50 split when only before/after positions are enabled', async () => {
      const onDrop = vi.fn();
      const { plugin } = setupPlugin(
        {
          onDrop,
          getDropCapabilities: () => ({ hasOn: false, hasBeforeAfter: true }),
        },
        { knownItemIds: ['a', 'b'] },
      );
      const source = createElement({ top: 0, height: 100 });
      const target = createElement({ top: 200, height: 100 });
      plugin.setupItem('a', source);
      plugin.setupItem('b', target);

      // Anywhere in the top half resolves to "before" rather than "on".
      await lift(source);
      await dragEnter(target, { clientY: 240 });
      await dragOver(target, { clientY: 240 });
      drop(target, { clientY: 240 });
      expect(onDrop).toHaveBeenLastCalledWith(
        expect.objectContaining({
          target: { itemId: 'b', position: 'before' },
        }),
      );
    });

    it('reads the before/after split from clientX with orientation: "horizontal"', async () => {
      const onDrop = vi.fn();
      const { plugin } = setupPlugin(
        {
          onDrop,
          orientation: 'horizontal',
          getDropCapabilities: () => ({ hasOn: false, hasBeforeAfter: true }),
        },
        { knownItemIds: ['a', 'b'] },
      );
      const source = createElement({ top: 0, height: 100, left: 0, width: 100 });
      const target = createElement({ top: 0, height: 100, left: 200, width: 100 });
      plugin.setupItem('a', source);
      plugin.setupItem('b', target);

      // Left half of the row → before (with a vertical read, clientY 50 would
      // have landed mid-row and split on Y instead).
      await lift(source);
      await dragEnter(target, { clientX: 240, clientY: 50 });
      await dragOver(target, { clientX: 240, clientY: 50 });
      drop(target, { clientX: 240, clientY: 50 });
      expect(onDrop).toHaveBeenLastCalledWith(
        expect.objectContaining({
          target: { itemId: 'b', position: 'before' },
        }),
      );

      // Right half → after. Only clientX changed, pinning the axis pick.
      await lift(source);
      await dragEnter(target, { clientX: 260, clientY: 50 });
      await dragOver(target, { clientX: 260, clientY: 50 });
      drop(target, { clientX: 260, clientY: 50 });
      expect(onDrop).toHaveBeenLastCalledWith(
        expect.objectContaining({
          target: { itemId: 'b', position: 'after' },
        }),
      );
    });

    it('flips the horizontal before/after split for an RTL row', async () => {
      const onDrop = vi.fn();
      const { plugin } = setupPlugin(
        {
          onDrop,
          orientation: 'horizontal',
          getDropCapabilities: () => ({ hasOn: false, hasBeforeAfter: true }),
        },
        { knownItemIds: ['a', 'b'] },
      );
      const source = createElement({ top: 0, height: 100, left: 0, width: 100 });
      const target = createElement({ top: 0, height: 100, left: 200, width: 100 });
      // The row's computed `direction` drives the flip; an inline style resolves
      // in jsdom without layout (`createElement` connects the node to the body).
      target.style.direction = 'rtl';
      plugin.setupItem('a', source);
      plugin.setupItem('b', target);

      // Reading order is right-to-left, so the right half is visually "before".
      await lift(source);
      await dragEnter(target, { clientX: 260, clientY: 50 });
      await dragOver(target, { clientX: 260, clientY: 50 });
      drop(target, { clientX: 260, clientY: 50 });
      expect(onDrop).toHaveBeenLastCalledWith(
        expect.objectContaining({
          target: { itemId: 'b', position: 'before' },
        }),
      );
    });
  });

  describe('normalized drop routing', () => {
    it('can expose positions only to external drags', async () => {
      const onDrop = vi.fn();
      const onDragEnd = vi.fn();
      const { plugin, lastState } = setupPlugin(
        {
          onDrop,
          onDragEnd,
          getDropCapabilities: ({ isInternal }) => ({
            hasOn: false,
            hasBeforeAfter: !isInternal,
          }),
        },
        { knownItemIds: ['a', 'b'] },
      );
      const source = createElement({ top: 0, height: 100 });
      const target = createElement({ top: 200, height: 100 });
      plugin.setupItem('a', source);
      plugin.setupItem('b', target);

      await lift(source);
      await dragEnter(target, { clientY: 210 });
      await dragOver(target, { clientY: 210 });

      expect(lastState()?.dropTargetItemId).toBe(null);
      expect(lastState()?.dropPosition).toBe(null);

      drop(target, { clientY: 210 });

      expect(onDrop).not.toHaveBeenCalled();
      // Nothing committed, so the drag ends as a cancel, not an internal drop.
      expect(onDragEnd).toHaveBeenCalledTimes(1);
      expect(onDragEnd.mock.calls[0][0].isInternal).toBe(false);
      expect(onDragEnd.mock.calls[0][0].canceled).toBe(true);
    });

    it('reports isInternal=true for a drop in its originating collection', async () => {
      const onDrop = vi.fn();
      const onDragEnd = vi.fn();
      const { plugin } = setupPlugin({ onDrop, onDragEnd }, { knownItemIds: ['a', 'b'] });
      const source = createElement({ top: 0, height: 100 });
      const target = createElement({ top: 200, height: 100 });
      plugin.setupItem('a', source);
      plugin.setupItem('b', target);

      await lift(source);
      await dragEnter(target, { clientY: 250 });
      await dragOver(target, { clientY: 250 });
      drop(target, { clientY: 250 });

      expect(onDrop).toHaveBeenCalledWith(expect.objectContaining({ isInternal: true }));
      expect(onDragEnd).toHaveBeenCalledTimes(1);
      expect(onDragEnd.mock.calls[0][0].isInternal).toBe(true);
    });
  });

  describe('canDrag / canDrop / isDropTargetInvalid', () => {
    it('rejects drop on a dragged item', async () => {
      const onDrop = vi.fn();
      const { plugin } = setupPlugin({ onDrop }, { knownItemIds: ['a'] });
      const el = createElement({ top: 0, height: 100 });
      plugin.setupItem('a', el);

      await lift(el);
      await dragEnter(el, { clientY: 50 });
      await dragOver(el, { clientY: 50 });
      drop(el, { clientY: 50 });

      expect(onDrop).not.toHaveBeenCalled();
    });

    it('can retain a dragged item as a target for live reordering', async () => {
      const onDrop = vi.fn(() => true);
      const onDragEnd = vi.fn();
      const { plugin } = setupPlugin(
        { allowDropOnDraggedItems: true, onDrop, onDragEnd },
        { knownItemIds: ['a'] },
      );
      const element = createElement({ top: 0, height: 100 });
      plugin.setupItem('a', element);

      await lift(element);
      await dragEnter(element, { clientY: 50 });
      await dragOver(element, { clientY: 50 });
      drop(element, { clientY: 50 });

      expect(onDrop).toHaveBeenCalledWith(
        expect.objectContaining({
          itemIds: new Set(['a']),
          target: { itemId: 'a', position: 'on' },
          isInternal: true,
        }),
      );
      expect(onDragEnd).toHaveBeenCalledWith(
        expect.objectContaining({ canceled: false, isInternal: true }),
      );
    });

    it('still applies canDrop when a dragged item remains a target', async () => {
      const onDrop = vi.fn(() => true);
      const canDrop = vi.fn(() => false);
      const { plugin } = setupPlugin(
        { allowDropOnDraggedItems: true, canDrop, onDrop },
        { knownItemIds: ['a'] },
      );
      const element = createElement({ top: 0, height: 100 });
      plugin.setupItem('a', element);

      await lift(element);
      await dragEnter(element, { clientY: 50 });
      await dragOver(element, { clientY: 50 });
      drop(element, { clientY: 50 });

      expect(canDrop).toHaveBeenCalled();
      expect(onDrop).not.toHaveBeenCalled();
    });

    it('rejects drop on a descendant when isDropTargetInvalid says so (tree case)', async () => {
      const onDrop = vi.fn();
      // 'b' is a child of 'a'
      const { plugin } = setupPlugin(
        { onDrop },
        {
          knownItemIds: ['a', 'b'],
          parentMap: { b: 'a' },
          childrenMap: { a: ['b'], null: ['a'] },
        },
      );
      const source = createElement({ top: 0, height: 100 });
      const target = createElement({ top: 200, height: 100 });
      plugin.setupItem('a', source);
      plugin.setupItem('b', target);

      await lift(source);
      await dragEnter(target, { clientY: 250 });
      await dragOver(target, { clientY: 250 });
      drop(target, { clientY: 250 });

      expect(onDrop).not.toHaveBeenCalled();
    });

    it('respects user-provided canDrop', async () => {
      const onDrop = vi.fn();
      const canDrop = vi.fn(() => false);
      const { plugin } = setupPlugin({ onDrop, canDrop }, { knownItemIds: ['a', 'b'] });
      const source = createElement({ top: 0, height: 100 });
      const target = createElement({ top: 200, height: 100 });
      plugin.setupItem('a', source);
      plugin.setupItem('b', target);

      await lift(source);
      await dragEnter(target, { clientY: 210 });
      await dragOver(target, { clientY: 210 });
      drop(target, { clientY: 210 });

      expect(canDrop).toHaveBeenCalled();
      expect(onDrop).not.toHaveBeenCalled();
    });

    it('measures the hovered row once per frame when canDrop is configured', async () => {
      const onDrop = vi.fn();
      const canDrop = vi.fn(() => true);
      const { plugin } = setupPlugin({ onDrop, canDrop }, { knownItemIds: ['a', 'b'] });
      const source = createElement({ top: 0, height: 100 });
      const target = createElement({ top: 200, height: 100 });
      plugin.setupItem('a', source);
      plugin.setupItem('b', target);

      await lift(source);
      await dragEnter(target, { clientY: 210 });
      const measure = vi.spyOn(target, 'getBoundingClientRect');

      await dragOver(target, { clientY: 260 });

      // `canDrop` computed the position while the stack resolved, and the row's
      // `onDrag` in the same frame reused it rather than measuring again.
      expect(canDrop).toHaveBeenLastCalledWith(expect.objectContaining({ position: 'on' }));
      expect(measure).toHaveBeenCalledTimes(1);
    });

    it('blocks the pickup when canDrag returns false', async () => {
      const onDrop = vi.fn();
      const canDrag = vi.fn(() => false);
      const { plugin } = setupPlugin({ onDrop, canDrag }, { knownItemIds: ['a', 'b'] });
      const source = createElement({ top: 0, height: 100 });
      const target = createElement({ top: 200, height: 100 });
      plugin.setupItem('a', source);
      plugin.setupItem('b', target);

      // `canDrag: () => false` maps to `disabled`, so this lift must NOT start
      // a drag — opt out of the helper's started-drag assertion.
      await lift(source, { expectNoDrag: true });
      await dragEnter(target, { clientY: 250 });
      await dragOver(target, { clientY: 250 });
      drop(target, { clientY: 250 });

      expect(canDrag).toHaveBeenCalledWith('a');
      expect(onDrop).not.toHaveBeenCalled();
    });

    it('applies a config change made mid-drag once the drag ends', async () => {
      // Re-registering items mid-drag would tear the dragged item's registration
      // out from under the live gesture, so the sweep is deferred. It still has to
      // land — otherwise a `canDrag` (or locale) change made while dragging is
      // silently lost for the rest of the collection's life.
      const a = createElement({ top: 0, height: 100 });
      const b = createElement({ top: 200, height: 100 });
      const actions = {
        hasItem: () => true,
        getSelectedItemIds: () => new Set<string | number>(),
        getItemModels: (ids: ReadonlyArray<string | number>) => [...ids],
      };
      const { result, rerender } = renderHook(
        ({ locked }: { locked: boolean }) =>
          useDraggableCollection({
            onDrop: () => {},
            canDrag: () => !locked,
            getActions: () => actions,
          }),
        { initialProps: { locked: false } },
      );
      registerCleanup(result.current.setupItem('a', a));
      registerCleanup(result.current.setupItem('b', b));
      expect(b.style.touchAction).toBe('manipulation');

      await lift(a);
      rerender({ locked: true });
      // Deferred: the live gesture keeps the registration it started with.
      expect(b.style.touchAction).toBe('manipulation');

      drop(b, { clientY: 250 });
      // The sweep runs in a microtask once the session is gone.
      await Promise.resolve();
      await Promise.resolve();

      expect(b.style.touchAction).toBe('');
    });
  });

  describe('multi-select drag', () => {
    it('drags every selected item when the user lifts a selected item', async () => {
      const onDrop = vi.fn();
      const { plugin } = setupPlugin(
        { onDrop },
        {
          knownItemIds: ['a', 'b', 'c'],
          selectedItemIds: new Set<string>(['a', 'c']),
        },
      );
      const source = createElement({ top: 0, height: 100 });
      const target = createElement({ top: 200, height: 100 });
      plugin.setupItem('a', source);
      plugin.setupItem('b', target);
      plugin.setupItem('c', createElement({ top: 400, height: 100 }));

      await lift(source);
      await dragEnter(target, { clientY: 210 });
      await dragOver(target, { clientY: 210 });
      drop(target, { clientY: 210 });

      expect(onDrop).toHaveBeenCalledTimes(1);
      const [{ itemIds }] = onDrop.mock.calls[0];
      expect([...itemIds].sort()).toEqual(['a', 'c']);
    });

    it('drags only the lifted item when it is not part of the selection', async () => {
      const onDrop = vi.fn();
      const { plugin } = setupPlugin(
        { onDrop },
        {
          knownItemIds: ['a', 'b', 'c'],
          selectedItemIds: new Set<string>(['b', 'c']),
        },
      );
      const source = createElement({ top: 0, height: 100 });
      const target = createElement({ top: 200, height: 100 });
      plugin.setupItem('a', source);
      plugin.setupItem('b', target);

      await lift(source);
      await dragEnter(target, { clientY: 210 });
      await dragOver(target, { clientY: 210 });
      drop(target, { clientY: 210 });

      expect(onDrop).toHaveBeenCalledTimes(1);
      const [{ itemIds }] = onDrop.mock.calls[0];
      expect([...itemIds]).toEqual(['a']);
    });

    it('applies pruneDraggedItems for trees (drops descendants of selected ancestors)', async () => {
      const onDrop = vi.fn();
      // 'a1' is a child of 'a'; both selected → only 'a' should drag
      const { plugin } = setupPlugin(
        { onDrop },
        {
          knownItemIds: ['a', 'a1', 'b'],
          parentMap: { a1: 'a' },
          childrenMap: { a: ['a1'], null: ['a', 'b'] },
          selectedItemIds: new Set<string>(['a', 'a1']),
        },
      );
      const a = createElement({ top: 0, height: 100 });
      const a1 = createElement({ top: 100, height: 100 });
      const b = createElement({ top: 200, height: 100 });
      plugin.setupItem('a', a);
      plugin.setupItem('a1', a1);
      plugin.setupItem('b', b);

      await lift(a);
      await dragEnter(b, { clientY: 210 });
      await dragOver(b, { clientY: 210 });
      drop(b, { clientY: 210 });

      expect(onDrop).toHaveBeenCalledTimes(1);
      const [{ itemIds }] = onDrop.mock.calls[0];
      expect([...itemIds]).toEqual(['a']);
    });
  });

  describe('cancellation', () => {
    it('reports canceled=true via onDragEnd when no drop target is hit', async () => {
      const onDragEnd = vi.fn();
      const onDrop = vi.fn();
      const { plugin } = setupPlugin({ onDragEnd, onDrop }, { knownItemIds: ['a'] });
      const el = createElement({ top: 0, height: 100 });
      plugin.setupItem('a', el);

      await lift(el);
      // End the drag without a drop target hit
      fireEvent.dragEnd(el);

      expect(onDrop).not.toHaveBeenCalled();
      expect(onDragEnd).toHaveBeenCalledTimes(1);
      expect(onDragEnd.mock.calls[0][0].canceled).toBe(true);
    });
  });

  describe('mid-drag remount', () => {
    it('re-points the live session at the dragged row remounted to a fresh node', async () => {
      const { plugin } = setupPlugin({}, { knownItemIds: ['a'] });
      const first = createElement({ top: 0, height: 100 });
      const cleanup = plugin.setupItem('a', first);

      await lift(first);
      expect(dragSessionStore.getSnapshot()?.source.element).toBe(first);

      // Exactly React's order for a keyed remount: the previous effect's cleanup
      // runs before the new setup, so the outgoing node is already forgotten by
      // the time the replacement arrives.
      const second = createElement({ top: 0, height: 100 });
      act(() => {
        cleanup();
        plugin.setupItem('a', second);
      });

      // Without the re-point the session keeps reporting the detached node, so
      // `data-dragging` strands on it and the live row renders undragged.
      expect(dragSessionStore.getSnapshot()?.source.element).toBe(second);
    });

    it('leaves the session alone when a different row remounts', async () => {
      const { plugin } = setupPlugin({}, { knownItemIds: ['a', 'b'] });
      const dragged = createElement({ top: 0, height: 100 });
      const other = createElement({ top: 200, height: 100 });
      plugin.setupItem('a', dragged);
      const cleanupOther = plugin.setupItem('b', other);

      await lift(dragged);

      act(() => {
        cleanupOther();
        plugin.setupItem('b', createElement({ top: 200, height: 100 }));
      });

      expect(dragSessionStore.getSnapshot()?.source.element).toBe(dragged);
    });
  });

  describe('state transitions', () => {
    it('emits state on dragstart, hover, and reset on drop', async () => {
      const onDrop = vi.fn();
      const { plugin, lastState, states } = setupPlugin({ onDrop }, { knownItemIds: ['a', 'b'] });
      const source = createElement({ top: 0, height: 100 });
      const target = createElement({ top: 200, height: 100 });
      plugin.setupItem('a', source);
      plugin.setupItem('b', target);

      // initial state recorded on connect
      expect(states.length).toBeGreaterThanOrEqual(1);
      expect(lastState()?.draggedItemIds.size).toBe(0);

      await lift(source);
      const startState = lastState();
      expect(startState?.draggedItemIds.has('a')).toBe(true);
      expect(startState?.dropTargetItemId).toBe(null);

      await dragEnter(target, { clientY: 210 });
      const hoverState = lastState();
      expect(hoverState?.dropTargetItemId).toBe('b');
      expect(hoverState?.dropPosition).toBe('before');

      drop(target, { clientY: 210 });
      const endState = lastState();
      expect(endState?.draggedItemIds.size).toBe(0);
      expect(endState?.dropTargetItemId).toBe(null);
    });

    it('updates dropTargetItemId when moving from one target to another', async () => {
      const onDrop = vi.fn();
      const { plugin, lastState } = setupPlugin({ onDrop }, { knownItemIds: ['a', 'b', 'c'] });
      const source = createElement({ top: 0, height: 100 });
      const targetB = createElement({ top: 200, height: 100 });
      const targetC = createElement({ top: 400, height: 100 });
      plugin.setupItem('a', source);
      plugin.setupItem('b', targetB);
      plugin.setupItem('c', targetC);

      await lift(source);
      await dragEnter(targetB, { clientY: 210 });
      expect(lastState()?.dropTargetItemId).toBe('b');

      await dragEnter(targetC, { clientY: 410 });
      expect(lastState()?.dropTargetItemId).toBe('c');

      fireEvent.dragEnd(targetC);
    });
  });

  describe('kind filtering', () => {
    it('rejects drops from a different kind by default', async () => {
      const onDropA = vi.fn();
      const onDropB = vi.fn();
      const a = setupPlugin({ onDrop: onDropA, kind: cardsKind }, { knownItemIds: ['a'] });
      const b = setupPlugin({ onDrop: onDropB, kind: columnsKind }, { knownItemIds: ['b'] });
      const sourceA = createElement({ top: 0, height: 100 });
      const targetB = createElement({ top: 200, height: 100 });
      a.plugin.setupItem('a', sourceA);
      b.plugin.setupItem('b', targetB);

      await lift(sourceA);
      await dragEnter(targetB, { clientY: 210 });
      await dragOver(targetB, { clientY: 210 });
      drop(targetB, { clientY: 210 });

      expect(onDropB).not.toHaveBeenCalled();
      expect(onDropA).not.toHaveBeenCalled();
    });

    it('accepts cross-type drops from an accepted external kind', async () => {
      const onDrop = vi.fn();
      const a = setupPlugin({ kind: cardsKind }, { knownItemIds: ['a'] });
      const b = setupPlugin(
        { onDrop, kind: columnsKind, accept: cardsKind },
        { knownItemIds: ['b'] },
      );
      const sourceA = createElement({ top: 0, height: 100 });
      const targetB = createElement({ top: 200, height: 100 });
      a.plugin.setupItem('a', sourceA);
      b.plugin.setupItem('b', targetB);

      await lift(sourceA);
      await dragEnter(targetB, { clientY: 250 });
      await dragOver(targetB, { clientY: 250 });
      drop(targetB, { clientY: 250 });

      expect(onDrop).toHaveBeenCalledTimes(1);
      // A drop from another collection is flagged external.
      expect(onDrop.mock.calls[0][0].isInternal).toBe(false);
    });

    // Every other cross-kind case drags one collection into another, so the source
    // always carries the collection's wire format. A plain `Draggable.Root` carries
    // whatever its own author declared instead.
    it.each([
      ['declares no payload', undefined],
      ['declares a scalar payload', 'card-1'],
    ])('tolerates a drag from a plain draggable that %s', async (_label, payload) => {
      const onDrop = vi.fn();
      const onDragEnd = vi.fn();
      const b = setupPlugin(
        { onDrop, onDragEnd, kind: columnsKind, accept: cardsKind },
        { knownItemIds: ['b'] },
      );
      const plainSource = createElement({ top: 0, height: 100 });
      const targetB = createElement({ top: 200, height: 100 });
      setupPlainDraggable(plainSource, { kind: cardsKind, payload });
      b.plugin.setupItem('b', targetB);

      await lift(plainSource);
      // Reading the payload as this collection's shape throws, and the engine tears
      // the session down — so surviving drag start is the assertion.
      expect(dragSessionStore.getSnapshot()).not.toBe(null);

      await dragEnter(targetB, { clientY: 250 });
      await dragOver(targetB, { clientY: 250 });
      drop(targetB, { clientY: 250 });

      // A normalized drop still reaches the collection with an empty item set;
      // the consumer can inspect the generic source and decide what to commit.
      expect(onDrop).toHaveBeenCalledWith(
        expect.objectContaining({
          itemIds: new Set(),
          items: [],
          isInternal: false,
          target: { itemId: 'b', position: 'on' },
        }),
      );
      // This collection did not originate the drag, so it has no lifecycle end.
      expect(onDragEnd).not.toHaveBeenCalled();
      // State is untouched, so a later real drag still starts from a clean slate.
      expect(b.lastState()).toEqual({
        draggedItemIds: new Set(),
        dropTargetItemId: null,
        dropPosition: null,
      });
    });

    // The root target reads the incoming payload on its own `onDrop` path, which
    // the item-drop case above never reaches.
    it('tolerates a payload-less drag released on the collection root', async () => {
      const onDrop = vi.fn();
      const b = setupPlugin(
        { onDrop, kind: columnsKind, accept: cardsKind },
        { knownItemIds: ['b'] },
      );
      const plainSource = createElement({ top: 0, height: 100 });
      const rootB = createElement({ top: 1000, height: 100 });
      setupPlainDraggable(plainSource, { kind: cardsKind });
      b.plugin.setupRoot(rootB);

      await lift(plainSource);
      await dragEnter(rootB, { clientY: 1050 });
      await dragOver(rootB, { clientY: 1050 });
      drop(rootB, { clientY: 1050 });

      // The root drop still routes — it doesn't need item ids — but it reports an
      // empty set rather than reading the foreign payload as its own shape.
      expect(onDrop).toHaveBeenCalledTimes(1);
      expect(onDrop.mock.calls[0][0].itemIds.size).toBe(0);
      expect(onDrop.mock.calls[0][0].items).toEqual([]);
    });

    it('routes a plain draggable rejected by a row to the collection root', async () => {
      const onDrop = vi.fn();
      const b = setupPlugin(
        { onDrop, canDrop: () => false, kind: columnsKind, accept: cardsKind },
        { knownItemIds: ['b'] },
      );
      const plainSource = createElement({ top: 0, height: 100 });
      const rootB = createElement({ top: 200, height: 300 });
      const targetB = createElement({ top: 200, height: 100 });
      rootB.appendChild(targetB);
      setupPlainDraggable(plainSource, { kind: cardsKind, payload: 'card-1' });
      b.plugin.setupRoot(rootB);
      b.plugin.setupItem('b', targetB);

      await lift(plainSource);
      await dragEnter(targetB, { clientY: 250 });
      await dragOver(targetB, { clientY: 250 });
      drop(targetB, { clientY: 250 });

      // The row can't route a source without the collection wire format (no item
      // ids to commit), so it rejects the target and the drop falls through to
      // the root instead of being silently swallowed.
      expect(onDrop).toHaveBeenCalledTimes(1);
      expect(onDrop).toHaveBeenCalledWith(
        expect.objectContaining({
          itemIds: new Set(),
          target: { itemId: null, position: 'root' },
        }),
      );
    });

    // `connect()` seeds from the live session for a collection that mounts while a
    // drag is already in flight, which is a payload read the monitor path misses.
    it('tolerates mounting mid-drag while a payload-less source is in flight', async () => {
      const plainSource = createElement({ top: 0, height: 100 });
      setupPlainDraggable(plainSource, { kind: cardsKind });

      await lift(plainSource);
      expect(dragSessionStore.getSnapshot()).not.toBe(null);

      // Mounts *during* the drag, so its `connect()` seeds from the live session.
      const b = setupPlugin({ kind: columnsKind, accept: cardsKind }, { knownItemIds: ['b'] });

      expect(dragSessionStore.getSnapshot()).not.toBe(null);
      expect(b.lastState()).toEqual({
        draggedItemIds: new Set(),
        dropTargetItemId: null,
        dropPosition: null,
      });
    });

    // The destination enables before/after positions, so an external drop
    // resolves by pointer Y within the target row and routes to `onDrop`.
    it.each([
      { label: 'before', clientY: 210, position: 'before' as const },
      { label: 'after', clientY: 290, position: 'after' as const },
    ])('routes an external drop to onDrop at $label', async ({ clientY, position }) => {
      const onDrop = vi.fn();
      const a = setupPlugin({ kind: cardsKind }, { knownItemIds: ['a'] });
      const b = setupPlugin(
        {
          onDrop,
          kind: columnsKind,
          accept: cardsKind,
          getDropCapabilities: () => ({ hasOn: false, hasBeforeAfter: true }),
        },
        { knownItemIds: ['b'] },
      );
      const sourceA = createElement({ top: 0, height: 100 });
      // Target row spans y=200..300, so clientY 210 → before (relative 0.1) and
      // clientY 290 → after (relative 0.9).
      const targetB = createElement({ top: 200, height: 100 });
      a.plugin.setupItem('a', sourceA);
      b.plugin.setupItem('b', targetB);

      await lift(sourceA);
      await dragEnter(targetB, { clientY });
      await dragOver(targetB, { clientY });
      drop(targetB, { clientY });

      expect(onDrop).toHaveBeenCalledTimes(1);
      const payload = onDrop.mock.calls[0][0];
      // The external item's id is carried through to the insert callback.
      expect(Array.from(payload.itemIds)).toEqual(['a']);
      // Not `toBeDefined()`, which an empty array satisfies: the models the ids
      // resolve to are what the callback commits with.
      expect(payload.items).toEqual(['a']);
      expect(payload.target).toEqual({ itemId: 'b', position });
      // The collection's actions snapshot is handed to the callback.
      // Which collection's actions, not merely that some actions arrived.
      expect(payload.actions.hasItem('b')).toBe(true);
      expect(payload.actions.hasItem('zzz')).toBe(false);
    });
  });

  describe('cross-instance isolation', () => {
    it('only the originating plugin fires onDragStart and onDragEnd', async () => {
      const onDragStartA = vi.fn();
      const onDragEndA = vi.fn();
      const onDragStartB = vi.fn();
      const onDragEndB = vi.fn();
      const a = setupPlugin(
        { onDragStart: onDragStartA, onDragEnd: onDragEndA },
        { knownItemIds: ['a'] },
      );
      const b = setupPlugin(
        { onDragStart: onDragStartB, onDragEnd: onDragEndB },
        { knownItemIds: ['b'] },
      );
      const sourceA = createElement({ top: 0, height: 100 });
      const targetB = createElement({ top: 200, height: 100 });
      a.plugin.setupItem('a', sourceA);
      b.plugin.setupItem('b', targetB);

      await lift(sourceA);
      // drop on the other plugin's target — even if not accepted, only A fires lifecycle
      await dragEnter(targetB, { clientY: 250 });
      await dragOver(targetB, { clientY: 250 });
      drop(targetB, { clientY: 250 });

      expect(onDragStartA).toHaveBeenCalledTimes(1);
      expect(onDragEndA).toHaveBeenCalledTimes(1);
      expect(onDragStartB).not.toHaveBeenCalled();
      expect(onDragEndB).not.toHaveBeenCalled();
    });

    it('does not reset onStateChange on a same-kind plugin that never participated', async () => {
      const a = setupPlugin({ onDrop: vi.fn() }, { knownItemIds: ['a1', 'a2'] });
      const b = setupPlugin({ onDrop: vi.fn() }, { knownItemIds: ['b'] });

      const a1 = createElement({ top: 0, height: 100 });
      const a2 = createElement({ top: 200, height: 100 });
      const b1 = createElement({ top: 400, height: 100 });
      a.plugin.setupItem('a1', a1);
      a.plugin.setupItem('a2', a2);
      b.plugin.setupItem('b', b1);

      const bStatesBefore = b.states.length;

      // Drag entirely within A; never hover B's item.
      await lift(a1);
      await dragEnter(a2, { clientY: 250 });
      await dragOver(a2, { clientY: 250 });
      drop(a2, { clientY: 250 });
      await flushRaf();

      // B shares A's kind so its monitor observes the drag, but it never
      // originated or hovered — so it must not get a redundant
      // initial-state onStateChange on every drop.
      expect(b.states.length).toBe(bStatesBefore);
    });

    it('reconnecting mid-own-drag reseeds the in-flight drag as its own', async () => {
      // A collection that only *exports* its items declares `accept` without
      // its own kind. Remounting it during its own drag (Strict Mode, a wrapper
      // remount) reseeds from the live session: the seed must match on the
      // monitor's kinds (own kind included) and recompute the origin, or the
      // origin-side `onDragEnd` is silently lost.
      const onDragEnd = vi.fn();
      const { plugin, lastState } = setupPlugin(
        { onDragEnd, kind: cardsKind, accept: columnsKind },
        { knownItemIds: ['a'] },
      );
      const source = createElement({ top: 0, height: 100 });
      plugin.setupItem('a', source);

      await lift(source);

      plugin.destroy();
      plugin.connect();

      expect(lastState()?.draggedItemIds.has('a')).toBe(true);

      fireEvent.dragEnd(source); // cancel

      expect(onDragEnd).toHaveBeenCalledTimes(1);
      expect(onDragEnd.mock.calls[0][0].canceled).toBe(true);
    });
  });

  describe('root drop', () => {
    it('does not measure every selected row while tracking root hover', async () => {
      const itemIds = Array.from({ length: 50 }, (_, index) => `item-${index}`);
      const selectedItemIds = new Set(itemIds);
      const { plugin } = setupPlugin(
        { onDrop: vi.fn() },
        { knownItemIds: itemIds, selectedItemIds },
      );
      const root = createElement({ top: 0, height: 1000 });
      const rectSpies: ReturnType<typeof vi.fn>[] = [];
      const items = itemIds.map((itemId, index) => {
        const element = createElement({ top: index * 20, height: 20 });
        const getRect = vi.fn(element.getBoundingClientRect.bind(element));
        element.getBoundingClientRect = getRect;
        rectSpies.push(getRect);
        root.append(element);
        plugin.setupItem(itemId, element);
        return element;
      });
      plugin.setupRoot(root);

      await lift(items[0]);
      rectSpies.forEach((spy) => spy.mockClear());

      await dragEnter(root, { clientY: 990 });
      await dragOver(root, { clientY: 990 });

      expect(rectSpies.every((spy) => spy.mock.calls.length === 0)).toBe(true);
      fireEvent.dragEnd(items[0]);
    });

    it('fires a root onDrop only on the targeted plugin', async () => {
      const onDropA = vi.fn();
      const onDropB = vi.fn();
      const a = setupPlugin({ onDrop: onDropA }, { knownItemIds: ['a'] });
      const b = setupPlugin({ onDrop: onDropB }, { knownItemIds: ['b'] });

      const sourceA = createElement({ top: 0, height: 100 });
      const rootA = createElement({ top: 1000, height: 100 });
      const rootB = createElement({ top: 1100, height: 100 });
      a.plugin.setupItem('a', sourceA);
      a.plugin.setupRoot(rootA);
      b.plugin.setupRoot(rootB);

      await lift(sourceA);
      await dragEnter(rootA, { clientY: 1050 });
      await dragOver(rootA, { clientY: 1050 });
      drop(rootA, { clientY: 1050 });

      expect(onDropA).toHaveBeenCalledTimes(1);
      expect(onDropB).not.toHaveBeenCalled();
    });

    it('reports an item target rather than the collection root when dropping on an item', async () => {
      const onDrop = vi.fn();
      const { plugin } = setupPlugin({ onDrop }, { knownItemIds: ['a', 'b'] });
      const source = createElement({ top: 0, height: 100 });
      const target = createElement({ top: 200, height: 100 });
      const root = createElement({ top: 1000, height: 200 });
      plugin.setupItem('a', source);
      plugin.setupItem('b', target);
      plugin.setupRoot(root);

      await lift(source);
      await dragEnter(target, { clientY: 250 });
      await dragOver(target, { clientY: 250 });
      drop(target, { clientY: 250 });

      expect(onDrop).toHaveBeenCalledTimes(1);
      expect(onDrop).toHaveBeenCalledWith(
        expect.objectContaining({ target: { itemId: 'b', position: 'on' } }),
      );
    });

    it('treats releasing over the dragged row’s own footprint as a no-op, not a root drop', async () => {
      const onDrop = vi.fn();
      const onDragEnd = vi.fn();
      const { plugin } = setupPlugin({ onDrop, onDragEnd }, { knownItemIds: ['a', 'b'] });
      // The dragged row lives inside the root's footprint, as in a real list.
      const root = createElement({ top: 0, height: 400 });
      const source = createElement({ top: 0, height: 100 });
      root.appendChild(source);
      plugin.setupRoot(root);
      plugin.setupItem('a', source);

      await lift(source);
      // Release over the dragged row itself: it rejects itself as a target, so
      // the drop falls through to the root — but the user meant "put it back".
      await dragEnter(source, { clientY: 50 });
      await dragOver(source, { clientY: 50 });
      drop(source, { clientY: 50 });

      expect(onDrop).not.toHaveBeenCalled();
      expect(onDragEnd).toHaveBeenCalledTimes(1);
      expect(onDragEnd.mock.calls[0][0].canceled).toBe(true);
      expect(onDragEnd.mock.calls[0][0].isInternal).toBe(false);
    });

    it('fires onDrop for an internal drag released on the root’s empty area', async () => {
      const onDrop = vi.fn();
      const { plugin } = setupPlugin({ onDrop }, { knownItemIds: ['a'] });
      const root = createElement({ top: 0, height: 400 });
      const source = createElement({ top: 0, height: 100 });
      root.appendChild(source);
      plugin.setupRoot(root);
      plugin.setupItem('a', source);

      await lift(source);
      // Well below the dragged row's own rect, on the root's empty area.
      await dragEnter(root, { clientY: 350 });
      await dragOver(root, { clientY: 350 });
      drop(root, { clientY: 350 });

      expect(onDrop).toHaveBeenCalledTimes(1);
      expect([...onDrop.mock.calls[0][0].itemIds]).toEqual(['a']);
      expect(onDrop.mock.calls[0][0].target).toEqual({ itemId: null, position: 'root' });
    });

    it('keeps the put-back footprint through a mid-own-drag reconnect', async () => {
      const onDrop = vi.fn();
      const onDragEnd = vi.fn();
      const { plugin } = setupPlugin({ onDrop, onDragEnd }, { knownItemIds: ['a'] });
      const root = createElement({ top: 0, height: 400 });
      const source = createElement({ top: 0, height: 100 });
      root.appendChild(source);
      plugin.setupRoot(root);
      plugin.setupItem('a', source);

      await lift(source);

      // A `[data-dragging]` rule collapsed the row: its live rect is degenerate,
      // so a put-back can only be recognized from the pickup snapshot.
      source.getBoundingClientRect = () => new DOMRect(0, 0, 0, 0);

      // Strict Mode re-runs the connect effect mid-drag on the same plugin. The
      // reconnect reseeds the ids from the session; the footprint snapshot has
      // no live source to be re-measured from and must survive as-is.
      plugin.destroy();
      plugin.connect();

      // Release over the row's original footprint: "put it back", not a root drop.
      await dragEnter(root, { clientY: 50 });
      await dragOver(root, { clientY: 50 });
      drop(root, { clientY: 50 });

      expect(onDrop).not.toHaveBeenCalled();
      expect(onDragEnd).toHaveBeenCalledTimes(1);
      expect(onDragEnd.mock.calls[0][0].canceled).toBe(true);
    });

    it('commits a drop when the collection missed onDragStart seeding', async () => {
      const a = setupPlugin({ kind: cardsKind }, { knownItemIds: ['a'] });
      const sourceA = createElement({ top: 0, height: 100 });
      a.plugin.setupItem('a', sourceA);

      const onDrop = vi.fn();
      const b = setupPlugin(
        { onDrop, kind: columnsKind, accept: cardsKind },
        { knownItemIds: ['x'] },
      );
      const target = createElement({ top: 200, height: 100 });
      b.plugin.setupItem('x', target);
      // Model a collection whose targets can accept the drag although its monitor
      // joined too late (or its eligibility changed too late) to receive onDragStart.
      b.plugin.destroy();

      await lift(sourceA);
      await dragEnter(target, { clientY: 210 });
      await dragOver(target, { clientY: 210 });
      drop(target, { clientY: 210 });

      // The drop seeds itself from the event payload instead of silently
      // no-oping on a target the drop indicator showed as valid.
      expect(onDrop).toHaveBeenCalledTimes(1);
      expect([...onDrop.mock.calls[0][0].itemIds]).toEqual(['a']);
      expect(onDrop.mock.calls[0][0].target).toEqual({ itemId: 'x', position: 'before' });
    });
  });
});
