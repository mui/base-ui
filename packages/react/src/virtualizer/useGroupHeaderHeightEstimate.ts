'use client';
import * as React from 'react';
import { useStableCallback } from '@base-ui/utils/useStableCallback';
import type {
  VirtualizerGroup,
  VirtualizerEstimateGroupHeaderHeight,
} from '../internals/virtualization/types';
import type { GroupedRows } from '../internals/virtualization/useRowModels';

const DEFAULT_ESTIMATED_GROUP_HEADER_HEIGHT = 32;

export interface GroupHeaderHeightEstimate {
  /** What a group header is assumed to be worth before it has been measured. Never below 1px. */
  getEstimatedGroupHeaderHeight: (groupIndex: number) => number;
  /** Drops the per-group estimates, so they are derived again against the layout in force now. */
  invalidate: () => void;
}

export interface UseGroupHeaderHeightEstimateParameters<Item> {
  estimatedGroupHeaderHeight: number | VirtualizerEstimateGroupHeaderHeight<Item> | undefined;
  grouped: GroupedRows<Item> | null;
  groups: ReadonlyArray<VirtualizerGroup<Item>> | undefined;
  /**
   * The collection-wide item estimate, or `null` when the item estimate is per item. A header
   * defaults to it: headers are usually about the height of an item, and there are few of them.
   */
  staticEstimatedItemHeight: number | null;
}

/**
 * Answers how tall an unmeasured group header is likely to be.
 *
 * Headers are estimated separately from items so they never feed the running average that
 * refines a static item estimate: a handful of tall headers among short items would drag every
 * unmeasured item's estimate up. Like the item estimate, a per-group function is resolved once
 * per collection rather than per render, and an unchanged collection keeps the previous values.
 */
export function useGroupHeaderHeightEstimate<Item>(
  parameters: UseGroupHeaderHeightEstimateParameters<Item>,
): GroupHeaderHeightEstimate {
  const { estimatedGroupHeaderHeight, grouped, groups, staticEstimatedItemHeight } = parameters;

  const cacheRef = React.useRef<{
    grouped: GroupedRows<Item>;
    groups: ReadonlyArray<VirtualizerGroup<Item>>;
    values: number[];
  } | null>(null);
  // Read through a ref so the collection, not the callback's identity, decides when the per-group
  // estimates are derived again; `remeasure()` is how a change in what it returns is announced.
  const estimatedGroupHeaderHeightRef = React.useRef(estimatedGroupHeaderHeight);
  estimatedGroupHeaderHeightRef.current = estimatedGroupHeaderHeight;

  const isPerGroup = typeof estimatedGroupHeaderHeight === 'function';
  // A per-item estimate leaves nothing collection-wide to default to, so the library default
  // stands in; the first item's own estimate would be one value stretched over every header.
  const staticEstimate = isPerGroup
    ? null
    : (estimatedGroupHeaderHeight ??
      staticEstimatedItemHeight ??
      DEFAULT_ESTIMATED_GROUP_HEADER_HEIGHT);

  let cachedValues: number[] | null = null;

  if (isPerGroup && grouped != null && groups != null) {
    const cache = cacheRef.current;
    // Both identities: the projection is kept across group objects that keep their key and
    // items, and such a group can still have changed in what the estimate reads from it.
    if (cache != null && cache.grouped === grouped && cache.groups === groups) {
      cachedValues = cache.values;
    } else {
      const estimate =
        estimatedGroupHeaderHeightRef.current as VirtualizerEstimateGroupHeaderHeight<Item>;
      const values = groups.map((group, groupIndex) => estimate(group, groupIndex));
      const previousValues = cache?.values;
      const valuesAreEqual =
        previousValues != null &&
        previousValues.length === values.length &&
        values.every((value, index) => Object.is(value, previousValues[index]));
      cachedValues = valuesAreEqual ? previousValues : values;
      cacheRef.current = { grouped, groups, values: cachedValues };
    }
  }

  const values = cachedValues;
  const getEstimatedGroupHeaderHeight = React.useCallback(
    (groupIndex: number) =>
      Math.max(
        1,
        values == null
          ? (staticEstimate ?? DEFAULT_ESTIMATED_GROUP_HEADER_HEIGHT)
          : (values[groupIndex] ?? 1),
      ),
    [staticEstimate, values],
  );

  const invalidate = useStableCallback(() => {
    cacheRef.current = null;
  });

  return React.useMemo(
    () => ({ getEstimatedGroupHeaderHeight, invalidate }),
    [getEstimatedGroupHeaderHeight, invalidate],
  );
}
