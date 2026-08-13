import { describe, it, expect, vi } from 'vitest';
import { act } from '@mui/internal-test-utils';
import { createDndRenderer, isJSDOM } from '#test-utils';
import {
  createElement,
  flushRaf,
  lift,
  registerCleanup,
  setupDragEngineTests,
} from '../../../../test/dnd';
import { dragSessionStore, updateDragSourceElement } from '../dragSessionStore';
import { cancelDrag } from '../cancelDrag';
import { resetForTests as resetKeyboardSensor } from './keyboardSensor';
import { targetsOnlyKeyboardMovement } from './keyboardMovementPresets';
import { restrictToElement, restrictToVerticalAxis } from '../dragModifiers';
import { reorderRowBrand } from '../reorderRow';
import { createKind } from '../dragKind';
import type {
  DragStartContext,
  BeforeDragStartEventDetails,
  DragKeyboardFinalFocusParameters,
  DragKeyboardMoveDetails,
  DragKeyboardMoveTarget,
  DragModifier,
} from '../../../types/drag';

const cardKind = createKind('card');

setupDragEngineTests();

/**
 * Dispatch a `keydown` that the window-level capture listener will receive.
 * Wrapped in `act`: the mounted `Draggable.PreviewProvider` subscribes to the drag
 * session store, so a pick-up/move/drop key would re-render React outside `act`.
 */
function pressKey(
  target: EventTarget,
  key: string,
  init: Partial<KeyboardEventInit> = {},
): KeyboardEvent {
  const event = new KeyboardEvent('keydown', {
    key,
    bubbles: true,
    cancelable: true,
    ...init,
  });
  act(() => {
    target.dispatchEvent(event);
  });
  return event;
}

describe('keyboard sensor', () => {
  const { renderDnd } = createDndRenderer();

  it('Space picks up a focused draggable and starts a keyboard drag', async () => {
    const { engine } = await renderDnd();
    const el = createElement();
    const onDragStart = vi.fn();
    engine.registerDraggable(el, { onDragStart });

    el.focus();
    pressKey(el, ' ');

    // Both the session publish and onDragStart happen synchronously in the keydown handler.
    expect(dragSessionStore.getSnapshot()?.mode).toBe('keyboard');
    expect(onDragStart).toHaveBeenCalledTimes(1);
    // `mode` rides on every event payload, so a keyboard drag is identifiable
    // without inspecting the session store.
    expect(onDragStart.mock.calls[0][0].mode).toBe('keyboard');
  });

  it('picks up from a focus-delegating host, whose composed target is an inner control', async () => {
    // A web component registered as the draggable delegates focus to an internal
    // control, so `composedPath()[0]` is that control rather than the registered
    // host. The retargeted `event.target` still resolves to the host, and pickup
    // has to accept it or the element is pointer-draggable but never keyboard-
    // draggable.
    const { engine } = await renderDnd();
    const host = createElement();
    const shadow = host.attachShadow({ mode: 'open', delegatesFocus: true });
    const inner = document.createElement('button');
    shadow.appendChild(inner);
    engine.registerDraggable(host, {});

    // `getTarget` reads `composedPath()[0]`; jsdom composes the path from the
    // dispatch target, so dispatch at the inner control and let it retarget.
    const event = new KeyboardEvent('keydown', {
      key: ' ',
      bubbles: true,
      cancelable: true,
      // Real key events are composed; without it the event never leaves the
      // shadow tree and the window listener sees nothing at all.
      composed: true,
    });
    act(() => {
      inner.dispatchEvent(event);
    });

    expect(dragSessionStore.getSnapshot()?.mode).toBe('keyboard');
    act(() => cancelDrag());
  });

  it('picks up a draggable registered inside a closed shadow root', async () => {
    const { engine } = await renderDnd();
    // Keep the document sensor bound too. Without this ordinary light-DOM
    // source, only the shadow listener exists and the retargeting race is hidden.
    engine.registerDraggable(createElement(), {});
    const host = createElement();
    const shadow = host.attachShadow({ mode: 'closed' });
    const source = document.createElement('button');
    source.getBoundingClientRect = () => new DOMRect(0, 0, 200, 100);
    shadow.appendChild(source);
    const onDragStart = vi.fn();
    const unregister = engine.registerDraggable(source, { onDragStart });

    pressKey(source, ' ', { composed: true });

    expect(onDragStart).toHaveBeenCalledTimes(1);
    expect(dragSessionStore.getSnapshot()?.source.element).toBe(source);

    // The source can unmount during a committed move. The shadow-root pickup
    // listener is then unreachable, so the active session keeps a window path
    // through which Escape can still terminate it.
    unregister();
    source.remove();
    pressKey(window, 'Escape');
    expect(dragSessionStore.getSnapshot()).toBeNull();
  });

  it('Enter also picks up', async () => {
    const { engine } = await renderDnd();
    const el = createElement();
    engine.registerDraggable(el, {});

    el.focus();
    pressKey(el, 'Enter');

    expect(dragSessionStore.getSnapshot()?.mode).toBe('keyboard');
  });

  it('does not pick up a non-draggable element', () => {
    const el = createElement();
    el.focus();
    pressKey(el, ' ');
    expect(dragSessionStore.getSnapshot()).toBeNull();
  });

  it('does not pick up from a focused control outside the drag handle', async () => {
    const { engine } = await renderDnd();
    const el = createElement();
    const handle = document.createElement('button');
    const other = document.createElement('button');
    el.appendChild(handle);
    el.appendChild(other);
    engine.registerDraggable(el, { dragHandle: () => handle });

    // Focusing a control inside the card but outside the handle and pressing
    // Space must not start a drag, and must leave the key un-prevented so the
    // control performs its own action (mirrors the pointer drag-handle gate).
    const event = pressKey(other, ' ');
    expect(dragSessionStore.getSnapshot()).toBeNull();
    expect(event.defaultPrevented).toBe(false);
  });

  it('picks up from the drag handle when one is configured', async () => {
    const { engine } = await renderDnd();
    const el = createElement();
    const handle = document.createElement('button');
    el.appendChild(handle);
    engine.registerDraggable(el, { dragHandle: () => handle });

    const event = pressKey(handle, ' ');
    expect(dragSessionStore.getSnapshot()?.mode).toBe('keyboard');
    expect(event.defaultPrevented).toBe(true);
  });

  it('prevents default on a successful pick-up so the page does not scroll', async () => {
    const { engine } = await renderDnd();
    const el = createElement();
    engine.registerDraggable(el, {});
    el.focus();
    const event = pressKey(el, ' ');
    expect(event.defaultPrevented).toBe(true);
  });

  describe('keyboardActivation', () => {
    it.each([
      ['off', 'Space', ' '],
      ['off', 'Enter', 'Enter'],
      ['manual', 'Space', ' '],
      ['manual', 'Enter', 'Enter'],
    ] as const)(
      'with %s, leaves %s un-prevented and starts no drag',
      async (keyboardActivation, _label, key) => {
        const { engine } = await renderDnd();
        const el = createElement();
        engine.registerDraggable(el, { keyboardActivation });

        el.focus();
        // The key must pass through to the element's own handler (a menu trigger, or a
        // grid that reorders columns with the arrows): no drag starts, nothing is prevented.
        const event = pressKey(el, key);

        expect(dragSessionStore.getSnapshot()).toBeNull();
        expect(event.defaultPrevented).toBe(false);
      },
    );

    it('omits the keyboard-drag a11y attributes when off', async () => {
      const { engine } = await renderDnd();
      const optedOut = createElement();
      engine.registerDraggable(optedOut, { keyboardActivation: 'off' });
      const normal = createElement();
      engine.registerDraggable(normal, {});

      // A normal draggable advertises the keyboard drag to screen readers; an
      // opted-out one must not, since the keyboard pickup will never fire.
      expect(normal.hasAttribute('aria-roledescription')).toBe(true);
      expect(normal.hasAttribute('aria-describedby')).toBe(true);
      expect(optedOut.hasAttribute('aria-roledescription')).toBe(false);
      expect(optedOut.hasAttribute('aria-describedby')).toBe(false);
    });

    it('keeps the role description when manual, and describes only what the consumer wrote', async () => {
      const { engine } = await renderDnd();
      // `'manual'` is still draggable, just not by a key, so the role description
      // stays. The default instructions promise the Space pickup it took away, so
      // they are dropped unless the consumer wrote their own.
      const silent = createElement();
      engine.registerDraggable(silent, { keyboardActivation: 'manual' });
      const described = createElement();
      engine.registerDraggable(described, {
        keyboardActivation: 'manual',
        keyboardInstructions: 'Open the menu, then choose Reorder.',
      });

      expect(silent.hasAttribute('aria-roledescription')).toBe(true);
      expect(silent.hasAttribute('aria-describedby')).toBe(false);

      expect(described.hasAttribute('aria-roledescription')).toBe(true);
      const describedBy = described.getAttribute('aria-describedby');
      expect(describedBy).not.toBe(null);
      expect(document.getElementById(describedBy!)?.textContent).toBe(
        'Open the menu, then choose Reorder.',
      );
    });
  });

  it.each([
    ['Space', ' '],
    ['Enter', 'Enter'],
  ])(
    'leaves %s un-prevented when onBeforeDragStart cancels so a draggable control keeps its native key behavior',
    async (_label, key) => {
      const { engine } = await renderDnd();
      const el = createElement();
      const onBeforeDragStart = vi.fn(
        (_: DragStartContext, eventDetails: BeforeDragStartEventDetails) => eventDetails.cancel(),
      );
      engine.registerDraggable(el, { onBeforeDragStart });

      el.focus();
      // A canceled pickup turns the element back into an ordinary control:
      // no drag starts, and the key must NOT be swallowed so its own activation
      // (or page scroll) still fires — same as `keyboardActivation` above.
      const event = pressKey(el, key);

      expect(dragSessionStore.getSnapshot()).toBeNull();
      expect(event.defaultPrevented).toBe(false);
      // The details carry the keyboard modality and the native key event.
      const eventDetails = onBeforeDragStart.mock.calls[0][1];
      expect(eventDetails.reason).toBe('keyboard');
      expect(eventDetails.event).toBe(event);
      expect(eventDetails.trigger).toBe(el);
    },
  );

  it('reports the focused drag handle as the keyboard pickup trigger', async () => {
    const { engine } = await renderDnd();
    const el = createElement();
    const handle = document.createElement('button');
    el.appendChild(handle);
    const onBeforeDragStart = vi.fn(
      (_: DragStartContext, eventDetails: BeforeDragStartEventDetails) => eventDetails.cancel(),
    );
    engine.registerDraggable(el, { dragHandle: handle, onBeforeDragStart });

    handle.focus();
    pressKey(handle, ' ');

    expect(onBeforeDragStart.mock.calls[0][1].trigger).toBe(handle);
  });

  it('does not dispatch onBeforeDragStart when another drag already refuses the pickup', async () => {
    const { engine } = await renderDnd();
    const dragged = createElement();
    engine.registerDraggable(dragged, {});
    const other = createElement();
    const onBeforeDragStart = vi.fn();
    engine.registerDraggable(other, { onBeforeDragStart });

    // A pointer drag is in progress, so the keyboard pickup will be refused.
    await lift(dragged);

    other.focus();
    const event = pressKey(other, ' ');

    // The refusal must come before the consumer veto: `onBeforeDragStart` can
    // have observable side effects that would otherwise run for a pickup that
    // never starts. The key is left un-prevented: this pickup was never going
    // to start, and a draggable that is itself a real `<button>` must keep its
    // native Enter/Space activation during someone else's drag.
    expect(onBeforeDragStart).not.toHaveBeenCalled();
    expect(event.defaultPrevented).toBe(false);
    expect(dragSessionStore.getSnapshot()?.mode).not.toBe('keyboard');
  });

  it.each([
    ['Space', ' '],
    ['Enter', 'Enter'],
  ])('leaves %s un-prevented when onBeforeDragStart throws', async (_label, key) => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    registerCleanup(() => errorSpy.mockRestore());
    const { engine } = await renderDnd();
    const el = createElement();
    engine.registerDraggable(el, {
      onBeforeDragStart: () => {
        throw new Error('veto failed');
      },
    });

    el.focus();
    // A throwing consumer handler must not escape the window keydown listener:
    // it is treated as a cancel, leaving the key to the element's own handler.
    const event = pressKey(el, key);

    expect(dragSessionStore.getSnapshot()).toBeNull();
    expect(event.defaultPrevented).toBe(false);
    // The throw is reported, not silently swallowed: a handler that only throws
    // on keyboard pickups would otherwise make Space/Enter dead with no trace.
    expect(errorSpy).toHaveBeenCalledTimes(1);
    expect(errorSpy.mock.calls[0][0]).toContain('onBeforeDragStart');
    expect(errorSpy.mock.calls[0][1]).toBe(el);
  });

  it('contains a throwing payload callback: the pickup is canceled and reported', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    registerCleanup(() => errorSpy.mockRestore());
    const { engine } = await renderDnd();
    const el = createElement();
    engine.registerDraggable(el, {
      payload: () => {
        throw new Error('broken payload');
      },
    });

    el.focus();
    // The throw happens inside the session bootstrap, after the key was already
    // swallowed for a genuinely-in-progress pickup; the bootstrap undoes its
    // resources and the sensor contains the re-throw like `onBeforeDragStart`.
    const event = pressKey(el, ' ');

    expect(event.defaultPrevented).toBe(true);
    expect(dragSessionStore.getSnapshot()).toBeNull();
    expect(errorSpy).toHaveBeenCalledTimes(1);

    // The engine is not wedged: a later pickup on a healthy draggable works.
    const healthy = createElement();
    engine.registerDraggable(healthy, {});
    healthy.focus();
    pressKey(healthy, ' ');
    expect(dragSessionStore.getSnapshot()?.mode).toBe('keyboard');
  });

  it.each([
    ['Space', ' '],
    ['Enter', 'Enter'],
  ])('leaves %s un-prevented when the draggable is disabled', async (_label, key) => {
    const { engine } = await renderDnd();
    const el = createElement();
    engine.registerDraggable(el, { disabled: true });

    el.focus();
    const event = pressKey(el, key);

    expect(dragSessionStore.getSnapshot()).toBeNull();
    expect(event.defaultPrevented).toBe(false);
  });

  it('omits the keyboard-drag a11y attributes when disabled', async () => {
    const { engine } = await renderDnd();
    const disabled = createElement();
    engine.registerDraggable(disabled, { disabled: true });

    // A disabled draggable must not advertise a keyboard drag that can't start.
    expect(disabled.hasAttribute('aria-roledescription')).toBe(false);
    expect(disabled.hasAttribute('aria-describedby')).toBe(false);
  });

  it.each([
    ['an <input>', () => document.createElement('input')],
    ['a nested <button>', () => document.createElement('button')],
    // A plain, non-interactive child proves the gate is self-activation
    // (target === draggable), not an allow-list of editable/interactive tags.
    ['a plain <div> child', () => document.createElement('div')],
  ])(
    'does not start a keyboard drag when %s inside the draggable receives the key',
    async (_label, createChild) => {
      const { engine } = await renderDnd();
      const el = createElement();
      const child = createChild();
      el.appendChild(child);
      engine.registerDraggable(el, {});

      // Focus is on a descendant, not the draggable itself: Space/Enter belong to
      // that control (e.g. an inline rename input committing on Enter), so no drag
      // starts and the key stays un-prevented for the descendant's own handler.
      const spaceEvent = pressKey(child, ' ');
      expect(dragSessionStore.getSnapshot()).toBeNull();
      expect(spaceEvent.defaultPrevented).toBe(false);

      const enterEvent = pressKey(child, 'Enter');
      expect(dragSessionStore.getSnapshot()).toBeNull();
      expect(enterEvent.defaultPrevented).toBe(false);
    },
  );

  it.each([
    ['ctrlKey', { ctrlKey: true }],
    ['metaKey', { metaKey: true }],
    ['altKey', { altKey: true }],
  ])(
    'does not pick up when %s is held, leaving the shortcut un-prevented',
    async (_label, mods) => {
      const { engine } = await renderDnd();
      const el = createElement();
      engine.registerDraggable(el, {});

      el.focus();
      // A modifier + Space is an OS/IME/AT shortcut (e.g. Cmd+Enter to submit),
      // not a drag pickup: no drag starts and the key passes through.
      const event = pressKey(el, ' ', mods);

      expect(dragSessionStore.getSnapshot()).toBeNull();
      expect(event.defaultPrevented).toBe(false);
    },
  );

  it('ignores a modified activation key during an active drag (does not drop)', async () => {
    const { engine } = await renderDnd();
    const el = createElement();
    const onDragEnd = vi.fn();
    engine.registerDraggable(el, { onDragEnd });

    el.focus();
    pressKey(el, ' ');
    await flushRaf();

    // Cmd/Ctrl+Enter mid-drag is a shortcut, not a deliberate drop.
    const event = pressKey(el, 'Enter', { metaKey: true });

    expect(event.defaultPrevented).toBe(false);
    expect(onDragEnd).not.toHaveBeenCalled();
    expect(dragSessionStore.getSnapshot()?.mode).toBe('keyboard');
  });

  it('ignores a modified arrow key during an active drag (does not move)', async () => {
    const { engine } = await renderDnd();
    const el = createElement({ top: 0, height: 100, left: 0, width: 200 });
    const targetEl = createElement({ top: 200, height: 100, left: 0, width: 200 });
    const onDragEnter = vi.fn();
    const onDrag = vi.fn();
    engine.registerDropTarget(targetEl, { onDragEnter });
    engine.registerDraggable(el, { onDrag });

    el.focus();
    pressKey(el, ' ');
    await flushRaf();

    // Ctrl+ArrowDown is a navigation shortcut, not a drag move: no move may
    // commit at all. `onDrag` is the signal — it fires even for a step-nudge
    // fallback, whereas `onDragEnter` stays silent anyway while the null
    // hit-test resolves nothing.
    const event = pressKey(el, 'ArrowDown', { ctrlKey: true });

    expect(event.defaultPrevented).toBe(false);
    expect(onDrag).not.toHaveBeenCalled();
    expect(onDragEnter).not.toHaveBeenCalled();
  });

  it('swallows the activation key only on the drag source while another drag is active', async () => {
    const { engine } = await renderDnd();
    const dragged = createElement();
    engine.registerDraggable(dragged, {});
    const other = createElement();
    engine.registerDraggable(other, {});

    // A non-keyboard drag is in progress, so a keyboard pick-up cannot start.
    await lift(dragged);

    // On an unrelated draggable the key is left alone: its pickup was never
    // going to start, and a draggable that is itself a real `<button>` must
    // keep its native Enter/Space activation during someone else's drag.
    other.focus();
    const event = pressKey(other, ' ');
    expect(event.defaultPrevented).toBe(false);
    expect(dragSessionStore.getSnapshot()?.mode).not.toBe('keyboard');

    // On the drag's own source it is still swallowed: Space must not scroll
    // the page out from under the active gesture.
    dragged.focus();
    const sourceEvent = pressKey(dragged, ' ');
    expect(sourceEvent.defaultPrevented).toBe(true);
    expect(dragSessionStore.getSnapshot()?.mode).not.toBe('keyboard');
  });

  it('Escape cancels the drag (onDragEnd fires with an empty target stack)', async () => {
    const { engine } = await renderDnd();
    const el = createElement();
    const onDragEnd = vi.fn();
    engine.registerDraggable(el, { onDragEnd });

    el.focus();
    pressKey(el, ' ');
    await flushRaf();
    const event = pressKey(el, 'Escape');

    // Swallowed, so the same press can't also close an ancestor dialog.
    expect(event.defaultPrevented).toBe(true);
    expect(dragSessionStore.getSnapshot()).toBeNull();
    expect(onDragEnd).toHaveBeenCalledTimes(1);
    expect(onDragEnd.mock.calls[0][0].location.current.dropTargets).toHaveLength(0);
    expect(onDragEnd.mock.calls[0][0].canceled).toBe(true);
    expect(onDragEnd.mock.calls[0][1].reason).toBe('escape-key');
    // The details carry the keydown that caused it, not a stand-in.
    expect(onDragEnd.mock.calls[0][1].event).toBe(event);
  });

  it('Tab cancels the drag', async () => {
    const { engine } = await renderDnd();
    const el = createElement();
    const onDragEnd = vi.fn();
    engine.registerDraggable(el, { onDragEnd });
    el.focus();
    pressKey(el, ' ');
    await flushRaf();
    const event = pressKey(el, 'Tab');
    // Swallowed, so the cancel doesn't also move focus.
    expect(event.defaultPrevented).toBe(true);
    expect(dragSessionStore.getSnapshot()).toBeNull();
    // Escape and Tab both cancel, but they are distinguishable — the whole point
    // of the reason over a bare `canceled` boolean.
    expect(onDragEnd.mock.calls[0][1].reason).toBe('tab-key');
  });

  // Every way a keyboard drag can be taken away reports its own reason, which is
  // the whole point of the enum over a bare `canceled` boolean.
  it.each([
    [
      'pointer-down',
      (el: HTMLElement) => el.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true })),
    ],
    ['window-blur', () => window.dispatchEvent(new FocusEvent('blur'))],
    ['imperative-action', () => cancelDrag()],
  ])('reports %s as the drag end reason', async (expected, endTheDrag) => {
    const { engine } = await renderDnd();
    const el = createElement();
    const onDragEnd = vi.fn();
    engine.registerDraggable(el, { onDragEnd });

    el.focus();
    pressKey(el, ' ');
    await flushRaf();
    act(() => endTheDrag(el));

    expect(onDragEnd).toHaveBeenCalledTimes(1);
    expect(onDragEnd.mock.calls[0][1].reason).toBe(expected);
    expect(onDragEnd.mock.calls[0][0].canceled).toBe(true);
  });

  it('reports page-hidden when the tab is hidden mid-drag', async () => {
    const { engine } = await renderDnd();
    const el = createElement();
    const onDragEnd = vi.fn();
    engine.registerDraggable(el, { onDragEnd });

    el.focus();
    pressKey(el, ' ');
    await flushRaf();
    Object.defineProperty(document, 'visibilityState', { value: 'hidden', configurable: true });
    act(() => {
      document.dispatchEvent(new Event('visibilitychange'));
    });
    Object.defineProperty(document, 'visibilityState', { value: 'visible', configurable: true });

    expect(onDragEnd).toHaveBeenCalledTimes(1);
    expect(onDragEnd.mock.calls[0][1].reason).toBe('page-hidden');
    expect(onDragEnd.mock.calls[0][0].canceled).toBe(true);
  });

  it('keeps the drag when the dragged element is unmounted mid-drag', async () => {
    const { engine } = await renderDnd();
    const el = createElement();
    const onDragEnd = vi.fn();
    const cleanup = engine.registerDraggable(el, { onDragEnd });

    el.focus();
    pressKey(el, ' ');
    await flushRaf();
    // The node goes away *and* its registration is released, with nothing taking
    // its place: a windowed list dropping the row once it scrolls out of view.
    act(() => {
      el.remove();
      cleanup();
    });
    await flushRaf();

    // Nothing about moving or dropping needs the source element — the virtual
    // cursor carries the position and the targets resolve from it — so the drag
    // runs on rather than stranding the user mid-gesture.
    expect(onDragEnd).not.toHaveBeenCalled();
    expect(dragSessionStore.getSnapshot()).not.toBeNull();

    // Still endable by hand, which is what the user has left once the item they
    // were dragging is gone for good.
    pressKey(document.body, 'Escape');
    await flushRaf();
    expect(onDragEnd).toHaveBeenCalledTimes(1);
    expect(onDragEnd.mock.calls[0][1].reason).toBe('escape-key');
  });

  it('reports focus-out when focus moves to an editable elsewhere', async () => {
    const { engine } = await renderDnd();
    const el = createElement();
    const input = document.createElement('input');
    document.body.appendChild(input);
    registerCleanup(() => input.remove());
    const onDragEnd = vi.fn();
    engine.registerDraggable(el, { onDragEnd });

    el.focus();
    pressKey(el, ' ');
    await flushRaf();
    // The drag hands the keys back rather than swallowing the user's typing.
    act(() => {
      input.focus();
    });

    expect(onDragEnd).toHaveBeenCalledTimes(1);
    expect(onDragEnd.mock.calls[0][1].reason).toBe('focus-out');
    expect(onDragEnd.mock.calls[0][0].canceled).toBe(true);
  });

  it('window blur cancels an active keyboard drag', async () => {
    const { engine } = await renderDnd();
    const el = createElement();
    const onDragEnd = vi.fn();
    engine.registerDraggable(el, { onDragEnd });

    el.focus();
    pressKey(el, ' ');
    await flushRaf();

    // Losing window focus (alt-tab, browser chrome) aborts the drag — the virtual
    // cursor can no longer be driven by keys, so it must not linger.
    act(() => {
      window.dispatchEvent(new Event('blur'));
    });

    expect(dragSessionStore.getSnapshot()).toBeNull();
    expect(onDragEnd).toHaveBeenCalledTimes(1);
    expect(onDragEnd.mock.calls[0][0].canceled).toBe(true);
  });

  it('visibilitychange with the document hidden cancels an active keyboard drag', async () => {
    const { engine } = await renderDnd();
    const el = createElement();
    const onDragEnd = vi.fn();
    engine.registerDraggable(el, { onDragEnd });

    el.focus();
    pressKey(el, ' ');
    await flushRaf();

    Object.defineProperty(document, 'visibilityState', { value: 'hidden', configurable: true });
    try {
      act(() => {
        document.dispatchEvent(new Event('visibilitychange'));
      });

      expect(dragSessionStore.getSnapshot()).toBeNull();
      expect(onDragEnd).toHaveBeenCalledTimes(1);
      expect(onDragEnd.mock.calls[0][0].canceled).toBe(true);
    } finally {
      // Restore in `finally` so a failed assertion can't leave the document stuck
      // `hidden` and cascade into every later test.
      Object.defineProperty(document, 'visibilityState', { value: 'visible', configurable: true });
    }
  });

  // jsdom-only: a real browser fires `blur` on the iframe window when the frame
  // is removed, and the sensor's own blur listener ends the session there — so
  // the detached-document branch is unreachable and there is nothing to assert.
  // jsdom fires no such blur and keeps the realm alive, which is what lets this
  // test hold a session over a dead document.
  it.skipIf(!isJSDOM)(
    'drops a session whose document lost its browsing context and starts fresh',
    async () => {
      const { engine } = await renderDnd();
      const frame = document.createElement('iframe');
      document.body.appendChild(frame);
      registerCleanup(() => frame.remove());
      const innerDoc = frame.contentDocument!;
      // jsdom implements `elementFromPoint` on neither document; the test setup
      // polyfills only the main one, so the iframe document needs its own.
      innerDoc.elementFromPoint = () => null;
      const innerWin = innerDoc.defaultView!;
      const innerEl = innerDoc.createElement('div');
      innerEl.getBoundingClientRect = () => new DOMRect(0, 0, 200, 100);
      innerDoc.body.appendChild(innerEl);
      const onInnerDragEnd = vi.fn();
      engine.registerDraggable(innerEl, { onDragEnd: onInnerDragEnd });

      const mainEl = createElement();
      engine.registerDraggable(mainEl, {});

      pressKey(innerEl, ' ');
      expect(dragSessionStore.getSnapshot()?.source.element).toBe(innerEl);

      // The iframe is torn out: every listener that could end the session lived
      // in the dead realm, so the session can never terminate on its own. jsdom
      // keeps `defaultView` on a removed iframe's document, so mimic the real
      // browsing-context teardown by marking the window closed.
      frame.remove();
      Object.defineProperty(innerWin, 'closed', { value: true, configurable: true });

      pressKey(mainEl, ' ');

      // The dead session was canceled and the same press started a fresh pickup
      // instead of being refused forever.
      expect(onInnerDragEnd).toHaveBeenCalledTimes(1);
      expect(onInnerDragEnd.mock.calls[0][0].canceled).toBe(true);
      expect(dragSessionStore.getSnapshot()?.mode).toBe('keyboard');
      expect(dragSessionStore.getSnapshot()?.source.element).toBe(mainEl);

      act(() => cancelDrag());
    },
  );

  it('an auto-repeat activation key does not drop the item', async () => {
    const { engine } = await renderDnd();
    const el = createElement();
    const onDragEnd = vi.fn();
    engine.registerDraggable(el, { onDragEnd });

    el.focus();
    pressKey(el, ' '); // pick up
    await flushRaf();

    // Holding Space fires OS auto-repeat keydowns (`repeat: true`); they must be
    // ignored so the item isn't immediately dropped on pickup.
    const event = pressKey(el, ' ', { repeat: true });
    expect(event.defaultPrevented).toBe(true);
    expect(dragSessionStore.getSnapshot()?.mode).toBe('keyboard');
    expect(onDragEnd).not.toHaveBeenCalled();

    // A genuine (non-repeat) key still drops.
    pressKey(el, ' ');
    expect(dragSessionStore.getSnapshot()).toBeNull();
    expect(onDragEnd).toHaveBeenCalledTimes(1);
  });

  it('an auto-repeat activation key after a drop does not pick the item back up', async () => {
    const { engine } = await renderDnd();
    const el = createElement();
    const onDragStart = vi.fn();
    engine.registerDraggable(el, { onDragStart });

    el.focus();
    pressKey(el, ' '); // pick up
    await flushRaf();
    pressKey(el, ' '); // drop
    expect(dragSessionStore.getSnapshot()).toBeNull();
    expect(onDragStart).toHaveBeenCalledTimes(1);

    // The user is still holding Space from the drop; the OS auto-repeat keydowns
    // now arrive with no active drag and must not start a phantom pickup.
    pressKey(el, ' ', { repeat: true });
    expect(dragSessionStore.getSnapshot()).toBeNull();
    expect(onDragStart).toHaveBeenCalledTimes(1);

    // Releasing and pressing again picks up normally.
    pressKey(el, ' ');
    await flushRaf();
    expect(dragSessionStore.getSnapshot()?.mode).toBe('keyboard');
    expect(onDragStart).toHaveBeenCalledTimes(2);
  });

  it('coalesces held arrow-key repeats to one move per animation frame', async () => {
    const { engine } = await renderDnd();
    const el = createElement({ top: 0, height: 100, left: 0, width: 200 });
    const keyboardMovement = vi.fn(() => false as const);
    engine.registerDraggable(el, { keyboardMovement });

    el.focus();
    pressKey(el, ' ');
    await flushRaf();

    pressKey(el, 'ArrowDown');
    expect(keyboardMovement).toHaveBeenCalledTimes(1);

    pressKey(el, 'ArrowDown', { repeat: true });
    pressKey(el, 'ArrowDown', { repeat: true });
    pressKey(el, 'ArrowDown', { repeat: true });
    expect(keyboardMovement).toHaveBeenCalledTimes(1);

    await flushRaf();
    expect(keyboardMovement).toHaveBeenCalledTimes(2);

    await flushRaf();
    expect(keyboardMovement).toHaveBeenCalledTimes(2);
  });

  it('reuses target rects across held-arrow repeat frames until layout changes', async () => {
    const { engine } = await renderDnd();
    const el = createElement({ top: 0, height: 100, left: 0, width: 200 });
    const target = createElement({ top: 200, height: 100, left: 0, width: 200 });
    const measure = vi.spyOn(target, 'getBoundingClientRect');
    engine.registerDropTarget(target, {});
    engine.registerDraggable(el, {
      keyboardMovement: ({ getTargets }) => {
        getTargets();
        return false;
      },
    });

    el.focus();
    pressKey(el, ' ');
    await flushRaf();
    pressKey(el, 'ArrowDown');
    const afterFirstPress = measure.mock.calls.length;

    pressKey(el, 'ArrowDown', { repeat: true });
    await flushRaf();
    expect(measure).toHaveBeenCalledTimes(afterFirstPress);

    target.style.top = '250px';
    await Promise.resolve();
    pressKey(el, 'ArrowDown', { repeat: true });
    await flushRaf();
    expect(measure.mock.calls.length).toBeGreaterThan(afterFirstPress);
  });

  it.each(['PageUp', 'PageDown', 'Home', 'End'])(
    'swallows the page-scroll key %s during a drag without moving the cursor',
    async (key) => {
      const { engine } = await renderDnd();
      const el = createElement({ top: 0, height: 100, left: 0, width: 200 });
      const onDropTargetChange = vi.fn();
      const onDrag = vi.fn();
      const moved = vi.fn(() => null);
      engine.registerDraggable(el, {
        onDropTargetChange,
        onDrag,
        keyboardAnnouncements: { moved },
      });

      el.focus();
      pressKey(el, ' ');
      await flushRaf();

      const event = pressKey(el, key);

      // The key is swallowed (the viewport must not scroll out from under the
      // virtual cursor)...
      expect(event.defaultPrevented).toBe(true);
      // ...and no move was committed: a committed move always flushes `onDrag`
      // and runs the `moved` announcement, so their silence pins the cursor in
      // place. (The store snapshot republishes only on stack changes, so a
      // before/after snapshot comparison would compare an object to itself.)
      expect(dragSessionStore.getSnapshot()).not.toBeNull();
      expect(onDrag).not.toHaveBeenCalled();
      expect(moved).not.toHaveBeenCalled();
      expect(onDropTargetChange).not.toHaveBeenCalled();
    },
  );

  it('cancelDrag() cancels a keyboard drag and restores focus', async () => {
    const { engine } = await renderDnd();
    const el = createElement();
    el.tabIndex = 0;
    const onDragEnd = vi.fn();
    engine.registerDraggable(el, { onDragEnd });

    el.focus();
    pressKey(el, ' ');
    await flushRaf();
    // Move focus away so the restore is observable.
    act(() => {
      (document.body as HTMLElement).focus();
    });

    act(() => {
      cancelDrag();
    });

    expect(dragSessionStore.getSnapshot()).toBeNull();
    expect(onDragEnd).toHaveBeenCalledTimes(1);
    expect(onDragEnd.mock.calls[0][0].canceled).toBe(true);

    // Focus restoration runs one frame after the cancel.
    await flushRaf();
    expect(document.activeElement).toBe(el);
  });

  describe('guards with no other coverage', () => {
    /**
     * Run `body`, collecting the messages of any errors that escape as uncaught
     * (a consumer handler throwing out of the sensor's own keydown listener
     * surfaces that way under jsdom, not as a synchronous throw at the caller).
     */
    function withSwallowedUncaughtErrors(body: () => void): string[] {
      const messages: string[] = [];
      const onError = (event: ErrorEvent) => {
        messages.push(String(event.error?.message ?? event.message));
        event.preventDefault();
      };
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      window.addEventListener('error', onError);
      try {
        body();
      } finally {
        window.removeEventListener('error', onError);
        consoleErrorSpy.mockRestore();
      }
      return messages;
    }

    it('a keydown arriving at an editable cancels the drag', async () => {
      // The focus-departure guard watches `focusin` on the source's *own*
      // document, but the sensor binds `keydown` in every document holding a
      // draggable — so a textarea in a same-origin iframe kept the drag
      // swallowing that document's typing. This is the branch that catches it,
      // reached without any `focusin` of ours.
      const { engine } = await renderDnd();
      const el = createElement();
      el.tabIndex = 0;
      const input = document.createElement('input');
      document.body.appendChild(input);
      registerCleanup(() => input.remove());
      const onDragEnd = vi.fn();
      engine.registerDraggable(el, { onDragEnd });

      el.focus();
      pressKey(el, ' ');
      await flushRaf();
      // Dispatched *at* the editable without focusing it, so only the keydown
      // branch can act on it.
      pressKey(input, 'a');

      expect(onDragEnd).toHaveBeenCalledTimes(1);
      expect(onDragEnd.mock.calls[0][1].reason).toBe('focus-out');
    });

    it.each([[true], [42], ['x']])(
      'a keyboardMovement resolver returning %p falls through to the default move',
      async (result) => {
        // `'type' in true` throws, out of the window keydown listener — which
        // would leave the drag unmovable while still swallowing every arrow. A
        // loosely-typed (or plain JS) resolver can return any of these.
        const { engine } = await renderDnd();
        const el = createElement({ top: 0, height: 100, left: 0, width: 200 });
        const onDrag = vi.fn();
        engine.registerDraggable(el, {
          keyboardMovement: () => result as never,
          onDrag,
        });

        el.focus();
        pressKey(el, ' ');
        await flushRaf();
        pressKey(el, 'ArrowDown');

        // The default step move ran: the cursor advanced by the default 24px.
        expect(onDrag).toHaveBeenCalled();
        expect(onDrag.mock.calls.at(-1)![0].location.current.input.clientY).toBe(74);
        expect(dragSessionStore.getSnapshot()).not.toBeNull();
      },
    );

    it('restores focus even when onDrop throws', async () => {
      const { engine } = await renderDnd();
      const el = createElement({ top: 0, height: 100, left: 0, width: 200 });
      el.tabIndex = 0;
      const target = createElement({ top: 200, height: 100, left: 0, width: 200 });
      engine.registerDropTarget(target, {});
      engine.registerDraggable(el, {
        onDrop: () => {
          throw new Error('boom from onDrop');
        },
      });

      const originalEFP = document.elementFromPoint;
      document.elementFromPoint = ((_x: number, y: number) =>
        y >= 200 ? target : null) as typeof document.elementFromPoint;
      registerCleanup(() => {
        document.elementFromPoint = originalEFP;
      });

      el.focus();
      pressKey(el, ' ');
      await flushRaf();
      pressKey(el, 'ArrowDown');
      act(() => {
        (document.body as HTMLElement).focus();
      });

      // The lifecycle rethrows a consumer handler's error and the sensor has
      // already cleared its session, so without the `finally` the keyboard user
      // is stranded on `<body>`. The throw escapes the keydown listener as an
      // uncaught error under jsdom, so swallow it rather than fail the run.
      const errors = withSwallowedUncaughtErrors(() => pressKey(el, 'Enter'));

      expect(errors.some((message) => message.includes('boom from onDrop'))).toBe(true);
      await flushRaf();
      expect(document.activeElement).toBe(el);
    });

    it('hands finalFocus the committed drop outcome even when a terminal handler throws', async () => {
      const { engine } = await renderDnd();
      const el = createElement({ top: 0, height: 100, left: 0, width: 200 });
      el.tabIndex = 0;
      const target = createElement({ top: 200, height: 100, left: 0, width: 200 });
      engine.registerDropTarget(target, {});
      const finalFocus = vi.fn((_parameters: DragKeyboardFinalFocusParameters) => true as const);
      engine.registerDraggable(el, {
        finalFocus,
        onDragEnd: () => {
          throw new Error('boom from onDragEnd');
        },
      });

      const originalEFP = document.elementFromPoint;
      document.elementFromPoint = ((_x: number, y: number) =>
        y >= 200 ? target : null) as typeof document.elementFromPoint;
      registerCleanup(() => {
        document.elementFromPoint = originalEFP;
      });

      el.focus();
      pressKey(el, ' ');
      await flushRaf();
      pressKey(el, 'ArrowDown');

      withSwallowedUncaughtErrors(() => pressKey(el, 'Enter'));
      await flushRaf();

      // The throw skipped `drop`'s return, but the drop itself committed: a
      // `finalFocus` keyed off the destination must see the real outcome, not
      // the cancel branch.
      expect(finalFocus).toHaveBeenCalledTimes(1);
      const parameters = finalFocus.mock.calls[0][0];
      expect(parameters.canceled).toBe(false);
      expect(parameters.dropTarget?.element).toBe(target);
    });

    it('restores focus even when onDragEnd throws on cancel', async () => {
      const { engine } = await renderDnd();
      const el = createElement();
      el.tabIndex = 0;
      engine.registerDraggable(el, {
        onDragEnd: () => {
          throw new Error('boom from onDragEnd');
        },
      });

      el.focus();
      pressKey(el, ' ');
      await flushRaf();
      act(() => {
        (document.body as HTMLElement).focus();
      });

      const errors = withSwallowedUncaughtErrors(() => pressKey(el, 'Escape'));

      expect(errors.some((message) => message.includes('boom from onDragEnd'))).toBe(true);
      await flushRaf();
      expect(document.activeElement).toBe(el);
    });

    it('resolves the drop target the keyboard drag starts on', async () => {
      // The pickup hit-tests around the just-seeded preview to seed the initial
      // stack, so a drag lifted while already inside a target enters it.
      const { engine } = await renderDnd();
      const target = createElement({ top: 0, height: 200, left: 0, width: 200 });
      const el = createElement({ top: 50, height: 100, left: 0, width: 200 });
      target.appendChild(el);
      const onDragStart = vi.fn();
      const onDragEnter = vi.fn();
      engine.registerDropTarget(target, { onDragStart, onDragEnter });
      engine.registerDraggable(el, {});

      const originalEFP = document.elementFromPoint;
      document.elementFromPoint = (() => el) as typeof document.elementFromPoint;
      registerCleanup(() => {
        document.elementFromPoint = originalEFP;
      });

      el.focus();
      pressKey(el, ' ');
      await flushRaf();

      expect(onDragStart).toHaveBeenCalledTimes(1);
      expect(onDragEnter).toHaveBeenCalledTimes(1);
    });
  });

  it('moves toward the nearest accepting drop target in the pressed direction', async () => {
    const { engine } = await renderDnd();
    const el = createElement({ top: 0, height: 100, left: 0, width: 200 });
    // A drop target below the source: ArrowDown should collide with it.
    const targetEl = createElement({ top: 200, height: 100, left: 0, width: 200 });
    const onDragEnter = vi.fn();
    engine.registerDropTarget(targetEl, { onDragEnter });
    engine.registerDraggable(el, {});

    // The sensor moves the cursor onto the target it picked; resolve it there.
    const spy = vi
      .spyOn(document, 'elementFromPoint')
      .mockImplementation((_x: number, y: number) => (y >= 200 ? targetEl : null));
    registerCleanup(() => spy.mockRestore());

    el.focus();
    pressKey(el, ' '); // pick up at center (100, 50)
    await flushRaf();
    pressKey(el, 'ArrowDown'); // collide with the target below

    expect(onDragEnter).toHaveBeenCalledTimes(1);
  });

  it('hit-tests each press with its own modifier keys, so a key-gated canDrop answers for the press', async () => {
    const { engine } = await renderDnd();
    const el = createElement({ top: 0, height: 100, left: 0, width: 200 });
    const targetEl = createElement({ top: 200, height: 100, left: 0, width: 200 });
    const onDragEnter = vi.fn();
    const seen: boolean[] = [];
    engine.registerDropTarget(targetEl, {
      canDrop: ({ input }) => {
        seen.push(input.shiftKey);
        return input.shiftKey;
      },
      onDragEnter,
    });
    engine.registerDraggable(el, {});

    const spy = vi
      .spyOn(document, 'elementFromPoint')
      .mockImplementation((_x: number, y: number) => (y >= 200 ? targetEl : null));
    registerCleanup(() => spy.mockRestore());

    el.focus();
    pressKey(el, ' ');
    await flushRaf();

    // Plain press: the target refuses, so the press step-nudges short of it.
    pressKey(el, 'ArrowDown');
    expect(onDragEnter).not.toHaveBeenCalled();
    expect(seen.length).toBeGreaterThan(0);
    expect(seen.every((held) => held === false)).toBe(true);

    // Shift+ArrowDown: the directional search must ask `canDrop` with *this*
    // press's keys. The previous press baked Shift-up into the session's input,
    // and a search reading that stale snapshot would refuse the target the
    // committed move then reports Shift-down for.
    pressKey(el, 'ArrowDown', { shiftKey: true });
    expect(seen.at(-1)).toBe(true);
    expect(onDragEnter).toHaveBeenCalledTimes(1);

    act(() => cancelDrag());
  });

  it('re-resolves the stack on a modifier-only press and release, like the pointer sensor', async () => {
    const { engine } = await renderDnd();
    const el = createElement({ top: 0, height: 100, left: 0, width: 200 });
    const onDragEnter = vi.fn();
    const onDragLeave = vi.fn();
    // The virtual cursor sits over this target from pickup on; only Shift decides.
    engine.registerDropTarget(el, {
      canDrop: ({ input }) => input.shiftKey,
      onDragEnter,
      onDragLeave,
    });
    engine.registerDraggable(el, {});

    const spy = vi.spyOn(document, 'elementFromPoint').mockImplementation(() => el);
    registerCleanup(() => spy.mockRestore());

    el.focus();
    pressKey(el, ' ');
    await flushRaf();
    expect(onDragEnter).not.toHaveBeenCalled();

    // Pressing Shift moves nothing, but the gated `canDrop` answers differently
    // now: the stack must re-resolve on the press itself, not on the next arrow.
    pressKey(el, 'Shift', { shiftKey: true });
    expect(onDragEnter).toHaveBeenCalledTimes(1);

    // Releasing it has no keydown at all — the keyup listener must re-resolve.
    act(() => {
      el.dispatchEvent(new KeyboardEvent('keyup', { key: 'Shift', bubbles: true }));
    });
    expect(onDragLeave).toHaveBeenCalledTimes(1);

    act(() => cancelDrag());
  });

  it('scrolls the chosen target into view before aiming, so off-screen rows stay reachable', async () => {
    const { engine } = await renderDnd();
    const el = createElement({ top: 100, height: 100, left: 0, width: 200 });
    // A drop target scrolled out of view above the source (negative rect).
    const targetEl = createElement({ top: -200, height: 100, left: 0, width: 200 });
    // Revealing the row scrolls it under the viewport's top edge.
    const scrollIntoView = vi.fn(() => {
      targetEl.getBoundingClientRect = () => new DOMRect(0, 0, 200, 100);
    });
    targetEl.scrollIntoView = scrollIntoView as unknown as Element['scrollIntoView'];
    const onDragEnter = vi.fn();
    engine.registerDropTarget(targetEl, { onDragEnter });
    engine.registerDraggable(el, {});

    const spy = vi
      .spyOn(document, 'elementFromPoint')
      .mockImplementation((_x: number, y: number) => (y < 100 ? targetEl : null));
    registerCleanup(() => spy.mockRestore());

    el.focus();
    pressKey(el, ' '); // pick up at center (100, 150)
    await flushRaf();
    pressKey(el, 'ArrowUp'); // nearest accepting target is the off-screen one above

    // The sensor must reveal it before resolving, or `elementFromPoint` would
    // land on whatever is painted above the container instead of the row.
    expect(scrollIntoView).toHaveBeenCalled();
    // The aim reads the post-scroll rect: the press commits at the revealed
    // center (100, 50) and genuinely enters the target. Aiming at the
    // pre-scroll rect instead would commit at (100, -150).
    expect(onDragEnter).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenLastCalledWith(100, 50);
  });

  it('falls back to a step nudge when the chosen target is occluded at its aim point', async () => {
    // A sticky header painted over the target's entry edge: the hit-test
    // resolves the occluder, so committing the aim would enter a phantom
    // target. The press must degrade to a plain step nudge instead.
    const { engine } = await renderDnd();
    const el = createElement({ top: 0, height: 100, left: 0, width: 200 });
    const targetEl = createElement({ top: 200, height: 100, left: 0, width: 200 });
    const occluder = createElement({ top: 200, height: 100, left: 0, width: 200 });
    const onDragEnter = vi.fn();
    const moves: Array<{ x: number; y: number }> = [];
    engine.registerDropTarget(targetEl, { onDragEnter });
    engine.registerDraggable(el, {
      onDrag: ({ location }) => {
        moves.push({ x: location.current.input.clientX, y: location.current.input.clientY });
      },
    });

    const spy = vi.spyOn(document, 'elementFromPoint').mockReturnValue(occluder);
    registerCleanup(() => spy.mockRestore());

    el.focus();
    pressKey(el, ' '); // pick up at center (100, 50)
    await flushRaf();
    pressKey(el, 'ArrowDown');

    expect(onDragEnter).not.toHaveBeenCalled();
    // The commit is the step-nudged point (50 + 24 = 74), not the occluded aim.
    expect(moves).toEqual([{ x: 100, y: 74 }]);
  });

  it('falls back to a fixed step nudge when no target lies ahead', async () => {
    const { engine } = await renderDnd();
    const el = createElement({ top: 0, height: 100, left: 0, width: 200 });
    engine.registerDraggable(el, {});

    const spy = vi.spyOn(document, 'elementFromPoint').mockReturnValue(null);
    registerCleanup(() => spy.mockRestore());

    el.focus();
    pressKey(el, ' '); // pick up at center (100, 50)
    await flushRaf();
    pressKey(el, 'ArrowDown'); // no target → nudge down by the default step

    // 50 (center) + 24 (default step) = 74.
    expect(spy).toHaveBeenCalledWith(100, 74);
  });

  it('takes a coarser step with Shift in the fallback nudge', async () => {
    const { engine } = await renderDnd();
    const el = createElement({ top: 0, height: 100, left: 0, width: 200 });
    engine.registerDraggable(el, {});

    const spy = vi.spyOn(document, 'elementFromPoint').mockReturnValue(null);
    registerCleanup(() => spy.mockRestore());

    el.focus();
    pressKey(el, ' ');
    await flushRaf();
    pressKey(el, 'ArrowDown', { shiftKey: true }); // 50 + 24 * 4 = 146

    expect(spy).toHaveBeenCalledWith(100, 146);
  });

  it('Space drops on the resolved target', async () => {
    const { engine } = await renderDnd();
    const el = createElement({ top: 0, height: 100, left: 0, width: 200 });
    const targetEl = createElement({ top: 200, height: 100 });
    const onDrop = vi.fn();
    engine.registerDropTarget(targetEl, { onDrop });
    engine.registerDraggable(el, {});

    const spy = vi
      .spyOn(document, 'elementFromPoint')
      .mockImplementation((_x: number, y: number) => (y >= 70 ? targetEl : null));
    registerCleanup(() => spy.mockRestore());

    el.focus();
    pressKey(el, ' ');
    await flushRaf();
    pressKey(el, 'ArrowDown'); // enter target
    pressKey(el, ' '); // drop

    expect(dragSessionStore.getSnapshot()).toBeNull();
    // The drop target's `onDrop` firing at all means a real drop landed on it.
    expect(onDrop).toHaveBeenCalledTimes(1);
  });

  it('drops on a freshly remounted target when the committed one detached', async () => {
    const { engine } = await renderDnd();
    const el = createElement({ top: 0, height: 100, left: 0, width: 200 });
    const targetEl = createElement({ top: 200, height: 100 });
    const onDropOld = vi.fn();
    const onDropNew = vi.fn();
    engine.registerDraggable(el, {});
    engine.registerDropTarget(targetEl, { onDrop: onDropOld });

    // The hit-test resolves whichever row is currently mounted at the target
    // position; it swaps to `replacement` once the original detaches.
    let hovered: Element | null = targetEl;
    const spy = vi
      .spyOn(document, 'elementFromPoint')
      .mockImplementation((_x: number, y: number) => (y >= 70 ? hovered : null));
    registerCleanup(() => spy.mockRestore());

    el.focus();
    pressKey(el, ' ');
    await flushRaf();
    pressKey(el, 'ArrowDown'); // enter targetEl, committing it as currentTarget

    // A virtualizer recycles the row between the move and the drop: the committed
    // target detaches and a fresh node takes its place under the cursor.
    targetEl.remove();
    const replacement = createElement({ top: 200, height: 100 });
    engine.registerDropTarget(replacement, { onDrop: onDropNew });
    hovered = replacement;

    pressKey(el, ' '); // drop

    expect(dragSessionStore.getSnapshot()).toBeNull();
    // The detached target must not receive the drop; guarding on `isConnected`
    // re-hit-tests and lands it on the fresh node instead of silently resolving
    // to `outside-release` and dropping nothing.
    expect(onDropOld).not.toHaveBeenCalled();
    expect(onDropNew).toHaveBeenCalledTimes(1);
  });

  it('Space over no target reports an outside release (not canceled) to onDragEnd', async () => {
    const { engine } = await renderDnd();
    const el = createElement();
    const onDragEnd = vi.fn();
    const onDrop = vi.fn();
    engine.registerDraggable(el, { onDragEnd, onDrop });

    el.focus();
    pressKey(el, ' ');
    await flushRaf();
    pressKey(el, ' '); // drop with nothing under the cursor

    expect(dragSessionStore.getSnapshot()).toBeNull();
    expect(onDragEnd).toHaveBeenCalledTimes(1);
    expect(onDragEnd.mock.calls[0][0].location.current.dropTargets).toHaveLength(0);
    // Space over empty space fires onDragEnd (announced as "No drop target"),
    // but no real target resolved, so it is not canceled and `dropTarget` is
    // `null`. This is the ending that makes `!canceled` the wrong commit test —
    // `onDrop` is what stays silent here.
    expect(onDragEnd.mock.calls[0][0].canceled).toBe(false);
    expect(onDragEnd.mock.calls[0][0].dropTarget).toBeNull();
    expect(onDragEnd.mock.calls[0][1].reason).toBe('outside-release');
    expect(onDrop).not.toHaveBeenCalled();
  });

  it('keeps excluding the dragged row after a mid-drag source remount', async () => {
    const { engine } = await renderDnd();
    const el = createElement({ top: 0, height: 100, left: 0, width: 200 });
    engine.registerDraggable(el, {});

    el.focus();
    pressKey(el, ' '); // pick up at center (100, 50)
    await flushRaf();

    // A virtualizer remounts the dragged row below the cursor and the engine
    // re-points the live source at the fresh node. The fresh node doubles as a
    // registered drop target (a collection row), so if the exclusion still
    // pointed at the detached pickup-time node, the next move would enter it.
    el.remove();
    const remounted = createElement({ top: 200, height: 100, left: 0, width: 200 });
    const onDragEnter = vi.fn();
    engine.registerDropTarget(remounted, { onDragEnter });
    act(() => {
      expect(updateDragSourceElement(el, remounted)).toBe(true);
    });

    const spy = vi
      .spyOn(document, 'elementFromPoint')
      .mockImplementation((_x: number, y: number) => (y >= 200 ? remounted : null));
    registerCleanup(() => spy.mockRestore());

    pressKey(remounted, 'ArrowDown');

    // No target lies ahead once the dragged row is excluded: the move falls
    // back to a step nudge (50 + 24 = 74) instead of entering its own row.
    expect(onDragEnter).not.toHaveBeenCalled();
    expect(spy).toHaveBeenCalledWith(100, 74);
  });

  it('cancels the drag when focus moves into a text input mid-drag', async () => {
    const { engine } = await renderDnd();
    const el = createElement();
    const onDragEnd = vi.fn();
    engine.registerDraggable(el, { onDragEnd });

    const input = document.createElement('input');
    document.body.appendChild(input);
    registerCleanup(() => input.remove());

    el.focus();
    pressKey(el, ' ');
    await flushRaf();

    // Typing beats dragging: keys must go to the input, so the drag cancels
    // instead of keeping Space/arrows preventDefaulted under the user.
    act(() => {
      input.focus();
      input.dispatchEvent(new FocusEvent('focusin', { bubbles: true }));
    });

    expect(dragSessionStore.getSnapshot()).toBeNull();
    expect(onDragEnd).toHaveBeenCalledTimes(1);
    expect(onDragEnd.mock.calls[0][0].canceled).toBe(true);
  });

  it('leaves focus in the text input after a focusin cancel (no end-of-drag focus restore)', async () => {
    const { engine } = await renderDnd();
    const el = createElement();
    el.tabIndex = 0;
    engine.registerDraggable(el, {});

    const input = document.createElement('input');
    document.body.appendChild(input);
    registerCleanup(() => input.remove());

    el.focus();
    pressKey(el, ' ');
    await flushRaf();

    act(() => {
      input.focus();
      input.dispatchEvent(new FocusEvent('focusin', { bubbles: true }));
    });
    expect(dragSessionStore.getSnapshot()).toBeNull();

    // The cancel exists to hand the keys to the input the user just focused, so
    // the end-of-drag focus restore must not run a frame later and yank focus
    // back to the draggable (Escape-cancel still restores — see the
    // `cancelDrag()` test above).
    await flushRaf();
    await flushRaf();
    expect(document.activeElement).toBe(input);
  });

  it('does not cancel when focus moves into a checkbox input mid-drag', async () => {
    const { engine } = await renderDnd();
    const el = createElement();
    const onDragEnd = vi.fn();
    engine.registerDraggable(el, { onDragEnd });

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    document.body.appendChild(checkbox);
    registerCleanup(() => checkbox.remove());

    el.focus();
    pressKey(el, ' ');
    await flushRaf();

    // A checkbox takes no text or arrow-key input, so focusing one mid-drag (a
    // row's selection checkbox refocused by a re-render) must not end the drag
    // any more than focusing a `<button>` would.
    act(() => {
      checkbox.focus();
      checkbox.dispatchEvent(new FocusEvent('focusin', { bubbles: true }));
    });
    expect(dragSessionStore.getSnapshot()?.mode).toBe('keyboard');
    expect(onDragEnd).not.toHaveBeenCalled();

    // A text input still hands the keys back and cancels.
    const text = document.createElement('input');
    document.body.appendChild(text);
    registerCleanup(() => text.remove());
    act(() => {
      text.focus();
      text.dispatchEvent(new FocusEvent('focusin', { bubbles: true }));
    });
    expect(dragSessionStore.getSnapshot()).toBeNull();
    expect(onDragEnd).toHaveBeenCalledTimes(1);
    expect(onDragEnd.mock.calls[0][0].canceled).toBe(true);
  });

  it('does not cancel for a readOnly input, but cancels for a textarea', async () => {
    const { engine } = await renderDnd();
    const el = createElement();
    const onDragEnd = vi.fn();
    engine.registerDraggable(el, { onDragEnd });

    const readOnlyInput = document.createElement('input');
    readOnlyInput.readOnly = true;
    const textarea = document.createElement('textarea');
    document.body.append(readOnlyInput, textarea);
    registerCleanup(() => {
      readOnlyInput.remove();
      textarea.remove();
    });

    el.focus();
    pressKey(el, ' ');
    await flushRaf();

    // A readOnly input takes no text, so focusing one mid-drag must not end
    // the drag any more than focusing a button would.
    act(() => {
      readOnlyInput.dispatchEvent(new FocusEvent('focusin', { bubbles: true }));
    });
    expect(dragSessionStore.getSnapshot()?.mode).toBe('keyboard');
    expect(onDragEnd).not.toHaveBeenCalled();

    // A plain textarea is editable: the keys go back to it and the drag cancels.
    act(() => {
      textarea.dispatchEvent(new FocusEvent('focusin', { bubbles: true }));
    });
    expect(dragSessionStore.getSnapshot()).toBeNull();
    expect(onDragEnd).toHaveBeenCalledTimes(1);
    expect(onDragEnd.mock.calls[0][0].canceled).toBe(true);
  });

  it('cancels the drag when focus moves into an enabled select mid-drag', async () => {
    // A `<select>` owns arrows (change the option) and Space (open the listbox).
    // A drag that kept swallowing them would leave the focused select inert.
    const { engine } = await renderDnd();
    const el = createElement();
    const onDragEnd = vi.fn();
    engine.registerDraggable(el, { onDragEnd });

    const disabledSelect = document.createElement('select');
    disabledSelect.disabled = true;
    const select = document.createElement('select');
    document.body.append(disabledSelect, select);
    registerCleanup(() => {
      disabledSelect.remove();
      select.remove();
    });

    el.focus();
    pressKey(el, ' ');
    await flushRaf();

    // A disabled select takes no keys, so it behaves like any inert element.
    act(() => {
      disabledSelect.dispatchEvent(new FocusEvent('focusin', { bubbles: true }));
    });
    expect(dragSessionStore.getSnapshot()?.mode).toBe('keyboard');

    act(() => {
      select.dispatchEvent(new FocusEvent('focusin', { bubbles: true }));
    });

    expect(dragSessionStore.getSnapshot()).toBeNull();
    expect(onDragEnd).toHaveBeenCalledTimes(1);
    expect(onDragEnd.mock.calls[0][0].canceled).toBe(true);
  });

  it('cancels the drag when focus moves into a contenteditable element mid-drag', async () => {
    const { engine } = await renderDnd();
    const el = createElement();
    const onDragEnd = vi.fn();
    engine.registerDraggable(el, { onDragEnd });

    const editor = document.createElement('div');
    editor.setAttribute('contenteditable', 'true');
    // jsdom does not implement `isContentEditable`; force the flag the sensor reads.
    Object.defineProperty(editor, 'isContentEditable', { value: true });
    document.body.appendChild(editor);
    registerCleanup(() => editor.remove());

    el.focus();
    pressKey(el, ' ');
    await flushRaf();

    act(() => {
      editor.dispatchEvent(new FocusEvent('focusin', { bubbles: true }));
    });

    expect(dragSessionStore.getSnapshot()).toBeNull();
    expect(onDragEnd).toHaveBeenCalledTimes(1);
    expect(onDragEnd.mock.calls[0][0].canceled).toBe(true);
  });

  it('does not cancel when focus moves to a plain non-editable element mid-drag', async () => {
    const { engine } = await renderDnd();
    const el = createElement();
    const onDragEnd = vi.fn();
    engine.registerDraggable(el, { onDragEnd });

    const other = createElement();
    other.tabIndex = 0;

    el.focus();
    pressKey(el, ' ');
    await flushRaf();

    // The drag stays modal: only editable controls hand the keys back.
    act(() => {
      other.focus();
      other.dispatchEvent(new FocusEvent('focusin', { bubbles: true }));
    });

    expect(dragSessionStore.getSnapshot()?.mode).toBe('keyboard');
    expect(onDragEnd).not.toHaveBeenCalled();
  });

  it('cancels on a pointerdown, and that same press cannot start a pointer drag', async () => {
    const { engine } = await renderDnd();
    const a = createElement();
    const b = createElement();
    const onDragEnd = vi.fn();
    engine.registerDraggable(a, { onDragEnd });
    engine.registerDraggable(b, { pointerActivation: { mouse: { type: 'immediate' } } });

    a.focus();
    pressKey(a, ' ');
    await flushRaf();
    expect(dragSessionStore.getSnapshot()?.source.element).toBe(a);

    // Reaching for the mouse mid-drag ends the keyboard drag: leaving it live
    // would make the next Space drop at a stale virtual cursor instead of
    // activating whatever was clicked.
    act(() => {
      b.dispatchEvent(
        new PointerEvent('pointerdown', {
          pointerType: 'mouse',
          button: 0,
          buttons: 1,
          clientX: 10,
          clientY: 10,
          bubbles: true,
          cancelable: true,
        }),
      );
    });
    await flushRaf();

    expect(onDragEnd).toHaveBeenCalledTimes(1);
    expect(onDragEnd.mock.calls[0][0].canceled).toBe(true);
    // The pointer sensor's window-level capture listener runs before this
    // document-level one, so it still saw the keyboard drag and refused: the
    // press cancels, and only a later one lifts `b` with the mouse.
    expect(dragSessionStore.getSnapshot()).toBeNull();
  });

  it('survives both a virtualizer remount and an unmount with no replacement', async () => {
    const { engine } = await renderDnd();
    const el = createElement();
    const onDragEnd = vi.fn();
    const unregister = engine.registerDraggable(el, { onDragEnd });

    el.focus();
    pressKey(el, ' ');
    await flushRaf();

    // A recycled row unregisters and re-registers in the same commit, re-pointing
    // the session at the fresh node — the grace frame has to see that.
    const replacement = createElement();
    let unregisterReplacement = () => {};
    act(() => {
      unregister();
      el.remove();
      unregisterReplacement = engine.registerDraggable(replacement, { onDragEnd });
      updateDragSourceElement(el, replacement);
    });
    await flushRaf();

    expect(onDragEnd).not.toHaveBeenCalled();
    expect(dragSessionStore.getSnapshot()?.source.element).toBe(replacement);

    // An unmount with no replacement leaves the session pointing at a detached
    // node, which costs the drag nothing: it moves and drops off the virtual
    // cursor. The window scrolling the row away must not end the gesture.
    act(() => {
      unregisterReplacement();
      replacement.remove();
    });
    await flushRaf();

    expect(onDragEnd).not.toHaveBeenCalled();
    expect(dragSessionStore.getSnapshot()).not.toBeNull();
  });

  it('sets aria-roledescription and aria-describedby on the handle', async () => {
    const { engine } = await renderDnd();
    const el = createElement();
    engine.registerDraggable(el, {});
    expect(el.getAttribute('aria-roledescription')).toBe('draggable');
    const describedBy = el.getAttribute('aria-describedby');
    expect(describedBy).toBeTruthy();
    expect(document.getElementById(describedBy!)?.textContent).toContain('arrow keys');
  });

  describe('live-region keyboardAnnouncements', () => {
    function liveRegionText(): string {
      return document.querySelector('[aria-live="polite"]')?.textContent ?? '';
    }

    it('announces pick up then cancel with the English defaults', async () => {
      const { engine } = await renderDnd();
      const el = createElement();
      engine.registerDraggable(el, { label: 'First card' });

      el.focus();
      pressKey(el, ' ');
      expect(liveRegionText()).toBe(
        'Grabbed First card. Use the arrow keys to move, Space or Enter to drop, Escape to cancel.',
      );

      await flushRaf();
      pressKey(el, 'Escape');
      expect(liveRegionText()).toBe('Canceled dragging First card.');
    });

    it('announces with a generic label when the draggable declares none', async () => {
      const { engine } = await renderDnd();
      const el = createElement();
      engine.registerDraggable(el, {});

      el.focus();
      pressKey(el, ' ');
      expect(liveRegionText()).toBe(
        'Grabbed item. Use the arrow keys to move, Space or Enter to drop, Escape to cancel.',
      );
    });

    it('announces a drop with no target', async () => {
      const { engine } = await renderDnd();
      const el = createElement();
      engine.registerDraggable(el, { label: 'First card' });

      el.focus();
      pressKey(el, ' ');
      await flushRaf();
      pressKey(el, ' '); // drop with nothing under the cursor

      expect(liveRegionText()).toBe('Dropped First card. No drop target.');
    });

    it('names a labeled drop target in the moved and dropped announcements', async () => {
      const { engine } = await renderDnd();
      const el = createElement();
      const targetEl = createElement({ top: 200, height: 100 });
      engine.registerDraggable(el, { label: 'First card' });
      engine.registerDropTarget(targetEl, { label: 'To-do' });

      const spy = vi
        .spyOn(document, 'elementFromPoint')
        .mockImplementation((_x: number, y: number) => (y >= 200 ? targetEl : null));
      registerCleanup(() => spy.mockRestore());

      el.focus();
      pressKey(el, ' ');
      await flushRaf();
      pressKey(el, 'ArrowDown'); // move over the labeled target

      // Move announcements are debounced (held arrow keys would flood the queue).
      await act(async () => {
        await new Promise((resolve) => {
          setTimeout(resolve, 300);
        });
      });
      expect(liveRegionText()).toBe('First card on To-do');

      pressKey(el, ' '); // drop on the target
      expect(liveRegionText()).toBe('Dropped First card on To-do.');
      expect(dragSessionStore.getSnapshot()).toBeNull();
    });

    it('announces the final canDrop result when eligibility changes without another move', async () => {
      const { engine } = await renderDnd();
      const el = createElement();
      const targetEl = createElement({ top: 200, height: 100 });
      const onDrop = vi.fn();
      let acceptsDrop = true;
      engine.registerDraggable(el, { label: 'First card', onDrop });
      engine.registerDropTarget(targetEl, {
        label: 'To-do',
        canDrop: () => acceptsDrop,
      });

      const spy = vi
        .spyOn(document, 'elementFromPoint')
        .mockImplementation((_x: number, y: number) => (y >= 200 ? targetEl : null));
      registerCleanup(() => spy.mockRestore());

      el.focus();
      pressKey(el, ' ');
      await flushRaf();
      pressKey(el, 'ArrowDown');

      // No further movement publishes a snapshot after this live state change.
      acceptsDrop = false;
      pressKey(el, ' ');

      expect(liveRegionText()).toBe('Dropped First card. No drop target.');
      expect(onDrop).not.toHaveBeenCalled();
      expect(dragSessionStore.getSnapshot()).toBeNull();
    });

    it('completes the drop even when the dropped announcement throws', async () => {
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      registerCleanup(() => errorSpy.mockRestore());
      const { engine } = await renderDnd();
      const el = createElement();
      const onDragEnd = vi.fn();
      engine.registerDraggable(el, {
        onDragEnd,
        keyboardAnnouncements: {
          dropped: () => {
            throw new Error('broken announcement');
          },
        },
      });

      el.focus();
      pressKey(el, ' ');
      await flushRaf();
      pressKey(el, ' '); // drop

      // The announcement runs after sensor teardown but before the lifecycle's
      // terminal dispatches; an uncontained throw there would leave the lifecycle
      // active with no sensor owning it, refusing every later pickup.
      expect(errorSpy).toHaveBeenCalledTimes(1);
      expect(errorSpy.mock.calls[0][0]).toContain('"dropped" keyboard announcement');
      expect(dragSessionStore.getSnapshot()).toBeNull();
      expect(onDragEnd).toHaveBeenCalledTimes(1);
      expect(onDragEnd.mock.calls[0][0].canceled).toBe(false);

      // The engine is not wedged: a later pickup works.
      pressKey(el, ' ');
      expect(dragSessionStore.getSnapshot()?.mode).toBe('keyboard');
    });

    it('a drop right after a move cancels the debounced moved announcement', async () => {
      const { engine } = await renderDnd();
      const el = createElement({ top: 0, height: 100, left: 0, width: 200 });
      engine.registerDraggable(el, {
        keyboardAnnouncements: {
          moved: () => 'Card moved',
          // Falsy: writes nothing, so it cannot be relied on to overwrite a
          // stale queued message — the queue itself must be canceled.
          dropped: () => null,
        },
      });

      el.focus();
      pressKey(el, ' ');
      await flushRaf();
      const pickedUpText = liveRegionText();
      expect(pickedUpText).not.toBe('');
      pressKey(el, 'ArrowDown'); // queues 'Card moved' behind the debounce
      pressKey(el, ' '); // drop before the debounce elapses

      await act(async () => {
        await new Promise((resolve) => {
          setTimeout(resolve, 300);
        });
      });

      // The stale move must not read out after the drag already ended.
      expect(liveRegionText()).toBe(pickedUpText);
    });

    it('lets a custom announcement override win per key while keeping the defaults elsewhere', async () => {
      const { engine } = await renderDnd();
      const el = createElement();
      engine.registerDraggable(el, {
        keyboardAnnouncements: { pickedUp: () => 'Picked it up' },
      });

      el.focus();
      pressKey(el, ' ');
      expect(liveRegionText()).toBe('Picked it up');

      await flushRaf();
      pressKey(el, 'Escape');
      // onDragCancel is not overridden, so the English default still applies.
      expect(liveRegionText()).toBe('Canceled dragging item.');
    });

    it('stays silent when an announcement callback returns null', async () => {
      const { engine } = await renderDnd();
      const el = createElement();
      engine.registerDraggable(el, {
        keyboardAnnouncements: { pickedUp: () => null },
      });

      el.focus();
      pressKey(el, ' ');
      expect(liveRegionText()).toBe('');
    });

    it('hands the moved announcement the live cursor position', async () => {
      const { engine } = await renderDnd();
      const el = createElement({ top: 0, height: 100, left: 0, width: 200 });
      const positions: number[] = [];
      engine.registerDraggable(el, {
        keyboardAnnouncements: {
          moved: ({ location }) => {
            positions.push(location.current.input.clientY);
            return null;
          },
        },
      });

      const spy = vi.spyOn(document, 'elementFromPoint').mockReturnValue(null);
      registerCleanup(() => spy.mockRestore());

      el.focus();
      pressKey(el, ' '); // pick up at center (100, 50)
      await flushRaf();
      pressKey(el, 'ArrowDown'); // nudge to y = 74
      pressKey(el, 'ArrowDown'); // nudge to y = 98

      // The session store republishes only on stack changes, so same-stack
      // moves must not hand the announcement the pickup coordinates.
      expect(positions).toEqual([74, 98]);
    });
  });

  describe('keyboardMovement', () => {
    it('receives the press and a step suggestion when no target lies ahead', async () => {
      const { engine } = await renderDnd();
      const el = createElement({ top: 0, height: 100, left: 0, width: 200 });
      const calls: DragKeyboardMoveDetails[] = [];
      engine.registerDraggable(el, {
        payload: 'card-1',
        keyboardMovement: (details) => {
          calls.push(details);
          return null;
        },
      });

      el.focus();
      pressKey(el, ' '); // pick up at center (100, 50)
      await flushRaf();
      pressKey(el, 'ArrowDown', { shiftKey: true });

      expect(calls).toHaveLength(1);
      const details = calls[0];
      expect(details.key).toBe('ArrowDown');
      expect(details.direction).toEqual({ x: 0, y: 1 });
      expect(details.shiftKey).toBe(true);
      expect(details.position).toEqual({ x: 100, y: 50 });
      expect(details.source.payload).toBe('card-1');
      expect(details.target).toBeNull();
      // The suggestion carries the built-in outcome: no target ahead, so a
      // Shift-multiplied step nudge (50 + 24 * 4 = 146).
      expect(details.suggestion).toEqual({ type: 'step', position: { x: 100, y: 146 } });
    });

    it('receives a target suggestion with the collision-chosen element and aim point', async () => {
      const { engine } = await renderDnd();
      const el = createElement({ top: 0, height: 100, left: 0, width: 200 });
      const targetEl = createElement({ top: 200, height: 100, left: 0, width: 200 });
      engine.registerDropTarget(targetEl, {});
      const calls: DragKeyboardMoveDetails[] = [];
      engine.registerDraggable(el, {
        keyboardMovement: (details) => {
          calls.push(details);
          return null;
        },
      });

      el.focus();
      pressKey(el, ' ');
      await flushRaf();
      pressKey(el, 'ArrowDown');

      // A plain drop zone is aimed at its center.
      expect(calls[0].suggestion).toEqual({
        type: 'target',
        element: targetEl,
        position: { x: 100, y: 250 },
      });
    });

    it('commits a returned position exactly, with no Shift multiplier', async () => {
      const { engine } = await renderDnd();
      const el = createElement({ top: 0, height: 100, left: 0, width: 200 });
      engine.registerDraggable(el, {
        keyboardMovement: ({ position, shiftKey }) =>
          shiftKey ? { x: position.x, y: position.y + 10 } : null,
      });

      const spy = vi.spyOn(document, 'elementFromPoint').mockReturnValue(null);
      registerCleanup(() => spy.mockRestore());

      el.focus();
      pressKey(el, ' '); // pick up at center (100, 50)
      await flushRaf();
      pressKey(el, 'ArrowDown', { shiftKey: true });

      // The resolver's math lands verbatim: 50 + 10, not 50 + 10 * 4.
      expect(spy).toHaveBeenCalledWith(100, 60);
    });

    it('clamps a returned off-viewport position to the viewport', async () => {
      const { engine } = await renderDnd();
      const el = createElement({ top: 0, height: 100, left: 0, width: 200 });
      engine.registerDraggable(el, {
        keyboardMovement: () => ({ x: -50, y: 5000 }),
      });

      const spy = vi.spyOn(document, 'elementFromPoint').mockReturnValue(null);
      registerCleanup(() => spy.mockRestore());

      el.focus();
      pressKey(el, ' ');
      await flushRaf();
      pressKey(el, 'ArrowDown');

      // An off-viewport cursor would hit-test to nothing forever; the commit
      // clamps to the window size (jsdom reports no layout viewport).
      expect(spy).toHaveBeenCalledWith(0, window.innerHeight - 1);
    });

    it('returning false swallows the press: nothing moves and the drop lands at the old position', async () => {
      const { engine } = await renderDnd();
      const el = createElement({ top: 0, height: 100, left: 0, width: 200 });
      const onDrag = vi.fn();
      const onDragEnd = vi.fn();
      engine.registerDraggable(el, { keyboardMovement: () => false, onDrag, onDragEnd });

      const spy = vi.spyOn(document, 'elementFromPoint').mockReturnValue(null);
      registerCleanup(() => spy.mockRestore());

      el.focus();
      pressKey(el, ' '); // pick up at center (100, 50)
      await flushRaf();
      spy.mockClear();
      pressKey(el, 'ArrowDown');

      // No hit-test, no lifecycle move: the press was a true no-op.
      expect(spy).not.toHaveBeenCalled();
      expect(onDrag).not.toHaveBeenCalled();

      pressKey(el, ' '); // drop
      expect(onDragEnd.mock.calls[0][0].location.current.input.clientY).toBe(50);
    });

    it('announces reachedEdge (and not moved) when the resolver returns false', async () => {
      const { engine } = await renderDnd();
      const el = createElement({ top: 0, height: 100, left: 0, width: 200 });
      const reachedEdge = vi.fn(() => null);
      const moved = vi.fn(() => null);
      engine.registerDraggable(el, {
        keyboardMovement: () => false,
        keyboardAnnouncements: { reachedEdge, moved },
      });

      el.focus();
      pressKey(el, ' ');
      await flushRaf();
      pressKey(el, 'ArrowDown');

      expect(reachedEdge).toHaveBeenCalledTimes(1);
      expect(moved).not.toHaveBeenCalled();
    });

    it.each([
      ['undefined', undefined],
      ['null', null],
    ])('returning %s falls back to the default behavior for the press', async (_, fallThrough) => {
      const { engine } = await renderDnd();
      const el = createElement({ top: 0, height: 100, left: 0, width: 200 });
      engine.registerDraggable(el, {
        keyboardMovement: () => fallThrough,
      });

      const spy = vi.spyOn(document, 'elementFromPoint').mockReturnValue(null);
      registerCleanup(() => spy.mockRestore());

      el.focus();
      pressKey(el, ' '); // pick up at center (100, 50)
      await flushRaf();
      pressKey(el, 'ArrowDown');

      // The default step nudge: 50 + 24 = 74.
      expect(spy).toHaveBeenCalledWith(100, 74);
    });

    it('aims a returned plain-zone element at its center, and a reorder row at its entering edge', async () => {
      const { engine } = await renderDnd();
      const el = createElement({ top: 0, height: 100, left: 0, width: 200 });
      const zone = createElement({ top: 200, height: 100, left: 0, width: 200 });
      engine.registerDropTarget(zone, {});
      const row = createElement({ top: 400, height: 100, left: 0, width: 200 });
      engine.registerDropTarget(row, { payload: { ...reorderRowBrand, role: 'item' } });

      let returned: Element = zone;
      engine.registerDraggable(el, { keyboardMovement: () => returned });

      const spy = vi.spyOn(document, 'elementFromPoint').mockReturnValue(null);
      registerCleanup(() => spy.mockRestore());

      el.focus();
      pressKey(el, ' ');
      await flushRaf();

      pressKey(el, 'ArrowDown');
      // Plain zone: center (100, 250).
      expect(spy).toHaveBeenLastCalledWith(100, 250);

      returned = row;
      pressKey(el, 'ArrowDown');
      // Reorder row entered via ArrowDown: 90% into the rect (400 + 100 * 0.9).
      expect(spy).toHaveBeenLastCalledWith(100, 490);
    });

    it('aims a returned unregistered element at its center', async () => {
      const { engine } = await renderDnd();
      const el = createElement({ top: 0, height: 100, left: 0, width: 200 });
      const plain = createElement({ top: 300, height: 100, left: 0, width: 200 });
      engine.registerDraggable(el, { keyboardMovement: () => plain });

      const spy = vi.spyOn(document, 'elementFromPoint').mockReturnValue(null);
      registerCleanup(() => spy.mockRestore());

      el.focus();
      pressKey(el, ' ');
      await flushRaf();
      pressKey(el, 'ArrowDown');

      expect(spy).toHaveBeenCalledWith(100, 350);
    });

    it('scrolls a returned element into view before aiming', async () => {
      const { engine } = await renderDnd();
      const el = createElement({ top: 0, height: 100, left: 0, width: 200 });
      const target = createElement({ top: -200, height: 100, left: 0, width: 200 });
      const onDrag = vi.fn();
      // The reveal has to move the rect, or the aim point is derived from the
      // off-screen box either way and the assertion below holds whether or not the
      // scroll happened at all.
      const scrollIntoView = vi.fn(() => {
        target.getBoundingClientRect = () => new DOMRect(0, 0, 200, 100);
      });
      target.scrollIntoView = scrollIntoView as unknown as Element['scrollIntoView'];
      engine.registerDraggable(el, { keyboardMovement: () => target, onDrag });

      el.focus();
      pressKey(el, ' ');
      await flushRaf();
      pressKey(el, 'ArrowUp');

      expect(scrollIntoView).toHaveBeenCalled();
      // Aimed at the revealed box's centre (0..100 → y 50), not the pre-scroll
      // one (-200..-100 → y -150).
      const lastInput = onDrag.mock.calls.at(-1)![0].location.current.input;
      expect(lastInput.clientY).toBe(50);
    });

    it('commits a target result at its position, shifted by the reveal scroll', async () => {
      const { engine } = await renderDnd();
      const el = createElement({ top: 0, height: 100, left: 0, width: 200 });
      const target = createElement({ top: 300, height: 100, left: 0, width: 200 });
      engine.registerDropTarget(target, {});
      // Revealing the target scrolls the page 40px, moving its rect up.
      target.scrollIntoView = () => {
        target.getBoundingClientRect = () => new DOMRect(0, 260, 200, 100);
      };
      engine.registerDraggable(el, {
        // Aim at a chosen point (10px into the target, off-center on x)
        // instead of the derived entry point.
        keyboardMovement: () => ({
          type: 'target',
          element: target,
          position: { x: 30, y: 310 },
        }),
      });

      const spy = vi.spyOn(document, 'elementFromPoint').mockReturnValue(null);
      registerCleanup(() => spy.mockRestore());

      el.focus();
      pressKey(el, ' ');
      await flushRaf();
      pressKey(el, 'ArrowDown');

      // The chosen aim point rides the scroll shift: (30, 310 − 40).
      expect(spy).toHaveBeenCalledWith(30, 270);
    });

    it('commits an echoed step suggestion at its point and reveals what it lands on', async () => {
      const { engine } = await renderDnd();
      const el = createElement({ top: 0, height: 100, left: 0, width: 200 });
      // Unregistered content under the step point — revealed, never entered.
      const under = createElement({ top: 60, height: 100, left: 0, width: 200 });
      const scrollIntoView = vi.fn();
      under.scrollIntoView = scrollIntoView as unknown as Element['scrollIntoView'];
      const moves: Array<{ x: number; y: number }> = [];
      engine.registerDraggable(el, {
        // Echo the built-in suggestion when it is a step: keeps the default
        // stepping while the resolver intercepts target moves.
        keyboardMovement: ({ suggestion }) => (suggestion.type === 'step' ? suggestion : false),
        onDrag: ({ location }) => {
          moves.push({ x: location.current.input.clientX, y: location.current.input.clientY });
        },
      });

      const spy = vi.spyOn(document, 'elementFromPoint').mockReturnValue(under);
      registerCleanup(() => spy.mockRestore());

      el.focus();
      pressKey(el, ' '); // pick up at center (100, 50)
      await flushRaf();
      pressKey(el, 'ArrowDown');

      // The clamped step commit (50 + 24 = 74)…
      expect(moves).toEqual([{ x: 100, y: 74 }]);
      // …and the position-move path keeps what the cursor landed on in view.
      expect(scrollIntoView).toHaveBeenCalledTimes(1);
    });

    it('exposes the live target/location and probes findTarget from an explicit point', async () => {
      const { engine } = await renderDnd();
      const el = createElement({ top: 0, height: 100, left: 0, width: 200 });
      const zone = createElement({ top: 200, height: 100, left: 0, width: 200 });
      engine.registerDropTarget(zone, { payload: 'zone' });
      // Two targets to the right: one on-axis with the live cursor (y = 250),
      // one on-axis with the explicit `from` point (y = 50). The cross-axis
      // penalty makes each probe resolve a different winner.
      const rightOfCursor = createElement({ left: 300, width: 100, top: 200, height: 100 });
      engine.registerDropTarget(rightOfCursor, {});
      const rightOfFrom = createElement({ left: 300, width: 100, top: 0, height: 100 });
      engine.registerDropTarget(rightOfFrom, {});

      // Captured for post-press assertions: an expect() throwing inside the
      // resolver would be contained by the sensor and pass vacuously.
      const observations: Array<{
        targetPayload: unknown;
        cursor: { x: number; y: number };
        fromCursor: Element | null;
        fromPoint: Element | null;
      }> = [];
      let presses = 0;
      engine.registerDraggable(el, {
        keyboardMovement: (details) => {
          presses += 1;
          if (presses === 1) {
            return null; // default move: enter the zone below
          }
          observations.push({
            targetPayload: details.target?.payload,
            cursor: {
              x: details.location.current.input.clientX,
              y: details.location.current.input.clientY,
            },
            fromCursor: details.findTarget({ key: 'ArrowRight' }),
            fromPoint: details.findTarget({ key: 'ArrowRight', from: { x: 100, y: 50 } }),
          });
          return false;
        },
      });

      const spy = vi
        .spyOn(document, 'elementFromPoint')
        .mockImplementation((x: number, y: number) => (x < 300 && y >= 200 ? zone : null));
      registerCleanup(() => spy.mockRestore());

      el.focus();
      pressKey(el, ' '); // pick up at center (100, 50)
      await flushRaf();
      pressKey(el, 'ArrowDown'); // enter the zone at its center (100, 250)
      pressKey(el, 'ArrowDown'); // the resolver observes

      expect(observations).toHaveLength(1);
      // `target` is the record under the cursor after the previous move…
      expect(observations[0].targetPayload).toBe('zone');
      // …and `location.current` carries the live committed cursor.
      expect(observations[0].cursor).toEqual({ x: 100, y: 250 });
      // Probing from the cursor and from the explicit `from` point resolve
      // different winners, so `from` genuinely re-seats the probe origin.
      expect(observations[0].fromCursor).toBe(rightOfCursor);
      expect(observations[0].fromPoint).toBe(rightOfFrom);
    });

    it('a throwing resolver is a no-op press and the drag stays droppable', async () => {
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const { engine } = await renderDnd();
      const el = createElement({ top: 0, height: 100, left: 0, width: 200 });
      const onDragEnd = vi.fn();
      engine.registerDraggable(el, {
        keyboardMovement: () => {
          throw new Error('broken resolver');
        },
        onDragEnd,
      });

      el.focus();
      pressKey(el, ' ');
      await flushRaf();
      pressKey(el, 'ArrowDown');
      // The throw is contained and reported, not rethrown.
      expect(errorSpy).toHaveBeenCalledTimes(1);

      // The drag survives the throw and still drops normally.
      expect(dragSessionStore.getSnapshot()?.mode).toBe('keyboard');
      pressKey(el, ' ');
      expect(onDragEnd).toHaveBeenCalledTimes(1);
    });

    it('a resolver calling cancelDrag ends the drag without committing a move', async () => {
      const { engine } = await renderDnd();
      const el = createElement({ top: 0, height: 100, left: 0, width: 200 });
      const onDrag = vi.fn();
      const onDragEnd = vi.fn();
      engine.registerDraggable(el, {
        keyboardMovement: ({ position }) => {
          cancelDrag();
          return { x: position.x, y: position.y + 10 };
        },
        onDrag,
        onDragEnd,
      });

      el.focus();
      pressKey(el, ' ');
      await flushRaf();
      pressKey(el, 'ArrowDown');

      expect(dragSessionStore.getSnapshot()).toBeNull();
      expect(onDragEnd.mock.calls[0][0].canceled).toBe(true);
      // The returned position must not be committed into the dead session.
      expect(onDrag).not.toHaveBeenCalled();
    });

    it('getTargets lists only accepting targets; findTarget redirects the collision direction', async () => {
      const { engine } = await renderDnd();
      const el = createElement({ top: 0, height: 100, left: 0, width: 200 });
      const accepting = createElement({ top: 200, height: 100, left: 0, width: 200 });
      engine.registerDropTarget(accepting, { accept: cardKind, payload: 'accepting' });
      const refusing = createElement({ top: 400, height: 100, left: 0, width: 200 });
      engine.registerDropTarget(refusing, { accept: createKind('file') });
      const aside = createElement({ top: 0, height: 100, left: 400, width: 200 });
      const onDragEnter = vi.fn();
      engine.registerDropTarget(aside, { accept: cardKind, onDragEnter });

      // Captured for post-press assertions: an expect() throwing inside the
      // resolver would be contained by the sensor and pass vacuously.
      let targets: DragKeyboardMoveTarget[] = [];
      engine.registerDraggable(el, {
        kind: cardKind,
        keyboardMovement: ({ getTargets, findTarget }) => {
          targets = getTargets();
          // The press is ArrowDown, but the resolver looks right instead.
          return findTarget({ key: 'ArrowRight' });
        },
      });

      const spy = vi
        .spyOn(document, 'elementFromPoint')
        .mockImplementation((x: number) => (x >= 400 ? aside : null));
      registerCleanup(() => spy.mockRestore());

      el.focus();
      pressKey(el, ' ');
      await flushRaf();
      pressKey(el, 'ArrowDown');

      expect(targets.map((target) => target.record.payload)).toContain('accepting');
      expect(targets.some((target) => target.element === refusing)).toBe(false);
      expect(onDragEnter).toHaveBeenCalledTimes(1);
    });

    describe('targetsOnlyKeyboardMovement', () => {
      it('snaps to the target ahead', async () => {
        const { engine } = await renderDnd();
        const el = createElement({ top: 0, height: 100, left: 0, width: 200 });
        const targetEl = createElement({ top: 200, height: 100, left: 0, width: 200 });
        const onDragEnter = vi.fn();
        engine.registerDropTarget(targetEl, { onDragEnter });
        engine.registerDraggable(el, { keyboardMovement: targetsOnlyKeyboardMovement });

        const spy = vi
          .spyOn(document, 'elementFromPoint')
          .mockImplementation((_x: number, y: number) => (y >= 200 ? targetEl : null));
        registerCleanup(() => spy.mockRestore());

        el.focus();
        pressKey(el, ' ');
        await flushRaf();
        pressKey(el, 'ArrowDown');

        expect(onDragEnter).toHaveBeenCalledTimes(1);
      });

      it('does nothing when no target lies ahead, instead of nudging into dead space', async () => {
        const { engine } = await renderDnd();
        const el = createElement({ top: 0, height: 100, left: 0, width: 200 });
        // A target below only: ArrowUp has nothing ahead (the sortable-demo
        // first-row scenario).
        const below = createElement({ top: 200, height: 100, left: 0, width: 200 });
        engine.registerDropTarget(below, {});
        const onDrag = vi.fn();
        engine.registerDraggable(el, { keyboardMovement: targetsOnlyKeyboardMovement, onDrag });

        const spy = vi.spyOn(document, 'elementFromPoint').mockReturnValue(null);
        registerCleanup(() => spy.mockRestore());

        el.focus();
        pressKey(el, ' '); // pick up at center (100, 50)
        await flushRaf();
        spy.mockClear();
        pressKey(el, 'ArrowUp');

        expect(spy).not.toHaveBeenCalled();
        expect(onDrag).not.toHaveBeenCalled();
      });

      it('does not commit onto a target whose aim point is occluded', async () => {
        // A sticky header painted over the target's entry edge makes the
        // hit-test resolve something else, so committing would land on an empty
        // target stack — the dead space the preset exists to avoid.
        const { engine } = await renderDnd();
        const el = createElement({ top: 0, height: 100, left: 0, width: 200 });
        const targetEl = createElement({ top: 200, height: 100, left: 0, width: 200 });
        const occluder = createElement({ top: 200, height: 100, left: 0, width: 200 });
        const onDragEnter = vi.fn();
        const onDrag = vi.fn();
        const reachedEdge = vi.fn(() => null);
        engine.registerDropTarget(targetEl, { onDragEnter });
        engine.registerDraggable(el, {
          keyboardMovement: targetsOnlyKeyboardMovement,
          keyboardAnnouncements: { reachedEdge },
          onDrag,
        });

        const spy = vi.spyOn(document, 'elementFromPoint').mockReturnValue(occluder);
        registerCleanup(() => spy.mockRestore());

        el.focus();
        pressKey(el, ' ');
        await flushRaf();
        onDrag.mockClear();
        pressKey(el, 'ArrowDown');

        expect(onDragEnter).not.toHaveBeenCalled();
        expect(onDrag).not.toHaveBeenCalled();
        // The refused press is announced as an edge, not silently swallowed.
        expect(reachedEdge).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('finalFocus', () => {
    // jsdom lets a disabled button take focus, so the fall-through can only be
    // observed where focusability is real.
    it.skipIf(isJSDOM)(
      'skips a candidate that disabled itself mid-drag instead of losing focus',
      async () => {
        const { engine } = await renderDnd();
        const el = createElement();
        const handle = document.createElement('button');
        el.appendChild(handle);
        engine.registerDraggable(el, { dragHandle: handle });
        el.tabIndex = -1;

        handle.focus();
        pressKey(handle, ' ');
        await flushRaf();

        // The docs advertise flipping `disabled` from `onDragStart`. The engine reads
        // it only at pickup, so the drag continues — but the handle is now a natively
        // disabled button, and `.focus()` on it silently no-ops.
        handle.disabled = true;

        pressKey(handle, ' ');
        await flushRaf();

        // Falls through to the source rather than dropping the user on `<body>`.
        expect(document.activeElement).toBe(el);
      },
    );

    it('refocuses the source by default after a drop', async () => {
      const { engine } = await renderDnd();
      const el = createElement();
      el.tabIndex = 0;
      engine.registerDraggable(el, {});

      el.focus();
      pressKey(el, ' ');
      await flushRaf();
      pressKey(el, ' '); // drop
      await flushRaf(); // focus restoration runs one frame later

      expect(document.activeElement).toBe(el);
    });

    it('does not move focus when finalFocus is false', async () => {
      const { engine } = await renderDnd();
      const el = createElement();
      el.tabIndex = 0;
      const other = createElement();
      other.tabIndex = 0;
      engine.registerDraggable(el, { finalFocus: false });

      el.focus();
      pressKey(el, ' ');
      await flushRaf();
      other.focus(); // move focus elsewhere mid-drag
      pressKey(el, ' '); // drop
      await flushRaf();

      expect(document.activeElement).toBe(other);
    });

    it('moves focus to the ref element when finalFocus is a ref', async () => {
      const { engine } = await renderDnd();
      const el = createElement();
      el.tabIndex = 0;
      const target = createElement();
      target.tabIndex = 0;
      engine.registerDraggable(el, { finalFocus: { current: target } });

      el.focus();
      pressKey(el, ' ');
      await flushRaf();
      pressKey(el, ' '); // drop
      await flushRaf();

      expect(document.activeElement).toBe(target);
    });

    it('focuses the element returned by a finalFocus function', async () => {
      const { engine } = await renderDnd();
      const el = createElement();
      el.tabIndex = 0;
      const target = createElement();
      target.tabIndex = 0;
      const finalFocus = vi.fn(() => target);
      engine.registerDraggable(el, { finalFocus });

      el.focus();
      pressKey(el, ' ');
      await flushRaf();
      pressKey(el, ' '); // drop
      await flushRaf();

      expect(finalFocus).toHaveBeenCalledWith(
        expect.objectContaining({ canceled: false, dropTarget: null }),
      );
      expect(document.activeElement).toBe(target);
    });

    it('falls back to the default behavior when the function returns true', async () => {
      const { engine } = await renderDnd();
      const el = createElement();
      el.tabIndex = 0;
      const other = createElement();
      other.tabIndex = 0;
      engine.registerDraggable(el, { finalFocus: () => true });

      el.focus();
      pressKey(el, ' ');
      await flushRaf();
      other.focus(); // move focus elsewhere mid-drag
      pressKey(el, ' '); // drop
      await flushRaf();

      expect(document.activeElement).toBe(el);
    });

    it('falls back to the default behavior when the function returns null', async () => {
      const { engine } = await renderDnd();
      const el = createElement();
      el.tabIndex = 0;
      const other = createElement();
      other.tabIndex = 0;
      // `null` defers to the default behavior (like `true`), matching Base UI's
      // `finalFocus` callback contract; only `false`/`undefined` do nothing.
      engine.registerDraggable(el, { finalFocus: () => null });

      el.focus();
      pressKey(el, ' ');
      await flushRaf();
      other.focus(); // move focus elsewhere mid-drag
      pressKey(el, ' '); // drop
      await flushRaf();

      expect(document.activeElement).toBe(el);
    });

    it('does nothing when the function returns undefined', async () => {
      const { engine } = await renderDnd();
      const el = createElement();
      el.tabIndex = 0;
      const other = createElement();
      other.tabIndex = 0;
      engine.registerDraggable(el, { finalFocus: () => undefined });

      el.focus();
      pressKey(el, ' ');
      await flushRaf();
      other.focus(); // move focus elsewhere mid-drag
      pressKey(el, ' '); // drop
      await flushRaf();

      expect(document.activeElement).toBe(other);
    });

    it('reports the drop target to finalFocus when the drop lands on an accepting target', async () => {
      const { engine } = await renderDnd();
      const el = createElement();
      el.tabIndex = 0;
      const targetEl = createElement({ top: 200, height: 100 });
      engine.registerDropTarget(targetEl, {});
      const focusTarget = createElement();
      focusTarget.tabIndex = 0;
      const finalFocus = vi.fn((_parameters: DragKeyboardFinalFocusParameters) => focusTarget);
      engine.registerDraggable(el, { finalFocus });

      const spy = vi
        .spyOn(document, 'elementFromPoint')
        .mockImplementation((_x: number, y: number) => (y >= 200 ? targetEl : null));
      registerCleanup(() => spy.mockRestore());

      el.focus();
      pressKey(el, ' ');
      await flushRaf();
      pressKey(el, 'ArrowDown'); // enter the target
      pressKey(el, ' '); // drop on it
      await flushRaf();

      expect(finalFocus).toHaveBeenCalledTimes(1);
      expect(finalFocus).toHaveBeenCalledWith(
        expect.objectContaining({ canceled: false, dropTarget: expect.anything() }),
      );
      expect(finalFocus.mock.calls[0][0].location.current.dropTargets[0]?.element).toBe(targetEl);
      expect(document.activeElement).toBe(focusTarget);
    });

    it('reports a canceled drag to finalFocus when canceled with Escape', async () => {
      const { engine } = await renderDnd();
      const el = createElement();
      el.tabIndex = 0;
      const focusTarget = createElement();
      focusTarget.tabIndex = 0;
      const finalFocus = vi.fn(() => focusTarget);
      engine.registerDraggable(el, { finalFocus });

      el.focus();
      pressKey(el, ' ');
      await flushRaf();
      pressKey(el, 'Escape');
      await flushRaf(); // focus restoration runs one frame later

      // The Escape path restores focus, so `finalFocus` runs canceled. (The
      // focus-departure cancel — focusing an input mid-drag — deliberately skips
      // the restore and never calls it.)
      expect(finalFocus).toHaveBeenCalledTimes(1);
      expect(finalFocus).toHaveBeenCalledWith(expect.objectContaining({ canceled: true }));
      expect(document.activeElement).toBe(focusTarget);
    });

    it('restores focus to the live source node after a mid-drag remount', async () => {
      const { engine } = await renderDnd();
      const el = createElement();
      el.tabIndex = 0;
      engine.registerDraggable(el, {});

      el.focus();
      pressKey(el, ' ');
      await flushRaf();

      // A virtualizer remounts the dragged row: the pickup-time element
      // detaches and the engine re-points the live source at the fresh node.
      el.remove();
      const remounted = createElement();
      remounted.tabIndex = 0;
      act(() => {
        expect(updateDragSourceElement(el, remounted)).toBe(true);
      });

      pressKey(remounted, ' '); // drop
      await flushRaf();

      // Focus must land on the live node, not fall through to the drop-target
      // stack (often non-focusable) because the pickup-time refs detached.
      expect(document.activeElement).toBe(remounted);
    });

    it('focuses the current handle after a mid-drag handle remount', async () => {
      const { engine } = await renderDnd();
      const el = createElement();
      const oldHandle = document.createElement('button');
      el.appendChild(oldHandle);
      let handle = oldHandle;
      engine.registerDraggable(el, { dragHandle: () => handle });

      pressKey(oldHandle, ' '); // pick up from the handle
      await flushRaf();

      // A keyed handle button remounts during the drag: fresh node, same
      // registration. The default cascade must focus the draggable's *current*
      // handle — the pickup-time one is detached, and the root div is not
      // focusable, so trying only the pickup-time pair would drop focus.
      oldHandle.remove();
      const newHandle = document.createElement('button');
      el.appendChild(newHandle);
      handle = newHandle;

      pressKey(el, ' '); // drop
      await flushRaf();

      expect(document.activeElement).toBe(newHandle);
    });

    it('falls back to the default focus when the finalFocus element was removed', async () => {
      const { engine } = await renderDnd();
      const el = createElement();
      el.tabIndex = 0;
      const other = createElement();
      other.tabIndex = 0;
      const target = createElement();
      target.tabIndex = 0;
      // A reorder commit can unmount the intended element before the restore rAF
      // runs; focusing it would silently lose focus, so the default cascade wins.
      engine.registerDraggable(el, {
        finalFocus: () => {
          target.remove();
          return target;
        },
      });

      el.focus();
      pressKey(el, ' ');
      await flushRaf();
      other.focus(); // move focus elsewhere mid-drag so restoration is observable
      pressKey(el, ' '); // drop
      await flushRaf();

      // The disconnected target can't take focus; the default cascade restores el.
      expect(document.activeElement).toBe(el);
    });

    it('resetForTests cancels a pending focus-restore frame', async () => {
      const { engine } = await renderDnd();
      const el = createElement();
      el.tabIndex = 0;
      const other = createElement();
      other.tabIndex = 0;
      engine.registerDraggable(el, {});

      el.focus();
      pressKey(el, ' ');
      await flushRaf();
      other.focus(); // move focus elsewhere mid-drag so a restore is observable
      pressKey(el, ' '); // drop schedules the focus restore for the next frame

      // Tearing the sensor down before the frame fires must cancel it: a
      // focus() landing after teardown would steal focus from whatever the
      // next test (or consumer code) focused in the meantime.
      act(() => resetKeyboardSensor());
      await flushRaf();

      expect(document.activeElement).toBe(other);
    });
  });
});

describe('keyboard sensor — modifiers', () => {
  const { renderDnd } = createDndRenderer();

  it('restrictToVerticalAxis pins the virtual cursor to the origin x', async () => {
    const { engine } = await renderDnd();
    const el = createElement({ top: 0, height: 100, left: 0, width: 200 });
    // The session store only republishes on drop-target stack changes, so read
    // each move's committed cursor from the `onDrag` payload instead.
    const moves: Array<{ x: number; y: number }> = [];
    engine.registerDraggable(el, {
      modifiers: restrictToVerticalAxis,
      onDrag: ({ location }) => {
        moves.push({ x: location.current.input.clientX, y: location.current.input.clientY });
      },
    });
    const spy = vi.spyOn(document, 'elementFromPoint').mockReturnValue(null);
    registerCleanup(() => spy.mockRestore());

    el.focus();
    pressKey(el, ' '); // pick up at center (100, 50)
    await flushRaf();

    pressKey(el, 'ArrowDown'); // y step-nudges to 74
    const movesAfterVerticalPress = moves.length;
    pressKey(el, 'ArrowRight'); // x would step to 124, but the axis lock blocks it

    // The vertical press moved y; every committed x stayed at the origin (100),
    // so the horizontal press never escaped the locked axis.
    expect(moves.some((move) => move.y === 74)).toBe(true);
    expect(moves.every((move) => move.x === 100)).toBe(true);
    expect(moves.at(-1)).toEqual({ x: 100, y: 74 });
    // The clamped horizontal press resolves to the unchanged position, which is
    // a refused no-op: no onDrag fires for it.
    expect(moves).toHaveLength(movesAfterVerticalPress);

    act(() => cancelDrag());
  });

  // A keyboard drag reports the real key state, so a modifier can gate on it the same
  // way it does for the pointer. `mode` is how the two are told apart — Shift already
  // means "travel further" to `fixedStepKeyboardMovement`.
  it('reports the modifier keys of the press that produced the move', async () => {
    const { engine } = await renderDnd();
    const el = createElement({ top: 0, height: 100, left: 0, width: 200 });
    const seen: boolean[] = [];
    const inputs: boolean[] = [];
    const probe: DragModifier = ({ point, shiftKey }) => {
      seen.push(shiftKey);
      return point;
    };
    engine.registerDraggable(el, {
      modifiers: probe,
      onDrag: ({ location }) => {
        inputs.push(location.current.input.shiftKey);
      },
    });
    const spy = vi.spyOn(document, 'elementFromPoint').mockReturnValue(null);
    registerCleanup(() => spy.mockRestore());

    el.focus();
    pressKey(el, ' ');
    await flushRaf();
    expect(seen.at(-1)).toBe(false);

    pressKey(el, 'ArrowDown', { shiftKey: true });
    expect(seen.at(-1)).toBe(true);
    // The reported input agrees, so a consumer reading either sees the same press.
    expect(inputs.at(-1)).toBe(true);

    pressKey(el, 'ArrowDown');
    expect(seen.at(-1)).toBe(false);
    expect(inputs.at(-1)).toBe(false);

    act(() => cancelDrag());
  });

  // A pickup with Shift already held starts constrained: the Space press's keys reach
  // the initial modifier application, before any arrow moves. (Only Shift — a Ctrl, Alt
  // or Meta chord never picks up at all.)
  it('applies the modifiers with the pickup press keys already held', async () => {
    const { engine } = await renderDnd();
    const el = createElement({ top: 0, height: 100, left: 0, width: 200 });
    const seen: boolean[] = [];
    const probe: DragModifier = ({ point, shiftKey }) => {
      seen.push(shiftKey);
      return point;
    };
    engine.registerDraggable(el, { modifiers: probe });
    const spy = vi.spyOn(document, 'elementFromPoint').mockReturnValue(null);
    registerCleanup(() => spy.mockRestore());

    el.focus();
    pressKey(el, ' ', { shiftKey: true });
    expect(seen[0]).toBe(true);

    act(() => cancelDrag());
  });

  it('re-clamps to the viewport after a modifier pushes the cursor past the edge', async () => {
    // The step is clamped before the modifiers run, but a modifier is free to
    // move the point anywhere — `snapToGrid` in particular rounds *away* from an
    // already-clamped edge. Off-viewport the hit-test resolves nothing for the
    // rest of the drag, so the bound has to be re-imposed on the result.
    const { engine } = await renderDnd();
    const el = createElement({ top: 0, height: 100, left: 0, width: 200 });
    const viewportWidth = window.innerWidth;
    const moves: Array<{ x: number; y: number }> = [];
    engine.registerDraggable(el, {
      // Shoves the cursor well past the right edge, whatever the step produced.
      modifiers: ({ point }) => ({ x: viewportWidth + 500, y: point.y }),
      onDrag: ({ location }) => {
        moves.push({ x: location.current.input.clientX, y: location.current.input.clientY });
      },
    });
    const spy = vi.spyOn(document, 'elementFromPoint').mockReturnValue(null);
    registerCleanup(() => spy.mockRestore());

    el.focus();
    pressKey(el, ' ');
    await flushRaf();
    moves.length = 0;
    spy.mockClear();

    pressKey(el, 'ArrowDown');

    expect(moves.length).toBeGreaterThan(0);
    expect(moves.every((move) => move.x <= viewportWidth - 1)).toBe(true);
    expect(spy.mock.calls.every(([x]) => x <= viewportWidth - 1)).toBe(true);

    act(() => cancelDrag());
  });

  it('reaches a target scrolled out of a restrictToElement container instead of vetoing the aim', async () => {
    const { engine } = await renderDnd();
    // A scrollable container whose visible box also bounds the drag.
    const container = createElement({ top: 0, height: 300, left: 0, width: 200 });
    container.style.overflowY = 'auto';
    // jsdom has no layout; report the overflow the rects imply.
    Object.defineProperty(container, 'scrollHeight', { value: 700, configurable: true });
    Object.defineProperty(container, 'clientHeight', { value: 300, configurable: true });
    const el = createElement({ top: 0, height: 100, left: 0, width: 200 });
    container.appendChild(el);
    // A sortable row scrolled below the container's visible box: its pre-scroll
    // rect fails the in-bounds check even though revealing it makes it enterable.
    const targetEl = createElement({ top: 500, height: 100, left: 0, width: 200 });
    container.appendChild(targetEl);
    // Revealing the row scrolls it to the container's bottom edge.
    targetEl.scrollIntoView = () => {
      targetEl.getBoundingClientRect = () => new DOMRect(0, 200, 200, 100);
    };
    const onDragEnter = vi.fn();
    engine.registerDropTarget(targetEl, { onDragEnter });
    engine.registerDraggable(el, { modifiers: restrictToElement(container) });

    const spy = vi
      .spyOn(document, 'elementFromPoint')
      .mockImplementation((_x: number, y: number) => (y >= 200 && y < 300 ? targetEl : null));
    registerCleanup(() => spy.mockRestore());

    el.focus();
    pressKey(el, ' '); // pick up at center (100, 50)
    await flushRaf();
    pressKey(el, 'ArrowDown');

    // The press must enter the row rather than degrade to a clamped step-nudge:
    // the pre-scroll rect check alone would veto the aim and never scroll.
    expect(onDragEnter).toHaveBeenCalledTimes(1);

    act(() => cancelDrag());
  });

  it('runs the drop hit-test at the constrained point, never the raw step', async () => {
    const { engine } = await renderDnd();
    const el = createElement({ top: 0, height: 100, left: 0, width: 200 });
    engine.registerDraggable(el, { modifiers: restrictToVerticalAxis });
    const spy = vi.spyOn(document, 'elementFromPoint').mockReturnValue(null);
    registerCleanup(() => spy.mockRestore());

    el.focus();
    pressKey(el, ' '); // pick up at center (100, 50)
    await flushRaf();
    spy.mockClear();

    pressKey(el, 'ArrowDown'); // hit-tests at the constrained (100, 74)
    pressKey(el, 'ArrowRight'); // clamped to a no-op: no hit-test at all

    // The modifier runs before the probe/commit, so no hit-test ever sees the
    // raw stepped x (124) — every probe reads the locked axis.
    expect(spy).toHaveBeenCalled();
    expect(spy.mock.calls.every(([x]) => x === 100)).toBe(true);

    act(() => cancelDrag());
  });

  it('announces reachedEdge (and not moved) for a fully-clamped press', async () => {
    const { engine } = await renderDnd();
    const el = createElement({ top: 0, height: 100, left: 0, width: 200 });
    const reachedEdge = vi.fn(() => null);
    const moved = vi.fn(() => null);
    engine.registerDraggable(el, {
      modifiers: restrictToVerticalAxis,
      keyboardAnnouncements: { reachedEdge, moved },
    });
    const spy = vi.spyOn(document, 'elementFromPoint').mockReturnValue(null);
    registerCleanup(() => spy.mockRestore());

    el.focus();
    pressKey(el, ' '); // pick up at center (100, 50)
    await flushRaf();

    pressKey(el, 'ArrowRight'); // the axis lock clamps the step away entirely

    expect(reachedEdge).toHaveBeenCalledTimes(1);
    expect(moved).not.toHaveBeenCalled();

    act(() => cancelDrag());
  });

  it('contains a throwing modifier and commits the move unconstrained', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    registerCleanup(() => errorSpy.mockRestore());
    const { engine } = await renderDnd();
    const el = createElement({ top: 0, height: 100, left: 0, width: 200 });
    const moves: Array<{ x: number; y: number }> = [];
    engine.registerDraggable(el, {
      modifiers: () => {
        throw new Error('boom');
      },
      onDrag: ({ location }) => {
        moves.push({ x: location.current.input.clientX, y: location.current.input.clientY });
      },
    });
    const spy = vi.spyOn(document, 'elementFromPoint').mockReturnValue(null);
    registerCleanup(() => spy.mockRestore());

    el.focus();
    pressKey(el, ' '); // pick up at center (100, 50); the seed modifier throws too
    await flushRaf();
    expect(dragSessionStore.getSnapshot()?.mode).toBe('keyboard');

    pressKey(el, 'ArrowDown');

    // The throw is contained and reported; the press still moves by the step.
    expect(moves).toEqual([{ x: 100, y: 74 }]);
    expect(errorSpy).toHaveBeenCalled();
    expect(errorSpy.mock.calls.every(([message]) => typeof message === 'string')).toBe(true);
    expect(
      errorSpy.mock.calls.every(([message]) =>
        (message as string).startsWith('Base UI: a drag "modifiers" function threw'),
      ),
    ).toBe(true);

    act(() => cancelDrag());
  });

  it('clamps a keyboardMovement resolver position and refuses one clamped away entirely', async () => {
    const { engine } = await renderDnd();
    const el = createElement({ top: 0, height: 100, left: 0, width: 200 });
    const moves: Array<{ x: number; y: number }> = [];
    const reachedEdge = vi.fn(() => null);
    engine.registerDraggable(el, {
      modifiers: restrictToVerticalAxis,
      // ArrowDown escapes on both axes; ArrowRight only on the locked one.
      keyboardMovement: ({ key, position }) =>
        key === 'ArrowDown'
          ? { x: position.x + 50, y: position.y + 10 }
          : { x: position.x + 50, y: position.y },
      keyboardAnnouncements: { reachedEdge },
      onDrag: ({ location }) => {
        moves.push({ x: location.current.input.clientX, y: location.current.input.clientY });
      },
    });
    const spy = vi.spyOn(document, 'elementFromPoint').mockReturnValue(null);
    registerCleanup(() => spy.mockRestore());

    el.focus();
    pressKey(el, ' '); // pick up at center (100, 50)
    await flushRaf();

    // The resolver asked for (150, 60); the modifier clamps its output back to
    // the origin x before the commit.
    pressKey(el, 'ArrowDown');
    expect(moves).toEqual([{ x: 100, y: 60 }]);

    // The resolver asked for (150, 60); fully clamped back to the current
    // position, the press is refused — no onDrag, an edge announcement instead.
    pressKey(el, 'ArrowRight');
    expect(moves).toHaveLength(1);
    expect(reachedEdge).toHaveBeenCalledTimes(1);

    act(() => cancelDrag());
  });
});
