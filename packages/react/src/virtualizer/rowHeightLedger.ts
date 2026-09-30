/**
 * A row's entry in the engine's height cache. The engine hands the same mutable object to every
 * reader, so a write to it is what the next hydration commits.
 */
export interface RowHeightEntry {
  /** The height the geometry gives the row: measured, declared, or estimated. */
  content: number;
  /** Whether no measurement has arrived for the row yet, so `content` is not a real height. */
  needsFirstMeasurement: boolean;
  /** Whether the row is measured from the DOM rather than given a declared height. */
  autoHeight: boolean;
}

/**
 * The engine's cache of row heights, as far as the virtualizer reads and writes it. Every access
 * to the cache goes through here, apart from the engine's own ResizeObserver, which stores the
 * measurements of the rows it observes.
 */
export interface RowHeightCache {
  /** Every row the cache holds an entry for, mounted or not. */
  entries: () => Iterable<[React.Key, RowHeightEntry]>;
  /** A row's entry, or `undefined` when the cache has none. */
  peek: (rowId: React.Key) => RowHeightEntry | undefined;
  /** Whether a measurement has arrived for a row, as opposed to an estimate standing in. */
  hasMeasurement: (rowId: React.Key) => boolean;
  /** Stores a row's measured height, for the next hydration to commit. */
  store: (rowId: React.Key, height: number) => void;
  /** Records that the rows up to this one have been laid out and so can be measured. */
  setLastMeasuredRowIndex: (rowIndex: number) => void;
  /** Commits the cache to the geometry, recomputing every row position. */
  hydrate: () => void;
  /** Drops every entry and hydrates, so every row falls back to its estimate. */
  reset: () => void;
  /** Observes a row element's height until the returned function is called. */
  observe: (element: HTMLElement, rowId: React.Key) => () => void;
}

export interface RowHeightLedgerEnvironment {
  cache: RowHeightCache;
  /** Whether a row's real height is part of the committed geometry. */
  isCommitted: (rowId: React.Key) => boolean;
  /** Records that a row's real height is part of the committed geometry. */
  markCommitted: (rowId: React.Key) => void;
}

/**
 * Owns what the virtualizer knows about each row's height: the height the engine's cache holds for
 * it, and whether that height is real, estimated, or held back.
 *
 * A scrollbar drag holds measurements back: the user dictates the absolute scroll position, and a
 * real height committed mid-drag would move the geometry, and with it the thumb, out from under
 * the pointer. The rows' estimates stand in until the drag releases, and the real heights are
 * committed together in the hydration that follows.
 */
export class RowHeightLedger {
  /** Real heights a scrollbar drag is holding back, by row. */
  private readonly deferredHeights = new Map<React.Key, number>();

  constructor(private readonly environment: RowHeightLedgerEnvironment) {}

  /**
   * Settles the height the engine commits for a row in a hydration, given the entry the engine
   * worked out: a measurement arrived during a scrollbar drag is held back and the estimate
   * committed in its place, and one held back before is committed once the drag has ended.
   */
  applyRowHeight(
    entry: RowHeightEntry,
    rowId: React.Key,
    isScrollbarDrag: boolean,
    getEstimatedHeight: () => number,
  ) {
    const { isCommitted, markCommitted } = this.environment;

    // A row whose height was declared is already final: it is never measured, so there is no
    // measurement to defer through a scrollbar drag and none to sample for the average.
    if (!entry.autoHeight && !entry.needsFirstMeasurement) {
      return;
    }

    if (!isScrollbarDrag) {
      const deferredHeight = this.deferredHeights.get(rowId);
      if (deferredHeight != null) {
        this.deferredHeights.delete(rowId);
        entry.content = deferredHeight;
      }
      if (!entry.needsFirstMeasurement) {
        markCommitted(rowId);
      }
      return;
    }

    // A row whose real height is already committed keeps it: holding it back now would move the
    // geometry as much as committing a new one.
    if (entry.needsFirstMeasurement || isCommitted(rowId)) {
      return;
    }

    const estimatedHeight = getEstimatedHeight();
    // ResizeObserver may report the same mounted row more than once during a drag. Keep the newest
    // real height, but do not mistake the estimate committed in its place for a new measurement.
    if (!this.deferredHeights.has(rowId) || entry.content !== estimatedHeight) {
      this.deferredHeights.set(rowId, entry.content);
    }
    entry.content = estimatedHeight;
  }

  /** The real height a drag is holding back for a row, if any. Safe to call during render. */
  getDeferredHeight(rowId: React.Key) {
    return this.deferredHeights.get(rowId);
  }

  /** Whether a drag has held back any measurement that has not been committed since. */
  hasDeferredHeights() {
    return this.deferredHeights.size > 0;
  }

  /** Drops every held-back measurement, for a caller that is re-measuring from scratch. */
  clearDeferredHeights() {
    this.deferredHeights.clear();
  }
}
