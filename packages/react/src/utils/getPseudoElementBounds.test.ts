import { afterEach, describe, expect, it, vi } from 'vitest';
import { isJSDOM } from '#test-utils';
import { getPseudoElementBounds, isMouseWithinBounds } from './getPseudoElementBounds';

describe('getPseudoElementBounds', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it.skipIf(!isJSDOM)('does not read pseudo-element styles in jsdom', () => {
    const element = createElementWithRect({ x: 100, y: 50, width: 20, height: 10 });
    const getComputedStyle = vi.spyOn(window, 'getComputedStyle');

    expect(getPseudoElementBounds(element)).toMatchObject({
      left: 100,
      right: 120,
      top: 50,
      bottom: 60,
    });
    expect(getComputedStyle).not.toHaveBeenCalled();
  });

  it.skipIf(isJSDOM)('includes pseudo-element bounds in browsers', () => {
    const style = document.createElement('style');
    style.textContent = `
      .pseudo-element-bounds-test {
        position: absolute;
        left: 100px;
        top: 50px;
        width: 20px;
        height: 10px;
      }

      .pseudo-element-bounds-test::before {
        content: "";
        display: block;
        width: 40px;
        height: 30px;
      }
    `;

    const element = document.createElement('div');
    element.className = 'pseudo-element-bounds-test';

    document.head.appendChild(style);
    document.body.appendChild(element);

    try {
      expect(getPseudoElementBounds(element)).toEqual({
        left: 90,
        right: 130,
        top: 40,
        bottom: 70,
      });
    } finally {
      element.remove();
      style.remove();
    }
  });

  it('allows up to 5px of mouse drift around element bounds', () => {
    const element = createElementWithRect({ x: 100, y: 50, width: 20, height: 10 });

    const within = (clientX: number, clientY: number) =>
      isMouseWithinBounds(new MouseEvent('mouseup', { clientX, clientY }), element);

    // Left edge
    expect(within(95, 55)).toBe(true);
    expect(within(94, 55)).toBe(false);
    // Right edge
    expect(within(125, 55)).toBe(true);
    expect(within(126, 55)).toBe(false);
    // Top edge
    expect(within(110, 45)).toBe(true);
    expect(within(110, 44)).toBe(false);
    // Bottom edge
    expect(within(110, 65)).toBe(true);
    expect(within(110, 66)).toBe(false);
  });
});

function createElementWithRect(rect: DOMRectInit) {
  const element = document.createElement('div');
  element.getBoundingClientRect = () => DOMRect.fromRect(rect);
  return element;
}
