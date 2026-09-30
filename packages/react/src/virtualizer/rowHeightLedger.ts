import type { RowWindow } from './geometry';
import type { VirtualizerRow } from '../internals/virtualization/types';

/**
 * Minimum number of measured rows before a static estimate is replaced with their running
 * average, so a single unusual first row cannot skew the whole virtual geometry while still
 * allowing tall rows to reduce the settled render window.
 */
const ADAPTIVE_ESTIMATE_MIN_SAMPLES = 3;

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
  /**
   * Runs the callback once measurements have stopped arriving for a while, replacing a callback
   * scheduled before. Coalesces ResizeObserver hydrations before a sample is taken.
   */
  scheduleIdle: (callback: () => void) => void;
  /** Schedules a commit, whose refresh then reconsiders the average. */
  requestRefresh: () => void;
}

/** A laid-out row element whose height can be read, and the row it stands for. */
export interface MeasurableRow {
  element: HTMLElement;
  rowId: React.Key;
  rowIndex: number;
}

/** What the refresh reads of the render the current commit is for. */
export interface RowHeightRefreshInputs<RowModel> {
  /** Whether a static estimate is being refined at all. Per-row estimate functions are not. */
  enabled: boolean;
  /** The item rows: the average describes items, so headers neither seed it nor count in it. */
  rows: VirtualizerRow<RowModel>[];
  /** The rendered window, in item space. Only settled rendered rows are sampled. */
  window: RowWindow;
  /** The engine's row geometry, which republishes on every hydration. */
  rowsMeta: unknown;
  /** Changes whenever measurements arrived or a gesture settled since the last commit. */
  revision: number;
  /**
   * The estimate a row falls back to without a running average. Carried so a change to it starts
   * a fresh sampling pass.
   */
  defaultEstimatedItemHeight: number;
  /**
   * Whether a cached row is an item rather than a group header, for a list with headers, or
   * `undefined` for a flat list. A header is measured like any row, but it is no sample of the
   * items' average, and its measured height must survive a refresh that demotes items.
   */
  isItemRowId: ((rowId: React.Key) => boolean) | undefined;
  /** Whether the user is scrolling or dragging the scrollbar, which holds a refresh off. */
  isGestureActive: () => boolean;
  /**
   * Commits the refreshed estimate to the engine's geometry in one update, holding the content the
   * user is looking at in place. It may do so after the refresh returns, before the next paint.
   */
  settleGeometry: () => void;
}

/**
 * Owns what the virtualizer knows about each row's height: whether the height the engine's cache
 * holds for it is real, estimated, or held back, and the running average that estimates the rows
 * not measured yet. Apart from the engine's own ResizeObserver, every read and write of the
 * engine's height cache goes through here.
 *
 * A scrollbar drag holds measurements back: the user dictates the absolute scroll position, and a
 * real height committed mid-drag would move the geometry, and with it the thumb, out from under
 * the pointer. The rows' estimates stand in until the drag releases, and the real heights are
 * committed together in the hydration that follows.
 *
 * The running average replaces a static `estimatedItemHeight` for unmeasured rows, so the virtual
 * total converges after the first measured window instead of accumulating the estimate error row
 * by row. It is refreshed once scrolling has settled: it reassigns the height of every unmeasured
 * row, so on a long list even a small change in the average moves the total by thousands of
 * pixels, and doing that mid-gesture is what drags the scrollbar thumb out from under the
 * pointer. Waiting for idle also lets the first measurements settle, which keeps the list from
 * chasing an average that is still wrong.
 *
 * The owner decides during render whether a collection invalidates the average, accepts the
 * collection in a layout effect, publishes each commit's inputs before the layout effects run,
 * and runs `refresh()` in the commit after the viewport has anchored it.
 */
export class RowHeightLedger<RowModel> {
  /** Real heights a scrollbar drag is holding back, by row. */
  private readonly deferredHeights = new Map<React.Key, number>();

  /** Rows whose real height is part of the committed geometry. */
  private readonly committedRows = new Set<React.Key>();

  /** The running average currently published to the engine, or `null` while none applies. */
  private estimate: number | null = null;

  /** Heights of the rows sampled so far, and their running total. */
  private readonly samples = { heights: new Map<React.Key, number>(), total: 0 };

  /**
   * Whether the settled window has been sampled in full without reaching enough samples for an
   * average, so no refinement can come from it. Cleared by the next new sample.
   */
  private refinementExhausted = false;

  /**
   * Whether heights cached for rows that are no longer mounted may be stale. True until the first
   * refresh after the samples were taken afresh, since rows measured before any sample was taken
   * may have been laid out transiently, and set again when a sampled row measures differently,
   * which means the layout changed.
   */
  private cachedHeightsMayBeStale = true;

  /** The geometry the last idle wait was started for. */
  private hydratedRowsMeta: unknown = null;

  // The collection the samples describe. Filtering replaces the row array, but measurements from
  // the same keyed collection remain useful when the full list returns, so the samples are reset
  // only when the estimate or the logical collection changes.
  private sampledRows: VirtualizerRow<RowModel>[];
  private sampledEstimatedItemHeight: number | null;
  private readonly knownRowIds: Set<React.Key>;

  private inputs: RowHeightRefreshInputs<RowModel> | null = null;
  private lastRefreshInputs: unknown[] | null = null;

  constructor(
    private readonly environment: RowHeightLedgerEnvironment,
    rows: VirtualizerRow<RowModel>[],
    staticEstimatedItemHeight: number | null,
  ) {
    this.sampledRows = rows;
    this.sampledEstimatedItemHeight = staticEstimatedItemHeight;
    this.knownRowIds = new Set(rows.map((row) => row.id));
  }

  /**
   * Settles the height the engine commits for a row in a hydration, given the entry the engine
   * worked out: a measurement arrived during a scrollbar drag is held back and the estimate
   * committed in its place, and one held back before is committed once the drag has ended.
   * Called by the engine while it renders: it only reads and writes the ledger's own state.
   */
  applyRowHeight(
    entry: RowHeightEntry,
    rowId: React.Key,
    isScrollbarDrag: boolean,
    getEstimatedHeight: () => number,
  ) {
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
        this.committedRows.add(rowId);
      }
      return;
    }

    // A row whose real height is already committed keeps it: holding it back now would move the
    // geometry as much as committing a new one.
    if (entry.needsFirstMeasurement || this.committedRows.has(rowId)) {
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

  /** Whether a measurement has arrived for a row, as opposed to an estimate standing in. */
  hasMeasurement(rowId: React.Key) {
    return this.environment.cache.hasMeasurement(rowId);
  }

  /**
   * The running average published to the engine, or `null`. The refresh republishes it without a
   * re-render, so a reader after the refresh must read it here rather than from a render's value.
   * Safe to call during render.
   */
  readEstimate() {
    return this.estimate;
  }

  /**
   * Whether the rows on hand cannot produce an average: the settled window is sampled in full and
   * the samples are still too few. A concern waiting for the average stops waiting on it.
   */
  isRefinementExhausted() {
    return this.refinementExhausted;
  }

  /**
   * Whether a render's collection invalidates the running average: the estimate it refines
   * changed, or the collection was replaced rather than filtered or extended. Decided during
   * render, because the average it invalidates is part of that render's geometry; the samples are
   * only dropped once the collection is accepted, since a concurrent render that React discards
   * must not clear measurements the committed tree is still using.
   */
  isInvalidatedBy(rows: VirtualizerRow<RowModel>[], staticEstimatedItemHeight: number | null) {
    if (
      this.sampledRows === rows &&
      this.sampledEstimatedItemHeight === staticEstimatedItemHeight
    ) {
      return false;
    }

    const knownRowIds = this.knownRowIds;
    const nextRowIds = new Set(rows.map((row) => row.id));
    const estimateChanged = this.sampledEstimatedItemHeight !== staticEstimatedItemHeight;
    const addsUnknownRows = rows.some((row) => !knownRowIds.has(row.id));
    let omitsKnownRows = false;
    for (const rowId of knownRowIds) {
      if (!nextRowIds.has(rowId)) {
        omitsKnownRows = true;
        break;
      }
    }
    // A subset is filtering and a superset is expansion. Adding and removing IDs in the same
    // update is a partial replacement, even if a selected item keeps the collections overlapping.
    const collectionChanged =
      rows.length > 0 &&
      knownRowIds.size > 0 &&
      (!rows.some((row) => knownRowIds.has(row.id)) || (addsUnknownRows && omitsKnownRows));

    return estimateChanged || collectionChanged;
  }

  /**
   * Makes a committed render's collection the one the samples describe, dropping them first when
   * the render found it invalidated them.
   */
  acceptCollection(
    rows: VirtualizerRow<RowModel>[],
    staticEstimatedItemHeight: number | null,
    invalidated: boolean,
  ) {
    if (
      this.sampledRows === rows &&
      this.sampledEstimatedItemHeight === staticEstimatedItemHeight
    ) {
      return;
    }

    this.sampledRows = rows;
    this.sampledEstimatedItemHeight = staticEstimatedItemHeight;

    if (invalidated) {
      this.dropSamples();
      this.knownRowIds.clear();
    }

    rows.forEach((row) => this.knownRowIds.add(row.id));
  }

  /**
   * Measures the laid-out rows the engine has no measurement for, and commits their heights to its
   * geometry at once. Their ResizeObserver reports the same heights a frame later, which then
   * changes nothing.
   */
  measureNewRows(rows: Iterable<MeasurableRow>) {
    const { cache } = this.environment;
    let measuredAny = false;

    for (const { element, rowId, rowIndex } of rows) {
      if (!cache.hasMeasurement(rowId)) {
        const height = element.getBoundingClientRect().height;

        if (height > 0) {
          this.storeMeasurement(rowId, rowIndex, height);
          measuredAny = true;
        }
      }
    }

    if (measuredAny) {
      cache.hydrate();
    }
  }

  /**
   * Drops every height learned so far, measures the laid-out rows again, and commits them. The
   * rows' heights are then learned again against the layout they are in now, as they mount.
   */
  remeasure(rows: Iterable<MeasurableRow>) {
    const { cache } = this.environment;
    this.dropSamples();
    this.deferredHeights.clear();
    cache.reset();

    for (const { element, rowId, rowIndex } of rows) {
      const height = element.getBoundingClientRect().height;

      if (height > 0) {
        this.storeMeasurement(rowId, rowIndex, height);
      }
    }

    cache.hydrate();
    // A new sample of the rows on screen is due.
    this.environment.requestRefresh();
  }

  /** Reconsiders the average on the next commit, as a settled gesture calls for. */
  noteSettled() {
    this.environment.requestRefresh();
  }

  /** Publishes what the next refresh reads. */
  update(inputs: RowHeightRefreshInputs<RowModel>) {
    this.inputs = inputs;
  }

  /**
   * Forgets what the last refresh ran for, so the next one runs whatever changed. For effects torn
   * down and set up again — Strict Mode does it on mount, and a revealed Activity does too — which
   * dispose of the idle wait a refresh was counting on.
   */
  disconnect() {
    this.lastRefreshInputs = null;
  }

  /**
   * Refreshes the running average from the settled window, once scrolling has stopped. Does its
   * work only on a commit that changed what it reads, as an effect with those dependencies would.
   */
  refresh() {
    const inputs = this.inputs;
    if (inputs == null) {
      return;
    }

    const refreshInputs = [
      inputs.defaultEstimatedItemHeight,
      inputs.enabled,
      inputs.isItemRowId,
      inputs.revision,
      inputs.rows,
      inputs.rowsMeta,
      inputs.window.firstRowIndex,
      inputs.window.lastRowIndex,
    ];
    const lastInputs = this.lastRefreshInputs;
    if (
      lastInputs != null &&
      refreshInputs.every((input, index) => Object.is(input, lastInputs[index]))
    ) {
      return;
    }
    this.lastRefreshInputs = refreshInputs;

    const { enabled, isGestureActive, rows, rowsMeta, settleGeometry, window } = inputs;

    if (!enabled) {
      return;
    }

    // Coalesce ResizeObserver hydrations before accepting measurements. Opening popups can
    // temporarily lay rows out at an intermediate width; those sizes must not seed a collection-
    // wide estimate before the final layout has settled.
    if (this.hydratedRowsMeta !== rowsMeta) {
      this.hydratedRowsMeta = rowsMeta;
      this.environment.scheduleIdle(this.environment.requestRefresh);
      return;
    }

    // While a scrollbar drag is in progress the gesture owns the geometry even when the thumb is
    // held still, so the idle timer alone must not release the refresh.
    if (isGestureActive()) {
      return;
    }

    const { samples } = this;

    // Only sample the settled rendered range. The engine's cache retains measurements after rows
    // unmount, including transient measurements taken while a popup is initially resolving its
    // width. Treating every cached entry as authoritative biases the estimate long after the DOM
    // settles. An empty window, such as the one the engine renders before the scrollport is
    // measured, has not been sampled at all, so it cannot declare the refinement exhausted.
    let windowSampledInFull = window.lastRowIndex > window.firstRowIndex;
    for (let rowIndex = window.firstRowIndex; rowIndex < window.lastRowIndex; rowIndex += 1) {
      const row = rows[rowIndex];
      const measuredHeight = row == null ? null : this.readMeasuredHeight(row.id);
      if (row != null && measuredHeight != null) {
        const previousHeight = samples.heights.get(row.id);
        if (previousHeight !== measuredHeight) {
          // A row sampled before that measures differently now means the layout changed, so
          // heights cached for rows no longer mounted may be stale too.
          if (previousHeight !== undefined) {
            this.cachedHeightsMayBeStale = true;
          }
          samples.heights.set(row.id, measuredHeight);
          samples.total += measuredHeight - (previousHeight ?? 0);
          // A fresh sample means the window still has something to say.
          this.refinementExhausted = false;
        }
      } else if (row != null) {
        // Still unmeasured: its measurement is on its way and will bring another pass.
        windowSampledInFull = false;
      }
    }
    const measuredCount = samples.heights.size;

    if (measuredCount < ADAPTIVE_ESTIMATE_MIN_SAMPLES) {
      // Too few samples, and none left to take from this window: the rows on hand cannot produce
      // an average, which a request waiting for one needs to hear. Said once, on the way into
      // that state — the hydration republishes the geometry, which re-arms this pass, and saying
      // it again on every pass would never stop.
      if (windowSampledInFull && !this.refinementExhausted) {
        this.refinementExhausted = true;
        settleGeometry();
      }
      return;
    }

    const average = samples.total / measuredCount;
    const applied = this.estimate;

    // Judge refinements by their aggregate effect on the unmeasured collection. A sub-pixel
    // per-row error is still thousands of pixels on a long list and visibly changes its scrollbar.
    const unmeasuredRowCount = Math.max(1, rows.length - measuredCount);
    if (applied != null && Math.abs(average - applied) * unmeasuredRowCount < 1) {
      return;
    }

    // Before the first sample, or once the layout has changed, a height cached for a row that is
    // no longer mounted may have been measured under a layout that is gone, such as while a popup
    // was still resolving its width. Such rows were not part of the settled sample above. Do not
    // let those stale entries keep overriding the new estimate in the collection total; they will
    // be measured again if they re-enter the rendered window. Without that evidence, the cached
    // heights stand: rows measured while scrolling are just as real as the sample, and demoting
    // them would move the content when they mount and measure again.
    if (this.cachedHeightsMayBeStale) {
      this.cachedHeightsMayBeStale = false;
      for (const [rowId, entry] of this.environment.cache.entries()) {
        if (
          !entry.needsFirstMeasurement &&
          !samples.heights.has(rowId) &&
          // Includes headers of groups no longer in the collection, whose measured height must
          // survive this as any header's does.
          (inputs.isItemRowId == null || inputs.isItemRowId(rowId))
        ) {
          this.demote(entry, rowId, average);
        }
      }
    }

    this.estimate = average;
    settleGeometry();
  }

  /** Drops the running average and every measurement behind it. */
  private dropSamples() {
    this.estimate = null;
    this.refinementExhausted = false;
    this.cachedHeightsMayBeStale = true;
    this.samples.heights.clear();
    this.samples.total = 0;
    this.committedRows.clear();
  }

  private storeMeasurement(rowId: React.Key, rowIndex: number, height: number) {
    const { cache } = this.environment;
    cache.store(rowId, height);
    this.committedRows.add(rowId);
    cache.setLastMeasuredRowIndex(rowIndex);
  }

  /** A row's measured height, or `null` while it has only an estimate. */
  private readMeasuredHeight(rowId: React.Key) {
    const entry = this.environment.cache.peek(rowId);
    return entry == null || entry.needsFirstMeasurement ? null : entry.content;
  }

  /**
   * Sends a row back to its estimate. The engine has a reset for every row but none for one, which
   * this needs for rows measured under a transient layout; the entries are plain mutable objects,
   * so this is what a per-row reset would do.
   */
  private demote(entry: RowHeightEntry, rowId: React.Key, height: number) {
    entry.content = height;
    entry.needsFirstMeasurement = true;
    // A demoted row's real height is no longer part of the geometry. Leaving it marked as
    // committed would let a remeasurement commit that height mid-drag, moving the scrollbar under
    // the pointer — the drag deferral trusts this set to skip already-settled rows.
    this.committedRows.delete(rowId);
  }
}
