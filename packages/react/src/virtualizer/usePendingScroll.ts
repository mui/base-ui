'use client';
import * as React from 'react';
import { clamp } from '@base-ui/utils/clamp';
import { ownerDocument, ownerWindow } from '@base-ui/utils/owner';
import { useAnimationFrame } from '@base-ui/utils/useAnimationFrame';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
import { useStableCallback } from '@base-ui/utils/useStableCallback';
import type { RowWindow, RowsGeometry } from './geometry';
import { getLaidOutRowElements } from './getLaidOutRowElements';
import { getLayoutScale, toScrollOffset, type RowsInset } from './scrollport';
import { getMaxScrollOffset } from '../utils/scrollEdges';
import type {
  VirtualizerScrollAlignment,
  VirtualizerScrollToIndexOptions,
} from '../internals/virtualization/ListVirtualizationRegistry';
import type { VirtualizerRow } from '../internals/virtualization/types';
import type { AdaptiveEstimate } from './useAdaptiveEstimate';
import type { ScrollInputEvidence } from './useScrollGesture';

/**
 * Nearby rows do not accumulate enough estimate error to justify delaying scroll completion.
 */
const ADAPTIVE_SCROLL_TARGET_MIN_DISTANCE = 10;

/**
 * A scroll-to-row request that the geometry cannot satisfy yet, and what the rest of the
 * virtualizer needs to know about it while it stands.
 */
export interface PendingScroll {
  /** Requests that a row be brought into view, retrying until the geometry settles on it. */
  scrollToIndex: (rowIndex: number, options?: VirtualizerScrollToIndexOptions) => void;
  /** Whether a request is still outstanding. Scroll anchoring stands aside while one is. */
  isPending: () => boolean;
  /**
   * The position the scrollport should be at while it still refuses to scroll there, or `null`.
   * The rendered window and the render zone follow this offset rather than the DOM.
   */
  getViewportScrollTop: () => number | null;
  /** Whether a scroll event is an echo of a position this module wrote. */
  isProgrammaticEcho: (scrollTop: number, evidence: ScrollInputEvidence) => boolean;
  /** Records a scroll position another concern is about to write, so its event is not a takeover. */
  noteProgrammaticScroll: (scrollTop: number) => void;
  /** Abandons the outstanding request, as user scrolling does. */
  cancel: () => void;
  /** @internal Re-applies the outstanding request. Driven by {@link usePendingScrollRetry}. */
  retry: () => void;
}

export interface UsePendingScrollParameters<RowModel> {
  adaptive: AdaptiveEstimate;
  enabled: boolean;
  /** Whether a row's height has been measured, as opposed to estimated. */
  isRowMeasured: (rowId: React.Key) => boolean;
  /**
   * Realigns the sticky render zone for a position written here. The native scroll event is
   * asynchronous, so the rows must be told about the new position before it arrives.
   */
  onScrollApplied: (scrollTop: number) => void;
  /** Re-renders the window unconditionally, before paint. */
  refreshWindow: () => void;
  /**
   * Re-renders the window when a corrective write lands far from the position this commit's rows
   * were rendered for.
   */
  refreshWindowAfterCorrectiveScroll: (scrollTop: number) => void;
  /**
   * Number of items strictly before each row, for a list whose rows include group headers, or
   * `undefined` for a flat list. Distances between a request and the window are judged in items:
   * the estimate a distant request waits for is an average of items, and headers between two
   * items make them no further apart in that sense.
   */
  itemCountBeforeRow: number[] | undefined;
  /** The window this commit rendered, as of the latest render. */
  renderContextRef: React.RefObject<RowWindow>;
  /**
   * The element whose children — or grandchildren, one group wrapper deep — are the laid-out
   * rows, in whichever layout the rows are currently in.
   */
  getRowsParent: () => HTMLElement | null;
  /**
   * The current row index of a row, by id, for a list whose row indexes can move while the rows
   * themselves stay — group headers inserted above a requested item. A request follows its row
   * through such a move rather than being abandoned. `undefined` for a flat list, where a row at
   * a changed index is a different row.
   */
  resolveRowIndex: ((rowId: React.Key) => number | undefined) | undefined;
  rows: VirtualizerRow<RowModel>[];
  scrollElementRef: React.RefObject<HTMLElement | null>;
  /** The scrollable content before the first row and after the last one. */
  rowsInset: RowsInset;
  scrollToRowAlignment: VirtualizerScrollAlignment;
  scrollToRowIndex: number | undefined;
  /** The engine's current row geometry, read when asked rather than captured at render. */
  readRowsGeometry: () => RowsGeometry;
  trailingHeight: number;
}

/**
 * Owns the destination of a scroll-to-row request for as long as the geometry cannot satisfy it.
 *
 * A single write is rarely enough: the destination may still be carrying an estimate, the rows
 * above it may move once they are measured, and a newly opened scrollport may have no scrollable
 * overflow to accept the write at all. The request is therefore retained and re-applied on each
 * geometry update until the row is fully inside the scrollport, and abandoned the moment the user
 * scrolls, because retrying then would yank the list away from where they scrolled.
 *
 * Must be declared after the effects that publish the virtualization mode, so a request made as a
 * list opens is applied against the enabled window, and before `useScrollAnchor`, which stands
 * aside while a request stands.
 */
export function usePendingScroll<RowModel>(
  parameters: UsePendingScrollParameters<RowModel>,
): PendingScroll {
  const {
    adaptive,
    enabled,
    isRowMeasured,
    onScrollApplied,
    refreshWindow,
    itemCountBeforeRow,
    refreshWindowAfterCorrectiveScroll,
    renderContextRef,
    getRowsParent,
    resolveRowIndex,
    rows,
    scrollElementRef,
    rowsInset,
    scrollToRowAlignment,
    readRowsGeometry,
    scrollToRowIndex,
    trailingHeight,
  } = parameters;

  const rowIndexRef = React.useRef<number | null>(null);
  const rowIdRef = React.useRef<React.Key | null>(null);
  const alignmentRef = React.useRef<VirtualizerScrollAlignment>('auto');
  const requiresMeasurementRef = React.useRef(false);
  const requiresAdaptiveEstimateRef = React.useRef(false);
  /**
   * The last `scrollTop` this component itself wrote, so user-driven scrolling can be told apart
   * from the scroll events of our own corrective writes.
   */
  const programmaticScrollTopRef = React.useRef<number | null>(null);
  /**
   * Position the scrollport should be at while the browser still refuses to scroll there. A scroll
   * container gains its scrollable overflow only on the frame after the one that mounts it, so the
   * write that opens a popup at a distant row is clamped back to zero. The rendered window and the
   * render zone follow this offset instead of the DOM, which keeps the destination on screen from
   * the first paint: the rows are positioned inside a sticky viewport, so what they paint over
   * does not depend on `scrollTop` at all.
   */
  const viewportScrollTopRef = React.useRef<number | null>(null);
  const viewportScrollFrame = useAnimationFrame();
  const measurementFrame = useAnimationFrame();
  const retryRef = React.useRef<(() => void) | null>(null);

  const rowsInsetTotal = rowsInset.start + rowsInset.end;

  const isFarFromWindow = useStableCallback((rowIndex: number, window: RowWindow) =>
    isRowFarFromWindow(rowIndex, window, itemCountBeforeRow),
  );

  /** Forgets the request without treating it as fulfilled. */
  const cancel = useStableCallback(() => {
    rowIndexRef.current = null;
    rowIdRef.current = null;
    requiresAdaptiveEstimateRef.current = false;
    viewportScrollTopRef.current = null;
    viewportScrollFrame.cancel();
    measurementFrame.cancel();
  });

  /** Retires a request whose destination is now where it was asked to be. */
  const settle = useStableCallback(() => {
    measurementFrame.cancel();
    rowIndexRef.current = null;
    rowIdRef.current = null;
    requiresAdaptiveEstimateRef.current = false;
  });

  /**
   * Re-applies a position the scrollport rejected, on the frame where its scrollable overflow
   * exists. The rows already paint at that position, so this only brings `scrollTop` and the
   * scrollbar in line. A single attempt is enough to schedule: the pending scroll request retries
   * the write on each of its own measurement passes, and the rows keep rendering for the requested
   * position until one of them lands, so a scrollport that stays unscrollable never spins a frame
   * loop for as long as the request stands.
   */
  const applyViewportScroll = useStableCallback(() => {
    const scrollElement = scrollElementRef.current;
    const pendingScrollTop = viewportScrollTopRef.current;

    if (pendingScrollTop == null) {
      return;
    }

    if (scrollElement == null || rowIndexRef.current == null) {
      viewportScrollTopRef.current = null;
      return;
    }

    programmaticScrollTopRef.current = pendingScrollTop;
    scrollElement.scrollTo({ behavior: 'instant' as ScrollBehavior, top: pendingScrollTop });
    const appliedScrollTop = scrollElement.scrollTop;

    if (Math.abs(appliedScrollTop - pendingScrollTop) <= 1) {
      viewportScrollTopRef.current = null;
      onScrollApplied(appliedScrollTop);
    }
  });

  const waitForMeasurement = useStableCallback((rowIndex: number) => {
    const rowsParent = getRowsParent();
    if (
      rowsParent != null &&
      getLaidOutRowElements(rowsParent).some(
        (element) => Number(element.dataset.rowIndex) === rowIndex,
      )
    ) {
      // A first measurement matching the estimate only changes the engine's measured flag;
      // it does not publish new geometry. Retry after ResizeObserver has had a chance to
      // deliver it, or the request can wait forever for a geometry update that never comes.
      measurementFrame.request(() => retryRef.current?.());
    }
  });

  const scrollRowIntoView = useStableCallback(
    (rowIndex: number, requireMeasurement = false, align: VirtualizerScrollAlignment = 'auto') => {
      const scrollElement = scrollElementRef.current;
      const row = rows[rowIndex];

      if (!scrollElement || !row) {
        return false;
      }

      const measured = isRowMeasured(row.id);

      // The first pass may scroll using estimates so the destination mounts. The retry waits for
      // the real row measurement; treating an estimated position as final can leave only the
      // zero-sized focus proxy mounted after row heights expand.
      if (requireMeasurement && !measured) {
        waitForMeasurement(rowIndex);
        return false;
      }

      const currentRowsMeta = readRowsGeometry();
      const rowStart = currentRowsMeta.positions[rowIndex];
      const rowEnd =
        currentRowsMeta.positions[rowIndex + 1] ?? currentRowsMeta.currentPageTotalHeight;

      if (rowStart == null || rowEnd == null) {
        return false;
      }

      // Scroll offsets are measured from the scrollport's padding edge, so the row's virtual
      // position moves down by whatever the rows are laid out after.
      const start = rowStart + rowsInset.start;
      const end = rowEnd + rowsInset.start;

      const { resolvedAlignment, scrollTop: nextScrollTop } = resolveAlignedScrollTop(
        scrollElement,
        start,
        end,
        align,
      );

      if (align === 'auto' && resolvedAlignment !== 'auto' && rowIndexRef.current === rowIndex) {
        // Measurements can move the requested row across the opposite viewport edge. Keep the
        // edge chosen by the initial estimated pass so corrective retries do not visibly move a
        // selected row from the bottom of the popup to the top (or vice versa).
        alignmentRef.current = resolvedAlignment;
      }

      if (nextScrollTop != null) {
        const maxScrollTop = getMaxScrollOffset(
          currentRowsMeta.currentPageTotalHeight + rowsInsetTotal + trailingHeight,
          scrollElement.clientHeight,
        );
        const clampedScrollTop = clamp(nextScrollTop, 0, maxScrollTop);
        programmaticScrollTopRef.current = clampedScrollTop;
        scrollElement.scrollTo({
          behavior: 'instant' as ScrollBehavior,
          top: clampedScrollTop,
        });
        const appliedScrollTop = scrollElement.scrollTop;
        const scrollApplied = Math.abs(appliedScrollTop - clampedScrollTop) <= 1;

        if (scrollApplied) {
          viewportScrollTopRef.current = null;
          viewportScrollFrame.cancel();
          requiresMeasurementRef.current = true;
          // The native scroll event is asynchronous. Realign the sticky render zone immediately so
          // keyboard navigation cannot expose a blank edge or leave the highlighted row offscreen
          // for a frame while the virtual window catches up.
          onScrollApplied(appliedScrollTop);
          refreshWindowAfterCorrectiveScroll(appliedScrollTop);
        } else {
          // A newly opened popup runs this before its scrollable overflow exists, and the browser
          // clamps the write back to the top. The destination is still known, so hold it as the
          // position to render for: the window below is built from it and the sticky render zone
          // is offset by it, which puts the requested row on screen in this same commit. Only the
          // scrollbar still lags, until the retry below lands once the scrollport can accept it.
          programmaticScrollTopRef.current = clampedScrollTop;
          viewportScrollTopRef.current = clampedScrollTop;
          requiresMeasurementRef.current = false;
          refreshWindow();
          viewportScrollFrame.request(applyViewportScroll);
          return false;
        }
      } else {
        requiresMeasurementRef.current = true;
      }

      if (!measured) {
        waitForMeasurement(rowIndex);
        return false;
      }

      // A distant row measured while the collection was filtered can make the estimate-based first
      // pass look complete even though the expanded collection retained it only as an offscreen
      // focus proxy. Keep that request pending until the static estimate settles, so the alignment
      // is re-applied across the refresh that rewrites every unmeasured row.
      // A window that cannot supply the samples the average needs — a group's one item between two
      // tall headers — would keep the request pending for good, and anchoring suspended with it.
      // Once the refinement is known to be exhausted, the measured destination is final enough:
      // whatever average arrives later is absorbed by anchoring.
      if (
        requiresAdaptiveEstimateRef.current &&
        adaptive.readEstimate() == null &&
        !adaptive.isRefinementExhausted()
      ) {
        return false;
      }

      // Measuring the destination alone does not settle the request either: the rows above it can
      // still be carrying estimates, and measuring those later moves the destination by however
      // much they were off. An estimate below the real height pushes it down, so a row that was
      // scrolled to exactly can end up entirely below the scrollport with nothing to correct it.
      //
      // The request is settled once the destination is fully inside the scrollport, which merely
      // intersecting it does not establish: a row still hanging over an edge is one geometry
      // update away from leaving again. Until then the request stays pending and the rowsMeta
      // effect re-runs this alignment on every geometry update. Requiring the rendered row also
      // covers a distant row that the collection retained only as an offscreen focus proxy, which
      // is positioned absolutely and never counts as on screen. A row taller than the scrollport
      // can never fit, so for those covering the scrollport is what counts as arrived.
      const rowsParent = getRowsParent();
      const renderedRow =
        rowsParent == null
          ? undefined
          : getLaidOutRowElements(rowsParent).find(
              (element) => Number(element.dataset.rowIndex) === rowIndex,
            );
      const renderedRowRect = renderedRow?.getBoundingClientRect();
      const scrollElementRect = scrollElement.getBoundingClientRect();
      if (renderedRowRect == null) {
        return false;
      }

      return renderedRowRect.height <= scrollElementRect.height + 1
        ? renderedRowRect.top >= scrollElementRect.top - 1 &&
            renderedRowRect.bottom <= scrollElementRect.bottom + 1
        : renderedRowRect.top <= scrollElementRect.top + 1 &&
            renderedRowRect.bottom >= scrollElementRect.bottom - 1;
    },
  );

  /**
   * Brings a row into view while the list is not windowing. Every row is laid out natively then,
   * so the destination is read from the DOM rather than from the engine's geometry, nothing about
   * it is an estimate, and one write is final: no request is retained and nothing retries. So a
   * request made while the scrollport is hidden is served against empty rects and not again once
   * it shows, unlike a windowed request, which stands until the geometry satisfies it.
   */
  const scrollRowElementIntoView = useStableCallback(
    (rowIndex: number, align: VirtualizerScrollAlignment) => {
      const scrollElement = scrollElementRef.current;
      const rowsParent = getRowsParent();

      if (scrollElement == null || rowsParent == null) {
        return;
      }

      const rowElement = getLaidOutRowElements(rowsParent).find(
        (element) => Number(element.dataset.rowIndex) === rowIndex,
      );

      if (rowElement == null) {
        return;
      }

      // In scroll coordinates: from the scrollport's padding edge, at its current position.
      // Rects are in the viewport's space, which an ancestor transform scales (a popup mid
      // entrance animation); scroll offsets are in layout space.
      const rowRect = rowElement.getBoundingClientRect();
      const scrollElementRect = scrollElement.getBoundingClientRect();
      const scale = getLayoutScale(scrollElement, scrollElementRect);
      const start = toScrollOffset(rowRect.top, scrollElement, scrollElementRect, scale);
      const end = start + rowRect.height / scale;
      const { scrollTop: nextScrollTop } = resolveAlignedScrollTop(
        scrollElement,
        start,
        end,
        align,
      );

      if (nextScrollTop == null) {
        return;
      }

      const clampedScrollTop = clamp(
        nextScrollTop,
        0,
        getMaxScrollOffset(scrollElement.scrollHeight, scrollElement.clientHeight),
      );
      programmaticScrollTopRef.current = clampedScrollTop;
      scrollElement.scrollTo({ behavior: 'instant' as ScrollBehavior, top: clampedScrollTop });
    },
  );

  const scrollToIndex = useStableCallback(
    (rowIndex: number, options?: VirtualizerScrollToIndexOptions) => {
      const row = rows[rowIndex];

      if (!Number.isInteger(rowIndex) || rowIndex < 0 || !row) {
        return;
      }

      const align = options?.align ?? 'auto';

      if (!enabled) {
        cancel();
        scrollRowElementIntoView(rowIndex, align);
        return;
      }

      rowIndexRef.current = rowIndex;
      rowIdRef.current = row.id;
      alignmentRef.current = align;
      requiresMeasurementRef.current = false;
      requiresAdaptiveEstimateRef.current = false;

      if (scrollRowIntoView(rowIndex, false, align)) {
        settle();
      }
    },
  );

  const scrollToRowId = scrollToRowIndex == null ? null : (rows[scrollToRowIndex]?.id ?? null);
  // Alignment belongs to the activation that requested the scroll, so it is read at that moment
  // rather than depended on: changing only the alignment describes no new activation and must not
  // move the viewport on its own.
  const scrollToRowAlignmentRef = React.useRef(scrollToRowAlignment);
  scrollToRowAlignmentRef.current = scrollToRowAlignment;
  const adaptiveEnabled = adaptive.enabled;
  const readAdaptiveEstimate = adaptive.readEstimate;

  useIsoLayoutEffect(() => {
    if (scrollToRowIndex == null || scrollToRowIndex < 0 || scrollToRowId == null) {
      cancel();
      return;
    }

    if (!enabled) {
      // Nothing to retain: the row is on the page already.
      cancel();
      scrollRowElementIntoView(scrollToRowIndex, scrollToRowAlignmentRef.current);
      return;
    }

    const alignment = scrollToRowAlignmentRef.current;
    rowIndexRef.current = scrollToRowIndex;
    rowIdRef.current = scrollToRowId;
    alignmentRef.current = alignment;
    requiresMeasurementRef.current = false;
    requiresAdaptiveEstimateRef.current =
      requiresAdaptiveEstimateRef.current ||
      (adaptiveEnabled &&
        readAdaptiveEstimate() == null &&
        isFarFromWindow(scrollToRowIndex, renderContextRef.current));

    // Try immediately with estimated metadata. If the destination is still unmeasured, the
    // rowsMeta effect below corrects the position once ResizeObserver updates it.
    if (scrollRowIntoView(scrollToRowIndex, false, alignment)) {
      settle();
    }
  }, [
    adaptiveEnabled,
    cancel,
    enabled,
    isFarFromWindow,
    readAdaptiveEstimate,
    renderContextRef,
    scrollRowElementIntoView,
    scrollRowIntoView,
    scrollToRowId,
    scrollToRowIndex,
    settle,
  ]);

  const retry = useStableCallback(() => {
    let rowIndex = rowIndexRef.current;

    // Array identity may change without the logical destination changing. Only invalidate a
    // pending correction when a different row now occupies the requested collection index.
    if (rowIndex != null && rows[rowIndex]?.id !== rowIdRef.current) {
      const movedRowIndex =
        rowIdRef.current == null ? undefined : resolveRowIndex?.(rowIdRef.current);

      if (movedRowIndex == null) {
        cancel();
        return;
      }

      // The row is still there, at another index. Start its positioning over: the position
      // written so far was for the old index, and requiring the row to be measured before
      // scrolling would wait on a row that is not mounted at the new one yet.
      rowIndex = movedRowIndex;
      rowIndexRef.current = movedRowIndex;
      requiresMeasurementRef.current = false;
      viewportScrollTopRef.current = null;
      viewportScrollFrame.cancel();
    }

    if (
      rowIndex != null &&
      scrollRowIntoView(rowIndex, requiresMeasurementRef.current, alignmentRef.current)
    ) {
      settle();
    }
  });

  retryRef.current = retry;

  // The window computation reads the outstanding request during render, so these must stay
  // callable there: they only read refs.
  const isPending = React.useCallback(() => rowIndexRef.current != null, []);
  const getViewportScrollTop = React.useCallback(() => viewportScrollTopRef.current, []);
  const noteProgrammaticScroll = useStableCallback((scrollTop: number) => {
    programmaticScrollTopRef.current = scrollTop;
  });
  const isProgrammaticEcho = useStableCallback(
    (scrollTop: number, evidence: ScrollInputEvidence) =>
      (programmaticScrollTopRef.current != null &&
        Math.abs(scrollTop - programmaticScrollTopRef.current) <= 1) ||
      // Expanding a collection can queue several corrective native scroll events while its
      // adaptive estimate settles. None of those are user takeovers unless direct input occurred.
      (requiresAdaptiveEstimateRef.current && !evidence.hasDirectInput && !evidence.isPointerDown),
  );

  return React.useMemo(
    () => ({
      cancel,
      getViewportScrollTop,
      isPending,
      isProgrammaticEcho,
      noteProgrammaticScroll,
      retry,
      scrollToIndex,
    }),
    [
      cancel,
      getViewportScrollTop,
      isPending,
      isProgrammaticEcho,
      noteProgrammaticScroll,
      retry,
      scrollToIndex,
    ],
  );
}

export interface UsePendingScrollRetryParameters<RowModel> {
  pendingScroll: PendingScroll;
  /** The window this commit rendered. A different one can move the destination. */
  renderContext: RowWindow;
  rows: VirtualizerRow<RowModel>[];
  /**
   * What the rows are laid out after, as an opaque token: it republishes when that is measured
   * again, which moves every destination by the difference.
   */
  rowsInset: unknown;
  /** The engine's row geometry, which republishes whenever a measurement lands. */
  rowsMeta: unknown;
}

/**
 * Re-applies an outstanding request on every geometry update, until the destination is where it
 * was asked to be.
 *
 * Declared after `useAdaptiveEstimateRefresh` so a request waiting on a settled estimate sees the
 * refreshed one in the same commit, and after `useScrollAnchor`, which reads the request while it
 * still stands.
 */
export function usePendingScrollRetry<RowModel>(
  parameters: UsePendingScrollRetryParameters<RowModel>,
): void {
  const { pendingScroll, renderContext, rows, rowsInset, rowsMeta } = parameters;
  const { firstRowIndex, lastRowIndex } = renderContext;
  const { retry } = pendingScroll;

  useIsoLayoutEffect(retry, [firstRowIndex, lastRowIndex, retry, rows, rowsInset, rowsMeta]);
}

/**
 * Whether a destination lies far enough outside the window that the rows between it and the
 * window could accumulate enough estimate error to justify waiting for the refined average.
 *
 * Judged in items when the rows include group headers (`itemCountBeforeRow` given): the average
 * describes items, and headers between two items make them no further apart in that sense.
 */
export function isRowFarFromWindow(
  rowIndex: number,
  window: RowWindow,
  itemCountBeforeRow: number[] | undefined,
) {
  if (itemCountBeforeRow == null) {
    return (
      rowIndex < window.firstRowIndex - ADAPTIVE_SCROLL_TARGET_MIN_DISTANCE ||
      rowIndex > window.lastRowIndex + ADAPTIVE_SCROLL_TARGET_MIN_DISTANCE
    );
  }

  const lastRowIndex = Math.min(window.lastRowIndex, itemCountBeforeRow.length - 1);
  const itemIndex = itemCountBeforeRow[rowIndex] ?? 0;
  const firstItemIndex = itemCountBeforeRow[window.firstRowIndex] ?? 0;
  const lastItemIndex = itemCountBeforeRow[lastRowIndex] ?? firstItemIndex;
  return (
    itemIndex < firstItemIndex - ADAPTIVE_SCROLL_TARGET_MIN_DISTANCE ||
    itemIndex > lastItemIndex + ADAPTIVE_SCROLL_TARGET_MIN_DISTANCE
  );
}

/**
 * Where the scrollport should scroll so a row spanning `start` to `end`, in scroll coordinates,
 * lands as `align` asks, or `null` when `auto` finds it in view already. `auto` reports the edge it
 * chose, so a retry can keep to it.
 */
function resolveAlignedScrollTop(
  scrollElement: HTMLElement,
  start: number,
  end: number,
  align: VirtualizerScrollAlignment,
): { resolvedAlignment: VirtualizerScrollAlignment; scrollTop: number | null } {
  const styles = ownerWindow(scrollElement).getComputedStyle(scrollElement);
  const scrollPaddingStart = resolveScrollPadding(scrollElement, styles.scrollPaddingTop);
  const scrollPaddingEnd = resolveScrollPadding(scrollElement, styles.scrollPaddingBottom);
  const viewportStart = scrollElement.scrollTop + scrollPaddingStart;
  const viewportEnd = scrollElement.scrollTop + scrollElement.clientHeight - scrollPaddingEnd;
  const viewportSize = Math.max(
    0,
    scrollElement.clientHeight - scrollPaddingStart - scrollPaddingEnd,
  );
  const rowSize = end - start;
  let scrollTop: number | null = null;
  let resolvedAlignment = align;

  if (align === 'start') {
    scrollTop = start - scrollPaddingStart;
  } else if (align === 'center') {
    scrollTop = start - scrollPaddingStart - (viewportSize - rowSize) / 2;
  } else if (align === 'end') {
    scrollTop = end - scrollElement.clientHeight + scrollPaddingEnd;
  } else if (rowSize > viewportSize || start < viewportStart) {
    resolvedAlignment = 'start';
    scrollTop = start - scrollPaddingStart;
  } else if (end > viewportEnd) {
    resolvedAlignment = 'end';
    scrollTop = end - scrollElement.clientHeight + scrollPaddingEnd;
  }

  return { resolvedAlignment, scrollTop };
}

function resolveScrollPadding(scrollElement: HTMLElement, value: string) {
  if (!value || value === 'auto') {
    return 0;
  }

  if (value.endsWith('px')) {
    const pixels = Number.parseFloat(value);
    return Number.isFinite(pixels) ? Math.max(0, pixels) : 0;
  }

  // Computed scroll-padding preserves percentages and calculations. Resolve them through layout
  // against the scrollport's corresponding dimension, as required by CSS Scroll Snap.
  const probe = ownerDocument(scrollElement).createElement('div');
  Object.assign(probe.style, {
    boxSizing: 'border-box',
    height: value,
    pointerEvents: 'none',
    position: 'absolute',
    visibility: 'hidden',
    width: '0px',
  });
  scrollElement.append(probe);
  const pixels = probe.getBoundingClientRect().height;
  probe.remove();

  return Number.isFinite(pixels) ? Math.max(0, pixels) : 0;
}
