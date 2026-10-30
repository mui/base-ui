'use client';
import * as React from 'react';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
import { useRefWithInit } from '@base-ui/utils/useRefWithInit';
import { useTimeout } from '@base-ui/utils/useTimeout';
import type { VirtualizerRow } from '../internals/virtualization/types';
import { RowHeightLedger } from './rowHeightLedger';
import type { RowHeightCache } from './rowHeightLedger';
import { SCROLL_IDLE_MS } from './useScrollGesture';

export interface UseRowHeightLedgerParameters<RowModel> {
  /** The engine's height cache, which the ledger is the only reader and writer of. */
  cache: RowHeightCache;
  /** The item rows: the running average describes items alone. */
  rows: VirtualizerRow<RowModel>[];
  /**
   * The collection-wide estimate to refine, or `null` when the estimate is per item. A per-item
   * estimate encodes knowledge a global average would override, so it is used as provided.
   */
  staticEstimatedItemHeight: number | null;
}

/**
 * Creates the {@link RowHeightLedger} for a virtualizer's lifetime, and works out what this render
 * knows of it: whether the collection invalidates the running average, and the average the
 * render's geometry is built on.
 */
export function useRowHeightLedger<RowModel>(parameters: UseRowHeightLedgerParameters<RowModel>) {
  const { cache, rows, staticEstimatedItemHeight } = parameters;

  const idleTimeout = useTimeout();
  const [revision, bumpRevision] = React.useReducer((value: number) => value + 1, 0);
  const ledger = useRefWithInit(
    () =>
      new RowHeightLedger<RowModel>(
        {
          cache,
          requestRefresh: bumpRevision,
          scheduleIdle: (callback) => idleTimeout.start(SCROLL_IDLE_MS, callback),
        },
        rows,
        staticEstimatedItemHeight,
      ),
  ).current;

  const enabled = staticEstimatedItemHeight != null;
  const invalidated = ledger.isInvalidatedBy(rows, staticEstimatedItemHeight);

  useIsoLayoutEffect(() => {
    ledger.acceptCollection(rows, staticEstimatedItemHeight, invalidated);
  }, [invalidated, ledger, rows, staticEstimatedItemHeight]);

  useIsoLayoutEffect(() => () => ledger.disconnect(), [ledger]);

  // The engine reads estimates while it renders, so this must stay callable there.
  const readEstimate = React.useCallback(() => ledger.readEstimate(), [ledger]);

  return {
    /** Whether a static estimate is being refined at all. */
    enabled,
    /**
     * The running average this render's geometry is built on, or `null`. The collection this
     * render shows may have invalidated the published one, which is dropped only once it commits.
     */
    estimate: invalidated ? null : ledger.readEstimate(),
    /** Whether this render's collection invalidated the running average. */
    invalidated,
    ledger,
    readEstimate,
    /** Changes whenever measurements arrived or a gesture settled, which the refresh reads. */
    revision,
  };
}
