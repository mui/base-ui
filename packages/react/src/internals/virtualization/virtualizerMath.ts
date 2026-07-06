import { clamp } from '../clamp';
import type {
  VirtualizerEstimateSize,
  VirtualizerMeasurement,
  VirtualizerRange,
  VirtualizerScrollAlign,
} from './types';

const EMPTY_RANGE: VirtualizerRange = {
  startIndex: 0,
  endIndex: -1,
};

/**
 * Converts an arbitrary item count into a finite non-negative integer.
 */
export function normalizeVirtualizerCount(count: number): number {
  if (!Number.isFinite(count)) {
    return 0;
  }
  return Math.max(0, Math.floor(count));
}

/**
 * Converts an arbitrary size into a finite non-negative number.
 */
export function normalizeVirtualizerSize(size: number): number {
  if (!Number.isFinite(size)) {
    return 0;
  }
  return Math.max(0, size);
}

/**
 * Resolves the size for an item, preferring measured size over estimate.
 */
export function getVirtualizerItemSize(
  index: number,
  estimateSize: VirtualizerEstimateSize,
  measuredSizes?: ReadonlyMap<number, number> | undefined,
): number {
  const measuredSize = measuredSizes?.get(index);
  if (measuredSize != null) {
    return normalizeVirtualizerSize(measuredSize);
  }

  const estimatedSize = typeof estimateSize === 'function' ? estimateSize(index) : estimateSize;
  return normalizeVirtualizerSize(estimatedSize);
}

/**
 * Builds item measurements and total virtual content size for a collection.
 */
export function getVirtualizerMeasurements(options: {
  count: number;
  estimateSize: VirtualizerEstimateSize;
  measuredSizes?: ReadonlyMap<number, number> | undefined;
  paddingStart?: number | undefined;
  paddingEnd?: number | undefined;
}): { measurements: VirtualizerMeasurement[]; totalSize: number } {
  const count = normalizeVirtualizerCount(options.count);
  const paddingStart = normalizeVirtualizerSize(options.paddingStart ?? 0);
  const paddingEnd = normalizeVirtualizerSize(options.paddingEnd ?? 0);

  const measurements: VirtualizerMeasurement[] = [];
  let start = paddingStart;

  for (let index = 0; index < count; index += 1) {
    const size = getVirtualizerItemSize(index, options.estimateSize, options.measuredSizes);
    const end = start + size;

    measurements.push({
      index,
      start,
      size,
      end,
    });

    start = end;
  }

  return {
    measurements,
    totalSize: start + paddingEnd,
  };
}

/**
 * Calculates the inclusive render range for the current scroll viewport.
 */
export function getVirtualizerRange(options: {
  measurements: readonly VirtualizerMeasurement[];
  scrollOffset: number;
  viewportSize: number;
  overscan?: number | undefined;
  scrollPaddingStart?: number | undefined;
  scrollPaddingEnd?: number | undefined;
}): VirtualizerRange {
  const { measurements } = options;
  const count = measurements.length;

  if (count === 0) {
    return EMPTY_RANGE;
  }

  const overscan = normalizeVirtualizerCount(options.overscan ?? 0);
  const viewportSize = normalizeVirtualizerSize(options.viewportSize);

  if (viewportSize === 0) {
    return {
      startIndex: 0,
      endIndex: Math.min(count - 1, overscan),
    };
  }

  const scrollOffset = normalizeVirtualizerSize(options.scrollOffset);
  const scrollPaddingStart = normalizeVirtualizerSize(options.scrollPaddingStart ?? 0);
  const scrollPaddingEnd = normalizeVirtualizerSize(options.scrollPaddingEnd ?? 0);
  const visibleStart = Math.max(0, scrollOffset - scrollPaddingStart);
  const visibleEnd = scrollOffset + viewportSize + scrollPaddingEnd;

  const visibleStartIndex = findFirstMeasurementEndingAfter(measurements, visibleStart);
  const visibleEndIndex = findLastMeasurementStartingBefore(measurements, visibleEnd);

  return {
    startIndex: Math.max(0, visibleStartIndex - overscan),
    endIndex: Math.min(count - 1, visibleEndIndex + overscan),
  };
}

/**
 * Calculates the scroll offset needed to align a logical item index in the viewport.
 */
export function getOffsetForIndex(options: {
  measurements: readonly VirtualizerMeasurement[];
  index: number;
  align?: VirtualizerScrollAlign | undefined;
  scrollOffset: number;
  viewportSize: number;
  scrollPaddingStart?: number | undefined;
  scrollPaddingEnd?: number | undefined;
  totalSize: number;
}): number {
  const { measurements } = options;
  const count = measurements.length;

  if (count === 0) {
    return 0;
  }

  const index = clamp(Math.floor(options.index), 0, count - 1);
  const measurement = measurements[index];
  const align = options.align ?? 'nearest';
  const viewportSize = normalizeVirtualizerSize(options.viewportSize);
  const scrollOffset = normalizeVirtualizerSize(options.scrollOffset);
  const scrollPaddingStart = normalizeVirtualizerSize(options.scrollPaddingStart ?? 0);
  const scrollPaddingEnd = normalizeVirtualizerSize(options.scrollPaddingEnd ?? 0);

  let nextOffset: number;

  if (align === 'start') {
    nextOffset = measurement.start - scrollPaddingStart;
  } else if (align === 'end') {
    nextOffset = measurement.end - viewportSize + scrollPaddingEnd;
  } else if (align === 'center') {
    nextOffset = measurement.start - (viewportSize - measurement.size) / 2;
  } else {
    const visibleStart = scrollOffset + scrollPaddingStart;
    const visibleEnd = scrollOffset + viewportSize - scrollPaddingEnd;

    if (measurement.start < visibleStart) {
      nextOffset = measurement.start - scrollPaddingStart;
    } else if (measurement.end > visibleEnd) {
      nextOffset = measurement.end - viewportSize + scrollPaddingEnd;
    } else {
      nextOffset = scrollOffset;
    }
  }

  const maxOffset = Math.max(0, normalizeVirtualizerSize(options.totalSize) - viewportSize);
  return clamp(nextOffset, 0, maxOffset);
}

function findFirstMeasurementEndingAfter(
  measurements: readonly VirtualizerMeasurement[],
  offset: number,
): number {
  let low = 0;
  let high = measurements.length - 1;
  let result = measurements.length - 1;

  while (low <= high) {
    const middle = Math.floor((low + high) / 2);

    if (measurements[middle].end > offset) {
      result = middle;
      high = middle - 1;
    } else {
      low = middle + 1;
    }
  }

  return result;
}

function findLastMeasurementStartingBefore(
  measurements: readonly VirtualizerMeasurement[],
  offset: number,
): number {
  let low = 0;
  let high = measurements.length - 1;
  let result = 0;

  while (low <= high) {
    const middle = Math.floor((low + high) / 2);

    if (measurements[middle].start < offset) {
      result = middle;
      low = middle + 1;
    } else {
      high = middle - 1;
    }
  }

  return result;
}
