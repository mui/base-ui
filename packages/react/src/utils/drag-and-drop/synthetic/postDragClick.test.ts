import { afterEach, describe, expect, it, vi } from 'vitest';
import { resetForTests, suppressNextClick } from './postDragClick';

describe('post-drag click suppression', () => {
  afterEach(resetForTests);

  it.each([
    { heldPointerId: undefined, pointerEvent: false },
    { heldPointerId: 1, pointerEvent: false },
    { heldPointerId: undefined, pointerEvent: true },
    { heldPointerId: 1, pointerEvent: true },
  ])(
    'allows keyboard clicks with $heldPointerId held and pointerEvent=$pointerEvent',
    ({ heldPointerId, pointerEvent }) => {
      const button = document.createElement('button');
      document.body.appendChild(button);
      const onClick = vi.fn();
      button.addEventListener('click', onClick);
      try {
        suppressNextClick(button, heldPointerId);
        const options = { bubbles: true, cancelable: true, detail: 0 };
        const keyboardClick = pointerEvent
          ? new PointerEvent('click', { ...options, pointerId: -1 })
          : new MouseEvent('click', options);
        button.dispatchEvent(keyboardClick);
        expect(keyboardClick.defaultPrevented).toBe(false);
        expect(onClick).toHaveBeenCalledTimes(1);

        const pointerClick = new MouseEvent('click', {
          bubbles: true,
          cancelable: true,
          detail: 1,
        });
        button.dispatchEvent(pointerClick);
        expect(pointerClick.defaultPrevented).toBe(true);
        expect(onClick).toHaveBeenCalledTimes(1);
      } finally {
        button.remove();
      }
    },
  );
});
