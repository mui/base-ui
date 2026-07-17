import { expect, vi } from 'vitest';
import {
  hide as nativeHide,
  type MiddlewareState,
  type Rect,
  type SideObject,
} from '@floating-ui/react-dom';
import { hide } from './hideMiddleware';

const floatingRect: Rect = { x: 0, y: 0, width: 5, height: 5 };

function createState(reference: Rect, overflow: SideObject): MiddlewareState {
  const referenceElement = document.createElement('button');
  const floatingElement = document.createElement('div');

  return {
    x: 0,
    y: 0,
    initialPlacement: 'bottom',
    placement: 'bottom',
    strategy: 'absolute',
    middlewareData: {},
    elements: {
      reference: referenceElement,
      floating: floatingElement,
    },
    rects: {
      reference,
      floating: floatingRect,
    },
    platform: {
      detectOverflow: vi.fn(async () => overflow),
      getElementRects: vi.fn(async () => ({ reference, floating: floatingRect })),
      getClippingRect: vi.fn(async () => reference),
      getDimensions: vi.fn(async () => ({ width: 5, height: 5 })),
    },
  };
}

describe('hideMiddleware', () => {
  it.each([
    [{ top: 19, right: 9, bottom: 19, left: 9 }, false],
    [{ top: 20, right: 9, bottom: 19, left: 9 }, true],
    [{ top: 19, right: 10, bottom: 19, left: 9 }, true],
    [{ top: 19, right: 9, bottom: 20, left: 9 }, true],
    [{ top: 19, right: 9, bottom: 19, left: 10 }, true],
  ] satisfies Array<[SideObject, boolean]>)(
    'matches Floating UI hide() for reference overflow %#',
    async (overflow, expected) => {
      const state = createState({ x: 1, y: 2, width: 10, height: 20 }, overflow);

      const nativeResult = await nativeHide().fn(state);
      const result = await hide.fn(state);

      expect(result.data?.referenceHidden).toBe(nativeResult.data?.referenceHidden);
      expect(result.data?.referenceHidden).toBe(expected);
      expect(state.platform.detectOverflow).toHaveBeenCalledTimes(2);
      expect(state.platform.detectOverflow).toHaveBeenNthCalledWith(1, state, {
        elementContext: 'reference',
      });
      expect(state.platform.detectOverflow).toHaveBeenNthCalledWith(2, state, {
        elementContext: 'reference',
      });
    },
  );

  it('treats an all-zero reference rect as hidden', async () => {
    const state = createState(
      { x: 0, y: 0, width: 0, height: 0 },
      { top: -1, right: -1, bottom: -1, left: -1 },
    );

    const nativeResult = await nativeHide().fn(state);
    const result = await hide.fn(state);

    expect(nativeResult.data?.referenceHidden).toBe(false);
    expect(result.data?.referenceHidden).toBe(true);
  });
});
