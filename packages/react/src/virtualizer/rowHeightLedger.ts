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
