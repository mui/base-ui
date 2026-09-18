'use client';
import * as React from 'react';
import { useStableCallback } from '@base-ui/utils/useStableCallback';
import type { VirtualizerItemRowModel, VirtualizerRow } from '../internals/virtualization/types';

const DEFAULT_ESTIMATED_ITEM_HEIGHT = 32;

export interface ItemHeightEstimate {
  /** What a row is assumed to be worth before it has been measured. Never below one pixel. */
  getEstimatedItemHeight: (rowIndex: number) => number;
  /** The estimate for a row this collection does not have, and for the geometry as a whole. */
  defaultEstimatedItemHeight: number;
  /**
   * The single number every row is assumed to be, or `null` when the estimate is per item. Only a
   * collection-wide estimate can be refined into a running average.
   */
  staticEstimatedItemHeight: number | null;
  /** Drops the per-item estimates, so they are derived again against the layout in force now. */
  invalidate: () => void;
}

export interface UseItemHeightEstimateParameters<Item> {
  estimatedItemHeight: number | ((item: Item, index: number) => number) | undefined;
  items: ReadonlyArray<Item>;
  rows: VirtualizerRow<VirtualizerItemRowModel<Item>>[];
}

/**
 * Answers how tall an unmeasured row is likely to be.
 *
 * A per-item estimate is resolved once per collection rather than per render, because the engine
 * rehydrates its whole geometry whenever the estimate it was given changes identity, and a
 * feature layer writing that callback inline hands over a new identity on every one of its
 * renders. Resolving to plain numbers also lets an unchanged collection keep the previous values:
 * a re-derived array of equal numbers is not a geometry change.
 */
export function useItemHeightEstimate<Item>(
  parameters: UseItemHeightEstimateParameters<Item>,
): ItemHeightEstimate {
  const { estimatedItemHeight, items, rows } = parameters;

  const cacheRef = React.useRef<{
    rows: VirtualizerRow<VirtualizerItemRowModel<Item>>[];
    values: number[];
  } | null>(null);
  // Read through a ref so the collection, not the callback's identity, decides when the per-item
  // estimates are derived again. They are contracted as pure functions of the item, and
  // `remeasure()` is how a change in what they return is announced.
  const estimatedItemHeightRef = React.useRef(estimatedItemHeight);
  estimatedItemHeightRef.current = estimatedItemHeight;

  const isPerItem = typeof estimatedItemHeight === 'function';
  const staticEstimatedItemHeight = isPerItem
    ? null
    : (estimatedItemHeight ?? DEFAULT_ESTIMATED_ITEM_HEIGHT);
  let cachedItemValues: number[] | null = null;

  if (isPerItem) {
    const cache = cacheRef.current;
    if (cache != null && cache.rows === rows) {
      cachedItemValues = cache.values;
    } else {
      const estimate = estimatedItemHeightRef.current as (item: Item, index: number) => number;
      const values = items.map((item, index) => estimate(item, index));
      const previousValues = cache?.values;
      // Keep the previous array when the new collection resolves to the same estimates, so the
      // engine is not told that its geometry changed.
      const valuesAreEqual =
        previousValues != null &&
        previousValues.length === values.length &&
        values.every((value, index) => Object.is(value, previousValues[index]));
      cachedItemValues = valuesAreEqual ? previousValues : values;
      cacheRef.current = { rows, values: cachedItemValues };
    }
  }

  const itemValues = cachedItemValues;
  const getEstimatedItemHeight = React.useCallback(
    (rowIndex: number) =>
      Math.max(
        1,
        itemValues == null
          ? (staticEstimatedItemHeight ?? DEFAULT_ESTIMATED_ITEM_HEIGHT)
          : (itemValues[rowIndex] ?? 1),
      ),
    [itemValues, staticEstimatedItemHeight],
  );

  // An empty collection has no first row to ask, so a per-item estimate has nothing to say and
  // falls back to the smallest usable height.
  const defaultEstimatedItemHeight =
    rows.length === 0 ? Math.max(1, staticEstimatedItemHeight ?? 1) : getEstimatedItemHeight(0);

  const invalidate = useStableCallback(() => {
    cacheRef.current = null;
  });

  return React.useMemo(
    () => ({
      defaultEstimatedItemHeight,
      getEstimatedItemHeight,
      invalidate,
      staticEstimatedItemHeight,
    }),
    [defaultEstimatedItemHeight, getEstimatedItemHeight, invalidate, staticEstimatedItemHeight],
  );
}
