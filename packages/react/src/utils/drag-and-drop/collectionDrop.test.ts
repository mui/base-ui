import { afterEach, describe, it, expect } from 'vitest';
import { computeDropPosition } from './collectionDrop';

const appendedElements: HTMLElement[] = [];

afterEach(() => {
  while (appendedElements.length > 0) {
    appendedElements.pop()!.remove();
  }
});

function elementWithRect(top: number, height: number): HTMLElement {
  const el = document.createElement('div');
  el.getBoundingClientRect = () =>
    ({
      top,
      height,
      bottom: top + height,
      left: 0,
      right: 0,
      width: 0,
      x: 0,
      y: top,
      toJSON() {},
    }) as DOMRect;
  return el;
}

function horizontalElement(left: number, width: number, direction: 'ltr' | 'rtl'): HTMLElement {
  const el = document.createElement('div');
  el.style.direction = direction;
  // `getComputedStyle().direction` only resolves the inline value once the
  // element is connected, which mirrors the real drop-target row during a drag.
  document.body.appendChild(el);
  appendedElements.push(el);
  el.getBoundingClientRect = () =>
    ({
      top: 0,
      height: 0,
      bottom: 0,
      left,
      right: left + width,
      width,
      x: left,
      y: 0,
      toJSON() {},
    }) as DOMRect;
  return el;
}

const BOTH = { hasOn: true, hasBeforeAfter: true };
const BEFORE_AFTER_ONLY = { hasOn: false, hasBeforeAfter: true };
const ON_ONLY = { hasOn: true, hasBeforeAfter: false };

describe('computeDropPosition', () => {
  it('splits a row into before / on / after when both are allowed', () => {
    const el = elementWithRect(0, 100);
    expect(computeDropPosition(el, 10, BOTH)).toBe('before');
    expect(computeDropPosition(el, 50, BOTH)).toBe('on');
    expect(computeDropPosition(el, 90, BOTH)).toBe('after');
  });

  it('splits a row in half when only before/after is allowed', () => {
    const el = elementWithRect(0, 100);
    expect(computeDropPosition(el, 40, BEFORE_AFTER_ONLY)).toBe('before');
    expect(computeDropPosition(el, 60, BEFORE_AFTER_ONLY)).toBe('after');
  });

  it('always returns "on" when only "on" is allowed', () => {
    const el = elementWithRect(0, 100);
    expect(computeDropPosition(el, 10, ON_ONLY)).toBe('on');
    expect(computeDropPosition(el, 90, ON_ONLY)).toBe('on');
  });

  it('returns a deterministic position for a zero-height row instead of NaN/Infinity', () => {
    const el = elementWithRect(50, 0);
    // A naive `(clientY - top) / height` would be ±Infinity/NaN here.
    expect(computeDropPosition(el, 50, BOTH)).toBe('on');
    expect(computeDropPosition(el, 50, BEFORE_AFTER_ONLY)).toBe('after');
    expect(computeDropPosition(el, 50, ON_ONLY)).toBe('on');
  });

  it('reads before/after left-to-right for a horizontal LTR list', () => {
    const el = horizontalElement(0, 100, 'ltr');
    expect(computeDropPosition(el, 40, BEFORE_AFTER_ONLY, 'horizontal')).toBe('before');
    expect(computeDropPosition(el, 60, BEFORE_AFTER_ONLY, 'horizontal')).toBe('after');
  });

  it('flips before/after for a horizontal RTL list so the right half is "before"', () => {
    const el = horizontalElement(0, 100, 'rtl');
    // Reading order is right-to-left, so the right half is visually "before".
    expect(computeDropPosition(el, 60, BEFORE_AFTER_ONLY, 'horizontal')).toBe('before');
    expect(computeDropPosition(el, 40, BEFORE_AFTER_ONLY, 'horizontal')).toBe('after');
    // The before/on/after split flips too.
    expect(computeDropPosition(el, 90, BOTH, 'horizontal')).toBe('before');
    expect(computeDropPosition(el, 10, BOTH, 'horizontal')).toBe('after');
  });
});
