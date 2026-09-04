'use client';
import * as React from 'react';
import { clamp } from '@base-ui/utils/clamp';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
import { getMaxScrollOffset } from '../utils/scrollEdges';
import type { VirtualizerRow } from '../internals/virtualization/types';
import type { PendingScroll } from './usePendingScroll';
import type { ScrollGesture } from './useScrollGesture';

import type { RowsGeometry } from './geometry';

/**
 * Where the content was, the last time the viewport and the geometry agreed.
 */
export interface ScrollAnchorSnapshot<RowModel> {
  /** The topmost row element intersecting the scrollport when the snapshot was taken. */
  element: HTMLElement;
  rowIndex: number;
  /** The anchor's position relative to the scroller's top edge. */
  relativeTop: number;
  maxScrollTop: number;
  scrollTop: number;
  /** The anchor's position in the engine's coordinates, used when its element is recycled. */
  virtualOffset: number | null;
  rowsMeta: RowsGeometry;
  rows: VirtualizerRow<RowModel>[];
}

export interface ScrollAnchor<RowModel> {
  /**
   * The snapshot the last commit ended with. Read during render to anticipate the correction this
   * commit's anchoring effect is about to make.
   */
  readSnapshot: () => ScrollAnchorSnapshot<RowModel> | null;
}

export interface UseScrollAnchorParameters<RowModel> {
  enabled: boolean;
  gesture: ScrollGesture;
  /** Realigns the sticky render zone for a position written here. */
  onScrollApplied: (scrollTop: number) => void;
  pendingScroll: PendingScroll;
  /**
   * Re-renders the window when a correction lands far from the position this commit's rows were
   * rendered for.
   */
  refreshWindowAfterCorrectiveScroll: (scrollTop: number) => void;
  renderZoneRef: React.RefObject<HTMLElement | null>;
  rows: VirtualizerRow<RowModel>[];
  /** The engine's row geometry as of this render. */
  rowsMeta: RowsGeometry;
  scrollElementRef: React.RefObject<HTMLElement | null>;
  scrollportPaddingTotal: number;
  /**
   * The engine's latest row geometry, read when the effect runs. The engine publishes it before
   * React commits the matching row positions, so it can be ahead of `rowsMeta`.
   */
  readRowsGeometry: () => RowsGeometry;
  trailingHeight: number;
  /** Stacks the rendered rows for the position they are rendered for, before anything measures. */
  updateRenderZoneTransform: () => void;
}

/**
 * Keeps the content the user is looking at where it is, across geometry updates.
 *
 * Measurements replacing estimates, mounts realizing real heights, and estimate refreshes can all
 * move the rendered rows relative to the scrollport while the browser keeps `scrollTop`
 * unchanged, so the content would jump. This tracks the on-screen position of the topmost visible
 * row element and compensates by scrolling by however much it actually moved beyond the user's own
 * scrolling. Comparing real DOM positions rather than virtual position deltas matters: a row
 * measured after the window has already scrolled past it changes its virtual position without
 * moving anything on screen, and "correcting" for that would push the viewport around for no
 * visual reason. When the viewport was at the previous maximum scroll position, the bottom is
 * pinned instead: preserving the top row in that case would leave newly measured content below the
 * viewport.
 *
 * Must be declared after `usePendingScroll`, whose outstanding request repositions absolutely from
 * fresh geometry and so supersedes anchoring, and before `useAdaptiveEstimateRefresh`, whose
 * rewrites this compensates for on the resulting commit.
 *
 * A candidate for the engine itself: beside `hydrateRowsMeta` it could set `ignoreNextScrollEvent`
 * and skip the scroll-event round trip that an external `scrollTop` write costs. What it should
 * anchor on is not settled, though — it holds the topmost visible row, and once the adaptive
 * estimate has settled that lets a selection lower in the viewport drift under a geometry rewrite
 * (see the alignment test kept on `Virtualizer.combobox.test.tsx`). Resolve that before proposing
 * it upstream.
 */
export function useScrollAnchor<RowModel>(
  parameters: UseScrollAnchorParameters<RowModel>,
): ScrollAnchor<RowModel> {
  const {
    enabled,
    gesture,
    onScrollApplied,
    pendingScroll,
    refreshWindowAfterCorrectiveScroll,
    renderZoneRef,
    rows,
    rowsMeta,
    scrollElementRef,
    readRowsGeometry,
    scrollportPaddingTotal,
    trailingHeight,
    updateRenderZoneTransform,
  } = parameters;

  const snapshotRef = React.useRef<ScrollAnchorSnapshot<RowModel> | null>(null);

  useIsoLayoutEffect(() => {
    const scrollElement = scrollElementRef.current;
    const renderZone = renderZoneRef.current;

    if (!enabled || scrollElement == null || renderZone == null) {
      snapshotRef.current = null;
      return;
    }

    // The inline render style stacks rows from the top without DOM knowledge. Re-anchor the
    // rendered tail before any measurement below so anchor snapshots see final positions.
    updateRenderZoneTransform();

    // A pending scrollToIndex request repositions absolutely from the fresh geometry instead.
    if (pendingScroll.isPending()) {
      snapshotRef.current = null;
      return;
    }

    const latestRowsMeta = readRowsGeometry();
    // MUI publishes the store update before React commits the matching row positions. We can still
    // compensate from the logical row offsets, but must not snapshot the stale DOM in that commit.
    const hasPendingRowsMeta = rowsMeta !== latestRowsMeta;
    const previous = snapshotRef.current;
    const geometryChanged = previous?.rowsMeta !== latestRowsMeta;
    const scrollerRect = scrollElement.getBoundingClientRect();
    const scrollerTop = scrollerRect.top;
    let scrollTop = scrollElement.scrollTop;
    const maxScrollTop = getMaxScrollOffset(
      latestRowsMeta.currentPageTotalHeight + scrollportPaddingTotal + trailingHeight,
      scrollElement.clientHeight,
    );
    const shouldPinToBottom =
      previous !== null &&
      previous.maxScrollTop > 0 &&
      Math.abs(previous.scrollTop - previous.maxScrollTop) < 1 &&
      (Math.abs(scrollTop - previous.scrollTop) < 1 || Math.abs(scrollTop - maxScrollTop) < 1);

    if (
      previous !== null &&
      previous.rows === rows &&
      geometryChanged &&
      // During a scrollbar drag the user dictates the absolute position and corrections would
      // fight the pointer; the snapshot below simply absorbs whatever shifted.
      !gesture.isScrollbarDrag() &&
      // When pinned to the very top, stay there, mirroring native scroll anchoring.
      scrollTop > 0
    ) {
      let shift = 0;

      const elementStillRepresentsRow =
        previous.element.isConnected &&
        Number(previous.element.dataset.rowIndex) === previous.rowIndex;

      if (!hasPendingRowsMeta && elementStillRepresentsRow) {
        const anchorTop = previous.element.getBoundingClientRect().top - scrollerTop;
        // How far the anchor actually moved on screen beyond what user scrolling accounts for.
        shift = anchorTop - previous.relativeTop + (scrollTop - previous.scrollTop);
      } else if (
        previous.virtualOffset != null &&
        // A geometry refresh can replace the entire render window before this effect runs. In
        // that case the DOM anchor is gone, but the old row's virtual offset still tells us by
        // how much the content above it moved. Use this fallback when the user did not scroll in
        // between; a position at the new maximum is the browser's own clamp after the content
        // shrank under the current scroll position, not user scrolling.
        (Math.abs(scrollTop - previous.scrollTop) < 1 || Math.abs(scrollTop - maxScrollTop) < 1)
      ) {
        const currentVirtualOffset = latestRowsMeta.positions[previous.rowIndex];
        if (currentVirtualOffset != null) {
          // Apply the geometry shift to the position the user last held; a browser clamp has
          // already absorbed part of that shift into `scrollTop`.
          shift = currentVirtualOffset - previous.virtualOffset - (scrollTop - previous.scrollTop);
        }
      }

      if (shouldPinToBottom || Math.abs(shift) >= 1) {
        const nextScrollTop = shouldPinToBottom
          ? maxScrollTop
          : clamp(scrollTop + shift, 0, maxScrollTop);

        if (Math.abs(nextScrollTop - scrollTop) >= 1) {
          scrollTop = nextScrollTop;
          pendingScroll.noteProgrammaticScroll(nextScrollTop);
          scrollElement.scrollTo({ behavior: 'instant' as ScrollBehavior, top: nextScrollTop });
          // Realign the mounted rows before paint. The engine observes the same value when the
          // asynchronous scroll event arrives, making this idempotent.
          onScrollApplied(nextScrollTop);
          // A correction that lands far from the position this commit's window was rendered for
          // can move the viewport beyond the mounted rows. Re-render before paint so the window
          // follows the corrected position.
          refreshWindowAfterCorrectiveScroll(nextScrollTop);
        }
      }
    }

    if (hasPendingRowsMeta) {
      if (previous != null) {
        const virtualOffset = latestRowsMeta.positions[previous.rowIndex];
        if (virtualOffset != null) {
          snapshotRef.current = {
            ...previous,
            maxScrollTop,
            // The element position was measured at the snapshot's scroll position. Keep the pair
            // consistent while carrying the snapshot forward, or the next on-screen comparison
            // double-counts the scrolling that happened in between as a geometry shift.
            relativeTop: previous.relativeTop - (scrollTop - previous.scrollTop),
            scrollTop,
            virtualOffset,
            rowsMeta: latestRowsMeta,
          };
        }
      }
      return;
    }

    const userScrollDelta = previous == null ? 0 : scrollTop - previous.scrollTop;
    if (
      previous != null &&
      previous.rows === rows &&
      !previous.element.isConnected &&
      !gesture.isScrollbarDrag() &&
      Math.abs(userScrollDelta) >= 1 &&
      Math.abs(userScrollDelta) <= scrollElement.clientHeight
    ) {
      const virtualOffset = rowsMeta.positions[previous.rowIndex];
      if (virtualOffset != null) {
        // A small scroll can replace the whole virtual window before its newly mounted rows are
        // measured. Keep the prior logical anchor for one measurement cycle so growth between the
        // old and new windows is not lost merely because its DOM node was recycled.
        snapshotRef.current = {
          ...previous,
          maxScrollTop,
          relativeTop: previous.relativeTop - userScrollDelta,
          scrollTop,
          virtualOffset,
          rowsMeta,
        };
        return;
      }
    }

    const anchor = findAnchorRowElement(renderZone, scrollerTop, scrollerRect.bottom);
    snapshotRef.current =
      anchor === null
        ? null
        : {
            element: anchor.element,
            rowIndex: anchor.rowIndex,
            relativeTop: anchor.relativeTop,
            maxScrollTop,
            scrollTop,
            virtualOffset: rowsMeta.positions[anchor.rowIndex] ?? null,
            rowsMeta,
            rows,
          };
  });

  // Read during render to anticipate this commit's correction, so it cannot be a stable callback.
  const readSnapshot = React.useCallback(() => snapshotRef.current, []);

  return React.useMemo(() => ({ readSnapshot }), [readSnapshot]);
}

/**
 * Returns the topmost row element intersecting the scrollport, with its position relative to the
 * scroller's top edge. The retained focus-proxy row is absolutely positioned out of layout and is
 * never a valid anchor.
 */
function findAnchorRowElement(
  renderZone: HTMLElement,
  scrollerTop: number,
  scrollerBottom: number,
) {
  for (let index = 0; index < renderZone.children.length; index += 1) {
    const child = renderZone.children[index] as HTMLElement;

    if (child.style.position === 'absolute') {
      continue;
    }

    const rect = child.getBoundingClientRect();
    if (rect.height > 0 && rect.bottom > scrollerTop && rect.top < scrollerBottom) {
      return {
        element: child,
        rowIndex: Number(child.dataset.rowIndex),
        relativeTop: rect.top - scrollerTop,
      };
    }
  }

  return null;
}
