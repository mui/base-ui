import { afterEach, describe, expect, it, vi } from 'vitest';
import { resetForTests, suppressDoubleClickFollowUp, suppressNextClick } from './postDragClick';

describe('post-drag click suppression', () => {
  afterEach(resetForTests);

  it.each([undefined, 1])('allows keyboard clicks with %s held', (heldPointerId) => {
    const button = document.createElement('button');
    document.body.appendChild(button);
    const onClick = vi.fn();
    button.addEventListener('click', onClick);
    try {
      suppressNextClick(button, heldPointerId);
      const keyboardClick = new PointerEvent('click', {
        bubbles: true,
        cancelable: true,
        detail: 0,
        pointerId: -1,
      });
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
  });

  describe('double-click follow-up', () => {
    function click(target: Element, type: 'click' | 'dblclick', detail: number): MouseEvent {
      const event = new MouseEvent(type, { bubbles: true, cancelable: true, detail });
      target.dispatchEvent(event);
      return event;
    }

    it('swallows the rest of the double-click, then lets clicks through', () => {
      const button = document.createElement('button');
      document.body.appendChild(button);
      try {
        suppressDoubleClickFollowUp(button);
        // A keyboard click isn't part of the sequence and leaves it armed.
        expect(click(button, 'click', 0).defaultPrevented).toBe(false);
        expect(click(button, 'click', 2).defaultPrevented).toBe(true);
        expect(click(button, 'dblclick', 2).defaultPrevented).toBe(true);
        expect(click(button, 'dblclick', 2).defaultPrevented).toBe(false);
      } finally {
        button.remove();
      }
    });

    it('disarms on a click that starts a new sequence', () => {
      const button = document.createElement('button');
      document.body.appendChild(button);
      try {
        suppressDoubleClickFollowUp(button);
        expect(click(button, 'click', 1).defaultPrevented).toBe(false);
        expect(click(button, 'click', 2).defaultPrevented).toBe(false);
        expect(click(button, 'dblclick', 2).defaultPrevented).toBe(false);
      } finally {
        button.remove();
      }
    });
  });
});
