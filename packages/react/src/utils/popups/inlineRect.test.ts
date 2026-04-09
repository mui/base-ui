import type * as React from 'react';
import { describe, expect, it, vi } from 'vitest';
import type { InlineRectCoords } from './inlineRect';
import { createInlineMiddleware, getInlineRectTriggerProps } from './inlineRect';

type RectLike = {
  left: number;
  top: number;
  right: number;
  bottom: number;
  width: number;
  height: number;
};

function createTrigger(rects: RectLike[]) {
  const trigger = document.createElement('span');
  Object.defineProperty(trigger, 'getClientRects', {
    value: () => rects,
  });
  return trigger;
}

function createMouseEvent(
  trigger: Element,
  clientX: number,
  clientY: number,
): React.MouseEvent<Element> {
  return {
    currentTarget: trigger,
    clientX,
    clientY,
  } as unknown as React.MouseEvent<Element>;
}

function createMiddlewareState(
  trigger: Element,
  placement: string,
  referenceRect: { x: number; y: number; width: number; height: number },
  options?: {
    getElementRects?: (rect: RectLike & { x: number; y: number }) => {
      x: number;
      y: number;
      width: number;
      height: number;
    };
  },
) {
  const floatingRect = { x: 0, y: 0, width: 20, height: 10 };

  return {
    placement,
    strategy: 'absolute',
    elements: { reference: trigger, floating: document.createElement('div') },
    rects: {
      reference: referenceRect,
      floating: floatingRect,
    },
    platform: {
      getElementRects: async ({
        reference,
      }: {
        reference: { getBoundingClientRect(): RectLike & { x: number; y: number } };
      }) => {
        const rect = reference.getBoundingClientRect();
        return {
          reference: options?.getElementRects
            ? options.getElementRects(rect)
            : { x: rect.x, y: rect.y, width: rect.width, height: rect.height },
          floating: floatingRect,
        };
      },
    },
  };
}

describe('inlineRect', () => {
  it('clears stored coords on focus', () => {
    const trigger = document.createElement('span');
    const coordsRef: React.MutableRefObject<InlineRectCoords | undefined> = {
      current: { x: 2, y: 3, element: trigger },
    };

    getInlineRectTriggerProps(coordsRef, false).onFocus?.({} as React.FocusEvent<Element>);

    expect(coordsRef.current).toBeUndefined();
  });

  it('stores undefined when the trigger does not wrap', () => {
    const trigger = createTrigger([
      { left: 0, top: 0, right: 10, bottom: 10, width: 10, height: 10 },
    ]);
    const coordsRef: React.MutableRefObject<InlineRectCoords | undefined> = {
      current: { x: 1, y: 1, element: trigger },
    };

    getInlineRectTriggerProps(coordsRef, false).onMouseMove?.(createMouseEvent(trigger, 5, 5));

    expect(coordsRef.current).toBeUndefined();
  });

  it('updates stored coords on mouse move while closed', () => {
    const trigger = createTrigger([
      { left: 0, top: 0, right: 10, bottom: 10, width: 10, height: 10 },
      { left: 0, top: 20, right: 10, bottom: 30, width: 10, height: 10 },
    ]);
    const coordsRef: React.MutableRefObject<InlineRectCoords | undefined> = { current: undefined };

    getInlineRectTriggerProps(coordsRef, false).onMouseMove?.(createMouseEvent(trigger, 5, 25));

    expect(coordsRef.current).toEqual({ x: 5, y: 25, element: trigger });
  });

  it('does not update stored coords on mouse move while open', () => {
    const trigger = createTrigger([
      { left: 0, top: 0, right: 10, bottom: 10, width: 10, height: 10 },
      { left: 0, top: 20, right: 10, bottom: 30, width: 10, height: 10 },
    ]);
    const coordsRef: React.MutableRefObject<InlineRectCoords | undefined> = {
      current: { x: 1, y: 1, element: trigger },
    };

    getInlineRectTriggerProps(coordsRef, true).onMouseMove?.(createMouseEvent(trigger, 5, 25));

    expect(coordsRef.current).toEqual({ x: 1, y: 1, element: trigger });
  });

  it('creates inline middleware rects from the hovered line', async () => {
    const rects: RectLike[] = [
      { left: 0, top: 0, right: 10, bottom: 10, width: 10, height: 10 },
      { left: 0, top: 20, right: 10, bottom: 30, width: 10, height: 10 },
    ];
    const trigger = createTrigger(rects);
    const middleware = createInlineMiddleware({
      current: { x: 2, y: 23, element: trigger },
    });

    expect(
      await middleware.fn?.(
        createMiddlewareState(trigger, 'bottom', { x: 0, y: 0, width: 10, height: 10 }) as never,
      ),
    ).toEqual({
      reset: {
        rects: {
          reference: {
            x: rects[1].left,
            y: rects[0].top,
            width: rects[1].width,
            height: rects[1].bottom - rects[0].top,
          },
          floating: { x: 0, y: 0, width: 20, height: 10 },
        },
      },
    });
  });

  it('uses the edge-aligned rect for right placements', async () => {
    const rects: RectLike[] = [
      { left: 0, top: 0, right: 40, bottom: 10, width: 40, height: 10 },
      { left: 0, top: 20, right: 60, bottom: 30, width: 60, height: 10 },
      { left: 20, top: 40, right: 60, bottom: 50, width: 40, height: 10 },
    ];
    const trigger = createTrigger(rects);
    const middleware = createInlineMiddleware({ current: undefined });

    expect(
      await middleware.fn?.(
        createMiddlewareState(trigger, 'right', { x: 0, y: 0, width: 60, height: 50 }) as never,
      ),
    ).toEqual({
      reset: {
        rects: {
          reference: {
            x: rects[0].left,
            y: rects[1].top,
            width: rects[1].right - rects[0].left,
            height: rects[2].bottom - rects[1].top,
          },
          floating: { x: 0, y: 0, width: 20, height: 10 },
        },
      },
    });
  });

  it('ignores stored coords from a different element', async () => {
    const previousTrigger = createTrigger([
      { left: 80, top: 0, right: 120, bottom: 10, width: 40, height: 10 },
      { left: 0, top: 20, right: 60, bottom: 30, width: 60, height: 10 },
    ]);
    const rects: RectLike[] = [
      { left: 80, top: 100, right: 120, bottom: 110, width: 40, height: 10 },
      { left: 0, top: 120, right: 60, bottom: 130, width: 60, height: 10 },
    ];
    const trigger = createTrigger(rects);
    const middleware = createInlineMiddleware({
      current: { x: 100, y: 5, element: previousTrigger },
    });

    expect(
      await middleware.fn?.(
        createMiddlewareState(trigger, 'bottom', { x: 0, y: 100, width: 120, height: 30 }) as never,
      ),
    ).toEqual({
      reset: {
        rects: {
          reference: {
            x: rects[1].left,
            y: rects[0].top,
            width: rects[1].width,
            height: rects[1].bottom - rects[0].top,
          },
          floating: { x: 0, y: 0, width: 20, height: 10 },
        },
      },
    });
  });

  it('converts client-space inline rects through the positioning platform', async () => {
    const rects: RectLike[] = [
      { left: 140, top: 300, right: 180, bottom: 310, width: 40, height: 10 },
      { left: 100, top: 320, right: 180, bottom: 330, width: 80, height: 10 },
    ];
    const trigger = createTrigger(rects);
    const getElementRects = vi.fn((rect: RectLike & { x: number; y: number }) => ({
      x: rect.x,
      y: rect.y + 500,
      width: rect.width,
      height: rect.height,
    }));
    const middleware = createInlineMiddleware({ current: undefined });

    expect(
      await middleware.fn?.(
        createMiddlewareState(
          trigger,
          'top',
          { x: 100, y: 800, width: 80, height: 30 },
          { getElementRects },
        ) as never,
      ),
    ).toEqual({
      reset: {
        rects: {
          reference: {
            x: rects[0].left,
            y: rects[0].top + 500,
            width: rects[0].width,
            height: rects[1].bottom - rects[0].top,
          },
          floating: { x: 0, y: 0, width: 20, height: 10 },
        },
      },
    });

    expect(getElementRects).toHaveBeenCalledOnce();
  });
});
