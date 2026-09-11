import { expect, describe, it } from 'vitest';
import type { VirtualizerHandle } from '../../internals/virtualization/ListVirtualizationRegistry';
import { getTargetScrollTop, getVirtualizedTargetScrollTop } from './scrollArrowStepping';

interface Row {
  offset: number;
  size: number;
}

function buildRows(sizes: number[]): Row[] {
  let offset = 0;
  return sizes.map((size) => {
    const row = { offset, size };
    offset += size;
    return row;
  });
}

/**
 * A DOM list whose boxes describe exactly the same geometry as the metrics below, so the two
 * branches can be asked the same question.
 */
function buildElements(rows: Row[]): Array<HTMLElement | null> {
  return rows.map((row) => {
    const element = document.createElement('div');
    Object.defineProperty(element, 'offsetTop', { configurable: true, value: row.offset });
    Object.defineProperty(element, 'offsetHeight', { configurable: true, value: row.size });
    return element;
  });
}

function buildHandle(rows: Row[]): VirtualizerHandle {
  return {
    getIndexAtOffset(offset: number) {
      if (rows.length === 0) {
        return null;
      }
      let result = 0;
      for (let index = 0; index < rows.length; index += 1) {
        if (rows[index].offset <= offset) {
          result = index;
        } else {
          break;
        }
      }
      return result;
    },
    getItemMetrics(index: number) {
      return rows[index] ?? null;
    },
    getScrollElement: () => null,
    remeasure: () => {},
    resetScroll: () => {},
    scrollToIndex: () => {},
  };
}

const CLIENT_HEIGHT = 100;
const ARROW_HEIGHT = 10;

describe('scrollArrowStepping', () => {
  // Fixed rows, a tall first row (the asymmetry the two branches must share), and mixed heights.
  const GEOMETRIES: Array<[string, number[]]> = [
    ['uniform rows', Array.from({ length: 20 }, () => 20)],
    ['a very tall first row', [300, 20, 20, 20, 20, 20, 20, 20]],
    ['mixed heights', [10, 45, 20, 80, 15, 60, 25, 30, 20, 55]],
    ['a single row taller than the scrollport', [400]],
  ];

  const SCROLL_POSITIONS = [0, 5, 17, 40, 95, 160, 300];

  describe.each(GEOMETRIES)('over %s', (_name, sizes) => {
    const rows = buildRows(sizes);
    const totalHeight = rows.reduce((sum, row) => sum + row.size, 0);
    const maxScrollTop = Math.max(0, totalHeight - CLIENT_HEIGHT);
    const elements = buildElements(rows);
    const handle = buildHandle(rows);

    it.each(SCROLL_POSITIONS)(
      'agrees between the DOM and metrics branches scrolling up from %i',
      (scrollTop) => {
        const fromDom = getTargetScrollTop(
          elements,
          true,
          scrollTop,
          CLIENT_HEIGHT,
          ARROW_HEIGHT,
          maxScrollTop,
        );
        const fromMetrics = getVirtualizedTargetScrollTop(
          handle,
          rows.length,
          true,
          scrollTop,
          CLIENT_HEIGHT,
          ARROW_HEIGHT,
          maxScrollTop,
        );

        expect(fromMetrics).toBe(fromDom);
      },
    );

    it.each(SCROLL_POSITIONS)(
      'agrees between the DOM and metrics branches scrolling down from %i',
      (scrollTop) => {
        const fromDom = getTargetScrollTop(
          elements,
          false,
          scrollTop,
          CLIENT_HEIGHT,
          ARROW_HEIGHT,
          maxScrollTop,
        );
        const fromMetrics = getVirtualizedTargetScrollTop(
          handle,
          rows.length,
          false,
          scrollTop,
          CLIENT_HEIGHT,
          ARROW_HEIGHT,
          maxScrollTop,
        );

        expect(fromMetrics).toBe(fromDom);
      },
    );
  });

  // Equivalence alone cannot catch both branches drifting together, so the asymmetry the metrics
  // branch exists to reproduce is also pinned to an absolute value.
  it('steps past a tall first row the way the DOM branch does', () => {
    const rows = buildRows([300, 20, 20, 20, 20]);
    const maxScrollTop = 380 - CLIENT_HEIGHT;

    // The covered bottom edge (0 + 100 - 10 + 1) falls inside row 0, so row 0 counts as the last
    // visible one and the step targets row 1 — not row 0.
    const expected = rows[1].offset + rows[1].size - CLIENT_HEIGHT + ARROW_HEIGHT;
    expect(expected).toBe(230);

    expect(
      getTargetScrollTop(buildElements(rows), false, 0, CLIENT_HEIGHT, ARROW_HEIGHT, maxScrollTop),
    ).toBe(230);
    expect(
      getVirtualizedTargetScrollTop(
        buildHandle(rows),
        rows.length,
        false,
        0,
        CLIENT_HEIGHT,
        ARROW_HEIGHT,
        maxScrollTop,
      ),
    ).toBe(230);
  });

  it('holds the position when a row has not been measured yet', () => {
    const rows = buildRows([20, 20, 20, 20, 20]);
    const handle = buildHandle(rows);
    // A row the engine has not placed yet reports no metrics.
    const partial: VirtualizerHandle = {
      ...handle,
      getItemMetrics: (index) => (index >= 2 ? null : handle.getItemMetrics(index)),
    };

    expect(
      getVirtualizedTargetScrollTop(
        partial,
        rows.length,
        false,
        40,
        CLIENT_HEIGHT,
        ARROW_HEIGHT,
        0,
      ),
    ).toBe(null);
  });

  it('resolves both ends for an empty collection', () => {
    const handle = buildHandle([]);
    expect(
      getVirtualizedTargetScrollTop(handle, 0, true, 0, CLIENT_HEIGHT, ARROW_HEIGHT, 200),
    ).toBe(0);
    expect(
      getVirtualizedTargetScrollTop(handle, 0, false, 0, CLIENT_HEIGHT, ARROW_HEIGHT, 200),
    ).toBe(200);
  });
});
