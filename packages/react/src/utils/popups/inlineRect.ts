import * as React from 'react';
import { inline } from '@floating-ui/react-dom';
import { isHTMLElement } from '@floating-ui/utils/dom';
import type { Middleware } from '@floating-ui/react-dom';

export interface InlineRectCoords {
  /** The index of the rect in the list of client rects. */
  rectIndex: number;
  /** The x position relative to the rect. */
  x: number;
  /** The y position relative to the rect. */
  y: number;
}

/**
 * Gets the inline rect hover coords from a mouse event.
 * Returns undefined if the element has less than 2 client rects (i.e., it's not wrapped).
 */
export function getInlineRectHoverCoords(
  event: React.MouseEvent<Element>,
): InlineRectCoords | undefined {
  const rects = Array.from(event.currentTarget.getClientRects());

  if (rects.length < 2) {
    return undefined;
  }

  const hovered = rects.reduce(
    (best, rect, i) => {
      const d = Math.hypot(
        event.clientX - (rect.left + rect.width / 2),
        event.clientY - (rect.top + rect.height / 2),
      );
      return d < best.d ? { i, rect, d } : best;
    },
    { i: 0, rect: rects[0], d: Number.POSITIVE_INFINITY },
  );

  return {
    rectIndex: hovered.i,
    x: event.clientX - hovered.rect.left,
    y: event.clientY - hovered.rect.top,
  };
}

/**
 * Creates an inline middleware that positions the floating element relative to the
 * hovered rect of a wrapped inline element (e.g., a multi-line link).
 */
export function createInlineMiddleware(
  coordsRef: React.RefObject<InlineRectCoords | undefined>,
): Middleware {
  return inline((state) => {
    const trigger = state.elements.reference;
    if (!isHTMLElement(trigger) || !coordsRef.current) {
      return {};
    }

    const rects = Array.from(trigger.getClientRects());
    const rect = rects[coordsRef.current.rectIndex];

    if (!rect) {
      return {};
    }

    return {
      x: rect.left + coordsRef.current.x,
      y: rect.top + coordsRef.current.y,
    };
  });
}
