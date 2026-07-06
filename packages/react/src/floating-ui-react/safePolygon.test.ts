import { vi, expect } from 'vitest';
import { act } from '@mui/internal-test-utils';
import { FloatingTreeStore } from './components/FloatingTreeStore';
import type { HandleCloseContext } from './hooks/useHoverShared';
import type { ClientRectObject, FloatingContext, Side } from './types';
import {
  classifySafePolygonCursor,
  safePolygon,
  CURSOR_OPPOSITE_SIDE,
  CURSOR_IN_TROUGH,
  CURSOR_INSIDE_POLYGON,
  CURSOR_OUTSIDE_POLYGON,
} from './safePolygon';
import { getEmptyRootContext } from './utils/getEmptyRootContext';

function createRect(left: number, top: number, width: number, height: number) {
  return {
    x: left,
    y: top,
    left,
    top,
    width,
    height,
    right: left + width,
    bottom: top + height,
    toJSON() {
      return this;
    },
  } satisfies DOMRect;
}

function createMouseMoveEvent(
  clientX: number,
  clientY: number,
  target: EventTarget | null = null,
): MouseEvent {
  return {
    type: 'mousemove',
    clientX,
    clientY,
    relatedTarget: null,
    composedPath: () => [target],
  } as unknown as MouseEvent;
}

function createHandleCloseContext({
  domReference,
  floating,
  onClose,
  tree,
  placement = 'right',
  x = 2,
  y = 0,
}: {
  domReference: Element;
  floating: HTMLElement;
  onClose: () => void;
  tree: FloatingTreeStore;
  placement?: 'top' | 'bottom' | 'left' | 'right';
  x?: number;
  y?: number;
}): HandleCloseContext {
  return {
    x,
    y,
    placement,
    elements: { domReference, floating },
    nodeId: 'root',
    onClose,
    tree,
  };
}

function createFloatingContext({
  domReference,
  floating,
  open,
}: {
  domReference: Element;
  floating: HTMLElement;
  open: boolean;
}): FloatingContext {
  const refs: FloatingContext['refs'] = {
    reference: { current: domReference },
    floating: { current: floating },
    domReference: { current: domReference },
    setReference() {},
    setFloating() {},
    setPositionReference() {},
  };

  const events: FloatingContext['events'] = {
    emit() {},
    on() {},
    off() {},
  };

  return {
    x: 0,
    y: 0,
    strategy: 'absolute',
    placement: 'right',
    middlewareData: {},
    isPositioned: true,
    update: async () => {},
    floatingStyles: {},
    open,
    onOpenChange() {},
    events,
    dataRef: { current: {} },
    nodeId: 'root',
    floatingId: 'floating-id',
    refs,
    elements: { reference: domReference, domReference, floating },
    rootStore: getEmptyRootContext(),
  };
}

function createPlacementScenario(placement: 'top' | 'bottom' | 'left' | 'right') {
  const referenceRect = createRect(0, 0, 100, 100);

  switch (placement) {
    case 'top':
      return {
        referenceRect,
        floatingRect: createRect(0, -120, 100, 100),
        leavePoint: [50, 0] as const,
        troughPoint: [50, -10] as const,
        outsidePoint: [50, 150] as const,
      };
    case 'bottom':
      return {
        referenceRect,
        floatingRect: createRect(0, 120, 100, 100),
        leavePoint: [50, 100] as const,
        troughPoint: [50, 110] as const,
        outsidePoint: [50, -50] as const,
      };
    case 'left':
      return {
        referenceRect,
        floatingRect: createRect(-120, 0, 100, 100),
        leavePoint: [0, 50] as const,
        troughPoint: [-10, 50] as const,
        outsidePoint: [150, 50] as const,
      };
    case 'right':
      return {
        referenceRect,
        floatingRect: createRect(120, 0, 100, 100),
        leavePoint: [100, 50] as const,
        troughPoint: [110, 50] as const,
        outsidePoint: [-50, 50] as const,
      };
    default:
      return {
        referenceRect,
        floatingRect: createRect(120, 0, 100, 100),
        leavePoint: [100, 50] as const,
        troughPoint: [110, 50] as const,
        outsidePoint: [-50, 50] as const,
      };
  }
}

describe('safePolygon', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('does not close when a nested child is open', async () => {
    const domReference = document.createElement('button');
    const floating = document.createElement('div');
    domReference.getBoundingClientRect = () => createRect(0, 0, 100, 100);
    floating.getBoundingClientRect = () => createRect(120, 0, 100, 100);

    const tree = new FloatingTreeStore();
    const onClose = vi.fn();
    const context = createHandleCloseContext({
      domReference,
      floating,
      onClose,
      tree,
    });

    const openChildContext = createFloatingContext({ domReference, floating, open: true });
    tree.addNode({ id: 'child', parentId: 'root', context: openChildContext });

    const handler = safePolygon()(context);
    handler(createMouseMoveEvent(3, -1));

    await act(async () => {
      vi.advanceTimersByTime(50);
    });

    expect(onClose).toHaveBeenCalledTimes(0);
  });

  it('does not close when an open nested child is behind a contextless intermediary node', async () => {
    const domReference = document.createElement('button');
    const floating = document.createElement('div');
    domReference.getBoundingClientRect = () => createRect(0, 0, 100, 100);
    floating.getBoundingClientRect = () => createRect(120, 0, 100, 100);

    const tree = new FloatingTreeStore();
    const onClose = vi.fn();
    const context = createHandleCloseContext({
      domReference,
      floating,
      onClose,
      tree,
    });

    const openChildContext = createFloatingContext({ domReference, floating, open: true });
    tree.addNode({ id: 'inline-root', parentId: 'root' });
    tree.addNode({ id: 'child', parentId: 'inline-root', context: openChildContext });

    const handler = safePolygon()(context);
    handler(createMouseMoveEvent(3, -1));

    await act(async () => {
      vi.advanceTimersByTime(50);
    });

    expect(onClose).toHaveBeenCalledTimes(0);
  });

  it('closes after intent timeout when no nested child is open', async () => {
    const domReference = document.createElement('button');
    const floating = document.createElement('div');
    domReference.getBoundingClientRect = () => createRect(0, 0, 100, 100);
    floating.getBoundingClientRect = () => createRect(120, 0, 100, 100);

    const tree = new FloatingTreeStore();
    const onClose = vi.fn();
    const context = createHandleCloseContext({
      domReference,
      floating,
      onClose,
      tree,
    });

    const closedChildContext = createFloatingContext({ domReference, floating, open: false });
    tree.addNode({ id: 'child', parentId: 'root', context: closedChildContext });

    const handler = safePolygon()(context);
    handler(createMouseMoveEvent(3, -1));

    await act(async () => {
      vi.advanceTimersByTime(50);
    });

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it.each(['top', 'bottom', 'left', 'right'] as const)(
    'keeps open while moving through the trough on %s placement',
    (placement) => {
      const domReference = document.createElement('button');
      const floating = document.createElement('div');
      const scenario = createPlacementScenario(placement);

      domReference.getBoundingClientRect = () => scenario.referenceRect;
      floating.getBoundingClientRect = () => scenario.floatingRect;

      const tree = new FloatingTreeStore();
      const onClose = vi.fn();
      const context = createHandleCloseContext({
        domReference,
        floating,
        onClose,
        tree,
        placement,
        x: scenario.leavePoint[0],
        y: scenario.leavePoint[1],
      });

      const handler = safePolygon()(context);
      handler(createMouseMoveEvent(scenario.troughPoint[0], scenario.troughPoint[1]));

      expect(onClose).toHaveBeenCalledTimes(0);
    },
  );

  it.each(['top', 'bottom', 'left', 'right'] as const)(
    'closes when moving away from corridor on %s placement',
    (placement) => {
      const domReference = document.createElement('button');
      const floating = document.createElement('div');
      const scenario = createPlacementScenario(placement);

      domReference.getBoundingClientRect = () => scenario.referenceRect;
      floating.getBoundingClientRect = () => scenario.floatingRect;

      const tree = new FloatingTreeStore();
      const onClose = vi.fn();
      const context = createHandleCloseContext({
        domReference,
        floating,
        onClose,
        tree,
        placement,
        x: scenario.leavePoint[0],
        y: scenario.leavePoint[1],
      });

      const handler = safePolygon()(context);
      handler(createMouseMoveEvent(scenario.outsidePoint[0], scenario.outsidePoint[1]));

      expect(onClose).toHaveBeenCalledTimes(1);
    },
  );

  it('resets traversal state for a new handler invocation', () => {
    const domReference = document.createElement('button');
    const floating = document.createElement('div');
    const scenario = createPlacementScenario('right');

    domReference.getBoundingClientRect = () => scenario.referenceRect;
    floating.getBoundingClientRect = () => scenario.floatingRect;

    const tree = new FloatingTreeStore();
    const onClose = vi.fn();
    const context = createHandleCloseContext({
      domReference,
      floating,
      onClose,
      tree,
      placement: 'right',
      x: scenario.leavePoint[0],
      y: scenario.leavePoint[1],
    });

    const handleClose = safePolygon();
    const firstHandler = handleClose(context);
    firstHandler(createMouseMoveEvent(130, 50, floating));

    const secondHandler = handleClose(context);
    secondHandler(createMouseMoveEvent(scenario.troughPoint[0], scenario.troughPoint[1]));

    expect(onClose).toHaveBeenCalledTimes(0);
  });
});
// ---------------------------------------------------------------------------
// Oracle: verbatim copy of the pre-refactor per-side geometry from
// safePolygon.ts. The axis-parameterized rewrite must classify every cursor
// position identically (bit-exact) to this code. Do not simplify it.
// ---------------------------------------------------------------------------

/* eslint-disable no-nested-ternary */

const ORACLE_POLYGON_BUFFER = 0.5;

function oracleHasIntersectingEdge(
  pointX: number,
  pointY: number,
  xi: number,
  yi: number,
  xj: number,
  yj: number,
) {
  return yi >= pointY !== yj >= pointY && pointX <= ((xj - xi) * (pointY - yi)) / (yj - yi) + xi;
}

function oracleIsPointInQuadrilateral(
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

  if (oracleHasIntersectingEdge(pointX, pointY, x1, y1, x2, y2)) {
    isInsideValue = !isInsideValue;
  }

  if (oracleHasIntersectingEdge(pointX, pointY, x2, y2, x3, y3)) {
    isInsideValue = !isInsideValue;
  }

  if (oracleHasIntersectingEdge(pointX, pointY, x3, y3, x4, y4)) {
    isInsideValue = !isInsideValue;
  }

  if (oracleHasIntersectingEdge(pointX, pointY, x4, y4, x1, y1)) {
    isInsideValue = !isInsideValue;
  }

  return isInsideValue;
}

function oracleIsInsideAxisAlignedRect(
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

function oracleClassifyCursor(
  side: Side,
  x: number,
  y: number,
  clientX: number,
  clientY: number,
  refRect: ClientRectObject,
  rect: ClientRectObject,
): number {
  const cursorLeaveFromRight = x > rect.right - rect.width / 2;
  const cursorLeaveFromBottom = y > rect.bottom - rect.height / 2;
  const isFloatingWider = rect.width > refRect.width;
  const isFloatingTaller = rect.height > refRect.height;
  const left = (isFloatingWider ? refRect : rect).left;
  const right = (isFloatingWider ? refRect : rect).right;
  const top = (isFloatingTaller ? refRect : rect).top;
  const bottom = (isFloatingTaller ? refRect : rect).bottom;

  if (
    (side === 'top' && y >= refRect.bottom - 1) ||
    (side === 'bottom' && y <= refRect.top + 1) ||
    (side === 'left' && x >= refRect.right - 1) ||
    (side === 'right' && x <= refRect.left + 1)
  ) {
    return CURSOR_OPPOSITE_SIDE;
  }

  let isInsideTroughRect = false;

  switch (side) {
    case 'top':
      isInsideTroughRect = oracleIsInsideAxisAlignedRect(
        clientX,
        clientY,
        left,
        refRect.top + 1,
        right,
        rect.bottom - 1,
      );
      break;
    case 'bottom':
      isInsideTroughRect = oracleIsInsideAxisAlignedRect(
        clientX,
        clientY,
        left,
        rect.top + 1,
        right,
        refRect.bottom - 1,
      );
      break;
    case 'left':
      isInsideTroughRect = oracleIsInsideAxisAlignedRect(
        clientX,
        clientY,
        rect.right - 1,
        bottom,
        refRect.left + 1,
        top,
      );
      break;
    case 'right':
      isInsideTroughRect = oracleIsInsideAxisAlignedRect(
        clientX,
        clientY,
        refRect.right - 1,
        bottom,
        rect.left + 1,
        top,
      );
      break;
    default:
  }

  if (isInsideTroughRect) {
    return CURSOR_IN_TROUGH;
  }

  let isInsidePolygon = false;

  switch (side) {
    case 'top': {
      const cursorXOffset = isFloatingWider ? ORACLE_POLYGON_BUFFER / 2 : ORACLE_POLYGON_BUFFER * 4;
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
      const cursorPointY = y + ORACLE_POLYGON_BUFFER + 1;

      const commonYLeft = cursorLeaveFromRight
        ? rect.bottom - ORACLE_POLYGON_BUFFER
        : isFloatingWider
          ? rect.bottom - ORACLE_POLYGON_BUFFER
          : rect.top;
      const commonYRight = cursorLeaveFromRight
        ? isFloatingWider
          ? rect.bottom - ORACLE_POLYGON_BUFFER
          : rect.top
        : rect.bottom - ORACLE_POLYGON_BUFFER;

      isInsidePolygon = oracleIsPointInQuadrilateral(
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
      break;
    }
    case 'bottom': {
      const cursorXOffset = isFloatingWider ? ORACLE_POLYGON_BUFFER / 2 : ORACLE_POLYGON_BUFFER * 4;
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
      const cursorPointY = y - ORACLE_POLYGON_BUFFER;

      const commonYLeft = cursorLeaveFromRight
        ? rect.top + ORACLE_POLYGON_BUFFER
        : isFloatingWider
          ? rect.top + ORACLE_POLYGON_BUFFER
          : rect.bottom;
      const commonYRight = cursorLeaveFromRight
        ? isFloatingWider
          ? rect.top + ORACLE_POLYGON_BUFFER
          : rect.bottom
        : rect.top + ORACLE_POLYGON_BUFFER;

      isInsidePolygon = oracleIsPointInQuadrilateral(
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
      break;
    }
    case 'left': {
      const cursorYOffset = isFloatingTaller
        ? ORACLE_POLYGON_BUFFER / 2
        : ORACLE_POLYGON_BUFFER * 4;
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
      const cursorPointX = x + ORACLE_POLYGON_BUFFER + 1;

      const commonXTop = cursorLeaveFromBottom
        ? rect.right - ORACLE_POLYGON_BUFFER
        : isFloatingTaller
          ? rect.right - ORACLE_POLYGON_BUFFER
          : rect.left;
      const commonXBottom = cursorLeaveFromBottom
        ? isFloatingTaller
          ? rect.right - ORACLE_POLYGON_BUFFER
          : rect.left
        : rect.right - ORACLE_POLYGON_BUFFER;

      isInsidePolygon = oracleIsPointInQuadrilateral(
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
      );
      break;
    }
    case 'right': {
      const cursorYOffset = isFloatingTaller
        ? ORACLE_POLYGON_BUFFER / 2
        : ORACLE_POLYGON_BUFFER * 4;
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
      const cursorPointX = x - ORACLE_POLYGON_BUFFER;

      const commonXTop = cursorLeaveFromBottom
        ? rect.left + ORACLE_POLYGON_BUFFER
        : isFloatingTaller
          ? rect.left + ORACLE_POLYGON_BUFFER
          : rect.right;
      const commonXBottom = cursorLeaveFromBottom
        ? isFloatingTaller
          ? rect.left + ORACLE_POLYGON_BUFFER
          : rect.right
        : rect.left + ORACLE_POLYGON_BUFFER;

      isInsidePolygon = oracleIsPointInQuadrilateral(
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
      break;
    }
    default:
  }

  return isInsidePolygon ? CURSOR_INSIDE_POLYGON : CURSOR_OUTSIDE_POLYGON;
}

/* eslint-enable no-nested-ternary */

const SIDES = ['top', 'bottom', 'left', 'right'] as const;

// Deterministic PRNG so failures are reproducible.
/* eslint-disable no-bitwise */
function mulberry32(seed: number) {
  let state = seed;
  return function next() {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
/* eslint-enable no-bitwise */

function compareClassification(
  side: Side,
  x: number,
  y: number,
  clientX: number,
  clientY: number,
  refRect: ClientRectObject,
  rect: ClientRectObject,
) {
  const actual = classifySafePolygonCursor(side, x, y, clientX, clientY, refRect, rect);
  const expected = oracleClassifyCursor(side, x, y, clientX, clientY, refRect, rect);
  if (actual !== expected) {
    expect.fail(
      `classifySafePolygonCursor returned ${actual}, oracle returned ${expected} for ${JSON.stringify(
        { side, x, y, clientX, clientY, refRect, rect },
      )}`,
    );
  }
  return actual;
}

// Guards against degenerate generation: every classification must actually be
// exercised by the compared samples.
function expectAllStatusesSeen(statusCounts: number[]) {
  expect(statusCounts[CURSOR_OPPOSITE_SIDE]).toBeGreaterThan(0);
  expect(statusCounts[CURSOR_IN_TROUGH]).toBeGreaterThan(0);
  expect(statusCounts[CURSOR_INSIDE_POLYGON]).toBeGreaterThan(0);
  expect(statusCounts[CURSOR_OUTSIDE_POLYGON]).toBeGreaterThan(0);
}

function createRandomScenario(side: Side, random: () => number) {
  const range = (min: number, max: number) => min + (max - min) * random();
  const refRect = createRect(range(-150, 150), range(-150, 150), range(5, 220), range(5, 220));
  const floatingWidth = range(5, 300);
  const floatingHeight = range(5, 300);
  // Negative gaps produce partially overlapping elements.
  const gap = range(-25, 60);
  const mainShift = range(-120, 120);

  let floatingLeft: number;
  let floatingTop: number;
  switch (side) {
    case 'top':
      floatingLeft = refRect.left + mainShift;
      floatingTop = refRect.top - gap - floatingHeight;
      break;
    case 'bottom':
      floatingLeft = refRect.left + mainShift;
      floatingTop = refRect.bottom + gap;
      break;
    case 'left':
      floatingLeft = refRect.left - gap - floatingWidth;
      floatingTop = refRect.top + mainShift;
      break;
    default:
      floatingLeft = refRect.right + gap;
      floatingTop = refRect.top + mainShift;
  }

  const floatingRect = createRect(floatingLeft, floatingTop, floatingWidth, floatingHeight);

  // The cursor coordinates recorded when closing began, usually near the
  // reference but allowed to be anywhere around it.
  const x = range(refRect.left - 30, refRect.right + 30);
  const y = range(refRect.top - 30, refRect.bottom + 30);

  return { refRect, floatingRect, x, y };
}

// Values at and around geometric boundaries, where an inexact rewrite of the
// float arithmetic would flip comparisons.
function boundaryValues(bases: number[]) {
  const values: number[] = [];
  for (const base of bases) {
    // Offsets mirror the constants used by the geometry: the trough/opposite
    // epsilon (1), POLYGON_BUFFER (0.5), POLYGON_BUFFER / 2, POLYGON_BUFFER * 4,
    // and the cursor point offset computed with both associativity groupings
    // ((base + 0.5) + 1 vs base + 1.5), which may differ by one ULP.
    values.push(
      base,
      base - 1,
      base + 1,
      base - 0.5,
      base + 0.5,
      base - 0.25,
      base + 0.25,
      base - 2,
      base + 2,
      base + 0.5 + 1,
      base + 1.5,
      base - 1.5,
      base - 1e-9,
      base + 1e-9,
    );
  }
  return values;
}

describe('safePolygon geometry equivalence with the pre-refactor implementation', () => {
  it('classifies randomized and boundary cursor points identically', () => {
    const random = mulberry32(0xba5e0001);
    const statusCounts = [0, 0, 0, 0];

    for (const side of SIDES) {
      for (let scenarioIndex = 0; scenarioIndex < 50; scenarioIndex += 1) {
        const { refRect, floatingRect, x, y } = createRandomScenario(side, random);

        const xPool = boundaryValues([
          refRect.left,
          refRect.right,
          floatingRect.left,
          floatingRect.right,
          x,
          (refRect.left + refRect.right) / 2,
          (floatingRect.left + floatingRect.right) / 2,
        ]);
        const yPool = boundaryValues([
          refRect.top,
          refRect.bottom,
          floatingRect.top,
          floatingRect.bottom,
          y,
          (refRect.top + refRect.bottom) / 2,
          (floatingRect.top + floatingRect.bottom) / 2,
        ]);

        for (let i = 0; i < 600; i += 1) {
          const clientX = xPool[Math.floor(random() * xPool.length)];
          const clientY = yPool[Math.floor(random() * yPool.length)];
          statusCounts[
            compareClassification(side, x, y, clientX, clientY, refRect, floatingRect)
          ] += 1;
        }

        for (let i = 0; i < 200; i += 1) {
          const clientX = -400 + 800 * random();
          const clientY = -400 + 800 * random();
          statusCounts[
            compareClassification(side, x, y, clientX, clientY, refRect, floatingRect)
          ] += 1;
        }

        // The opposite-side check compares the leave point (x, y) rather than
        // the client point, so target its boundaries too.
        for (let i = 0; i < 200; i += 1) {
          const leaveX = xPool[Math.floor(random() * xPool.length)];
          const leaveY = yPool[Math.floor(random() * yPool.length)];
          const clientX = xPool[Math.floor(random() * xPool.length)];
          const clientY = yPool[Math.floor(random() * yPool.length)];
          statusCounts[
            compareClassification(side, leaveX, leaveY, clientX, clientY, refRect, floatingRect)
          ] += 1;
        }
      }
    }

    expectAllStatusesSeen(statusCounts);
  });

  it('classifies cursor paths from the reference to the floating element identically', () => {
    const random = mulberry32(0xba5e0002);
    const statusCounts = [0, 0, 0, 0];

    for (const side of SIDES) {
      for (let scenarioIndex = 0; scenarioIndex < 50; scenarioIndex += 1) {
        const { refRect, floatingRect, x, y } = createRandomScenario(side, random);

        for (let path = 0; path < 8; path += 1) {
          const startX = refRect.left + refRect.width * random();
          const startY = refRect.top + refRect.height * random();
          const endX = floatingRect.left + floatingRect.width * random();
          const endY = floatingRect.top + floatingRect.height * random();

          for (let step = 0; step <= 24; step += 1) {
            const t = step / 24;
            const clientX = startX + (endX - startX) * t;
            const clientY = startY + (endY - startY) * t;
            statusCounts[
              compareClassification(side, x, y, clientX, clientY, refRect, floatingRect)
            ] += 1;
          }
        }
      }
    }

    expectAllStatusesSeen(statusCounts);
  });

  it('classifies fully randomized configurations identically', () => {
    const random = mulberry32(0xba5e0003);
    const statusCounts = [0, 0, 0, 0];

    for (let i = 0; i < 20000; i += 1) {
      const side = SIDES[Math.floor(random() * SIDES.length)];
      const refRect = createRect(
        -300 + 600 * random(),
        -300 + 600 * random(),
        400 * random(),
        400 * random(),
      );
      const rect = createRect(
        -300 + 600 * random(),
        -300 + 600 * random(),
        400 * random(),
        400 * random(),
      );
      const x = -350 + 700 * random();
      const y = -350 + 700 * random();
      const clientX = -350 + 700 * random();
      const clientY = -350 + 700 * random();
      statusCounts[compareClassification(side, x, y, clientX, clientY, refRect, rect)] += 1;
    }

    expectAllStatusesSeen(statusCounts);
  });
});
