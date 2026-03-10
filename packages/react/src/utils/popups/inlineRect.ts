import * as React from 'react';
import type { Middleware } from '@floating-ui/react-dom';

export interface InlineRectCoords {
  /** The index of the rect in the list of client rects. */
  rectIndex: number;
  /** The x position relative to the rect. */
  x: number;
  /** The y position relative to the rect. */
  y: number;
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

function hasGetClientRects(value: unknown): value is ClientRectsReference {
  return (
    typeof value === 'object' &&
    value !== null &&
    'getClientRects' in value &&
    typeof value.getClientRects === 'function'
  );
}

function toClientRect(rect: RectLike) {
  return {
    ...rect,
    x: rect.left,
    y: rect.top,
  };
}

function getBoundingRect(rects: readonly RectLike[]) {
  const left = Math.min(...rects.map((rect) => rect.left));
  const top = Math.min(...rects.map((rect) => rect.top));
  const right = Math.max(...rects.map((rect) => rect.right));
  const bottom = Math.max(...rects.map((rect) => rect.bottom));

  return toClientRect({
    left,
    top,
    right,
    bottom,
    width: right - left,
    height: bottom - top,
  });
}

function getRectsByLine(rects: readonly RectLike[]) {
  const sortedRects = rects.slice().sort((a, b) => a.top - b.top);
  const groups: RectLike[][] = [];
  let previousRect: RectLike | null = null;

  for (const rect of sortedRects) {
    if (!previousRect || rect.top - previousRect.top > previousRect.height / 2) {
      groups.push([rect]);
    } else {
      groups[groups.length - 1].push(rect);
    }

    previousRect = rect;
  }

  return groups.map((group) => getBoundingRect(group));
}

function getInlineReferenceRect(
  reference: ClientRectsReference,
  placement: string,
  coords: InlineRectCoords | undefined,
) {
  const nativeRects = Array.from(reference.getClientRects());

  if (nativeRects.length < 2) {
    return null;
  }

  const clientRects = getRectsByLine(nativeRects);

  if (clientRects.length < 2) {
    return null;
  }

  const fallback = getBoundingRect(nativeRects);
  const hoveredRect = coords ? nativeRects[coords.rectIndex] : undefined;
  const x = hoveredRect && coords ? hoveredRect.left + coords.x : undefined;
  const y = hoveredRect && coords ? hoveredRect.top + coords.y : undefined;
  const side = placement.split('-')[0];

  if (
    clientRects.length === 2 &&
    clientRects[0].left > clientRects[1].right &&
    x != null &&
    y != null
  ) {
    return (
      clientRects.find(
        (rect) =>
          x > rect.left - 2 &&
          x < rect.right + 2 &&
          y > rect.top - 2 &&
          y < rect.bottom + 2,
      ) || fallback
    );
  }

  if (side === 'top' || side === 'bottom') {
    const firstRect = clientRects[0];
    const lastRect = clientRects[clientRects.length - 1];
    const targetRect = side === 'top' ? firstRect : lastRect;

    return toClientRect({
      left: targetRect.left,
      top: firstRect.top,
      right: targetRect.right,
      bottom: lastRect.bottom,
      width: targetRect.width,
      height: lastRect.bottom - firstRect.top,
    });
  }

  const boundary = side === 'left' ? Math.min : Math.max;
  const edge = boundary(...clientRects.map((rect) => (side === 'left' ? rect.left : rect.right)));
  const targetRects = clientRects.filter((rect) =>
    side === 'left' ? rect.left === edge : rect.right === edge,
  );
  const left = Math.min(...clientRects.map((rect) => rect.left));
  const right = Math.max(...clientRects.map((rect) => rect.right));

  return toClientRect({
    left,
    top: targetRects[0].top,
    right,
    bottom: targetRects[targetRects.length - 1].bottom,
    width: right - left,
    height: targetRects[targetRects.length - 1].bottom - targetRects[0].top,
  });
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

export function getInlineRectTriggerProps(
  coordsRef: React.MutableRefObject<InlineRectCoords | undefined>,
  isOpen: boolean,
): Pick<React.HTMLAttributes<Element>, 'onFocus' | 'onMouseMove'> {
  return {
    onFocus() {
      coordsRef.current = undefined;
    },
    onMouseMove(event: React.MouseEvent<Element>) {
      if (isOpen) {
        return;
      }

      coordsRef.current = getInlineRectHoverCoords(event);
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

      if (!hasGetClientRects(reference)) {
        return {};
      }

      const rect = getInlineReferenceRect(reference, state.placement, coordsRef.current);

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
            reference: {
              x: rect.x,
              y: rect.y,
              width: rect.width,
              height: rect.height,
            },
            floating: state.rects.floating,
          },
        },
      };
    },
  };
}
