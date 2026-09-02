'use client';
import * as React from 'react';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
import { useRefWithInit } from '@base-ui/utils/useRefWithInit';
import { useStableCallback } from '@base-ui/utils/useStableCallback';
import { useTimeout } from '@base-ui/utils/useTimeout';
import type { HeightEntry, RenderContext, Virtualizer as MuiVirtualizer } from '@mui/x-virtualizer';
import type { VirtualizerRow } from '../internals/virtualization/types';
import { SCROLL_IDLE_MS, type ScrollGesture } from './useScrollGesture';

/**
 * Minimum number of measured rows before a static estimate is replaced with their running
 * average, so a single unusual first row cannot skew the whole virtual geometry while still
 * allowing tall rows to reduce the settled render window.
 */
const ADAPTIVE_ESTIMATE_MIN_SAMPLES = 3;

interface AdaptiveEstimateInternals {
  /** The running average currently published to the engine, or `null` while none applies. */
  estimateRef: React.RefObject<number | null>;
  /** Heights of the rows sampled so far, and their running total. */
  measurements: { heights: Map<React.Key, number>; total: number };
  /** Rows whose real height is part of the committed geometry. */
  measuredRows: Set<React.Key>;
  measurementRevision: number;
  /** Coalesces ResizeObserver hydrations before a sample is taken. */
  hydrationTimeout: ReturnType<typeof useTimeout>;
  hydratedRowsMetaRef: React.RefObject<unknown>;
}

/**
 * The question the rest of the virtualizer asks about row heights it has not measured: what to
 * assume they are, and whether what it assumed a moment ago still describes this collection.
 */
export interface AdaptiveEstimate {
  /** Whether a static estimate is being refined at all. Per-row estimate functions are not. */
  enabled: boolean;
  /**
   * Whether this render's collection invalidated the running average. The decision is made during
   * render because the estimate it invalidates is part of this render's geometry, but the caches
   * behind it are only rewritten in a layout effect: a concurrent render that React discards must
   * not clear measurements the committed tree is still using.
   */
  invalidated: boolean;
  /** The running average this render's geometry is built on, or `null`. */
  estimate: number | null;
  /**
   * Reads the published running average. Callers that run after the refresh pass must read it
   * through here rather than through {@link AdaptiveEstimate.estimate}: the refresh republishes
   * the average to the engine without a re-render.
   */
  readEstimate: () => number | null;
  isMeasured: (rowId: React.Key) => boolean;
  markMeasured: (rowId: React.Key) => void;
  /** Drops the running average and every measurement behind it. */
  reset: () => void;
  /** Announces that row heights changed, so the deferred refresh reconsiders the average. */
  noteMeasurements: () => void;
  /** @internal Shared with {@link useAdaptiveEstimateRefresh}, which owns the deferred pass. */
  internals: AdaptiveEstimateInternals;
}

export interface UseAdaptiveEstimateParameters<RowModel> {
  rows: VirtualizerRow<RowModel>[];
  /**
   * The collection-wide estimate to refine, or `null` when the estimate is per item. A per-item
   * estimate encodes knowledge a global average would override, so it is used as provided.
   */
  staticEstimatedItemHeight: number | null;
}

/**
 * Owns the running average that replaces a static `estimatedItemHeight` for unmeasured rows, so
 * the virtual total converges after the first measured window instead of accumulating the
 * estimate error row by row.
 *
 * This half tracks the samples and decides when the collection has moved on far enough that they
 * no longer describe it. {@link useAdaptiveEstimateRefresh} owns the pass that turns them into a
 * new average.
 */
export function useAdaptiveEstimate<RowModel>(
  parameters: UseAdaptiveEstimateParameters<RowModel>,
): AdaptiveEstimate {
  const { rows, staticEstimatedItemHeight } = parameters;

  const enabled = staticEstimatedItemHeight != null;

  const estimateRef = React.useRef<number | null>(null);
  const measurementsRef = useRefWithInit(() => ({
    heights: new Map<React.Key, number>(),
    total: 0,
  }));
  const measuredRowsRef = useRefWithInit(() => new Set<React.Key>());
  const sampledRowsRef = React.useRef(rows);
  const sampledEstimatedItemHeightRef = React.useRef(staticEstimatedItemHeight);
  // Filtering replaces the row array, but measurements from the same keyed collection remain
  // useful when the full list returns. Reset only when the estimate or logical collection changes.
  const knownRowIdsRef = useRefWithInit(() => new Set(rows.map((row) => row.id)));
  const hydrationTimeout = useTimeout();
  const hydratedRowsMetaRef = React.useRef<unknown>(null);
  const [measurementRevision, bumpMeasurementRevision] = React.useReducer(
    (value: number) => value + 1,
    0,
  );

  // Whether the running average still describes the collection this render shows.
  let invalidated = false;
  if (
    sampledRowsRef.current !== rows ||
    sampledEstimatedItemHeightRef.current !== staticEstimatedItemHeight
  ) {
    const knownRowIds = knownRowIdsRef.current;
    const nextRowIds = new Set(rows.map((row) => row.id));
    const estimateChanged = sampledEstimatedItemHeightRef.current !== staticEstimatedItemHeight;
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

    invalidated = estimateChanged || collectionChanged;
  }

  useIsoLayoutEffect(() => {
    if (
      sampledRowsRef.current === rows &&
      sampledEstimatedItemHeightRef.current === staticEstimatedItemHeight
    ) {
      return;
    }

    sampledRowsRef.current = rows;
    sampledEstimatedItemHeightRef.current = staticEstimatedItemHeight;

    const knownRowIds = knownRowIdsRef.current;

    if (invalidated) {
      estimateRef.current = null;
      measurementsRef.current.heights.clear();
      measurementsRef.current.total = 0;
      measuredRowsRef.current.clear();
      knownRowIds.clear();
    }

    rows.forEach((row) => knownRowIds.add(row.id));
  }, [
    invalidated,
    knownRowIdsRef,
    measurementsRef,
    measuredRowsRef,
    rows,
    staticEstimatedItemHeight,
  ]);

  // The engine reads estimates and reports measurements while it renders, so these must stay
  // callable there: they only read and write refs.
  const readEstimate = React.useCallback(() => estimateRef.current, []);
  const isMeasured = React.useCallback(
    (rowId: React.Key) => measuredRowsRef.current.has(rowId),
    [measuredRowsRef],
  );
  const markMeasured = React.useCallback(
    (rowId: React.Key) => {
      measuredRowsRef.current.add(rowId);
    },
    [measuredRowsRef],
  );
  const reset = useStableCallback(() => {
    estimateRef.current = null;
    measurementsRef.current.heights.clear();
    measurementsRef.current.total = 0;
    measuredRowsRef.current.clear();
  });

  const internals = React.useMemo<AdaptiveEstimateInternals>(
    () => ({
      estimateRef,
      hydratedRowsMetaRef,
      hydrationTimeout,
      measuredRows: measuredRowsRef.current,
      measurementRevision,
      measurements: measurementsRef.current,
    }),
    [hydrationTimeout, measuredRowsRef, measurementRevision, measurementsRef],
  );

  // The layout effect that clears an invalidated running average has not run yet in the render
  // that invalidates it, so the published value must be ignored until it has.
  const estimate = invalidated ? null : estimateRef.current;

  return React.useMemo(
    () => ({
      enabled,
      estimate,
      internals,
      invalidated,
      isMeasured,
      markMeasured,
      noteMeasurements: bumpMeasurementRevision,
      readEstimate,
      reset,
    }),
    [enabled, estimate, internals, invalidated, isMeasured, markMeasured, readEstimate, reset],
  );
}

export interface UseAdaptiveEstimateRefreshParameters<RowModel> {
  adaptive: AdaptiveEstimate;
  apiRef: React.RefObject<MuiVirtualizer['api'] | null>;
  /**
   * The estimate a row falls back to without a running average. Carried so a change to it starts
   * a fresh sampling pass.
   */
  defaultEstimatedItemHeight: number;
  gesture: ScrollGesture;
  /** The window the sample is taken from. Only settled rendered rows are trusted. */
  renderContext: RenderContext;
  rows: VirtualizerRow<RowModel>[];
  /** The engine's row geometry, which republishes on every hydration. */
  rowsMeta: unknown;
  store: MuiVirtualizer['store'];
}

/**
 * Refreshes the running average once scrolling has settled.
 *
 * The refresh is deferred until scrolling stops. It reassigns the height of every unmeasured
 * row, so on a long list even a small change in the average moves the total by thousands of
 * pixels; doing that mid-gesture is what drags the scrollbar thumb out from under the pointer.
 * Waiting for idle also lets the first measurements settle, which keeps the list from chasing
 * an average that is still wrong.
 *
 * Re-estimating rows above the viewport shifts their positions, and scroll anchoring compensates
 * for that on the resulting commit — so this must be declared after `useScrollAnchor`.
 */
export function useAdaptiveEstimateRefresh<RowModel>(
  parameters: UseAdaptiveEstimateRefreshParameters<RowModel>,
): void {
  const {
    adaptive,
    apiRef,
    defaultEstimatedItemHeight,
    gesture,
    renderContext,
    rows,
    rowsMeta,
    store,
  } = parameters;
  const {
    estimateRef,
    hydratedRowsMetaRef,
    hydrationTimeout,
    measuredRows,
    measurementRevision,
    measurements,
  } = adaptive.internals;
  const { enabled, noteMeasurements } = adaptive;
  const { firstRowIndex, lastRowIndex } = renderContext;

  useIsoLayoutEffect(() => {
    if (!enabled) {
      return;
    }

    // Coalesce ResizeObserver hydrations before accepting measurements. Opening popups can
    // temporarily lay rows out at an intermediate width; those sizes must not seed a collection-
    // wide estimate before the final layout has settled.
    if (hydratedRowsMetaRef.current !== rowsMeta) {
      hydratedRowsMetaRef.current = rowsMeta;
      hydrationTimeout.start(SCROLL_IDLE_MS, noteMeasurements);
      return;
    }

    // While a scrollbar drag is in progress the gesture owns the geometry even when the thumb is
    // held still, so the idle timer alone must not release the refresh.
    if (gesture.isScrolling() || gesture.isScrollbarDrag()) {
      return;
    }

    // Only sample the settled rendered range. MUI's cache retains measurements after rows unmount,
    // including transient measurements taken while a popup is initially resolving its width.
    // Treating every cached entry as authoritative biases the estimate long after the DOM settles.
    const heightCache = store.state.rowHeights as Map<React.Key, HeightEntry>;
    for (let rowIndex = firstRowIndex; rowIndex < lastRowIndex; rowIndex += 1) {
      const row = rows[rowIndex];
      const entry = row == null ? undefined : heightCache.get(row.id);
      // A zero height is a row that is not laid out, never a measurement of it.
      if (row != null && entry != null && !entry.needsFirstMeasurement && entry.content > 0) {
        const previousHeight = measurements.heights.get(row.id);
        if (previousHeight !== entry.content) {
          measurements.heights.set(row.id, entry.content);
          measurements.total += entry.content - (previousHeight ?? 0);
        }
      }
    }
    const measuredCount = measurements.heights.size;

    if (measuredCount < ADAPTIVE_ESTIMATE_MIN_SAMPLES) {
      return;
    }

    const average = measurements.total / measuredCount;
    const applied = estimateRef.current;

    // Judge refinements by their aggregate effect on the unmeasured collection. A sub-pixel
    // per-row error is still thousands of pixels on a long list and visibly changes its scrollbar.
    const unmeasuredRowCount = Math.max(1, rows.length - measuredCount);
    if (applied != null && Math.abs(average - applied) * unmeasuredRowCount < 1) {
      return;
    }

    // Rows measured during a transient layout or an active gesture were deliberately excluded from
    // the settled sample above. Do not let those stale entries continue overriding the new estimate
    // in the collection total; they will be measured again if they re-enter the rendered window.
    for (const [rowId, entry] of heightCache) {
      if (!entry.needsFirstMeasurement && !measurements.heights.has(rowId)) {
        entry.content = average;
        entry.needsFirstMeasurement = true;
        // A demoted row's real height is no longer part of the geometry. Leaving it marked as
        // measured would let a remeasurement commit that height mid-drag, moving the scrollbar
        // under the pointer — the drag deferral trusts this set to skip already-settled rows.
        measuredRows.delete(rowId as React.Key);
      }
    }

    estimateRef.current = average;
    apiRef.current?.rowsMeta.hydrateRowsMeta();
  }, [
    apiRef,
    defaultEstimatedItemHeight,
    enabled,
    estimateRef,
    firstRowIndex,
    gesture,
    hydratedRowsMetaRef,
    hydrationTimeout,
    lastRowIndex,
    measuredRows,
    measurementRevision,
    measurements,
    noteMeasurements,
    rows,
    rowsMeta,
    store,
  ]);
}
