import * as React from 'react';
import { describe, it, expect, vi } from 'vitest';
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
import { getRegistration } from '../../utils/drag-and-drop/draggableRegistry';
import { useManager } from './useManager';
import type { DraggableManager } from '../../utils/drag-and-drop/registrationTypes';

setupDragEngineTests();

describe('engine.registerSource', () => {
  const { renderDnd } = createDndRenderer();

  it('applies gesture styles to the element', async () => {
    const { engine } = await renderDnd();
    const el = createElement();
    const cleanup = engine.registerSource(el, {});
    expect(el.style.touchAction).toBe('manipulation');
    expect(el.style.userSelect).toBe('none');
    cleanup();
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

  it('restores styles on cleanup', async () => {
    const { engine } = await renderDnd();
    const el = createElement();
    const cleanup = engine.registerSource(el, {});
    cleanup();
    expect(el.style.touchAction).toBe('');
    expect(el.style.userSelect).toBe('');
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
    // Register an outer draggable and an inner draggable nested inside it.
    const outer = createElement();
    const inner = document.createElement('div');
    outer.appendChild(inner);
    const onOuterStart = vi.fn();
    const onInnerStart = vi.fn();
    engine.registerSource(outer, { onMoveStart: onOuterStart });
    engine.registerSource(inner, { onMoveStart: onInnerStart });

    // The gesture begins on the inner element. Pickup resolves the innermost
    // registered ancestor, so the inner draggable claims the drag.
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
    // Two registrations on one node, as with merged refs, registered A then B.
    // B unmounts, for example inside a conditional wrapper, while A stays. The
    // next drag must read A's parameters, not B's stale ones.
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

    // Nothing was registered and no gesture styles were applied.
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
