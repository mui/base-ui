import { normalizeScrollOffset, SCROLL_EDGE_TOLERANCE_PX } from '../../utils/scrollEdges';
import type { VirtualizerHandle } from '../../internals/virtualization/ListVirtualizationRegistry';

/**
 * Where a scroll arrow's next step should land.
 *
 * Two implementations of one algorithm: one reading the DOM boxes of a fully rendered list, one
 * reading the logical metrics of a windowed one. They are kept separate rather than unified because
 * the DOM version has asymmetries worth preserving exactly — see `getVirtualizedTargetScrollTop`.
 */

/**
 * The metrics twin of `getTargetScrollTop` below, for a windowed list.
 *
 * Deliberately mirrors that function's index arithmetic rather than sharing it, including its
 * asymmetry when the covered edge falls inside a single very tall row: both resolve the same
 * target so an arrow steps identically whether or not the list is virtualized. Returns `null` when
 * the geometry needed for this step is not available yet.
 */
export function getVirtualizedTargetScrollTop(
  virtualizer: VirtualizerHandle,
  itemCount: number,
  isUp: boolean,
  scrollTop: number,
  clientHeight: number,
  scrollArrowHeight: number,
  maxScrollTop: number,
): number | null {
  if (itemCount === 0) {
    return isUp ? 0 : maxScrollTop;
  }

  if (isUp) {
    const visibleTop = scrollTop + scrollArrowHeight - SCROLL_EDGE_TOLERANCE_PX;
    const atOffset = virtualizer.getIndexAtOffset(visibleTop);
    if (atOffset == null) {
      return 0;
    }

    const atOffsetMetrics = virtualizer.getItemMetrics(atOffset);
    if (atOffsetMetrics == null) {
      return null;
    }

    // The first row starting at or after the covered edge, matching the DOM scan. When no row
    // does, the scan leaves its index at `0` and the step resolves to the start.
    const candidate = atOffsetMetrics.offset >= visibleTop ? atOffset : atOffset + 1;
    const firstVisibleIndex = candidate < itemCount ? candidate : 0;

    const targetIndex = Math.max(0, firstVisibleIndex - 1);
    if (targetIndex >= firstVisibleIndex) {
      return 0;
    }

    const targetMetrics = virtualizer.getItemMetrics(targetIndex);
    if (targetMetrics == null) {
      return null;
    }

    return normalizeScrollOffset(targetMetrics.offset - scrollArrowHeight, maxScrollTop);
  }

  const visibleBottom = scrollTop + clientHeight - scrollArrowHeight + SCROLL_EDGE_TOLERANCE_PX;
  const atOffset = virtualizer.getIndexAtOffset(visibleBottom);
  const searchStart = atOffset ?? 0;
  const searchStartMetrics = virtualizer.getItemMetrics(searchStart);
  if (searchStartMetrics == null) {
    return null;
  }

  // The first row ending past the covered edge. Rows before `searchStart` end no later than it
  // begins, and the row after it begins past the edge, so only these two can be the first.
  const overflowing =
    searchStartMetrics.offset + searchStartMetrics.size > visibleBottom
      ? searchStart
      : searchStart + 1;
  const lastVisibleIndex = overflowing < itemCount ? Math.max(0, overflowing - 1) : itemCount - 1;

  const targetIndex = Math.min(itemCount - 1, lastVisibleIndex + 1);
  if (targetIndex <= lastVisibleIndex) {
    return maxScrollTop;
  }

  const targetMetrics = virtualizer.getItemMetrics(targetIndex);
  if (targetMetrics == null) {
    return null;
  }

  return normalizeScrollOffset(
    targetMetrics.offset + targetMetrics.size - clientHeight + scrollArrowHeight,
    maxScrollTop,
  );
}

export function getTargetScrollTop(
  items: Array<HTMLElement | null>,
  isUp: boolean,
  scrollTop: number,
  clientHeight: number,
  scrollArrowHeight: number,
  maxScrollTop: number,
) {
  if (isUp) {
    let firstVisibleIndex = 0;
    const visibleTop = scrollTop + scrollArrowHeight - SCROLL_EDGE_TOLERANCE_PX;

    for (let i = 0; i < items.length; i += 1) {
      const item = items[i];
      if (item && item.offsetTop >= visibleTop) {
        firstVisibleIndex = i;
        break;
      }
    }

    const targetIndex = Math.max(0, firstVisibleIndex - 1);
    const targetItem = items[targetIndex];
    return targetIndex < firstVisibleIndex && targetItem
      ? normalizeScrollOffset(targetItem.offsetTop - scrollArrowHeight, maxScrollTop)
      : 0;
  }

  let lastVisibleIndex = items.length - 1;
  const visibleBottom = scrollTop + clientHeight - scrollArrowHeight + SCROLL_EDGE_TOLERANCE_PX;

  for (let i = 0; i < items.length; i += 1) {
    const item = items[i];
    if (item && item.offsetTop + item.offsetHeight > visibleBottom) {
      lastVisibleIndex = Math.max(0, i - 1);
      break;
    }
  }

  const targetIndex = Math.min(items.length - 1, lastVisibleIndex + 1);
  const targetItem = items[targetIndex];
  return targetIndex > lastVisibleIndex && targetItem
    ? normalizeScrollOffset(
        targetItem.offsetTop + targetItem.offsetHeight - clientHeight + scrollArrowHeight,
        maxScrollTop,
      )
    : maxScrollTop;
}
