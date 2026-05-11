import { isElement } from '@floating-ui/utils/dom';
import { Timeout } from '@base-ui/utils/useTimeout';
import type { Rect, Side } from './types';
import type { HandleClose, HandleCloseOptions } from './hooks/useHoverShared';
import { contains, getTarget } from './utils/element';
import { getNodeChildren } from './utils/nodes';

/* eslint-disable no-nested-ternary */

const CURSOR_SPEED_THRESHOLD = 0.1;
const CURSOR_SPEED_THRESHOLD_SQUARED = CURSOR_SPEED_THRESHOLD * CURSOR_SPEED_THRESHOLD;
const POLYGON_BUFFER = 0.5;

function hasIntersectingEdge(
  pointX: number,
  pointY: number,
  xi: number,
  yi: number,
  xj: number,
  yj: number,
) {
  return yi >= pointY !== yj >= pointY && pointX <= ((xj - xi) * (pointY - yi)) / (yj - yi) + xi;
}

function isPointInQuadrilateral(
  pointX: number,
  pointY: number,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  x3: number,
  y3: number,
  x4: number,
  y4: number,
) {
  let isInsideValue = false;

  if (hasIntersectingEdge(pointX, pointY, x1, y1, x2, y2)) {
    isInsideValue = !isInsideValue;
  }

  if (hasIntersectingEdge(pointX, pointY, x2, y2, x3, y3)) {
    isInsideValue = !isInsideValue;
  }

  if (hasIntersectingEdge(pointX, pointY, x3, y3, x4, y4)) {
    isInsideValue = !isInsideValue;
  }

  if (hasIntersectingEdge(pointX, pointY, x4, y4, x1, y1)) {
    isInsideValue = !isInsideValue;
  }

  return isInsideValue;
}

function isInsideRect(pointX: number, pointY: number, rect: Rect) {
  return (
    pointX >= rect.x &&
    pointX <= rect.x + rect.width &&
    pointY >= rect.y &&
    pointY <= rect.y + rect.height
  );
}

function isInsideAxisAlignedRect(
  pointX: number,
  pointY: number,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
) {
  const minX = Math.min(x1, x2);
  const maxX = Math.max(x1, x2);
  const minY = Math.min(y1, y2);
  const maxY = Math.max(y1, y2);

  return pointX >= minX && pointX <= maxX && pointY >= minY && pointY <= maxY;
}

export interface SafePolygonOptions extends HandleCloseOptions {}

/**
 * Generates a safe polygon area that the user can traverse without closing the
 * floating element once leaving the reference element.
 * @see https://floating-ui.com/docs/useHover#safepolygon
 */
export function safePolygon(options: SafePolygonOptions = {}) {
  const timeout = new Timeout();

  const fn: HandleClose = ({ x, y, placement, elements, onClose, nodeId, tree }) => {
    const side = placement?.split('-')[0] as Side | undefined;
    let hasLanded = false;
    let lastX: number | null = null;
    let lastY: number | null = null;
    let lastCursorTime = typeof performance !== 'undefined' ? performance.now() : 0;

    function isCursorMovingSlowly(nextX: number, nextY: number) {
      const currentTime = performance.now();
      const elapsedTime = currentTime - lastCursorTime;

      if (lastX === null || lastY === null || elapsedTime === 0) {
        lastX = nextX;
        lastY = nextY;
        lastCursorTime = currentTime;
        return false;
      }

      const deltaX = nextX - lastX;
      const deltaY = nextY - lastY;
      const distanceSquared = deltaX * deltaX + deltaY * deltaY;
      const thresholdSquared = elapsedTime * elapsedTime * CURSOR_SPEED_THRESHOLD_SQUARED;

      lastX = nextX;
      lastY = nextY;
      lastCursorTime = currentTime;

      return distanceSquared < thresholdSquared;
    }

    function close() {
      timeout.clear();
      onClose();
    }

    function hasOpenChildNode() {
      return Boolean(tree && getNodeChildren(tree.nodesRef.current, nodeId).length > 0);
    }

    function closeIfNoOpenChild() {
      if (!hasOpenChildNode()) {
        close();
      }
    }

    return function onMouseMove(event: MouseEvent) {
      timeout.clear();

      const domReference = elements.domReference;
      const floating = elements.floating;
      if (!domReference || !floating || side == null || x == null || y == null) {
        return;
      }

      const { clientX, clientY } = event;
      const target = getTarget(event) as Element | null;
      const isLeave = event.type === 'mouseleave';
      const isOverFloatingEl = contains(floating, target);
      const isOverReferenceEl = contains(domReference, target);

      if (isOverFloatingEl) {
        hasLanded = true;

        if (!isLeave) {
          return;
        }
      }

      if (isOverReferenceEl) {
        hasLanded = false;

        if (!isLeave) {
          hasLanded = true;
          return;
        }
      }

      // Prevent overlapping floating element from being stuck in an open-close
      // loop: https://github.com/floating-ui/floating-ui/issues/1910
      if (isLeave && isElement(event.relatedTarget) && contains(floating, event.relatedTarget)) {
        return;
      }

      // If any nested child is open, abort.
      if (hasOpenChildNode()) {
        return;
      }

      const refRect = domReference.getBoundingClientRect();
      const rect = floating.getBoundingClientRect();
      const cursorLeaveFromRight = x > rect.right - rect.width / 2;
      const cursorLeaveFromBottom = y > rect.bottom - rect.height / 2;
      const isFloatingWider = rect.width > refRect.width;
      const isFloatingTaller = rect.height > refRect.height;
      const left = (isFloatingWider ? refRect : rect).left;
      const right = (isFloatingWider ? refRect : rect).right;
      const top = (isFloatingTaller ? refRect : rect).top;
      const bottom = (isFloatingTaller ? refRect : rect).bottom;

      // If the pointer is leaving from the opposite side, the "buffer" logic
      // creates a point where the floating element remains open, but should be
      // ignored.
      // A constant of 1 handles floating point rounding errors.
      if (
        (side === 'top' && y >= refRect.bottom - 1) ||
        (side === 'bottom' && y <= refRect.top + 1) ||
        (side === 'left' && x >= refRect.right - 1) ||
        (side === 'right' && x <= refRect.left + 1)
      ) {
        closeIfNoOpenChild();
        return;
      }

      // Ignore when the cursor is within the rectangular trough between the
      // two elements. Since the triangle is created from the cursor point,
      // which can start beyond the ref element's edge, traversing back and
      // forth from the ref to the floating element can cause it to close. This
      // ensures it always remains open in that case.
      const isVerticalSide = side === 'top' || side === 'bottom';
      const isInsideTroughRect = isVerticalSide
        ? isInsideAxisAlignedRect(
            clientX,
            clientY,
            left,
            side === 'top' ? refRect.top + 1 : rect.top + 1,
            right,
            side === 'top' ? rect.bottom - 1 : refRect.bottom - 1,
          )
        : isInsideAxisAlignedRect(
            clientX,
            clientY,
            side === 'left' ? rect.right - 1 : refRect.right - 1,
            bottom,
            side === 'left' ? refRect.left + 1 : rect.left + 1,
            top,
          );

      if (isInsideTroughRect) {
        return;
      }

      if (hasLanded && !isInsideRect(clientX, clientY, refRect)) {
        closeIfNoOpenChild();
        return;
      }

      if (!isLeave && isCursorMovingSlowly(clientX, clientY)) {
        closeIfNoOpenChild();
        return;
      }

      const isInsidePolygon = isVerticalSide
        ? (() => {
            const cursorXOffset = isFloatingWider ? POLYGON_BUFFER / 2 : POLYGON_BUFFER * 4;
            const cursorPointOneX = isFloatingWider
              ? x + cursorXOffset
              : cursorLeaveFromRight
                ? x + cursorXOffset
                : x - cursorXOffset;
            const cursorPointTwoX = isFloatingWider
              ? x - cursorXOffset
              : cursorLeaveFromRight
                ? x + cursorXOffset
                : x - cursorXOffset;
            const cursorPointY = side === 'top' ? y + POLYGON_BUFFER + 1 : y - POLYGON_BUFFER;
            const commonY =
              side === 'top' ? rect.bottom - POLYGON_BUFFER : rect.top + POLYGON_BUFFER;
            const oppositeY = side === 'top' ? rect.top : rect.bottom;
            const commonYLeft = cursorLeaveFromRight
              ? commonY
              : isFloatingWider
                ? commonY
                : oppositeY;
            const commonYRight = cursorLeaveFromRight
              ? isFloatingWider
                ? commonY
                : oppositeY
              : commonY;

            return isPointInQuadrilateral(
              clientX,
              clientY,
              cursorPointOneX,
              cursorPointY,
              cursorPointTwoX,
              cursorPointY,
              rect.left,
              commonYLeft,
              rect.right,
              commonYRight,
            );
          })()
        : (() => {
            const cursorYOffset = isFloatingTaller ? POLYGON_BUFFER / 2 : POLYGON_BUFFER * 4;
            const cursorPointOneY = isFloatingTaller
              ? y + cursorYOffset
              : cursorLeaveFromBottom
                ? y + cursorYOffset
                : y - cursorYOffset;
            const cursorPointTwoY = isFloatingTaller
              ? y - cursorYOffset
              : cursorLeaveFromBottom
                ? y + cursorYOffset
                : y - cursorYOffset;
            const cursorPointX = side === 'left' ? x + POLYGON_BUFFER + 1 : x - POLYGON_BUFFER;
            const commonX =
              side === 'left' ? rect.right - POLYGON_BUFFER : rect.left + POLYGON_BUFFER;
            const oppositeX = side === 'left' ? rect.left : rect.right;
            const commonXTop = cursorLeaveFromBottom
              ? commonX
              : isFloatingTaller
                ? commonX
                : oppositeX;
            const commonXBottom = cursorLeaveFromBottom
              ? isFloatingTaller
                ? commonX
                : oppositeX
              : commonX;

            return side === 'left'
              ? isPointInQuadrilateral(
                  clientX,
                  clientY,
                  commonXTop,
                  rect.top,
                  commonXBottom,
                  rect.bottom,
                  cursorPointX,
                  cursorPointOneY,
                  cursorPointX,
                  cursorPointTwoY,
                )
              : isPointInQuadrilateral(
                  clientX,
                  clientY,
                  cursorPointX,
                  cursorPointOneY,
                  cursorPointX,
                  cursorPointTwoY,
                  commonXTop,
                  rect.top,
                  commonXBottom,
                  rect.bottom,
                );
          })();

      if (!isInsidePolygon) {
        closeIfNoOpenChild();
      } else if (!hasLanded) {
        timeout.start(40, closeIfNoOpenChild);
      }

      return;
    };
  };

  // eslint-disable-next-line no-underscore-dangle
  fn.__options = options;

  return fn;
}
