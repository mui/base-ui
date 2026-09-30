import { expect, describe, it, vi } from 'vitest';
import type { VirtualizerRow } from '../internals/virtualization/types';
import { RowHeightLedger } from './rowHeightLedger';
import type { MeasurableRow, RowHeightCache, RowHeightEntry } from './rowHeightLedger';

/** The engine's height cache in memory: entries by row, as the engine keeps them. */
function createCache() {
  const entries = new Map<React.Key, RowHeightEntry>();
  const cache: RowHeightCache = {
    entries: () => entries,
    peek: (rowId) => entries.get(rowId),
    hasMeasurement: (rowId) => entries.get(rowId)?.needsFirstMeasurement === false,
    store: (rowId, height) => {
      entries.set(rowId, { autoHeight: true, content: height, needsFirstMeasurement: false });
    },
    setLastMeasuredRowIndex: () => {},
    hydrate: vi.fn(),
    reset: () => entries.clear(),
    observe: () => () => {},
  };
  return { cache, entries };
}

function toRows(ids: string[]): VirtualizerRow<string>[] {
  return ids.map((id) => ({ id, model: id }));
}

/**
 * A ledger over an in-memory cache, driven the way the Virtualizer drives it: measurements land
 * in the cache, hydrations hand every entry to the ledger, and each commit publishes the refresh's
 * inputs and runs it.
 */
function createSubject(ids: string[] = ['a', 'b', 'c'], staticEstimatedItemHeight = 32) {
  const { cache, entries } = createCache();
  let idleCallback: (() => void) | null = null;
  const requestRefresh = vi.fn();
  const settleGeometry = vi.fn();
  const rows = toRows(ids);
  const ledger = new RowHeightLedger<string>(
    {
      cache,
      requestRefresh,
      scheduleIdle: (callback) => {
        idleCallback = callback;
      },
    },
    rows,
    staticEstimatedItemHeight,
  );
  let revision = 0;
  let rowsMeta = {};
  let isGestureActive = false;

  const subject = {
    cache,
    entries,
    ledger,
    requestRefresh,
    rows,
    settleGeometry,
    /** Stores a measurement the way the engine's ResizeObserver does. */
    measure(rowId: React.Key, height: number) {
      cache.store(rowId, height);
    },
    /** Hydrates: the engine republishes its geometry, and hands every row's entry to the ledger. */
    hydrate(isScrollbarDrag = false) {
      for (const [rowId, entry] of entries) {
        ledger.applyRowHeight(entry, rowId, isScrollbarDrag, () => staticEstimatedItemHeight);
      }
      rowsMeta = {};
    },
    setGestureActive(value: boolean) {
      isGestureActive = value;
    },
    /** Runs a commit's refresh over the given rows. */
    commit(
      commitRows: VirtualizerRow<string>[] = rows,
      options: { isItemRowId?: (rowId: React.Key) => boolean } = {},
    ) {
      ledger.update({
        defaultEstimatedItemHeight: staticEstimatedItemHeight,
        enabled: true,
        isGestureActive: () => isGestureActive,
        isItemRowId: options.isItemRowId,
        revision,
        rows: commitRows,
        rowsMeta,
        settleGeometry,
        window: { firstRowIndex: 0, lastRowIndex: commitRows.length },
      });
      ledger.refresh();
    },
    /** Lets the idle wait elapse, which schedules another commit. */
    idle() {
      const callback = idleCallback;
      idleCallback = null;
      callback?.();
      revision += 1;
    },
  };
  return subject;
}

/** The entry the engine works out for a measured row before handing it to the ledger. */
function measured(height: number): RowHeightEntry {
  return { autoHeight: true, content: height, needsFirstMeasurement: false };
}

function rowElement(height: number) {
  const element = document.createElement('div');
  element.getBoundingClientRect = () => ({ height }) as DOMRect;
  return element;
}

const ESTIMATE = () => 30;

describe('RowHeightLedger', () => {
  describe('scrollbar drags', () => {
    it('commits the estimate in place of a measurement taken during a drag', () => {
      const { ledger } = createSubject();
      const entry = measured(90);

      ledger.applyRowHeight(entry, 'a', true, ESTIMATE);

      expect(entry.content).toBe(30);
      expect(ledger.getDeferredHeight('a')).toBe(90);
      expect(ledger.hasDeferredHeights()).toBe(true);
    });

    it('commits the held-back measurement once the drag has ended, and then forgets it', () => {
      const { ledger } = createSubject();
      ledger.applyRowHeight(measured(90), 'a', true, ESTIMATE);

      // The hydration after the release hands the ledger the entry as the drag left it.
      const entry = measured(30);
      ledger.applyRowHeight(entry, 'a', false, ESTIMATE);

      expect(entry.content).toBe(90);
      expect(ledger.getDeferredHeight('a')).toBe(undefined);
      expect(ledger.hasDeferredHeights()).toBe(false);
    });

    it('keeps the newest measurement across repeated reports during a drag', () => {
      const { ledger } = createSubject();
      ledger.applyRowHeight(measured(90), 'a', true, ESTIMATE);
      ledger.applyRowHeight(measured(95), 'a', true, ESTIMATE);
      // A hydration hands back the estimate the drag committed, which is no new measurement.
      ledger.applyRowHeight(measured(30), 'a', true, ESTIMATE);

      expect(ledger.getDeferredHeight('a')).toBe(95);
    });

    it('leaves a row whose real height is already committed alone', () => {
      const { ledger } = createSubject();
      ledger.applyRowHeight(measured(90), 'a', false, ESTIMATE);
      const entry = measured(90);

      ledger.applyRowHeight(entry, 'a', true, ESTIMATE);

      expect(entry.content).toBe(90);
      expect(ledger.hasDeferredHeights()).toBe(false);
    });

    it('leaves a row with a declared height alone', () => {
      const { ledger } = createSubject();
      const entry: RowHeightEntry = {
        autoHeight: false,
        content: 40,
        needsFirstMeasurement: false,
      };

      ledger.applyRowHeight(entry, 'a', true, ESTIMATE);

      expect(entry.content).toBe(40);
      expect(ledger.hasDeferredHeights()).toBe(false);
    });
  });

  describe('collections', () => {
    it('keeps the samples when the collection is unchanged, filtered or grown', () => {
      const { ledger, rows } = createSubject();

      expect(ledger.isInvalidatedBy([...rows], 32)).toBe(false);
      expect(ledger.isInvalidatedBy(toRows(['b']), 32)).toBe(false);
      expect(ledger.isInvalidatedBy(toRows(['a', 'b', 'c', 'd']), 32)).toBe(false);
    });

    it('drops the samples when the collection is replaced, even partly', () => {
      const { ledger } = createSubject();

      expect(ledger.isInvalidatedBy(toRows(['x', 'y', 'z']), 32)).toBe(true);
      // Adding and removing ids in the same update is a partial replacement, even though `c`
      // keeps the two collections overlapping.
      expect(ledger.isInvalidatedBy(toRows(['c', 'x', 'y']), 32)).toBe(true);
    });

    it('drops the samples when the estimate itself changes', () => {
      const { ledger, rows } = createSubject();

      expect(ledger.isInvalidatedBy(rows, 64)).toBe(true);
    });

    it('forgets which heights are committed only when the samples are dropped', () => {
      const { ledger } = createSubject();
      ledger.applyRowHeight(measured(90), 'a', false, ESTIMATE);

      const filtered = toRows(['a', 'b']);
      ledger.acceptCollection(filtered, 32, ledger.isInvalidatedBy(filtered, 32));
      const kept = measured(90);
      ledger.applyRowHeight(kept, 'a', true, ESTIMATE);
      expect(kept.content).toBe(90);

      const replaced = toRows(['x', 'y']);
      ledger.acceptCollection(replaced, 32, ledger.isInvalidatedBy(replaced, 32));
      const forgotten = measured(90);
      ledger.applyRowHeight(forgotten, 'a', true, ESTIMATE);
      expect(forgotten.content).toBe(30);
    });
  });

  describe('measuring', () => {
    it('measures only the laid-out rows that have no measurement yet', () => {
      const { cache, entries, ledger, measure } = createSubject();
      measure('a', 50);
      const rows: MeasurableRow[] = [
        { element: rowElement(40), rowId: 'a', rowIndex: 0 },
        { element: rowElement(24), rowId: 'b', rowIndex: 1 },
        { element: rowElement(0), rowId: 'c', rowIndex: 2 },
      ];

      ledger.measureNewRows(rows);

      expect(entries.get('a')?.content).toBe(50);
      expect(entries.get('b')?.content).toBe(24);
      // A row laid out at no height says nothing about its height.
      expect(entries.has('c')).toBe(false);
      expect(cache.hydrate).toHaveBeenCalledTimes(1);

      ledger.measureNewRows(rows.slice(0, 1));
      expect(cache.hydrate).toHaveBeenCalledTimes(1);
    });

    it('forgets every height, held back or committed, when remeasuring', () => {
      const { entries, ledger, measure, requestRefresh } = createSubject();
      measure('z', 50);
      ledger.applyRowHeight(measured(90), 'a', true, ESTIMATE);

      ledger.remeasure([{ element: rowElement(24), rowId: 'b', rowIndex: 1 }]);

      expect(ledger.hasDeferredHeights()).toBe(false);
      expect(entries.has('z')).toBe(false);
      expect(entries.get('b')?.content).toBe(24);
      expect(ledger.readEstimate()).toBe(null);
      expect(requestRefresh).toHaveBeenCalledTimes(1);
    });
  });

  describe('refresh', () => {
    it('announces an exhausted refinement once, and refines once samples suffice', () => {
      const subject = createSubject(['a', 'b']);
      subject.measure('a', 20);
      subject.measure('b', 20);

      // The first pass waits for the measurements to settle.
      subject.commit();
      subject.idle();
      subject.commit();

      // Two rows, both measured and sampled, are one short of an average: nothing on hand can
      // refine the estimate, which is said once.
      expect(subject.ledger.isRefinementExhausted()).toBe(true);
      expect(subject.ledger.readEstimate()).toBe(null);
      expect(subject.settleGeometry).toHaveBeenCalledTimes(1);

      // The geometry that announcement republished re-arms the settled pass, which must not say
      // it again — or the two would take turns for ever.
      subject.hydrate();
      subject.commit();
      subject.idle();
      subject.commit();
      expect(subject.settleGeometry).toHaveBeenCalledTimes(1);

      // A third row brings a third sample, and with it an average.
      const rows = toRows(['a', 'b', 'c']);
      subject.measure('c', 20);
      subject.ledger.acceptCollection(rows, 32, subject.ledger.isInvalidatedBy(rows, 32));
      subject.hydrate();
      subject.commit(rows);
      subject.idle();
      subject.commit(rows);
      expect(subject.ledger.isRefinementExhausted()).toBe(false);
      expect(subject.ledger.readEstimate()).toBe(20);
      expect(subject.settleGeometry).toHaveBeenCalledTimes(2);
    });

    it('holds the refresh off while the user scrolls', () => {
      const subject = createSubject();
      subject.measure('a', 20);
      subject.measure('b', 20);
      subject.measure('c', 20);
      subject.setGestureActive(true);

      subject.commit();
      subject.idle();
      subject.commit();
      expect(subject.ledger.readEstimate()).toBe(null);

      // The gesture settling schedules the commit that refreshes.
      subject.setGestureActive(false);
      subject.ledger.noteSettled();
      subject.idle();
      subject.commit();
      expect(subject.ledger.readEstimate()).toBe(20);
    });

    it('demotes heights cached outside the first sample, but not a header', () => {
      const subject = createSubject();
      subject.measure('a', 20);
      subject.measure('b', 20);
      subject.measure('c', 20);
      // Measured before the layout settled, and no longer mounted.
      subject.measure('gone', 50);
      subject.measure('header', 50);
      const isItemRowId = (rowId: React.Key) => rowId !== 'header';

      subject.commit(subject.rows, { isItemRowId });
      subject.idle();
      subject.commit(subject.rows, { isItemRowId });

      expect(subject.entries.get('gone')).toEqual(
        expect.objectContaining({ content: 20, needsFirstMeasurement: true }),
      );
      expect(subject.entries.get('header')).toEqual(
        expect.objectContaining({ content: 50, needsFirstMeasurement: false }),
      );
    });

    it('keeps heights measured while scrolling once the layout has settled', () => {
      const subject = createSubject(['a', 'b', 'c', 'd']);
      subject.measure('a', 20);
      subject.measure('b', 20);
      subject.measure('c', 20);
      const firstRows = subject.rows.slice(0, 3);
      subject.commit(firstRows);
      subject.idle();
      subject.commit(firstRows);
      expect(subject.ledger.readEstimate()).toBe(20);

      // Measured while scrolling, then scrolled away from: as real as the sample.
      subject.measure('scrolled', 50);
      subject.measure('d', 40);
      subject.hydrate();
      subject.commit();
      subject.idle();
      subject.commit();

      expect(subject.ledger.readEstimate()).toBe(25);
      expect(subject.entries.get('scrolled')?.needsFirstMeasurement).toBe(false);
    });

    it('runs again once its effects are set up again', () => {
      const subject = createSubject(['a', 'b']);
      subject.measure('a', 20);
      subject.measure('b', 20);
      subject.commit();
      // The same commit's refresh, run again as Strict Mode does, changes nothing.
      subject.commit();
      expect(subject.settleGeometry).not.toHaveBeenCalled();

      subject.ledger.disconnect();
      subject.commit();

      expect(subject.settleGeometry).toHaveBeenCalledTimes(1);
    });
  });
});
