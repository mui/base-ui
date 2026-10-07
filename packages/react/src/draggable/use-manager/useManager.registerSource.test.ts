import * as React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { act } from '@mui/internal-test-utils';
import { firePointer, isJSDOM } from '#test-utils';
import { createDndRenderer } from '../../../test/dndEngine';
import {
  createElement,
  flushRaf,
  setupDragEngineTests,
  fireDrag,
  dragOver,
} from '../../../test/dnd';
import { dragSessionStore } from '../../utils/drag-and-drop/dragSessionStore';
import { dragPreviewStore } from '../../utils/drag-and-drop/overlay/dragPreviewStore';
import { getRegistration } from '../../utils/drag-and-drop/draggableRegistry';
import { useManager } from './useManager';
import type { DraggableManager } from '../../utils/drag-and-drop/registrationTypes';

setupDragEngineTests();

const ROW = { id: 'a' };

describe('engine.registerSource', () => {
  const { renderDnd } = createDndRenderer();

  it('applies gesture styles to the element and restores them on cleanup', async () => {
    const { engine } = await renderDnd();
    const el = createElement();
    const cleanup = engine.registerSource(el, {});
    expect(el.style.touchAction).toBe('manipulation');
    expect(el.style.userSelect).toBe('none');
    cleanup();
    expect(el.style.touchAction).toBe('');
    expect(el.style.userSelect).toBe('');
  });

  it('refreshes an imperative disabled getter on the next pointerdown', async () => {
    const { engine } = await renderDnd();
    const el = createElement();
    let disabled = true;
    const onMoveStart = vi.fn();
    engine.registerSource(el, () => ({
      disabled,
      activation: { type: 'immediate' },
      onMoveStart,
    }));
    expect(el.style.touchAction || '').toBe('');

    disabled = false;
    firePointer.down(el, { pointerType: 'mouse', button: 0, buttons: 1, timeStamp: 100 });
    expect(el.style.touchAction).toBe('manipulation');
    expect(onMoveStart).toHaveBeenCalledTimes(1);
    firePointer.up(el, { pointerType: 'mouse', button: 0, buttons: 0, timeStamp: 200 });

    disabled = true;
    firePointer.down(el, { pointerType: 'mouse', button: 0, buttons: 1, timeStamp: 100 });
    expect(el.style.touchAction).toBe('');
    expect(onMoveStart).toHaveBeenCalledTimes(1);
    firePointer.up(el, { pointerType: 'mouse', button: 0, buttons: 0, timeStamp: 200 });
  });

  it('applies a disabled change to the gesture styles on refresh, without a press', async () => {
    const { engine } = await renderDnd();
    const el = createElement();
    let disabled = false;
    engine.registerSource(el, () => ({ disabled }));
    expect(el.style.touchAction).toBe('manipulation');

    disabled = true;
    engine.refresh(el);
    expect(el.style.touchAction).toBe('');
    expect(el.style.userSelect).toBe('');

    disabled = false;
    engine.refresh(el);
    expect(el.style.touchAction).toBe('manipulation');
  });

  it('moves gesture styles to a new imperative handle on pointerdown', async () => {
    const { engine } = await renderDnd();
    const el = createElement();
    const first = document.createElement('span');
    const second = document.createElement('span');
    el.append(first, second);
    let handle = first;
    engine.registerSource(el, () => ({ handle }));
    expect(first.style.touchAction).toBe('manipulation');

    handle = second;
    firePointer.down(second, { pointerType: 'mouse', button: 0, buttons: 1, timeStamp: 100 });
    expect(first.style.touchAction).toBe('');
    expect(second.style.touchAction).toBe('manipulation');
    firePointer.up(second, { pointerType: 'mouse', button: 0, buttons: 0, timeStamp: 200 });
  });

  it.skipIf(isJSDOM)('restores inline gesture style priorities on cleanup', async () => {
    const { engine } = await renderDnd();
    const el = createElement();
    el.style.setProperty('user-select', 'text', 'important');
    const cleanup = engine.registerSource(el, {});
    expect(el.style.userSelect).toBe('none');
    cleanup();
    expect(el.style.userSelect).toBe('text');
    expect(el.style.getPropertyPriority('user-select')).toBe('important');
  });

  it('preserves ordinary interaction styles while disabled', async () => {
    const { engine } = await renderDnd();
    const el = createElement();
    const style = el.style as CSSStyleDeclaration & Record<string, string>;
    style.touchAction = 'auto';
    style.userSelect = 'text';
    style.webkitUserSelect = 'text';
    style.webkitTouchCallout = 'default';

    const cleanup = engine.registerSource(el, { disabled: true });

    expect(style.touchAction).toBe('auto');
    expect(style.userSelect).toBe('text');
    expect(style.webkitUserSelect).toBe('text');
    expect(style.webkitTouchCallout).toBe('default');
    cleanup();
  });

  it('does not restore over consumer changes made while a disabled registration is held', async () => {
    const { engine } = await renderDnd();
    const el = createElement();
    const style = el.style as CSSStyleDeclaration & Record<string, string>;
    style.touchAction = 'auto';
    el.setAttribute('aria-roledescription', 'original role');

    const cleanup = engine.registerSource(el, { disabled: true });

    style.touchAction = 'pan-y';
    el.setAttribute('aria-roledescription', 'consumer role');
    cleanup();

    expect(style.touchAction).toBe('pan-y');
    expect(el.getAttribute('aria-roledescription')).toBe('consumer role');
  });

  it('restores gesture styles when only disabled registrants remain', async () => {
    const { engine } = await renderDnd();
    const el = createElement();
    const cleanupDisabled = engine.registerSource(el, { disabled: true });
    const cleanupEnabled = engine.registerSource(el, {});

    expect(el.style.touchAction).toBe('manipulation');
    expect(el.style.userSelect).toBe('none');

    cleanupEnabled();

    expect(el.style.touchAction).toBe('');
    expect(el.style.userSelect).toBe('');
    cleanupDisabled();
  });

  it('deregisters on cleanup: a later gesture starts no drag', async () => {
    // Cleanup must unregister, not only restore styles. A style-only teardown
    // would leave the element draggable.
    const { engine } = await renderDnd();
    const el = createElement();
    const onMoveStart = vi.fn();
    const cleanup = engine.registerSource(el, { onMoveStart });
    cleanup();

    fireDrag.dragStart(el);
    await flushRaf();

    expect(onMoveStart).not.toHaveBeenCalled();
    expect(dragSessionStore.getSnapshot()).toBeNull();
  });

  it('cleanup is safe to call twice', async () => {
    const { engine } = await renderDnd();
    const el = createElement();
    const cleanup = engine.registerSource(el, {});
    cleanup();
    cleanup();
    expect(el.style.touchAction).toBe('');
  });

  it('a nested draggable wins pickup over its draggable ancestor', async () => {
    const { engine } = await renderDnd();
    const outer = createElement();
    const inner = document.createElement('div');
    outer.appendChild(inner);
    const onOuterStart = vi.fn();
    const onInnerStart = vi.fn();
    engine.registerSource(outer, { onMoveStart: onOuterStart });
    engine.registerSource(inner, { onMoveStart: onInnerStart });

    // Pickup resolves the innermost registered ancestor.
    fireDrag.dragStart(inner);
    await flushRaf();

    expect(onInnerStart).toHaveBeenCalledTimes(1);
    expect(onInnerStart.mock.calls[0][0].source.element).toBe(inner);
    expect(onOuterStart).not.toHaveBeenCalled();
  });

  it('a disabled nested draggable falls through to its draggable ancestor', async () => {
    const { engine } = await renderDnd();
    // A disabled card inside a draggable list item. Pressing the card must start
    // the outer drag instead of doing nothing.
    const outer = createElement();
    const inner = document.createElement('div');
    outer.appendChild(inner);
    const onOuterStart = vi.fn();
    const onInnerStart = vi.fn();
    engine.registerSource(outer, { onMoveStart: onOuterStart });
    engine.registerSource(inner, { disabled: true, onMoveStart: onInnerStart });

    fireDrag.dragStart(inner);
    await flushRaf();

    expect(onInnerStart).not.toHaveBeenCalled();
    expect(onOuterStart).toHaveBeenCalledTimes(1);
    expect(onOuterStart.mock.calls[0][0].source.element).toBe(outer);
  });

  it('keeps the source marked as dragging through the drop handlers when the preview has no element', async () => {
    // A preview with an element settles onto the source and keeps `[data-dragging]`
    // until it has. One without an element must keep it through the drop handlers,
    // so a rule that resizes or hides the source applies while they measure.
    const { engine } = await renderDnd();
    const source = createElement();
    const target = createElement();
    let draggingDuringDrop: boolean | undefined;
    engine.registerSource(source, { preview: { disabled: true } });
    engine.registerTarget(target, {
      onDraggableDrop() {
        draggingDuringDrop = source.hasAttribute('data-dragging');
      },
    });

    fireDrag.dragStart(source);
    await flushRaf();
    await dragOver(target);
    fireDrag.drop(target);

    expect(draggingDuringDrop).toBe(true);
    expect(source).not.toHaveAttribute('data-dragging');
  });

  it('releases the published preview content when the drag ends', async () => {
    // The overlay renders whatever the store holds. Content left there after the
    // drag would keep its detached host in memory until the next pickup.
    const { engine } = await renderDnd();
    const source = createElement();
    engine.registerSource(source, { preview: { render: () => 'chip' } });

    fireDrag.dragStart(source);
    await flushRaf();
    expect(dragPreviewStore.getSnapshot()).not.toBe(null);

    act(() => {
      engine.cancelDrag();
    });
    expect(dragPreviewStore.getSnapshot()).toBe(null);
  });

  // A virtualizer or a cross-list move can remount the dragged row as a new node.
  it.each([
    { name: 'the same payload', payload: () => ROW, previewKey: undefined },
    {
      name: 'the same previewKey and a new payload',
      payload: () => ({ id: 'a' }),
      previewKey: 'a',
    },
  ])(
    'moves the drag to a node registered with $name after the original left the document',
    async ({ payload, previewKey }) => {
      const { engine } = await renderDnd();
      const original = createElement();
      const unregister = engine.registerSource(original, { payload: payload(), previewKey });
      fireDrag.dragStart(original);
      await flushRaf();
      expect(original).toHaveAttribute('data-dragging');

      unregister();
      original.remove();
      const remounted = createElement();
      engine.registerSource(remounted, { payload: payload(), previewKey });

      expect(dragSessionStore.getSnapshot()?.source.element).toBe(remounted);
      expect(remounted).toHaveAttribute('data-dragging');
    },
  );

  it.each([
    { name: 'while the original is still in the document', detach: false, payload: ROW },
    { name: 'for another item', detach: true, payload: { id: 'b' } },
  ])(
    'keeps the drag on the original node when a node registers $name',
    async ({ detach, payload }) => {
      const { engine } = await renderDnd();
      const original = createElement();
      engine.registerSource(original, { payload: ROW });
      fireDrag.dragStart(original);
      await flushRaf();

      if (detach) {
        original.remove();
      }
      const other = createElement();
      engine.registerSource(other, { payload });

      expect(dragSessionStore.getSnapshot()?.source.element).toBe(original);
      expect(other).not.toHaveAttribute('data-dragging');
    },
  );

  it('keeps an imperatively updated payload throughout the drag', async () => {
    const { engine } = await renderDnd();
    const el = createElement();
    const payload = { key: 'value' };
    const onMove = vi.fn();
    engine.registerSource(el, {
      payload: { key: 'initial' },
      onMoveStart: ({ source }) => source.updatePayload(payload),
      onMove,
    });

    fireDrag.dragStart(el);
    await flushRaf();
    await dragOver(el, { clientX: 40, clientY: 40 });
    await dragOver(el, { clientX: 80, clientY: 80 });

    expect(onMove.mock.lastCall?.[0].source.payload).toBe(payload);
  });

  it('keeps a function payload as data', async () => {
    const { engine } = await renderDnd();
    const el = createElement();
    const myFunction = vi.fn(() => 'command result');
    const onMoveStart = vi.fn();
    engine.registerSource(el, { payload: myFunction, onMoveStart });

    fireDrag.dragStart(el);
    await flushRaf();

    expect(onMoveStart.mock.calls[0][0].source.payload).toBe(myFunction);
    expect(myFunction).not.toHaveBeenCalled();
  });

  // A static value, falsy or not, is passed through as-is, not replaced with a default.
  it.each([
    ['an object', { key: 'value' }],
    ['a number', 0],
    ['an empty string', ''],
    ['false', false],
    ['null', null],
  ])('attaches %s payload as-is', async (_label, value) => {
    const { engine } = await renderDnd();
    const el = createElement();
    const onMoveStart = vi.fn();
    engine.registerSource(el, { payload: value, onMoveStart });

    fireDrag.dragStart(el);
    await flushRaf();

    expect(onMoveStart.mock.calls[0][0].source.payload).toBe(value);
  });

  it('leaves the payload undefined when none is declared', async () => {
    const { engine } = await renderDnd();
    const el = createElement();
    const onMoveStart = vi.fn();
    engine.registerSource(el, { onMoveStart });

    fireDrag.dragStart(el);
    await flushRaf();

    expect(onMoveStart.mock.calls[0][0].source.payload).toBe(undefined);
  });

  it('releasing a non-last merged-ref hold keeps the surviving hook active', async () => {
    // Two holds on one node, as with merged refs. After B unmounts, the next drag
    // must read A's parameters, not B's stale ones.
    const { engine } = await renderDnd();
    const el = createElement();
    const onDragStartA = vi.fn();
    const onDragStartB = vi.fn();
    engine.registerSource(el, { onMoveStart: onDragStartA });
    const cleanupB = engine.registerSource(el, { onMoveStart: onDragStartB });

    cleanupB();

    fireDrag.dragStart(el);
    await flushRaf();

    expect(onDragStartA).toHaveBeenCalledTimes(1);
    expect(onDragStartB).not.toHaveBeenCalled();
  });

  it('throws before registering anything when the getter returns no kind', async () => {
    // The test engine fills in `kind`, so use the real manager to pass the
    // untyped shape the types forbid.
    let manager: DraggableManager | null = null;
    function Capture() {
      manager = useManager();
      return null;
    }
    await renderDnd(React.createElement(Capture));
    const el = createElement();
    const getParameters = (() => ({})) as unknown as Parameters<
      DraggableManager['registerSource']
    >[1];

    expect(() => manager!.registerSource(el, getParameters)).toThrow(
      'Base UI: registerSource() was called without a `kind`',
    );

    expect(getRegistration(el)).toBeUndefined();
    expect(el.style.touchAction || '').toBe('');
    expect(el.style.userSelect || '').toBe('');
  });

  it('prevents concurrent drags (only one at a time)', async () => {
    const { engine } = await renderDnd();
    const el1 = createElement();
    const el2 = createElement();
    const onDragStart1 = vi.fn();
    const onDragStart2 = vi.fn();

    engine.registerSource(el1, { onMoveStart: onDragStart1 });
    engine.registerSource(el2, { onMoveStart: onDragStart2 });

    fireDrag.dragStart(el1);
    await flushRaf();
    expect(onDragStart1).toHaveBeenCalledTimes(1);

    fireDrag.dragStart(el2);
    await flushRaf();
    expect(onDragStart2).not.toHaveBeenCalled();
  });
});
