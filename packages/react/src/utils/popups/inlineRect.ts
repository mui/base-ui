import * as React from 'react';
import type { Middleware, VirtualElement } from '@floating-ui/react-dom';

export interface InlineRectCoords {
  /** The x position in viewport coordinates. */
  x: number;
  /** The y position in viewport coordinates. */
  y: number;
  /** The trigger element whose rects produced these coordinates. */
  element: Element;
}

interface RectLike {
  left: number;
  top: number;
  right: number;
  bottom: number;
  width: number;
  height: number;
}

interface ClientRectLike extends RectLike {
  x: number;
  y: number;
}

interface ClientRectsReference {
  getClientRects(): ArrayLike<RectLike>;
}

function getInlineRectCoords(event: React.MouseEvent<Element>): InlineRectCoords | undefined {
  const { currentTarget, clientX, clientY } = event;

  if (currentTarget.getClientRects().length < 2) {
    return undefined;
  }

  return {
    x: clientX,
    y: clientY,
    element: currentTarget,
  };
}

function createRect(left: number, top: number, right: number, bottom: number): ClientRectLike {
  return {
    left,
    top,
    right,
    bottom,
    x: left,
    y: top,
    width: right - left,
    height: bottom - top,
  };
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

function getLineRects(rects: ArrayLike<RectLike>) {
  const lines: RectLike[] = [];
  let previousRect: RectLike | undefined;
  let left = Number.POSITIVE_INFINITY;
  let top = Number.POSITIVE_INFINITY;
  let right = Number.NEGATIVE_INFINITY;
  let bottom = Number.NEGATIVE_INFINITY;

  for (const rect of Array.from(rects).sort((a, b) => a.top - b.top)) {
    left = Math.min(left, rect.left);
    top = Math.min(top, rect.top);
    right = Math.max(right, rect.right);
    bottom = Math.max(bottom, rect.bottom);

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

  return {
    lines,
    fallback: createRect(left, top, right, bottom),
  };
}

function getInlineReferenceRect(
  reference: ClientRectsReference,
  placement: string,
  coords: InlineRectCoords | undefined,
): ClientRectLike | null {
  const { lines, fallback } = getLineRects(reference.getClientRects());

  if (lines.length < 2) {
    return null;
  }

  const x = coords?.x;
  const y = coords?.y;
  const side = placement[0];

  if (lines.length === 2 && lines[0].left > lines[1].right && x != null && y != null) {
    const rect = lines.find(
      (lineRect) =>
        x > lineRect.left - 2 &&
        x < lineRect.right + 2 &&
        y > lineRect.top - 2 &&
        y < lineRect.bottom + 2,
    );

    return rect ? createRect(rect.left, rect.top, rect.right, rect.bottom) : fallback;
  }

  if (side === 't' || side === 'b') {
    const firstRect = lines[0];
    const lastRect = lines[lines.length - 1];
    const targetRect = side === 't' ? firstRect : lastRect;

    return createRect(targetRect.left, firstRect.top, targetRect.right, lastRect.bottom);
  }

  const isLeft = side === 'l';
  let left = lines[0].left;
  let right = lines[0].right;
  let edge = isLeft ? Number.POSITIVE_INFINITY : Number.NEGATIVE_INFINITY;
  let targetFirstRect = lines[0];
  let targetLastRect = lines[0];

  for (const rect of lines) {
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

  return createRect(left, targetFirstRect.top, right, targetLastRect.bottom);
}

function getContextElement(reference: Element | VirtualElement): Element | undefined {
  if ('contextElement' in reference) {
    return reference.contextElement;
  }

  return typeof Element !== 'undefined' && reference instanceof Element ? reference : undefined;
}

export function getInlineRectTriggerProps(
  coordsRef: React.RefObject<InlineRectCoords | undefined>,
  isOpen: boolean,
): Pick<React.HTMLAttributes<Element>, 'onFocus' | 'onMouseEnter' | 'onMouseMove'> {
  function updateCoords(event: React.MouseEvent<Element>) {
    coordsRef.current = getInlineRectCoords(event);
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

export function createInlineMiddleware(
  coordsRef: React.RefObject<InlineRectCoords | undefined>,
): Middleware {
  return {
    name: 'inline',
    async fn(state) {
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

      if (!rect || typeof state.platform.getElementRects !== 'function') {
        return {};
      }

      const resetRects = await state.platform.getElementRects({
        reference: {
          contextElement: getContextElement(reference),
          getBoundingClientRect() {
            return rect;
          },
        },
        floating: state.elements.floating,
        strategy: state.strategy,
      });

      if (
        state.rects.reference.x === resetRects.reference.x &&
        state.rects.reference.y === resetRects.reference.y &&
        state.rects.reference.width === resetRects.reference.width &&
        state.rects.reference.height === resetRects.reference.height
      ) {
        return {};
      }

      return {
        reset: {
          rects: resetRects,
        },
      };
    },
  };
}
