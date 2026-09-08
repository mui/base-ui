import { describe, it, expect, vi } from 'vitest';
import { act } from '@mui/internal-test-utils';
import { createDndRenderer, isJSDOM } from '#test-utils';
import { flushRaf, registerCleanup, setupDragEngineTests } from '../../../../test/dnd';
import { dragSessionStore } from '../dragSessionStore';
import { targetsOnlyKeyboardMovement } from './keyboardMovementPresets';
import { createKind } from '../dragKind';

const cardKind = createKind('card');

/** Matches `MOVE_ANNOUNCE_DEBOUNCE_MS` in `keyboardSensor.ts`. */
const MOVE_ANNOUNCE_DEBOUNCE = 250;

setupDragEngineTests();

/** The engine handed back by `renderDnd`, inferred so the registration overloads resolve. */
type Engine = Awaited<ReturnType<ReturnType<typeof createDndRenderer>['renderDnd']>>['engine'];

function pressKey(target: EventTarget, key: string): void {
  act(() => {
    target.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }));
  });
}

/**
 * A keyboard drag whose source has left the DOM, which is what a windowed list does to the
 * dragged row once it scrolls out of view.
 *
 * Real layout rather than stubbed rects: each move commits through `elementFromPoint`, so a
 * test with unlaid-out elements would resolve no target and pass without proving the drop.
 */
describe.skipIf(isJSDOM)('keyboard drag with a detached source', () => {
  const { renderDnd } = createDndRenderer();

  /** A laid-out box at fixed viewport coordinates. Removed after the test. */
  function createBox(top: number): HTMLElement {
    const el = document.createElement('div');
    el.style.cssText = `position: fixed; left: 0; top: ${top}px; width: 200px; height: 50px; background: rgb(200 200 200);`;
    el.tabIndex = 0;
    document.body.appendChild(el);
    registerCleanup(() => el.remove());
    return el;
  }

  /** A source above two labeled targets, dragged with the arrows alone. */
  function setup(engine: Engine) {
    const source = createBox(0);
    const near = createBox(100);
    const far = createBox(200);

    const onDrop = vi.fn();
    const onDragEnd = vi.fn();
    const unregister = engine.registerDraggable(source, {
      kind: cardKind,
      payload: 'card-1',
      label: 'Card one',
      keyboardMovement: targetsOnlyKeyboardMovement,
      onDrop,
      onDragEnd,
    });
    engine.registerDropTarget(near, { label: 'Near zone' });
    engine.registerDropTarget(far, { label: 'Far zone' });

    return { source, near, far, onDrop, onDragEnd, unregister };
  }

  /** The innermost target's label, as the session currently reports it. */
  function over(): string | null {
    return dragSessionStore.getSnapshot()?.location.current.dropTargets[0]?.label ?? null;
  }

  it('keeps moving between targets and drops on the one it reached', async () => {
    const { engine } = await renderDnd();
    const { source, far, onDrop, onDragEnd, unregister } = setup(engine);

    source.focus();
    pressKey(source, ' ');
    await flushRaf();

    pressKey(source, 'ArrowDown');
    await flushRaf();
    expect(over()).toBe('Near zone');

    // The window scrolls past the row and unmounts it, with nothing taking its place.
    act(() => {
      unregister();
      source.remove();
    });
    await flushRaf();

    expect(dragSessionStore.getSnapshot()).not.toBeNull();
    // Still over the target it had reached: losing the source loses nothing about where the
    // drag is, because the position lives on the virtual cursor.
    expect(over()).toBe('Near zone');

    // Keys are handled on the window, so they still arrive with the source gone.
    pressKey(document.body, 'ArrowDown');
    await flushRaf();
    expect(over()).toBe('Far zone');

    pressKey(document.body, 'Enter');
    await flushRaf();

    expect(onDrop).toHaveBeenCalledTimes(1);
    expect(onDrop.mock.calls[0][0].dropTarget.label).toBe('Far zone');
    expect(onDragEnd.mock.calls[0][0].canceled).toBe(false);
    expect(onDragEnd.mock.calls[0][1].reason).toBe('drop');
    // With every source/handle candidate detached, the default focus cascade
    // lands on the innermost accepting target after the commit.
    expect(document.activeElement).toBe(far);
  });

  it('announces the move and the drop with the source gone', async () => {
    const { engine } = await renderDnd();
    const { source, unregister } = setup(engine);

    /** The announcer's live region, one per owner document. */
    const said = () =>
      [...document.querySelectorAll('[role="status"],[aria-live]')]
        .map((el) => el.textContent?.trim())
        .filter(Boolean)
        .join(' | ');

    // Move announcements are debounced, so each assertion waits the debounce out. Both the
    // source and the targets carry a `label` on purpose: without one, `moved` renders as
    // silence by design and this test would pass against an announcer that said nothing.
    const settleAnnouncement = () =>
      act(async () => {
        await new Promise((resolve) => {
          setTimeout(resolve, MOVE_ANNOUNCE_DEBOUNCE + 100);
        });
      });

    source.focus();
    pressKey(source, ' ');
    await flushRaf();
    expect(said()).toContain('Card one');

    act(() => {
      unregister();
      source.remove();
    });
    await flushRaf();

    pressKey(document.body, 'ArrowDown');
    await flushRaf();
    await settleAnnouncement();
    // The label comes from the source record captured at pickup, so it outlives the element.
    expect(said()).toBe('Card one on Near zone');

    pressKey(document.body, 'Enter');
    await flushRaf();
    expect(said()).toBe('Dropped Card one on Near zone.');
  });
});
