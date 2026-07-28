import { expect, vi } from 'vitest';
import { isJSDOM } from '#test-utils';
import { getViewportRect } from './getViewportRect';

describe('getViewportRect', () => {
  let element: HTMLElement;

  beforeEach(() => {
    element = document.createElement('div');
    element.style.cssText = 'position:fixed;left:100px;top:100px;width:20px;height:20px';
    document.body.appendChild(element);
  });

  afterEach(() => {
    element.remove();
  });

  it('pads the element rect by half the teleport distance', () => {
    const rect = element.getBoundingClientRect();

    expect(getViewportRect(100, element)).toEqual({
      left: rect.left - 50,
      top: rect.top - 50,
      right: rect.right + 50,
      bottom: rect.bottom + 50,
    });
  });

  it('collapses to the element rect for a zero teleport distance', () => {
    const rect = element.getBoundingClientRect();

    expect(getViewportRect(0, element)).toEqual({
      left: rect.left,
      top: rect.top,
      right: rect.right,
      bottom: rect.bottom,
    });
  });

  it.skipIf(isJSDOM)('uses the visual viewport when no teleport distance is set', () => {
    const visualViewport = window.visualViewport;
    if (!visualViewport) {
      throw new Error('Expected visualViewport in a browser test.');
    }

    // A pinch-zoomed viewport: offset from the layout viewport and smaller than it, so the
    // result can't coincide with the document element's bounds.
    const spies = [
      vi.spyOn(visualViewport, 'offsetLeft', 'get').mockReturnValue(7),
      vi.spyOn(visualViewport, 'offsetTop', 'get').mockReturnValue(11),
      vi.spyOn(visualViewport, 'width', 'get').mockReturnValue(300),
      vi.spyOn(visualViewport, 'height', 'get').mockReturnValue(400),
    ];

    try {
      expect(getViewportRect(undefined, element)).toEqual({
        left: 7,
        top: 11,
        right: 307,
        bottom: 411,
      });
    } finally {
      spies.forEach((spy) => spy.mockRestore());
    }
  });

  it.skipIf(!isJSDOM)('falls back to the document element without a visual viewport', () => {
    expect(window.visualViewport).toBe(undefined);

    expect(getViewportRect(undefined, element)).toEqual({
      left: 0,
      top: 0,
      right: document.documentElement.clientWidth,
      bottom: document.documentElement.clientHeight,
    });
  });
});
