import { expect, describe, it } from 'vitest';
import { RowHeightLedger } from './rowHeightLedger';
import type { RowHeightCache, RowHeightEntry } from './rowHeightLedger';

/** An engine height cache in memory: entries by row, as the engine keeps them. */
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
    hydrate: () => {},
    reset: () => entries.clear(),
    observe: () => () => {},
  };
  return { cache, entries };
}

function createLedger() {
  const { cache, entries } = createCache();
  const committed = new Set<React.Key>();
  const ledger = new RowHeightLedger({
    cache,
    isCommitted: (rowId) => committed.has(rowId),
    markCommitted: (rowId) => committed.add(rowId),
  });
  return { committed, entries, ledger };
}

/** The entry the engine works out for a measured row before handing it to the ledger. */
function measured(height: number): RowHeightEntry {
  return { autoHeight: true, content: height, needsFirstMeasurement: false };
}

const ESTIMATE = () => 30;

describe('RowHeightLedger', () => {
  describe('scrollbar drags', () => {
    it('commits the estimate in place of a measurement taken during a drag', () => {
      const { committed, ledger } = createLedger();
      const entry = measured(90);

      ledger.applyRowHeight(entry, 'row-1', true, ESTIMATE);

      expect(entry.content).toBe(30);
      expect(ledger.getDeferredHeight('row-1')).toBe(90);
      expect(committed.has('row-1')).toBe(false);
    });

    it('commits the held-back measurement once the drag has ended, and then forgets it', () => {
      const { committed, ledger } = createLedger();
      ledger.applyRowHeight(measured(90), 'row-1', true, ESTIMATE);

      // The hydration after the release hands the ledger the entry as the drag left it.
      const entry = measured(30);
      ledger.applyRowHeight(entry, 'row-1', false, ESTIMATE);

      expect(entry.content).toBe(90);
      expect(committed.has('row-1')).toBe(true);
      expect(ledger.getDeferredHeight('row-1')).toBe(undefined);
      expect(ledger.hasDeferredHeights()).toBe(false);
    });

    it('keeps the newest measurement across repeated reports during a drag', () => {
      const { ledger } = createLedger();
      ledger.applyRowHeight(measured(90), 'row-1', true, ESTIMATE);
      ledger.applyRowHeight(measured(95), 'row-1', true, ESTIMATE);
      // A hydration hands back the estimate the drag committed, which is no new measurement.
      ledger.applyRowHeight(measured(30), 'row-1', true, ESTIMATE);

      expect(ledger.getDeferredHeight('row-1')).toBe(95);
    });

    it('leaves a row whose real height is already committed alone', () => {
      const { committed, ledger } = createLedger();
      committed.add('row-1');
      const entry = measured(90);

      ledger.applyRowHeight(entry, 'row-1', true, ESTIMATE);

      expect(entry.content).toBe(90);
      expect(ledger.hasDeferredHeights()).toBe(false);
    });

    it('leaves a row with a declared height alone', () => {
      const { committed, ledger } = createLedger();
      const entry: RowHeightEntry = {
        autoHeight: false,
        content: 40,
        needsFirstMeasurement: false,
      };

      ledger.applyRowHeight(entry, 'row-1', true, ESTIMATE);
      ledger.applyRowHeight(entry, 'row-1', false, ESTIMATE);

      expect(entry.content).toBe(40);
      expect(committed.has('row-1')).toBe(false);
    });

    it('drops every held-back measurement on request', () => {
      const { ledger } = createLedger();
      ledger.applyRowHeight(measured(90), 'row-1', true, ESTIMATE);

      ledger.clearDeferredHeights();

      expect(ledger.getDeferredHeight('row-1')).toBe(undefined);
      expect(ledger.hasDeferredHeights()).toBe(false);
    });
  });
});
