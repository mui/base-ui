import { expect, describe, it } from 'vitest';
import type { RowsGeometry } from './geometry';
import {
  EMPTY_WINDOW_PLACEMENT,
  getWindowHeight,
  isWindowDisplaced,
  placeWindow,
} from './windowPlacement';
import type { WindowPlacementInputs } from './windowPlacement';

/** Rows of the given heights, laid out one after another. */
function geometryOf(heights: number[]): RowsGeometry {
  const positions: number[] = [];
  let offset = 0;
  for (const height of heights) {
    positions.push(offset);
    offset += height;
  }
  return { positions, currentPageTotalHeight: offset };
}

// A hundred rows of 20px, a total of 2000px, in a 100px scrollport.
const geometry = geometryOf(Array.from({ length: 100 }, () => 20));

function inputs(overrides: Partial<WindowPlacementInputs> = {}): WindowPlacementInputs {
  return {
    windowed: true,
    window: { firstRowIndex: 20, lastRowIndex: 40 },
    rowCount: 100,
    geometry,
    windowHeight: 400,
    viewportHeight: 100,
    rowsInset: { start: 0, end: 0 },
    scrollportPadding: { start: 0, end: 0 },
    table: false,
    ...overrides,
  };
}

describe('placeWindow', () => {
  it('places the window where its first row belongs, and sticks it by its excess height', () => {
    const placement = placeWindow(inputs());

    expect(placement.spacerHeight).toBe(400);
    expect(placement.top).toBe(400);
    expect(placement.endSpacerHeight).toBe(1200);
    // Taller than the scrollport by 300px: native scrolling moves the rows that far within it.
    expect(placement.insetTop).toBe(-300);
    expect(placement.insetBottom).toBe(-300);
    expect(placement.blockStart).toBe(0);
    expect(placement.blockEnd).toBe(2000);
  });

  it('does not stick a window shorter than the scrollport', () => {
    const placement = placeWindow(
      inputs({ window: { firstRowIndex: 0, lastRowIndex: 3 }, windowHeight: 60 }),
    );

    expect(placement.insetTop).toBe(0);
    expect(placement.insetBottom).toBe(0);
  });

  it('anchors a window holding the last row to the end of the content', () => {
    // The rows measured taller than the geometry says during a drag.
    const placement = placeWindow(
      inputs({ window: { firstRowIndex: 80, lastRowIndex: 100 }, windowHeight: 450 }),
    );

    expect(placement.spacerHeight).toBe(1550);
    expect(placement.top + placement.height).toBe(2000);
    expect(placement.endSpacerHeight).toBe(0);
  });

  it('keeps the first row at the start when the whole collection is rendered', () => {
    const placement = placeWindow(
      // The rows measured shorter than the geometry, which would pull a tail-anchored window down.
      inputs({ window: { firstRowIndex: 0, lastRowIndex: 100 }, windowHeight: 1900 }),
    );

    expect(placement.spacerHeight).toBe(0);
  });

  it('places a list after the scrollport padding, which it scrolls through', () => {
    const placement = placeWindow(
      inputs({ rowsInset: { start: 8, end: 8 }, scrollportPadding: { start: 8, end: 8 } }),
    );

    expect(placement.top).toBe(408);
    expect(placement.insetTop).toBe(-300);
    expect(placement.blockStart).toBe(8);
    expect(placement.blockEnd).toBe(2008);
    expect(placement.scrollportPaddingStart).toBe(8);
  });

  it('keeps a table section off what surrounds the rows at the other end of the table', () => {
    // A 30px header above the rows and a 40px footer below them, in an unpadded scrollport.
    const placement = placeWindow(inputs({ rowsInset: { start: 30, end: 40 }, table: true }));

    expect(placement.top).toBe(430);
    expect(placement.insetTop).toBe(-340);
    expect(placement.insetBottom).toBe(-330);
    expect(placement.blockStart).toBe(0);
    expect(placement.blockEnd).toBe(2070);
  });
});

describe('getWindowHeight', () => {
  const rows = Array.from({ length: 100 }, (_, index) => ({ id: `row-${index}` }));

  it('adds up the rows in the window', () => {
    expect(
      getWindowHeight(geometry, { firstRowIndex: 20, lastRowIndex: 25 }, rows, () => undefined),
    ).toBe(100);
  });

  it('counts a row held back by a drag at the height it measured', () => {
    const height = getWindowHeight(
      geometry,
      { firstRowIndex: 20, lastRowIndex: 25 },
      rows,
      (rowId) => (rowId === 'row-22' ? 50 : undefined),
    );

    expect(height).toBe(130);
  });

  it('reads the span from geometry that describes another collection', () => {
    const height = getWindowHeight(
      geometry,
      { firstRowIndex: 20, lastRowIndex: 25 },
      rows.slice(0, 50),
      () => 999,
    );

    expect(height).toBe(100);
  });
});

describe('isWindowDisplaced', () => {
  const placement = placeWindow(inputs());

  it('finds a window in place anywhere its insets reach', () => {
    // The window spans 400 to 800, and holds the 100px scrollport anywhere within it.
    expect(isWindowDisplaced(placement, 400)).toBe(false);
    expect(isWindowDisplaced(placement, 700)).toBe(false);
  });

  it('finds a window held at the scrollport after a scroll outran it', () => {
    expect(isWindowDisplaced(placement, 1000)).toBe(true);
    expect(isWindowDisplaced(placement, 100)).toBe(true);
  });

  it('finds a window at either end of its block in place, where nothing can push it', () => {
    const atStart = { ...placement, top: 0, height: 400, insetTop: 0, insetBottom: 0 };
    const atEnd = { ...placement, top: 1600, height: 400, insetTop: 0, insetBottom: 0 };

    expect(isWindowDisplaced(atStart, 0)).toBe(false);
    expect(isWindowDisplaced(atEnd, 1900)).toBe(false);
  });

  it('never finds an unwindowed list displaced', () => {
    expect(isWindowDisplaced(EMPTY_WINDOW_PLACEMENT, 500)).toBe(false);
  });
});
