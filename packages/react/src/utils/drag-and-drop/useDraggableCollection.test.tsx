import * as React from 'react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { fireEvent, renderHook } from '@testing-library/react';
import { act } from '@mui/internal-test-utils';
import { installDndPolyfill } from '../../../test/dndPolyfill';
import { frFR } from '../../locale-frFR';
import { LocalizationProvider } from '../../localization-provider';
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
import type { DragKeyboardMoveDetails, DragKind } from '../../types/drag';
import { createKind } from './dragKind';

const cardsKind = createKind<any>('cards');
const columnsKind = createKind<any>('columns');

installDndPolyfill();

// Spy/mock restores registered here run in `afterEach` even if a test throws, so
// a failed assertion can't leave a `console`/`elementFromPoint` mock installed for
// the rest of the suite.
const pendingRestores: Array<() => void> = [];
function restoreOnCleanup(restore: () => void): void {
  pendingRestores.push(restore);
}

afterEach(() => {
  while (pendingRestores.length > 0) {
    pendingRestores.pop()!();
  }
});

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

/** Dispatch a `keydown` the window-level keyboard sensor listener will receive. */
function pressKey(target: EventTarget, key: string): void {
  // The keyboard sensor publishes the drag session synchronously on keydown, so
  // the mounted `Draggable.PreviewProvider` re-renders in response — wrap it in `act`.
  act(() => {
    target.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }));
  });
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

  it('gives an item a stable label for cross-collection preview settling', () => {
    const { plugin } = setupPlugin(
      { getItemLabel: (itemId) => `Item ${itemId}` },
      { knownItemIds: ['a'] },
    );
    const element = createElement();
    registerCleanup(plugin.setupItem('a', element));

    expect(getRegistration(element)!().label).toBe('Item a');
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
    it('routes onMove for "before" / "on" / "after" based on pointer Y', async () => {
      const onMove = vi.fn();
      const { plugin } = setupPlugin({ onMove }, { knownItemIds: ['a', 'b'] });
      const source = createElement({ top: 0, height: 100 });
      const target = createElement({ top: 200, height: 100 });
      plugin.setupItem('a', source);
      plugin.setupItem('b', target);

      // top 25% → before
      await lift(source);
      await dragEnter(target, { clientY: 210 });
      await dragOver(target, { clientY: 210 });
      drop(target, { clientY: 210 });
      expect(onMove).toHaveBeenLastCalledWith(
        expect.objectContaining({
          target: { itemId: 'b', position: 'before' },
        }),
      );

      // middle → on
      await lift(source);
      await dragEnter(target, { clientY: 250 });
      await dragOver(target, { clientY: 250 });
      drop(target, { clientY: 250 });
      expect(onMove).toHaveBeenLastCalledWith(
        expect.objectContaining({
          target: { itemId: 'b', position: 'on' },
        }),
      );

      // bottom 25% → after
      await lift(source);
      await dragEnter(target, { clientY: 290 });
      await dragOver(target, { clientY: 290 });
      drop(target, { clientY: 290 });
      expect(onMove).toHaveBeenLastCalledWith(
        expect.objectContaining({
          target: { itemId: 'b', position: 'after' },
        }),
      );
    });

    it('uses 50/50 before/after split when only onReorder/onInsert is provided (no onMove/onItemDrop)', async () => {
      const onReorder = vi.fn();
      const { plugin } = setupPlugin({ onReorder }, { knownItemIds: ['a', 'b'] });
      const source = createElement({ top: 0, height: 100 });
      const target = createElement({ top: 200, height: 100 });
      plugin.setupItem('a', source);
      plugin.setupItem('b', target);

      // anywhere in the top half → before (would have been "on" with onMove)
      await lift(source);
      await dragEnter(target, { clientY: 240 });
      await dragOver(target, { clientY: 240 });
      drop(target, { clientY: 240 });
      expect(onReorder).toHaveBeenLastCalledWith(
        expect.objectContaining({
          target: { itemId: 'b', position: 'before' },
        }),
      );
    });

    it('reads the before/after split from clientX with orientation: "horizontal"', async () => {
      const onReorder = vi.fn();
      const { plugin } = setupPlugin(
        { onReorder, orientation: 'horizontal' },
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
      expect(onReorder).toHaveBeenLastCalledWith(
        expect.objectContaining({
          target: { itemId: 'b', position: 'before' },
        }),
      );

      // Right half → after. Only clientX changed, pinning the axis pick.
      await lift(source);
      await dragEnter(target, { clientX: 260, clientY: 50 });
      await dragOver(target, { clientX: 260, clientY: 50 });
      drop(target, { clientX: 260, clientY: 50 });
      expect(onReorder).toHaveBeenLastCalledWith(
        expect.objectContaining({
          target: { itemId: 'b', position: 'after' },
        }),
      );
    });

    it('flips the horizontal before/after split for an RTL row', async () => {
      const onReorder = vi.fn();
      const { plugin } = setupPlugin(
        { onReorder, orientation: 'horizontal' },
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
      expect(onReorder).toHaveBeenLastCalledWith(
        expect.objectContaining({
          target: { itemId: 'b', position: 'before' },
        }),
      );
    });
  });

  describe('callback routing', () => {
    it('fires onReorder for before/after, onItemDrop for on, when both are provided', async () => {
      const onReorder = vi.fn();
      const onItemDrop = vi.fn();
      const { plugin } = setupPlugin({ onReorder, onItemDrop }, { knownItemIds: ['a', 'b'] });
      const source = createElement({ top: 0, height: 100 });
      const target = createElement({ top: 200, height: 100 });
      plugin.setupItem('a', source);
      plugin.setupItem('b', target);

      await lift(source);
      await dragEnter(target, { clientY: 250 });
      await dragOver(target, { clientY: 250 });
      drop(target, { clientY: 250 });

      expect(onItemDrop).toHaveBeenCalledTimes(1);
      // A same-collection "on" drop is flagged internal.
      expect(onItemDrop.mock.calls[0][0].isInternal).toBe(true);
      expect(onReorder).not.toHaveBeenCalled();

      await lift(source);
      await dragEnter(target, { clientY: 210 });
      await dragOver(target, { clientY: 210 });
      drop(target, { clientY: 210 });

      expect(onReorder).toHaveBeenCalledTimes(1);
      expect(onItemDrop).toHaveBeenCalledTimes(1);
    });

    it('prefers onMove over onReorder/onItemDrop when both are provided', async () => {
      const onMove = vi.fn();
      const onReorder = vi.fn();
      const onItemDrop = vi.fn();
      // Providing both onMove and onReorder warns (onMove subsumes onReorder).
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      // Restore even if the assertion below throws, so a failure can't leave
      // `console.warn` mocked for the rest of the suite.
      restoreOnCleanup(() => warnSpy.mockRestore());
      const { plugin } = setupPlugin(
        { onMove, onReorder, onItemDrop },
        { knownItemIds: ['a', 'b'] },
      );
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining('`onMove` subsumes `onReorder`'),
      );
      const source = createElement({ top: 0, height: 100 });
      const target = createElement({ top: 200, height: 100 });
      plugin.setupItem('a', source);
      plugin.setupItem('b', target);

      await lift(source);
      await dragEnter(target, { clientY: 210 });
      await dragOver(target, { clientY: 210 });
      drop(target, { clientY: 210 });

      expect(onMove).toHaveBeenCalledTimes(1);
      expect(onReorder).not.toHaveBeenCalled();
      expect(onItemDrop).not.toHaveBeenCalled();
    });

    it('offers no drop positions to an internal drag when only onInsert is configured', async () => {
      // `onInsert` only commits *external* drops, so an internal drag must not
      // light up before/after indicators whose drop would then no-op — the rows
      // reject the target entirely.
      const onInsert = vi.fn();
      const onDragEnd = vi.fn();
      const { plugin, lastState } = setupPlugin(
        { onInsert, onDragEnd },
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

      expect(onInsert).not.toHaveBeenCalled();
      // Nothing committed, so the drag ends as a cancel, not an internal drop.
      expect(onDragEnd).toHaveBeenCalledTimes(1);
      expect(onDragEnd.mock.calls[0][0].isInternal).toBe(false);
      expect(onDragEnd.mock.calls[0][0].canceled).toBe(true);
    });

    it('reports isInternal=true for a drop in this collection with no drop callbacks', async () => {
      // A collection driven manually through `onStateChange` configures no drop
      // callbacks, but the drop still landed in the collection that started the
      // drag — `isInternal` reports where it landed, not whether a callback ran.
      const onDragEnd = vi.fn();
      const { plugin } = setupPlugin({ onDragEnd }, { knownItemIds: ['a', 'b'] });
      const source = createElement({ top: 0, height: 100 });
      const target = createElement({ top: 200, height: 100 });
      plugin.setupItem('a', source);
      plugin.setupItem('b', target);

      await lift(source);
      await dragEnter(target, { clientY: 250 });
      await dragOver(target, { clientY: 250 });
      drop(target, { clientY: 250 });

      expect(onDragEnd).toHaveBeenCalledTimes(1);
      expect(onDragEnd.mock.calls[0][0].isInternal).toBe(true);
    });
  });

  describe('canDrag / canDrop / isDropTargetInvalid', () => {
    it('rejects drop on a dragged item', async () => {
      const onMove = vi.fn();
      const { plugin } = setupPlugin({ onMove }, { knownItemIds: ['a'] });
      const el = createElement({ top: 0, height: 100 });
      plugin.setupItem('a', el);

      await lift(el);
      await dragEnter(el, { clientY: 50 });
      await dragOver(el, { clientY: 50 });
      drop(el, { clientY: 50 });

      expect(onMove).not.toHaveBeenCalled();
    });

    it('rejects drop on a descendant when isDropTargetInvalid says so (tree case)', async () => {
      const onMove = vi.fn();
      // 'b' is a child of 'a'
      const { plugin } = setupPlugin(
        { onMove },
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

      expect(onMove).not.toHaveBeenCalled();
    });

    it('respects user-provided canDrop', async () => {
      const onMove = vi.fn();
      const canDrop = vi.fn(() => false);
      const { plugin } = setupPlugin({ onMove, canDrop }, { knownItemIds: ['a', 'b'] });
      const source = createElement({ top: 0, height: 100 });
      const target = createElement({ top: 200, height: 100 });
      plugin.setupItem('a', source);
      plugin.setupItem('b', target);

      await lift(source);
      await dragEnter(target, { clientY: 210 });
      await dragOver(target, { clientY: 210 });
      drop(target, { clientY: 210 });

      expect(canDrop).toHaveBeenCalled();
      expect(onMove).not.toHaveBeenCalled();
    });

    it('blocks the pickup when canDrag returns false', async () => {
      const onMove = vi.fn();
      const canDrag = vi.fn(() => false);
      const { plugin } = setupPlugin({ onMove, canDrag }, { knownItemIds: ['a', 'b'] });
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
      expect(onMove).not.toHaveBeenCalled();
    });

    it('blocks keyboard pickup and omits the a11y hints on a canDrag-locked item', async () => {
      const onMove = vi.fn();
      // `canDrag` is declarative, so it maps to `disabled`: the locked item must
      // gate the keyboard pickup and never advertise a keyboard drag it can't
      // start, while a draggable sibling keeps its hints.
      const { plugin } = setupPlugin(
        { onMove, canDrag: (id) => id !== 'a' },
        { knownItemIds: ['a', 'b'] },
      );
      const a = createElement({ top: 0, height: 100 });
      const b = createElement({ top: 200, height: 100 });
      a.tabIndex = 0;
      plugin.setupItem('a', a);
      plugin.setupItem('b', b);

      expect(a.hasAttribute('aria-roledescription')).toBe(false);
      expect(a.hasAttribute('aria-describedby')).toBe(false);
      expect(b.hasAttribute('aria-roledescription')).toBe(true);

      a.focus();
      // Space/Enter must not pick the locked item up, and must stay un-prevented
      // so the key keeps its native behavior.
      for (const key of [' ', 'Enter']) {
        const event = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true });
        act(() => {
          a.dispatchEvent(event);
        });
        expect(dragSessionStore.getSnapshot()).toBeNull();
        expect(event.defaultPrevented).toBe(false);
      }
      expect(onMove).not.toHaveBeenCalled();
    });

    it('re-applies the item a11y setup when canDrag flips via a config change', () => {
      // The static setup (gesture styles, keyboard-drag hints) is captured at
      // registration; a config change that flips `canDrag` must re-apply it, or
      // the unlocked item stays keyboard-draggable without any screen-reader
      // hints (and vice versa).
      const el = createElement({ top: 0, height: 100 });
      const actions = {
        hasItem: () => true,
        getSelectedItemIds: () => new Set<string | number>(),
        getItemModels: (ids: ReadonlyArray<string | number>) => [...ids],
      };
      const { result, rerender } = renderHook(
        ({ locked }: { locked: boolean }) =>
          useDraggableCollection({
            onMove: () => {},
            canDrag: () => !locked,
            getActions: () => actions,
          }),
        { initialProps: { locked: true } },
      );
      registerCleanup(result.current.setupItem('a', el));

      // Locked: no keyboard-drag hints are advertised.
      expect(el.hasAttribute('aria-roledescription')).toBe(false);
      expect(el.hasAttribute('aria-describedby')).toBe(false);

      rerender({ locked: false });

      // Unlocked: the setup lands without remounting the item.
      expect(el.getAttribute('aria-roledescription')).toBe('draggable');
      expect(el.getAttribute('aria-describedby')).toBeTruthy();

      rerender({ locked: true });

      expect(el.hasAttribute('aria-roledescription')).toBe(false);
      expect(el.hasAttribute('aria-describedby')).toBe(false);
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
            onMove: () => {},
            canDrag: () => !locked,
            getActions: () => actions,
          }),
        { initialProps: { locked: false } },
      );
      registerCleanup(result.current.setupItem('a', a));
      registerCleanup(result.current.setupItem('b', b));
      expect(b.getAttribute('aria-roledescription')).toBe('draggable');

      await lift(a);
      rerender({ locked: true });
      // Deferred: the live gesture keeps the registration it started with.
      expect(b.getAttribute('aria-roledescription')).toBe('draggable');

      drop(b, { clientY: 250 });
      // The sweep runs in a microtask once the session is gone.
      await Promise.resolve();
      await Promise.resolve();

      expect(b.hasAttribute('aria-roledescription')).toBe(false);
    });
  });

  describe('multi-select drag', () => {
    it('drags every selected item when the user lifts a selected item', async () => {
      const onMove = vi.fn();
      const { plugin } = setupPlugin(
        { onMove },
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

      expect(onMove).toHaveBeenCalledTimes(1);
      const [{ itemIds }] = onMove.mock.calls[0];
      expect([...itemIds].sort()).toEqual(['a', 'c']);
    });

    it('drags only the lifted item when it is not part of the selection', async () => {
      const onMove = vi.fn();
      const { plugin } = setupPlugin(
        { onMove },
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

      expect(onMove).toHaveBeenCalledTimes(1);
      const [{ itemIds }] = onMove.mock.calls[0];
      expect([...itemIds]).toEqual(['a']);
    });

    it('applies pruneDraggedItems for trees (drops descendants of selected ancestors)', async () => {
      const onMove = vi.fn();
      // 'a1' is a child of 'a'; both selected → only 'a' should drag
      const { plugin } = setupPlugin(
        { onMove },
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

      expect(onMove).toHaveBeenCalledTimes(1);
      const [{ itemIds }] = onMove.mock.calls[0];
      expect([...itemIds]).toEqual(['a']);
    });
  });

  describe('cancellation', () => {
    it('reports canceled=true via onDragEnd when no drop target is hit', async () => {
      const onDragEnd = vi.fn();
      const onMove = vi.fn();
      const { plugin } = setupPlugin({ onDragEnd, onMove }, { knownItemIds: ['a'] });
      const el = createElement({ top: 0, height: 100 });
      plugin.setupItem('a', el);

      await lift(el);
      // End the drag without a drop target hit
      fireEvent.dragEnd(el);

      expect(onMove).not.toHaveBeenCalled();
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
      const onMove = vi.fn();
      const { plugin, lastState, states } = setupPlugin({ onMove }, { knownItemIds: ['a', 'b'] });
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
      const onMove = vi.fn();
      const { plugin, lastState } = setupPlugin({ onMove }, { knownItemIds: ['a', 'b', 'c'] });
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
      const onMoveA = vi.fn();
      const onMoveB = vi.fn();
      const a = setupPlugin({ onMove: onMoveA, kind: cardsKind }, { knownItemIds: ['a'] });
      const b = setupPlugin({ onMove: onMoveB, kind: columnsKind }, { knownItemIds: ['b'] });
      const sourceA = createElement({ top: 0, height: 100 });
      const targetB = createElement({ top: 200, height: 100 });
      a.plugin.setupItem('a', sourceA);
      b.plugin.setupItem('b', targetB);

      await lift(sourceA);
      await dragEnter(targetB, { clientY: 210 });
      await dragOver(targetB, { clientY: 210 });
      drop(targetB, { clientY: 210 });

      expect(onMoveB).not.toHaveBeenCalled();
      expect(onMoveA).not.toHaveBeenCalled();
    });

    it('accepts cross-type drops from an accepted external kind', async () => {
      const onItemDrop = vi.fn();
      const a = setupPlugin({ kind: cardsKind }, { knownItemIds: ['a'] });
      const b = setupPlugin(
        { onItemDrop, kind: columnsKind, accept: cardsKind },
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

      expect(onItemDrop).toHaveBeenCalledTimes(1);
      // A drop from another collection is flagged external.
      expect(onItemDrop.mock.calls[0][0].isInternal).toBe(false);
    });

    // Every other cross-kind case drags one collection into another, so the source
    // always carries the collection's wire format. A plain `Draggable.Root` carries
    // whatever its own author declared instead.
    it.each([
      ['declares no payload', undefined],
      ['declares a scalar payload', 'card-1'],
    ])('tolerates a drag from a plain draggable that %s', async (_label, payload) => {
      const onItemDrop = vi.fn();
      const onDragEnd = vi.fn();
      const b = setupPlugin(
        { onItemDrop, onDragEnd, kind: columnsKind, accept: cardsKind },
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

      // The source contributes no item ids, so the collection has nothing to move
      // and no drag of its own that ended.
      expect(onItemDrop).not.toHaveBeenCalled();
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
      const onRootDrop = vi.fn();
      const b = setupPlugin(
        { onRootDrop, kind: columnsKind, accept: cardsKind },
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
      expect(onRootDrop).toHaveBeenCalledTimes(1);
      expect(onRootDrop.mock.calls[0][0].itemIds.size).toBe(0);
      expect(onRootDrop.mock.calls[0][0].items).toEqual([]);
    });

    it('routes a plain draggable of an accepted kind dropped over a row to onRootDrop', async () => {
      const onItemDrop = vi.fn();
      const onRootDrop = vi.fn();
      const b = setupPlugin(
        { onItemDrop, onRootDrop, kind: columnsKind, accept: cardsKind },
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
      expect(onItemDrop).not.toHaveBeenCalled();
      expect(onRootDrop).toHaveBeenCalledTimes(1);
      expect(onRootDrop.mock.calls[0][0].itemIds.size).toBe(0);
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

    // With only `onInsert` (no `onItemDrop`/`onMove`), the collection's drop
    // capabilities are before/after-only, so an external drop resolves to
    // `before`/`after` by pointer Y within the target row and routes to `onInsert`.
    it.each([
      { label: 'before', clientY: 210, position: 'before' as const },
      { label: 'after', clientY: 290, position: 'after' as const },
    ])('routes an external drop to onInsert at $label', async ({ clientY, position }) => {
      const onInsert = vi.fn();
      const a = setupPlugin({ kind: cardsKind }, { knownItemIds: ['a'] });
      const b = setupPlugin(
        { onInsert, kind: columnsKind, accept: cardsKind },
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

      expect(onInsert).toHaveBeenCalledTimes(1);
      const payload = onInsert.mock.calls[0][0];
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
      const a = setupPlugin({ onMove: vi.fn() }, { knownItemIds: ['a1', 'a2'] });
      const b = setupPlugin({ onMove: vi.fn() }, { knownItemIds: ['b'] });

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
    it('fires onRootDrop only on the originating plugin', async () => {
      const onRootDropA = vi.fn();
      const onRootDropB = vi.fn();
      const a = setupPlugin({ onRootDrop: onRootDropA }, { knownItemIds: ['a'] });
      const b = setupPlugin({ onRootDrop: onRootDropB }, { knownItemIds: ['b'] });

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

      expect(onRootDropA).toHaveBeenCalledTimes(1);
      expect(onRootDropB).not.toHaveBeenCalled();
    });

    it('does not fire onRootDrop when dropping on an item', async () => {
      const onRootDrop = vi.fn();
      const onMove = vi.fn();
      const { plugin } = setupPlugin({ onRootDrop, onMove }, { knownItemIds: ['a', 'b'] });
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

      expect(onMove).toHaveBeenCalledTimes(1);
      expect(onRootDrop).not.toHaveBeenCalled();
    });

    it('treats releasing over the dragged row’s own footprint as a no-op, not a root drop', async () => {
      const onRootDrop = vi.fn();
      const onMove = vi.fn();
      const onDragEnd = vi.fn();
      const { plugin } = setupPlugin(
        { onRootDrop, onMove, onDragEnd },
        { knownItemIds: ['a', 'b'] },
      );
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

      expect(onRootDrop).not.toHaveBeenCalled();
      expect(onMove).not.toHaveBeenCalled();
      expect(onDragEnd).toHaveBeenCalledTimes(1);
      expect(onDragEnd.mock.calls[0][0].canceled).toBe(true);
      expect(onDragEnd.mock.calls[0][0].isInternal).toBe(false);
    });

    it('still fires onRootDrop for an internal drag released on the root’s empty area', async () => {
      const onRootDrop = vi.fn();
      const { plugin } = setupPlugin({ onRootDrop, onMove: vi.fn() }, { knownItemIds: ['a'] });
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

      expect(onRootDrop).toHaveBeenCalledTimes(1);
      expect([...onRootDrop.mock.calls[0][0].itemIds]).toEqual(['a']);
    });

    it('keeps the put-back footprint through a mid-own-drag reconnect', async () => {
      const onRootDrop = vi.fn();
      const onDragEnd = vi.fn();
      const { plugin } = setupPlugin({ onRootDrop, onDragEnd }, { knownItemIds: ['a'] });
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

      expect(onRootDrop).not.toHaveBeenCalled();
      expect(onDragEnd).toHaveBeenCalledTimes(1);
      expect(onDragEnd.mock.calls[0][0].canceled).toBe(true);
    });

    it('commits a drop that lands before the passive connect() has seeded the drag', async () => {
      const a = setupPlugin({}, { knownItemIds: ['a'] });
      const sourceA = createElement({ top: 0, height: 100 });
      a.plugin.setupItem('a', sourceA);

      const onInsert = vi.fn();
      const b = setupPlugin({ onInsert }, { knownItemIds: ['x'] });
      const target = createElement({ top: 200, height: 100 });
      b.plugin.setupItem('x', target);
      // The mount-mid-drag gap: item targets register synchronously in ref
      // callbacks, but the monitor seeding runs in a passive effect. Disconnect
      // the monitor so this collection never hears about the drag.
      b.plugin.destroy();

      await lift(sourceA);
      await dragEnter(target, { clientY: 210 });
      await dragOver(target, { clientY: 210 });
      drop(target, { clientY: 210 });

      // The drop seeds itself from the event payload instead of silently
      // no-oping on a target the drop indicator showed as valid.
      expect(onInsert).toHaveBeenCalledTimes(1);
      expect([...onInsert.mock.calls[0][0].itemIds]).toEqual(['a']);
      expect(onInsert.mock.calls[0][0].target).toEqual({ itemId: 'x', position: 'before' });
    });
  });

  describe('keyboard navigation', () => {
    // Resolve the element whose bounding rect vertically contains `y`.
    function hitTest(elements: HTMLElement[]) {
      return (_x: number, y: number): Element | null => {
        for (const el of elements) {
          const rect = el.getBoundingClientRect();
          if (y >= rect.top && y < rect.top + rect.height) {
            return el;
          }
        }
        return null;
      };
    }

    it('reorders with arrow keys: Space picks up, ArrowDown targets the next item, Space drops', async () => {
      const onReorder = vi.fn();
      const { plugin } = setupPlugin({ onReorder }, { knownItemIds: ['a', 'b'] });
      const a = createElement({ top: 0, height: 100 });
      const b = createElement({ top: 200, height: 100 });
      a.tabIndex = 0;
      b.tabIndex = 0;
      plugin.setupItem('a', a);
      plugin.setupItem('b', b);

      const spy = vi.spyOn(document, 'elementFromPoint').mockImplementation(hitTest([a, b]));
      restoreOnCleanup(() => spy.mockRestore());

      a.focus();
      pressKey(a, ' '); // pick up "a"
      await flushRaf(); // collection monitor records the dragged item
      pressKey(a, 'ArrowDown'); // jump to the slot after "b"
      pressKey(a, ' '); // drop

      expect(onReorder).toHaveBeenCalledTimes(1);
      expect(onReorder).toHaveBeenLastCalledWith(
        expect.objectContaining({ target: { itemId: 'b', position: 'after' } }),
      );
    });

    it('restores focus to the dragged item after a keyboard drop', async () => {
      const onReorder = vi.fn();
      const { plugin } = setupPlugin({ onReorder }, { knownItemIds: ['a', 'b'] });
      const a = createElement({ top: 0, height: 100 });
      const b = createElement({ top: 200, height: 100 });
      a.tabIndex = 0;
      b.tabIndex = 0;
      plugin.setupItem('a', a);
      plugin.setupItem('b', b);

      const spy = vi.spyOn(document, 'elementFromPoint').mockImplementation(hitTest([a, b]));
      restoreOnCleanup(() => spy.mockRestore());

      a.focus();
      pressKey(a, ' ');
      await flushRaf();
      pressKey(a, 'ArrowDown');
      pressKey(a, ' '); // drop
      await flushRaf(); // focus restoration runs one frame later

      expect(document.activeElement).toBe(a);
    });

    it('restores focus to the destination row after a cross-collection root drop', async () => {
      const origin = setupPlugin({ onDragEnd: vi.fn() }, { knownItemIds: ['a'] });
      const rowA = createElement({ top: 0, height: 100 });
      rowA.tabIndex = 0;
      const cleanupRowA = origin.plugin.setupItem('a', rowA);

      let movedRow: HTMLElement | null = null;
      const destination = setupPlugin(
        {
          onRootDrop: () => {
            // The destination commits the move: the origin unmounts its row and
            // the destination remounts it, before the deferred focus restore.
            cleanupRowA();
            movedRow = createElement({ top: 200, height: 100 });
            movedRow.tabIndex = 0;
            destination.plugin.setupItem('a', movedRow);
          },
        },
        { knownItemIds: [] },
      );
      const rootB = createElement({ top: 200, height: 200 });
      destination.plugin.setupRoot(rootB);

      const spy = vi.spyOn(document, 'elementFromPoint').mockImplementation(hitTest([rowA, rootB]));
      restoreOnCleanup(() => spy.mockRestore());

      rowA.focus();
      pressKey(rowA, ' '); // pick up "a"
      await flushRaf();
      pressKey(rowA, 'ArrowDown'); // onto the destination's empty root
      pressKey(rowA, ' '); // drop
      await flushRaf(); // focus restoration runs one frame later

      // The root-drop path claims the committed-drop slot like an item drop
      // does, so the origin's finalFocus can find the row the destination
      // remounted instead of falling back to default focus.
      expect(movedRow).not.toBeNull();
      expect(document.activeElement).toBe(movedRow);
    });

    it('threads a config keyboardMovement resolver into the item draggables', async () => {
      const onReorder = vi.fn();
      const moves: DragKeyboardMoveDetails[] = [];
      const { plugin } = setupPlugin(
        {
          onReorder,
          keyboardMovement: (details) => {
            moves.push(details);
            return null;
          },
        },
        { knownItemIds: ['a', 'b'] },
      );
      const a = createElement({ top: 0, height: 100 });
      const b = createElement({ top: 200, height: 100 });
      a.tabIndex = 0;
      b.tabIndex = 0;
      plugin.setupItem('a', a);
      plugin.setupItem('b', b);

      a.focus();
      pressKey(a, ' ');
      await flushRaf();
      pressKey(a, 'ArrowDown');
      pressKey(a, ' '); // drop

      // The resolver decided the press (null swallows it), replacing the default
      // target navigation: nothing moved, so the drop reorders nothing.
      expect(moves).toHaveLength(1);
      expect(moves[0].direction).toEqual({ x: 0, y: 1 });
      expect(onReorder).not.toHaveBeenCalled();
    });

    it('does not start a keyboard drag when keyboardActivation is off', async () => {
      const onReorder = vi.fn();
      const { plugin } = setupPlugin(
        { onReorder, keyboardActivation: 'off' },
        { knownItemIds: ['a', 'b'] },
      );
      const a = createElement({ top: 0, height: 100 });
      const b = createElement({ top: 200, height: 100 });
      a.tabIndex = 0;
      b.tabIndex = 0;
      plugin.setupItem('a', a);
      plugin.setupItem('b', b);

      a.focus();
      // Space/Enter must not pick the item up, and must stay un-prevented so the
      // consumer can bind them to another action (e.g. inline editing).
      for (const key of [' ', 'Enter']) {
        const event = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true });
        act(() => {
          a.dispatchEvent(event);
        });
        expect(dragSessionStore.getSnapshot()).toBeNull();
        expect(event.defaultPrevented).toBe(false);
      }
    });

    it('with keyboardActivation manual, keeps items draggable but drops the Space hint', async () => {
      const { plugin } = setupPlugin({ keyboardActivation: 'manual' }, { knownItemIds: ['a'] });
      const a = createElement({ top: 0, height: 100 });
      a.tabIndex = 0;
      plugin.setupItem('a', a);

      a.focus();
      // Space belongs to the consumer now, so it must pass through un-prevented...
      const event = new KeyboardEvent('keydown', { key: ' ', bubbles: true, cancelable: true });
      act(() => {
        a.dispatchEvent(event);
      });
      expect(dragSessionStore.getSnapshot()).toBeNull();
      expect(event.defaultPrevented).toBe(false);

      // ...and the item must not keep advertising the pickup it gave up. The role
      // description stays: still draggable, just not by a key.
      expect(a.hasAttribute('aria-roledescription')).toBe(true);
      expect(a.hasAttribute('aria-describedby')).toBe(false);
    });
  });

  describe('localized keyboardAnnouncements', () => {
    function FrenchProvider({ children }: { children: React.ReactNode }) {
      return <LocalizationProvider translations={frFR}>{children}</LocalizationProvider>;
    }

    function liveRegionText(): string {
      return document.querySelector('[aria-live="polite"]')?.textContent ?? '';
    }

    // Resolve the element whose bounding rect vertically contains `y`.
    function hitTest(elements: HTMLElement[]) {
      return (_x: number, y: number): Element | null => {
        for (const el of elements) {
          const rect = el.getBoundingClientRect();
          if (y >= rect.top && y < rect.top + rect.height) {
            return el;
          }
        }
        return null;
      };
    }

    it('announces a keyboard reorder in the provider language with item labels', async () => {
      const onReorder = vi.fn();
      const { plugin } = setupPlugin(
        {
          onReorder,
          getItemLabel: (id) => (id === 'a' ? 'Acheter du lait' : 'Promener le chien'),
        },
        { knownItemIds: ['a', 'b'] },
        { wrapper: FrenchProvider },
      );
      const a = createElement({ top: 0, height: 100 });
      const b = createElement({ top: 200, height: 100 });
      a.tabIndex = 0;
      b.tabIndex = 0;
      plugin.setupItem('a', a);
      plugin.setupItem('b', b);

      const spy = vi.spyOn(document, 'elementFromPoint').mockImplementation(hitTest([a, b]));
      restoreOnCleanup(() => spy.mockRestore());

      a.focus();
      pressKey(a, ' '); // pick up "a"
      expect(liveRegionText()).toBe(
        'Acheter du lait saisi. Utilisez les flèches pour déplacer, Espace ou Entrée pour déposer, Échap pour annuler.',
      );

      await flushRaf(); // collection monitor records the dragged item
      pressKey(a, 'ArrowDown'); // jump to the slot after "b"
      pressKey(a, ' '); // drop

      expect(onReorder).toHaveBeenLastCalledWith(
        expect.objectContaining({ target: { itemId: 'b', position: 'after' } }),
      );
      expect(liveRegionText()).toBe('Acheter du lait déposé après Promener le chien.');
    });

    it('uses the localized multi-item label when several items are dragged', async () => {
      const onReorder = vi.fn();
      const { plugin } = setupPlugin(
        { onReorder, getItemLabel: (id) => String(id) },
        { knownItemIds: ['a', 'b', 'c'], selectedItemIds: new Set(['a', 'b']) },
        { wrapper: FrenchProvider },
      );
      const a = createElement({ top: 0, height: 100 });
      const b = createElement({ top: 200, height: 100 });
      a.tabIndex = 0;
      plugin.setupItem('a', a);
      plugin.setupItem('b', b);

      a.focus();
      pressKey(a, ' '); // pick up the multi-selection
      // "saisis", not "saisi": the participle agrees with the several items the
      // drag carries, which the locale reads from `count`.
      expect(liveRegionText()).toBe(
        '2 éléments saisis. Utilisez les flèches pour déplacer, Espace ou Entrée pour déposer, Échap pour annuler.',
      );
    });

    it('announces another collection’s hovered row through the plugin that owns it', async () => {
      // A keyboard drag from collection A over collection B's rows: the
      // announcements come from A (the origin), but only B tracks the hovered
      // row. The position must still be announced on every move — and the row's
      // label must resolve through B's items, not A's.
      const onInsert = vi.fn();
      const a = setupPlugin(
        { kind: cardsKind, getItemLabel: (id) => `Origin ${id}` },
        { knownItemIds: ['a1'] },
      );
      const b = setupPlugin(
        {
          onInsert,
          kind: columnsKind,
          accept: cardsKind,
          getItemLabel: (id) => (id === 'b1' ? 'Berry' : String(id)),
        },
        { knownItemIds: ['b1'] },
      );
      const aRow = createElement({ top: 0, height: 100 });
      const bRow = createElement({ top: 200, height: 100 });
      aRow.tabIndex = 0;
      a.plugin.setupItem('a1', aRow);
      b.plugin.setupItem('b1', bRow);

      const spy = vi.spyOn(document, 'elementFromPoint').mockImplementation(hitTest([aRow, bRow]));
      restoreOnCleanup(() => spy.mockRestore());

      aRow.focus();
      pressKey(aRow, ' '); // pick up "a1"
      await flushRaf(); // both collection monitors record the dragged item
      pressKey(aRow, 'ArrowDown'); // move onto B's row

      // The move announcement is debounced; wait for it to land in the region.
      await vi.waitFor(() => {
        expect(liveRegionText()).toBe('Origin a1 after Berry');
      });

      pressKey(aRow, ' '); // drop

      expect(onInsert).toHaveBeenCalledTimes(1);
      expect(onInsert.mock.calls[0][0].target).toEqual({ itemId: 'b1', position: 'after' });
      // The terminal announcement carries the same owner-resolved phrase.
      expect(liveRegionText()).toBe('Dropped Origin a1 after Berry.');
    });
  });
});
