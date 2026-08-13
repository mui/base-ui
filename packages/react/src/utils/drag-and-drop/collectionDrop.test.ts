import { afterEach, describe, it, expect } from 'vitest';
import { computeDropPosition, getDropCapabilities } from './collectionDrop';

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

describe('getDropCapabilities', () => {
  it('enables both positions for both origins when no callbacks are configured', () => {
    // A callback-less collection is driven manually through `onStateChange`.
    expect(getDropCapabilities({}, 'internal')).toEqual({ hasOn: true, hasBeforeAfter: true });
    expect(getDropCapabilities({}, 'external')).toEqual({ hasOn: true, hasBeforeAfter: true });
  });

  it('enables both internal positions when onMove is configured', () => {
    expect(getDropCapabilities({ onMove: () => {} }, 'internal')).toEqual({
      hasOn: true,
      hasBeforeAfter: true,
    });
  });

  it('resolves no external positions when only internal callbacks are configured', () => {
    // An external drag has no handler that could commit, so no position may
    // light up an indicator.
    expect(getDropCapabilities({ onMove: () => {} }, 'external')).toEqual({
      hasOn: false,
      hasBeforeAfter: false,
    });
    expect(getDropCapabilities({ onReorder: () => {} }, 'external')).toEqual({
      hasOn: false,
      hasBeforeAfter: false,
    });
  });

  it('enables only before/after internally for a reorder-only collection', () => {
    expect(getDropCapabilities({ onReorder: () => {} }, 'internal')).toEqual({
      hasOn: false,
      hasBeforeAfter: true,
    });
  });

  it('enables only external before/after for an insert-only collection', () => {
    expect(getDropCapabilities({ onInsert: () => {} }, 'external')).toEqual({
      hasOn: false,
      hasBeforeAfter: true,
    });
    // The internal drop of an insert-only collection has nowhere to commit.
    expect(getDropCapabilities({ onInsert: () => {} }, 'internal')).toEqual({
      hasOn: false,
      hasBeforeAfter: false,
    });
  });

  it('enables only "on" for an item-drop-only collection, for both origins', () => {
    expect(getDropCapabilities({ onItemDrop: () => {} }, 'internal')).toEqual({
      hasOn: true,
      hasBeforeAfter: false,
    });
    expect(getDropCapabilities({ onItemDrop: () => {} }, 'external')).toEqual({
      hasOn: true,
      hasBeforeAfter: false,
    });
  });
});
