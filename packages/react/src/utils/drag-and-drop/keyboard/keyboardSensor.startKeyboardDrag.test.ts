import { describe, it, expect, vi } from 'vitest';
import { act } from '@mui/internal-test-utils';
import { createDndRenderer } from '#test-utils';
import {
  createElement,
  flushRaf,
  lift,
  registerCleanup,
  setupDragEngineTests,
} from '../../../../test/dnd';
import { dragSessionStore } from '../dragSessionStore';
import type { DragStartContext, BeforeDragStartEventDetails } from '../../../types/drag';

setupDragEngineTests();

/**
 * Dispatch a `keydown` that the window-level capture listener will receive.
 * Wrapped in `act`: the mounted `Draggable.PreviewProvider` subscribes to the drag
 * session store, so a move/drop key would re-render React outside `act`.
 */
function pressKey(target: EventTarget, key: string): KeyboardEvent {
  const event = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true });
  act(() => {
    target.dispatchEvent(event);
  });
  return event;
}

function liveRegionText(): string {
  return document.querySelector('[aria-live="polite"]')?.textContent ?? '';
}

describe('startKeyboardDrag', () => {
  const { renderDnd } = createDndRenderer();

  it('starts a keyboard drag on an unfocused draggable', async () => {
    const { engine } = await renderDnd();
    const el = createElement();
    const onDragStart = vi.fn();
    engine.registerDraggable(el, { keyboardActivation: 'manual', onDragStart });

    let started: boolean | undefined;
    act(() => {
      started = engine.startKeyboardDrag(el);
    });

    expect(started).toBe(true);
    expect(dragSessionStore.getSnapshot()?.mode).toBe('keyboard');
    expect(onDragStart).toHaveBeenCalledTimes(1);
    expect(onDragStart.mock.calls[0][0].mode).toBe('keyboard');
  });

  it('drives the drag with the keyboard from there: arrows move, Space drops', async () => {
    const { engine } = await renderDnd();
    const el = createElement({ top: 0, height: 100, left: 0, width: 200 });
    const targetEl = createElement({ top: 200, height: 100, left: 0, width: 200 });
    const onDragEnter = vi.fn();
    const onDrop = vi.fn();
    engine.registerDropTarget(targetEl, { onDragEnter, onDrop });
    engine.registerDraggable(el, { keyboardActivation: 'manual' });

    const spy = vi
      .spyOn(document, 'elementFromPoint')
      .mockImplementation((_x: number, y: number) => (y >= 200 ? targetEl : null));
    registerCleanup(() => spy.mockRestore());

    act(() => {
      engine.startKeyboardDrag(el);
    });
    await flushRaf();

    // Once started, the sensor owns the keys exactly as a key-driven pickup would.
    pressKey(el, 'ArrowDown');
    expect(onDragEnter).toHaveBeenCalledTimes(1);

    pressKey(el, ' ');
    expect(onDrop).toHaveBeenCalledTimes(1);
    expect(dragSessionStore.getSnapshot()).toBeNull();
  });

  it('Escape cancels a drag it started', async () => {
    const { engine } = await renderDnd();
    const el = createElement();
    const onDragEnd = vi.fn();
    engine.registerDraggable(el, { keyboardActivation: 'manual', onDragEnd });

    act(() => {
      engine.startKeyboardDrag(el);
    });
    await flushRaf();
    pressKey(el, 'Escape');

    expect(onDragEnd).toHaveBeenCalledTimes(1);
    expect(onDragEnd.mock.calls[0][0].canceled).toBe(true);
    expect(dragSessionStore.getSnapshot()).toBeNull();
  });

  it('announces the pickup, so a screen-reader user knows the drag began', async () => {
    const { engine } = await renderDnd();
    const el = createElement();
    engine.registerDraggable(el, { keyboardActivation: 'manual', label: 'First card' });

    act(() => {
      engine.startKeyboardDrag(el);
    });

    expect(liveRegionText()).toBe(
      'Grabbed First card. Use the arrow keys to move, Space or Enter to drop, Escape to cancel.',
    );
  });

  it('focuses the draggable, so the drag ends where the user can see it', async () => {
    const { engine } = await renderDnd();
    const el = createElement();
    el.tabIndex = 0;
    engine.registerDraggable(el, { keyboardActivation: 'manual' });
    // Where a menu item would have had focus when it invoked the pickup.
    const elsewhere = document.createElement('button');
    document.body.appendChild(elsewhere);
    registerCleanup(() => elsewhere.remove());
    elsewhere.focus();

    act(() => {
      engine.startKeyboardDrag(el);
    });

    expect(document.activeElement).toBe(el);
  });

  it('focuses the drag handle rather than the root when one is configured', async () => {
    const { engine } = await renderDnd();
    const el = createElement();
    const handle = document.createElement('button');
    el.appendChild(handle);
    engine.registerDraggable(el, { keyboardActivation: 'manual', dragHandle: () => handle });

    act(() => {
      engine.startKeyboardDrag(el);
    });

    expect(document.activeElement).toBe(handle);
    // The handle is reported on the source, as it is for a key-driven pickup.
    expect(dragSessionStore.getSnapshot()?.source.dragHandle).toBe(handle);
  });

  it('picks up the draggable a passed descendant belongs to', async () => {
    const { engine } = await renderDnd();
    const el = createElement();
    const child = document.createElement('span');
    el.appendChild(child);
    engine.registerDraggable(el, { keyboardActivation: 'manual' });

    act(() => {
      engine.startKeyboardDrag(child);
    });

    expect(dragSessionStore.getSnapshot()?.source.element).toBe(el);
  });

  it('ignores the drag-handle gate, unlike a gesture', async () => {
    const { engine } = await renderDnd();
    const el = createElement();
    const handle = document.createElement('button');
    const other = document.createElement('button');
    el.appendChild(handle);
    el.appendChild(other);
    engine.registerDraggable(el, { keyboardActivation: 'manual', dragHandle: () => handle });

    // The handle routes a gesture by where it landed; naming the element is not a
    // gesture, so a node outside the handle still picks up.
    let started: boolean | undefined;
    act(() => {
      started = engine.startKeyboardDrag(other);
    });

    expect(started).toBe(true);
    expect(dragSessionStore.getSnapshot()?.source.element).toBe(el);
  });

  it('starts on an element that never opted out', async () => {
    const { engine } = await renderDnd();
    const el = createElement();
    engine.registerDraggable(el, {});

    // `'auto'` keeps its Space pickup and gains this one.
    let started: boolean | undefined;
    act(() => {
      started = engine.startKeyboardDrag(el);
    });

    expect(started).toBe(true);
    expect(dragSessionStore.getSnapshot()?.mode).toBe('keyboard');
  });

  it.each([
    ['disabled', { disabled: true }],
    ['keyboardActivation is off', { keyboardActivation: 'off' as const }],
  ])('returns false and starts nothing when %s', async (_label, options) => {
    const { engine } = await renderDnd();
    const el = createElement();
    engine.registerDraggable(el, options);

    let started: boolean | undefined;
    act(() => {
      started = engine.startKeyboardDrag(el);
    });

    expect(started).toBe(false);
    expect(dragSessionStore.getSnapshot()).toBeNull();
  });

  it('returns false when a drag is already in progress, leaving it untouched', async () => {
    const { engine } = await renderDnd();
    const dragged = createElement();
    engine.registerDraggable(dragged, {});
    const other = createElement();
    engine.registerDraggable(other, { keyboardActivation: 'manual' });

    await lift(dragged);

    let started: boolean | undefined;
    act(() => {
      started = engine.startKeyboardDrag(other);
    });

    expect(started).toBe(false);
    // The pointer drag still owns the session.
    expect(dragSessionStore.getSnapshot()?.source.element).toBe(dragged);
    expect(dragSessionStore.getSnapshot()?.mode).toBe('pointer');
  });

  it('returns false when onBeforeDragStart cancels', async () => {
    const { engine } = await renderDnd();
    const el = createElement();
    const onBeforeDragStart = vi.fn(
      (_: DragStartContext, eventDetails: BeforeDragStartEventDetails) => eventDetails.cancel(),
    );
    engine.registerDraggable(el, { keyboardActivation: 'manual', onBeforeDragStart });

    let started: boolean | undefined;
    act(() => {
      started = engine.startKeyboardDrag(el);
    });

    expect(started).toBe(false);
    expect(dragSessionStore.getSnapshot()).toBeNull();
    // The modality is still `keyboard` — this is a keyboard drag, started differently.
    expect(onBeforeDragStart.mock.calls[0][1].reason).toBe('keyboard');
    expect(onBeforeDragStart.mock.calls[0][1].trigger).toBe(el);
  });

  it('throws when a mounted element is not in a registered draggable', async () => {
    const { engine } = await renderDnd();
    const el = createElement();

    expect(() => engine.startKeyboardDrag(el)).toThrow(/not a registered/);
    expect(dragSessionStore.getSnapshot()).toBeNull();
  });

  it.each([
    ['a ref that emptied', null],
    ['a source that unmounted', 'detached'],
  ])('returns false for %s, rather than throwing', async (_label, kind) => {
    const { engine } = await renderDnd();
    const el = createElement();
    engine.registerDraggable(el, { keyboardActivation: 'manual' });
    if (kind === 'detached') {
      el.remove();
    }

    // A pickup deferred to a menu's close callback can run after the source went
    // away — not a wiring mistake, so it must not throw out of the callback.
    let started: boolean | undefined;
    act(() => {
      started = engine.startKeyboardDrag(kind === null ? null : el);
    });

    expect(started).toBe(false);
    expect(dragSessionStore.getSnapshot()).toBeNull();
  });

  it('seeds the virtual cursor after focusing, so a focus scroll cannot desync it', async () => {
    const { engine } = await renderDnd();
    const el = createElement({ top: 400, height: 100, left: 0, width: 200 });
    el.tabIndex = 0;
    // Focusing an off-screen source scrolls it into view, moving its rect. Seed
    // against where it ends up, or the grab offset is a scroll delta out.
    Object.defineProperty(el, 'focus', {
      configurable: true,
      value: () => {
        el.getBoundingClientRect = () => new DOMRect(0, 0, 200, 100);
        HTMLElement.prototype.focus.call(el);
      },
    });
    const onDragStart = vi.fn();
    engine.registerDraggable(el, { keyboardActivation: 'manual', onDragStart });

    act(() => {
      engine.startKeyboardDrag(el);
    });

    // The post-scroll center, not the pre-scroll (100, 450).
    const { input } = onDragStart.mock.calls[0][0].location.initial;
    expect(input.clientX).toBe(100);
    expect(input.clientY).toBe(50);
  });

  it('restores focus when the pickup is refused, instead of stranding it on the source', async () => {
    const { engine } = await renderDnd();
    const el = createElement();
    el.tabIndex = 0;
    engine.registerDraggable(el, {
      keyboardActivation: 'manual',
      onBeforeDragStart: (_: DragStartContext, eventDetails: BeforeDragStartEventDetails) =>
        eventDetails.cancel(),
    });
    const menuItem = document.createElement('button');
    document.body.appendChild(menuItem);
    registerCleanup(() => menuItem.remove());
    menuItem.focus();

    act(() => {
      engine.startKeyboardDrag(el);
    });

    // Nothing was picked up, so focus belongs where the caller had it.
    expect(document.activeElement).toBe(menuItem);
  });

  it('answers for a disabled draggable itself rather than falling through to an outer one', async () => {
    const { engine } = await renderDnd();
    const outer = createElement();
    const inner = document.createElement('div');
    outer.appendChild(inner);
    engine.registerDraggable(outer, {});
    engine.registerDraggable(inner as HTMLElement, { disabled: true });

    // The gesture path would skip the disabled inner one and drag the outer. Naming
    // an element is not a press, so this refuses rather than dragging something else.
    let started: boolean | undefined;
    act(() => {
      started = engine.startKeyboardDrag(inner as HTMLElement);
    });

    expect(started).toBe(false);
    expect(dragSessionStore.getSnapshot()).toBeNull();
  });
});
