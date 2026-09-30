import { expect, describe, it, vi } from 'vitest';
import { isRowFarFromWindow, ViewportController } from './viewportController';
import type { ViewportFrame, ViewportInputs } from './viewportController';
import type { RowsGeometry } from './geometry';
import type { VirtualizerRow } from '../internals/virtualization/types';

/** A flat list's rows are its items. */
const flat = (rowIndex: number) => rowIndex;

/** Items before each row, from a grouped list's table, which ends with the total. */
function fromTable(itemCountBeforeRow: number[]) {
  return (rowIndex: number) =>
    itemCountBeforeRow[Math.min(Math.max(rowIndex, 0), itemCountBeforeRow.length - 1)];
}

describe('isRowFarFromWindow', () => {
  const window = { firstRowIndex: 10, lastRowIndex: 20 };

  it('judges a flat list in rows', () => {
    expect(isRowFarFromWindow(15, window, flat)).toBe(false);
    expect(isRowFarFromWindow(0, window, flat)).toBe(false);
    expect(isRowFarFromWindow(30, window, flat)).toBe(false);
    expect(isRowFarFromWindow(31, window, flat)).toBe(true);
    expect(isRowFarFromWindow(-1, window, flat)).toBe(true);
  });

  it('judges a grouped list in items, so headers add no distance', () => {
    // One item, fifty empty groups, one item: rows 0..53 hold two items. Row 53 is 52 rows past a
    // window on the first item, and one item past it.
    const itemCountBeforeRow = [0, 0, ...Array.from({ length: 50 }, () => 1), 1, 1, 2];
    expect(itemCountBeforeRow).toHaveLength(55);

    expect(
      isRowFarFromWindow(53, { firstRowIndex: 0, lastRowIndex: 2 }, fromTable(itemCountBeforeRow)),
    ).toBe(false);
    expect(isRowFarFromWindow(53, { firstRowIndex: 0, lastRowIndex: 2 }, flat)).toBe(true);
  });

  it('still finds a distant item in a grouped list', () => {
    // Twenty groups of two items: item index equals rows minus headers.
    const itemCountBeforeRow: number[] = [];
    let items = 0;
    for (let group = 0; group < 20; group += 1) {
      itemCountBeforeRow.push(items, items, items + 1);
      items += 2;
    }
    itemCountBeforeRow.push(items);

    // Row 59 is item 38; a window over the first six rows ends at item 4.
    expect(
      isRowFarFromWindow(59, { firstRowIndex: 0, lastRowIndex: 6 }, fromTable(itemCountBeforeRow)),
    ).toBe(true);
    expect(
      isRowFarFromWindow(20, { firstRowIndex: 0, lastRowIndex: 6 }, fromTable(itemCountBeforeRow)),
    ).toBe(false);
  });
});

const NO_INPUT = { hasDirectInput: false, isPointerDown: false };

function createFrame() {
  let pending: (() => void) | null = null;
  const frame: ViewportFrame & { flush: () => void } = {
    request(callback) {
      pending = callback;
    },
    cancel() {
      pending = null;
    },
    flush() {
      const callback = pending;
      pending = null;
      callback?.();
    },
  };
  return frame;
}

/**
 * A scrollport, its rows and the engine's geometry, scripted: every rectangle is worked out from
 * the row heights and the scroll position, the way a browser would lay them out, so the controller
 * is exercised without layout. Every row is laid out, as in a list short enough not to window.
 */
function createViewport(initialHeights: number[], viewportHeight = 100) {
  let rows: VirtualizerRow<number>[] = initialHeights.map((_, index) => ({
    id: `row-${index}`,
    model: index,
  }));
  const heights = new Map(rows.map((row, index) => [row.id, initialHeights[index]]));
  const measured = new Set<React.Key>(rows.map((row) => row.id));
  let geometry: RowsGeometry = { positions: [], currentPageTotalHeight: 0 };
  let scrollTop = 0;
  // A scrollport a popup just mounted has no scrollable overflow yet.
  let scrollable = true;

  const getMaxScrollTop = () =>
    scrollable ? Math.max(0, geometry.currentPageTotalHeight - viewportHeight) : 0;

  const rect = (top: number, height: number) =>
    ({ top, bottom: top + height, height, left: 0, right: 100, width: 100 }) as DOMRect;

  const scrollElement = document.createElement('div');
  Object.defineProperties(scrollElement, {
    scrollTop: {
      get: () => scrollTop,
      set: (value: number) => {
        scrollTop = Math.min(Math.max(0, value), getMaxScrollTop());
      },
    },
    clientHeight: { get: () => viewportHeight },
    scrollHeight: { get: () => Math.max(viewportHeight, geometry.currentPageTotalHeight) },
  });
  scrollElement.scrollTo = ((options: ScrollToOptions) => {
    scrollElement.scrollTop = options.top ?? scrollTop;
  }) as typeof scrollElement.scrollTo;
  scrollElement.getBoundingClientRect = () => rect(0, viewportHeight);

  const rowsParent = document.createElement('div');
  const elements = new Map<React.Key, HTMLElement>();

  function layOut() {
    const positions: number[] = [];
    let offset = 0;
    rows.forEach((row) => {
      positions.push(offset);
      offset += heights.get(row.id)!;
    });
    geometry = { positions, currentPageTotalHeight: offset };

    rowsParent.replaceChildren(
      ...rows.map((row, index) => {
        let element = elements.get(row.id);
        if (element == null) {
          element = document.createElement('div');
          elements.set(row.id, element);
        }
        element.dataset.rowIndex = String(index);
        element.getBoundingClientRect = () =>
          rect(geometry.positions[index] - scrollTop, heights.get(row.id)!);
        return element;
      }),
    );
  }

  layOut();

  const viewportFrame = createFrame();
  const measurementFrame = createFrame();
  const syncEngine = vi.fn();
  const controller = new ViewportController<number>({
    getRowsParent: () => rowsParent,
    getScrollElement: () => scrollElement,
    isRowMeasured: (rowId) => measured.has(rowId),
    isScrollbarDrag: () => false,
    isWindowInPlace: () => true,
    measureNewRows: () => {},
    measurementFrame,
    readRowsGeometry: () => geometry,
    settleEngineGeometry: () => {},
    syncEngine,
    viewportFrame,
  });

  let inputs: Partial<ViewportInputs<number>> = {};

  return {
    controller,
    measurementFrame,
    syncEngine,
    viewportFrame,
    get scrollTop() {
      return scrollTop;
    },
    /** Runs a commit the way the Virtualizer does, with this render's inputs. */
    commit(nextInputs: Partial<ViewportInputs<number>> = inputs) {
      inputs = nextInputs;
      controller.update({
        activation: {
          alignment: 'auto',
          paddingEnd: undefined,
          paddingStart: undefined,
          rowIndex: undefined,
        },
        enabled: true,
        estimate: { enabled: false, hasEstimate: () => true, isSettled: () => true },
        itemsBeforeRow: flat,
        resolveRowIndex: undefined,
        rows,
        rowsInset: { start: 0, end: 0 },
        rowsMeta: geometry,
        trailingHeight: 0,
        window: { firstRowIndex: 0, lastRowIndex: rows.length },
        ...inputs,
      });
      controller.commit();
      controller.retry();
    },
    /** Moves the scrollport the way the user would, without a commit. */
    scrollTo(top: number) {
      scrollElement.scrollTop = top;
    },
    /** Gives a row a new height, which the next commit sees as a geometry change. */
    resize(index: number, height: number, isMeasured = true) {
      heights.set(rows[index].id, height);
      if (isMeasured) {
        measured.add(rows[index].id);
      }
      layOut();
    },
    markUnmeasured(index: number) {
      measured.delete(rows[index].id);
    },
    insertRow(index: number, height: number) {
      const row = { id: `inserted-${index}`, model: -1 };
      rows = [...rows.slice(0, index), row, ...rows.slice(index)];
      heights.set(row.id, height);
      measured.add(row.id);
      layOut();
    },
    get rows() {
      return rows;
    },
    setScrollable(value: boolean) {
      scrollable = value;
    },
  };
}

function activation(rowIndex: number, alignment: 'auto' | 'start' = 'auto') {
  return { alignment, paddingEnd: undefined, paddingStart: undefined, rowIndex };
}

describe('ViewportController', () => {
  // Fifty rows of 20px in a 100px scrollport: five rows in view, a total of 1000px.
  const heights = () => Array.from({ length: 50 }, () => 20);

  describe('scroll requests', () => {
    it('brings a requested row into view and settles once it is inside the scrollport', () => {
      const viewport = createViewport(heights());
      viewport.commit();

      viewport.controller.scrollToIndex(20);

      // Row 20 spans 400 to 420, so it rests on the scrollport's end edge.
      expect(viewport.scrollTop).toBe(320);
      expect(viewport.syncEngine).toHaveBeenCalledTimes(1);
      expect(viewport.controller.isPending()).toBe(false);
    });

    it('keeps an unmeasured destination and re-applies it as the rows above are measured', () => {
      const viewport = createViewport(heights());
      viewport.markUnmeasured(20);
      viewport.commit({ activation: activation(20) });

      expect(viewport.scrollTop).toBe(320);
      expect(viewport.controller.isPending()).toBe(true);

      // A row above the destination measures 20px taller, and the destination is measured too.
      viewport.resize(5, 40);
      viewport.resize(20, 20);
      viewport.commit();

      // Anchoring stands aside while the request stands, so the request alone positions the row,
      // from the new geometry.
      expect(viewport.scrollTop).toBe(340);
      expect(viewport.controller.isPending()).toBe(false);
    });

    it('stands anchoring aside while a request stands', () => {
      const viewport = createViewport(heights());
      viewport.markUnmeasured(20);
      viewport.commit();
      viewport.controller.scrollToIndex(20, { align: 'start' });
      viewport.commit();
      expect(viewport.scrollTop).toBe(400);

      // Anchoring alone would correct for the row above growing; the request repositions from the
      // new geometry instead, in one write.
      viewport.resize(5, 40);
      viewport.resize(20, 20);
      viewport.commit();

      expect(viewport.scrollTop).toBe(420);
      expect(viewport.syncEngine).toHaveBeenCalledTimes(2);
    });

    it('writes a position the scrollport rejected again on the next frame', () => {
      const viewport = createViewport(heights());
      viewport.setScrollable(false);
      viewport.commit({ activation: activation(20) });

      expect(viewport.scrollTop).toBe(0);
      expect(viewport.syncEngine).not.toHaveBeenCalled();
      expect(viewport.controller.isPending()).toBe(true);

      viewport.setScrollable(true);
      viewport.viewportFrame.flush();

      expect(viewport.scrollTop).toBe(320);
      expect(viewport.syncEngine).toHaveBeenCalledTimes(1);
    });

    it('follows a destination whose row moved to another index', () => {
      const viewport = createViewport(heights());
      const resolveRowIndex = (rowId: React.Key) =>
        viewport.rows.findIndex((row) => row.id === rowId);
      viewport.markUnmeasured(20);
      viewport.commit({ resolveRowIndex });
      viewport.controller.scrollToIndex(20);
      const destinationId = viewport.rows[20].id;

      // A header inserted above moves the destination down by a row.
      viewport.insertRow(0, 20);
      viewport.resize(21, 20);
      viewport.commit({ resolveRowIndex });

      // The same row now spans 420 to 440.
      expect(viewport.rows[21].id).toBe(destinationId);
      expect(viewport.scrollTop).toBe(340);
    });

    it('abandons a destination when another row takes its index in a flat list', () => {
      const viewport = createViewport(heights());
      viewport.markUnmeasured(20);
      viewport.commit();
      viewport.controller.scrollToIndex(20);
      expect(viewport.controller.isPending()).toBe(true);

      viewport.insertRow(0, 20);
      viewport.commit();

      expect(viewport.controller.isPending()).toBe(false);
    });

    it('does not move for an activation that only changed its alignment', () => {
      const viewport = createViewport(heights());
      viewport.commit({ activation: activation(20) });
      expect(viewport.scrollTop).toBe(320);

      viewport.scrollTo(0);
      viewport.commit({ activation: activation(20, 'start') });

      expect(viewport.scrollTop).toBe(0);
    });

    it('treats another row at the activated index as a new activation', () => {
      const viewport = createViewport(heights());
      viewport.commit({ activation: activation(20) });
      viewport.scrollTo(0);

      viewport.insertRow(0, 20);
      viewport.commit({ activation: activation(20) });

      expect(viewport.scrollTop).toBe(320);
    });

    it('applies the activation again once its effects are set up again', () => {
      const viewport = createViewport(heights());
      viewport.commit({ activation: activation(20) });
      viewport.scrollTo(0);
      viewport.commit({ activation: activation(20) });
      expect(viewport.scrollTop).toBe(0);

      viewport.controller.disconnect();
      viewport.commit({ activation: activation(20) });

      expect(viewport.scrollTop).toBe(320);
    });
  });

  describe('scroll echoes', () => {
    it('tells the echo of its own write from a user scroll', () => {
      const viewport = createViewport(heights());
      viewport.commit();
      viewport.controller.scrollToIndex(20);

      expect(viewport.controller.isEcho(320, NO_INPUT)).toBe(true);
      expect(viewport.controller.isEcho(320.5, NO_INPUT)).toBe(true);
      expect(viewport.controller.isEcho(200, NO_INPUT)).toBe(false);
    });

    it('excuses scroll events without input while a request waits for the estimate', () => {
      const viewport = createViewport(heights());
      viewport.markUnmeasured(40);
      viewport.commit({
        activation: activation(40),
        estimate: { enabled: true, hasEstimate: () => false, isSettled: () => false },
        window: { firstRowIndex: 0, lastRowIndex: 5 },
      });

      expect(viewport.controller.isEcho(100, NO_INPUT)).toBe(true);
      expect(viewport.controller.isEcho(100, { hasDirectInput: true, isPointerDown: false })).toBe(
        false,
      );

      viewport.controller.cancel();
      expect(viewport.controller.isEcho(100, NO_INPUT)).toBe(false);
    });
  });

  describe('anchoring', () => {
    it('keeps the content in view in place when a row above it changes height', () => {
      const viewport = createViewport(heights());
      viewport.commit();
      viewport.scrollTo(200);
      viewport.commit();

      viewport.resize(2, 50);
      viewport.commit();

      expect(viewport.scrollTop).toBe(230);
      expect(viewport.syncEngine).toHaveBeenCalledTimes(1);
    });

    it('stays pinned to the bottom when the content grows', () => {
      const viewport = createViewport(heights());
      viewport.commit();
      viewport.scrollTo(900);
      viewport.commit();

      viewport.resize(49, 60);
      viewport.commit();

      expect(viewport.scrollTop).toBe(940);
    });

    it('stays at the top when a row in view changes height', () => {
      const viewport = createViewport(heights());
      viewport.commit();

      viewport.resize(0, 50);
      viewport.commit();

      expect(viewport.scrollTop).toBe(0);
      expect(viewport.syncEngine).not.toHaveBeenCalled();
    });
  });
});
