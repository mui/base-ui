import * as React from 'react';
import type { Middleware } from '@floating-ui/react-dom';

export interface InlineRectCoords {
  /** The x position in viewport coordinates. */
  x: number;
  /** The y position in viewport coordinates. */
  y: number;
  /** The trigger element whose rects produced these coordinates. */
  element?: Element | undefined;
}

interface RectLike {
  left: number;
  top: number;
  right: number;
  bottom: number;
  width: number;
  height: number;
}

interface ClientRectsReference {
  getClientRects(): ArrayLike<RectLike>;
}

function copyRect(rect: RectLike): RectLike {
  return {
    left: rect.left,
    top: rect.top,
    right: rect.right,
    bottom: rect.bottom,
    width: rect.width,
    height: rect.height,
  };
}

function toRect(rect: RectLike) {
  return {
    x: rect.left,
    y: rect.top,
    width: rect.width,
    height: rect.height,
  };
}

function getBoundingRect(rects: readonly RectLike[]) {
  let left = Number.POSITIVE_INFINITY;
  let top = Number.POSITIVE_INFINITY;
  let right = Number.NEGATIVE_INFINITY;
  let bottom = Number.NEGATIVE_INFINITY;

  for (const rect of rects) {
    if (rect.left < left) {
      left = rect.left;
    }

    if (rect.top < top) {
      top = rect.top;
    }

    if (rect.right > right) {
      right = rect.right;
    }

    if (rect.bottom > bottom) {
      bottom = rect.bottom;
    }
  }

  return {
    left,
    top,
    right,
    bottom,
    width: right - left,
    height: bottom - top,
  };
}

function getRectsByLine(rects: ArrayLike<RectLike>) {
  const lines: RectLike[] = [];
  let previousRect: RectLike | undefined;

  for (const rect of Array.from(rects).sort((a, b) => a.top - b.top)) {
    if (!previousRect || rect.top - previousRect.top > previousRect.height / 2) {
      lines.push(copyRect(rect));
    } else {
      const line = lines[lines.length - 1];
      line.left = Math.min(line.left, rect.left);
      line.right = Math.max(line.right, rect.right);
      line.bottom = Math.max(line.bottom, rect.bottom);
      line.width = line.right - line.left;
      line.height = line.bottom - line.top;
    }

    previousRect = rect;
  }

  return lines;
}

function getInlineReferenceRect(
  reference: ClientRectsReference,
  placement: string,
  coords: InlineRectCoords | undefined,
) {
  const clientRects = getRectsByLine(reference.getClientRects());

  if (clientRects.length < 2) {
    return null;
  }

  const fallback = getBoundingRect(clientRects);
  const x = coords?.x;
  const y = coords?.y;
  const side = placement[0];

  if (
    clientRects.length === 2 &&
    clientRects[0].left > clientRects[1].right &&
    x != null &&
    y != null
  ) {
    return toRect(
      clientRects.find(
        (rect) =>
          x > rect.left - 2 && x < rect.right + 2 && y > rect.top - 2 && y < rect.bottom + 2,
      ) || fallback,
    );
  }

  if (side === 't' || side === 'b') {
    const firstRect = clientRects[0];
    const lastRect = clientRects[clientRects.length - 1];
    const targetRect = side === 't' ? firstRect : lastRect;

    return toRect({
      left: targetRect.left,
      top: firstRect.top,
      right: targetRect.right,
      bottom: lastRect.bottom,
      width: targetRect.width,
      height: lastRect.bottom - firstRect.top,
    });
  }

  const firstRect = clientRects[0];
  const isLeft = side === 'l';
  let edge = isLeft ? Number.POSITIVE_INFINITY : Number.NEGATIVE_INFINITY;
  let left = firstRect.left;
  let right = firstRect.right;
  let targetFirstRect = firstRect;
  let targetLastRect = firstRect;

  for (const rect of clientRects) {
    left = Math.min(left, rect.left);
    right = Math.max(right, rect.right);

    const nextEdge = isLeft ? rect.left : rect.right;

    if ((isLeft && nextEdge < edge) || (!isLeft && nextEdge > edge)) {
      edge = nextEdge;
      targetFirstRect = rect;
      targetLastRect = rect;
    } else if (nextEdge === edge) {
      targetLastRect = rect;
    }
  }

  return toRect({
    left,
    top: targetFirstRect.top,
    right,
    bottom: targetLastRect.bottom,
    width: right - left,
    height: targetLastRect.bottom - targetFirstRect.top,
  });
}

/**
 * Gets the inline rect hover coords from a mouse event.
 * Returns undefined if the element has less than 2 client rects (i.e., it's not wrapped).
 */
export function getInlineRectHoverCoords(
  event: React.MouseEvent<Element>,
): InlineRectCoords | undefined {
  if (event.currentTarget.getClientRects().length < 2) {
    return undefined;
  }

  return {
    x: event.clientX,
    y: event.clientY,
  };
}

export function getInlineRectTriggerProps(
  coordsRef: React.RefObject<InlineRectCoords | undefined>,
  isOpen: boolean,
): Pick<React.HTMLAttributes<Element>, 'onFocus' | 'onMouseEnter' | 'onMouseMove'> {
  function updateCoords(event: React.MouseEvent<Element>) {
    const coords = getInlineRectHoverCoords(event);
    coordsRef.current = coords ? { ...coords, element: event.currentTarget } : undefined;
  }

  return {
    onFocus() {
      coordsRef.current = undefined;
    },
    onMouseEnter(event: React.MouseEvent<Element>) {
      updateCoords(event);
    },
    onMouseMove(event: React.MouseEvent<Element>) {
      if (isOpen) {
        return;
      }

      updateCoords(event);
    },
  };
}

/**
 * Creates an inline middleware that positions the floating element relative to the
 * hovered rect of a wrapped inline element (e.g., a multi-line link).
 */
export function createInlineMiddleware(
  coordsRef: React.RefObject<InlineRectCoords | undefined>,
): Middleware {
  return {
    name: 'inline',
    fn(state) {
      const reference = state.elements.reference;

      if (
        typeof (reference as Partial<ClientRectsReference> | null)?.getClientRects !== 'function'
      ) {
        return {};
      }

      const coords = coordsRef.current;
      const rect = getInlineReferenceRect(
        reference as ClientRectsReference,
        state.placement,
        coords?.element === reference ? coords : undefined,
      );

      if (
        !rect ||
        (state.rects.reference.x === rect.x &&
          state.rects.reference.y === rect.y &&
          state.rects.reference.width === rect.width &&
          state.rects.reference.height === rect.height)
      ) {
        return {};
      }

      return {
        reset: {
          rects: {
            reference: rect,
            floating: state.rects.floating,
          },
        },
      };
    },
  };
}
