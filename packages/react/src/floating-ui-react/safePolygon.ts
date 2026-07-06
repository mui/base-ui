import { isElement } from '@floating-ui/utils/dom';
import { Timeout } from '@base-ui/utils/useTimeout';
import type { ClientRectObject, Rect, Side } from './types';
import type { HandleClose, HandleCloseOptions } from './hooks/useHoverShared';
import { contains, getTarget } from './utils/element';
import { getNodeChildren } from './utils/nodes';

const CURSOR_SPEED_THRESHOLD = 0.1;
const CURSOR_SPEED_THRESHOLD_SQUARED = CURSOR_SPEED_THRESHOLD * CURSOR_SPEED_THRESHOLD;
const POLYGON_BUFFER = 0.5;

// Cursor classifications returned by `classifySafePolygonCursor`.
const CURSOR_OPPOSITE_SIDE = 0;
const CURSOR_IN_TROUGH = 1;
const CURSOR_INSIDE_POLYGON = 2;
const CURSOR_OUTSIDE_POLYGON = 3;

/**
 * Determines if a point is inside a polygon using the even-odd ray casting
 * algorithm. `points` is a flat list of vertex coordinates.
 */
function isPointInPolygon(pointX: number, pointY: number, points: number[]) {
  let isInsideValue = false;

  for (let i = 0, j = points.length - 2; i < points.length; j = i, i += 2) {
    const startX = points[j];
    const startY = points[j + 1];
    const endX = points[i];
    const endY = points[i + 1];

    if (
      startY >= pointY !== endY >= pointY &&
      pointX <= ((endX - startX) * (pointY - startY)) / (endY - startY) + startX
    ) {
      isInsideValue = !isInsideValue;
    }
  }

  return isInsideValue;
}

function isInsideBand(value: number, edgeA: number, edgeB: number) {
  return value >= Math.min(edgeA, edgeB) && value <= Math.max(edgeA, edgeB);
}

function isInsideRect(pointX: number, pointY: number, rect: Rect) {
  return (
    isInsideBand(pointX, rect.x, rect.x + rect.width) &&
    isInsideBand(pointY, rect.y, rect.y + rect.height)
  );
}

/**
 * Classifies where the cursor sits relative to the safe polygon geometry for
 * the given side. All four sides share one axis-parameterized computation: the
 * main axis runs along the shared edge of the two elements, and the cross axis
 * runs across the gap between them.
 */
function classifySafePolygonCursor(
  side: Side,
  x: number,
  y: number,
  clientX: number,
  clientY: number,
  refRect: ClientRectObject,
  rect: ClientRectObject,
): number {
  const isXAxis = side === 'top' || side === 'bottom';
  // Whether the floating element sits on the negative (top/left) side of the
  // reference on the cross axis.
  const isBeforeRef = side === 'top' || side === 'left';

  const cursorMain = isXAxis ? x : y;
  const cursorCross = isXAxis ? y : x;
  const clientMain = isXAxis ? clientX : clientY;
  const clientCross = isXAxis ? clientY : clientX;

  const rectMainStart = isXAxis ? rect.left : rect.top;
  const rectMainEnd = isXAxis ? rect.right : rect.bottom;
  const rectMainSize = isXAxis ? rect.width : rect.height;
  const rectCrossStart = isXAxis ? rect.top : rect.left;
  const rectCrossEnd = isXAxis ? rect.bottom : rect.right;
  const refCrossStart = isXAxis ? refRect.top : refRect.left;
  const refCrossEnd = isXAxis ? refRect.bottom : refRect.right;
  // Cross-axis edges facing the gap between the two elements.
  const rectCrossNear = isBeforeRef ? rectCrossEnd : rectCrossStart;
  const rectCrossFar = isBeforeRef ? rectCrossStart : rectCrossEnd;
  const refCrossNear = isBeforeRef ? refCrossStart : refCrossEnd;
  const refCrossFar = isBeforeRef ? refCrossEnd : refCrossStart;

  // If the pointer is leaving from the opposite side, the "buffer" logic
  // creates a point where the floating element remains open, but should be
  // ignored.
  // A constant of 1 handles floating point rounding errors.
  if (isBeforeRef ? cursorCross >= refCrossFar - 1 : cursorCross <= refCrossFar + 1) {
    return CURSOR_OPPOSITE_SIDE;
  }

  const isFloatingLarger = rectMainSize > (isXAxis ? refRect.width : refRect.height);
  // Main-axis extent of the narrower of the two elements.
  const boundingRect = isFloatingLarger ? refRect : rect;
  const bandMainStart = isXAxis ? boundingRect.left : boundingRect.top;
  const bandMainEnd = isXAxis ? boundingRect.right : boundingRect.bottom;

  // Ignore when the cursor is within the rectangular trough between the
  // two elements. Since the triangle is created from the cursor point,
  // which can start beyond the ref element's edge, traversing back and
  // forth from the ref to the floating element can cause it to close. This
  // ensures it always remains open in that case.
  if (
    isInsideBand(clientMain, bandMainStart, bandMainEnd) &&
    isInsideBand(
      clientCross,
      isBeforeRef ? refCrossNear + 1 : refCrossNear - 1,
      isBeforeRef ? rectCrossNear - 1 : rectCrossNear + 1,
    )
  ) {
    return CURSOR_IN_TROUGH;
  }

  const cursorLeaveFromMainEnd = cursorMain > rectMainEnd - rectMainSize / 2;
  const cursorOffset = isFloatingLarger ? POLYGON_BUFFER / 2 : POLYGON_BUFFER * 4;
  const sharedOffset = cursorLeaveFromMainEnd ? cursorOffset : -cursorOffset;
  const cursorPointMain1 = cursorMain + (isFloatingLarger ? cursorOffset : sharedOffset);
  const cursorPointMain2 = cursorMain + (isFloatingLarger ? -cursorOffset : sharedOffset);
  const cursorPointCross = isBeforeRef
    ? cursorCross + POLYGON_BUFFER + 1
    : cursorCross - POLYGON_BUFFER;

  // Cross-axis positions of the polygon corners on the floating element.
  const nearCorner = isBeforeRef ? rectCrossNear - POLYGON_BUFFER : rectCrossNear + POLYGON_BUFFER;
  const swingCorner = isFloatingLarger ? nearCorner : rectCrossFar;
  const cornerCrossMainStart = cursorLeaveFromMainEnd ? nearCorner : swingCorner;
  const cornerCrossMainEnd = cursorLeaveFromMainEnd ? swingCorner : nearCorner;

  const isInsidePolygon = isPointInPolygon(
    clientX,
    clientY,
    isXAxis
      ? [
          cursorPointMain1,
          cursorPointCross,
          cursorPointMain2,
          cursorPointCross,
          rectMainStart,
          cornerCrossMainStart,
          rectMainEnd,
          cornerCrossMainEnd,
        ]
      : [
          cursorPointCross,
          cursorPointMain1,
          cursorPointCross,
          cursorPointMain2,
          cornerCrossMainStart,
          rectMainStart,
          cornerCrossMainEnd,
          rectMainEnd,
        ],
  );

  return isInsidePolygon ? CURSOR_INSIDE_POLYGON : CURSOR_OUTSIDE_POLYGON;
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
    let lastCursorTime = performance.now();

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

    return function onMouseMove(event: MouseEvent) {
      timeout.clear();

      const domReference = elements.domReference;
      const floating = elements.floating;
      if (!domReference || !floating || side == null || x == null || y == null) {
        return undefined;
      }

      const { clientX, clientY } = event;
      const target = getTarget(event) as Element | null;
      const isLeave = event.type === 'mouseleave';
      const isOverFloatingEl = contains(floating, target);
      const isOverReferenceEl = contains(domReference, target);

      if (isOverFloatingEl) {
        hasLanded = true;

        if (!isLeave) {
          return undefined;
        }
      }

      if (isOverReferenceEl) {
        hasLanded = false;

        if (!isLeave) {
          hasLanded = true;
          return undefined;
        }
      }

      // Prevent overlapping floating element from being stuck in an open-close
      // loop: https://github.com/floating-ui/floating-ui/issues/1910
      if (isLeave && isElement(event.relatedTarget) && contains(floating, event.relatedTarget)) {
        return undefined;
      }

      function hasOpenChildNode() {
        return Boolean(tree && getNodeChildren(tree.nodesRef.current, nodeId).length > 0);
      }

      function closeIfNoOpenChild() {
        if (!hasOpenChildNode()) {
          close();
        }
      }

      // If any nested child is open, abort.
      if (hasOpenChildNode()) {
        return undefined;
      }

      const refRect = domReference.getBoundingClientRect();
      const status = classifySafePolygonCursor(
        side,
        x,
        y,
        clientX,
        clientY,
        refRect,
        floating.getBoundingClientRect(),
      );

      if (status === CURSOR_OPPOSITE_SIDE) {
        closeIfNoOpenChild();
        return undefined;
      }

      if (status === CURSOR_IN_TROUGH) {
        return undefined;
      }

      if (hasLanded && !isInsideRect(clientX, clientY, refRect)) {
        closeIfNoOpenChild();
        return undefined;
      }

      if (!isLeave && isCursorMovingSlowly(clientX, clientY)) {
        closeIfNoOpenChild();
        return undefined;
      }

      if (status === CURSOR_OUTSIDE_POLYGON) {
        closeIfNoOpenChild();
      } else if (!hasLanded) {
        timeout.start(40, closeIfNoOpenChild);
      }

      return undefined;
    };
  };

  // eslint-disable-next-line no-underscore-dangle
  fn.__options = options;

  return fn;
}
