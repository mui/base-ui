import type * as React from 'react';
import { describe, expect, it } from 'vitest';
import type { InlineRectCoords } from './inlineRect';
import {
  createInlineMiddleware,
  getInlineRectHoverCoords,
  getInlineRectTriggerProps,
} from './inlineRect';

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

describe('inlineRect', () => {
  it('returns undefined when there is only one rect', () => {
    const rects: RectLike[] = [{ left: 0, top: 0, right: 10, bottom: 10, width: 10, height: 10 }];
    const trigger = createTrigger(rects);
    const event = createMouseEvent(trigger, 5, 5);

    expect(getInlineRectHoverCoords(event)).toBeUndefined();
  });

  it('returns the closest rect coordinates for multi-line elements', () => {
    const rects: RectLike[] = [
      { left: 0, top: 0, right: 10, bottom: 10, width: 10, height: 10 },
      { left: 0, top: 20, right: 10, bottom: 30, width: 10, height: 10 },
    ];
    const trigger = createTrigger(rects);
    const event = createMouseEvent(trigger, 5, 25);

    expect(getInlineRectHoverCoords(event)).toEqual({
      rectIndex: 1,
      x: 5,
      y: 5,
    });
  });

  it('clears stored coords on focus', () => {
    const coordsRef: React.MutableRefObject<InlineRectCoords | undefined> = {
      current: { rectIndex: 1, x: 2, y: 3 },
    };

    getInlineRectTriggerProps(coordsRef, false).onFocus?.({} as React.FocusEvent<Element>);

    expect(coordsRef.current).toBeUndefined();
  });

  it('updates stored coords on mouse move while closed', () => {
    const rects: RectLike[] = [
      { left: 0, top: 0, right: 10, bottom: 10, width: 10, height: 10 },
      { left: 0, top: 20, right: 10, bottom: 30, width: 10, height: 10 },
    ];
    const trigger = createTrigger(rects);
    const coordsRef: React.MutableRefObject<InlineRectCoords | undefined> = { current: undefined };
    const event = createMouseEvent(trigger, 5, 25);

    getInlineRectTriggerProps(coordsRef, false).onMouseMove?.(event);

    expect(coordsRef.current).toEqual({
      rectIndex: 1,
      x: 5,
      y: 5,
    });
  });

  it('does not update stored coords on mouse move while open', () => {
    const rects: RectLike[] = [
      { left: 0, top: 0, right: 10, bottom: 10, width: 10, height: 10 },
      { left: 0, top: 20, right: 10, bottom: 30, width: 10, height: 10 },
    ];
    const trigger = createTrigger(rects);
    const coordsRef: React.MutableRefObject<InlineRectCoords | undefined> = {
      current: { rectIndex: 0, x: 1, y: 1 },
    };
    const event = createMouseEvent(trigger, 5, 25);

    getInlineRectTriggerProps(coordsRef, true).onMouseMove?.(event);

    expect(coordsRef.current).toEqual({
      rectIndex: 0,
      x: 1,
      y: 1,
    });
  });

  it('creates inline middleware options that offset based on stored coords', () => {
    const rects: RectLike[] = [
      { left: 0, top: 0, right: 10, bottom: 10, width: 10, height: 10 },
      { left: 0, top: 20, right: 10, bottom: 30, width: 10, height: 10 },
    ];
    const trigger = createTrigger(rects);
    const coordsRef: React.RefObject<InlineRectCoords | undefined> = {
      current: { rectIndex: 1, x: 2, y: 3 },
    };

    const middleware = createInlineMiddleware(coordsRef);
    const [options] = middleware.options as [
      (state: { elements: { reference: Element } }) => { x?: number; y?: number },
    ];

    expect(typeof options).toBe('function');
    expect(options({ elements: { reference: trigger } })).toEqual({
      x: rects[1].left + 2,
      y: rects[1].top + 3,
    });
  });

  it('returns an empty object when coords are missing', () => {
    const rects: RectLike[] = [{ left: 0, top: 0, right: 10, bottom: 10, width: 10, height: 10 }];
    const trigger = createTrigger(rects);
    const coordsRef: React.RefObject<InlineRectCoords | undefined> = { current: undefined };

    const middleware = createInlineMiddleware(coordsRef);
    const [options] = middleware.options as [
      (state: { elements: { reference: Element } }) => { x?: number; y?: number },
    ];

    expect(typeof options).toBe('function');
    expect(options({ elements: { reference: trigger } })).toEqual({});
  });

  it('returns an empty object when the rect index is out of range', () => {
    const rects: RectLike[] = [{ left: 0, top: 0, right: 10, bottom: 10, width: 10, height: 10 }];
    const trigger = createTrigger(rects);
    const coordsRef: React.RefObject<InlineRectCoords | undefined> = {
      current: { rectIndex: 2, x: 1, y: 1 },
    };

    const middleware = createInlineMiddleware(coordsRef);
    const [options] = middleware.options as [
      (state: { elements: { reference: Element } }) => { x?: number; y?: number },
    ];

    expect(typeof options).toBe('function');
    expect(options({ elements: { reference: trigger } })).toEqual({});
  });
});
