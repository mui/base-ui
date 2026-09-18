'use client';
import * as React from 'react';
import { clamp } from '@base-ui/utils/clamp';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
import { getMaxScrollOffset } from '../utils/scrollEdges';
import type { VirtualizerRow } from '../internals/virtualization/types';
import type { PendingScroll } from './usePendingScroll';
import type { ScrollGesture } from './useScrollGesture';
import { getLaidOutRowElements } from './getLaidOutRowElements';

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

export interface UseScrollAnchorParameters<RowModel> {
  enabled: boolean;
  gesture: ScrollGesture;
  /** Hands a position written here to the engine, which the browser tells only a task later. */
  onScrollApplied: (scrollTop: number) => void;
  pendingScroll: PendingScroll;
  /**
   * The element whose children — or grandchildren, one group wrapper deep — are the laid-out
   * rows, in whichever layout the rows are currently in.
   */
  getRowsParent: () => HTMLElement | null;
  /**
   * Whether the window the rows are held in stands where they belong, rather than held at the
   * scrollport's edge after a scroll outran it, until the engine places the next window.
   */
  isWindowInPlace: () => boolean;
  rows: VirtualizerRow<RowModel>[];
  /** The engine's row geometry as of this render. */
  rowsMeta: RowsGeometry;
  scrollElementRef: React.RefObject<HTMLElement | null>;
  /** The scrollable content before the first row and after the last one, together. */
  rowsInsetTotal: number;
  /**
   * The engine's latest row geometry, read when the effect runs. The engine publishes it before
   * React commits the matching row positions, so it can be ahead of `rowsMeta`.
   */
  readRowsGeometry: () => RowsGeometry;
  trailingHeight: number;
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
export function useScrollAnchor<RowModel>(parameters: UseScrollAnchorParameters<RowModel>): void {
  const {
    enabled,
    gesture,
    onScrollApplied,
    pendingScroll,
    getRowsParent,
    isWindowInPlace,
    rows,
    rowsMeta,
    scrollElementRef,
    readRowsGeometry,
    rowsInsetTotal,
    trailingHeight,
  } = parameters;

  const snapshotRef = React.useRef<ScrollAnchorSnapshot<RowModel> | null>(null);

  useIsoLayoutEffect(() => {
    const scrollElement = scrollElementRef.current;
    const rowsParent = getRowsParent();

    if (!enabled || scrollElement == null || rowsParent == null) {
      snapshotRef.current = null;
      return;
    }

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
      latestRowsMeta.currentPageTotalHeight + rowsInsetTotal + trailingHeight,
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

      // A group header retained hidden after it left the window is still connected and still
      // names its row, but its rectangle describes nothing on screen.
      const elementStillRepresentsRow =
        previous.element.isConnected &&
        !previous.element.hidden &&
        // A row retained as the offscreen focus proxy is positioned out of the layout.
        previous.element.style.position !== 'absolute' &&
        Number(previous.element.dataset.rowIndex) === previous.rowIndex;

      // A window held at the scrollport's edge holds its rows where they do not belong, whether a
      // scroll outran it or the geometry moved it from under a resting viewport, which is the very
      // shift to correct here. The rows' positions on screen say nothing then, and the shift is
      // taken from the geometry instead.
      if (!hasPendingRowsMeta && elementStillRepresentsRow && isWindowInPlace()) {
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
          // The engine observes the written position when the asynchronous scroll event arrives,
          // and commits the window it calls for from inside that event, before the browser paints.
          onScrollApplied(nextScrollTop);
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

    // A held window's rows are not where the content is: nothing to snapshot off them, so the
    // snapshot taken while they were stands until the engine places the next window.
    if (!isWindowInPlace()) {
      return;
    }

    const anchor = findAnchorRowElement(rowsParent, scrollerTop, scrollerRect.bottom);
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
}

/**
 * Returns the topmost row element intersecting the scrollport, with its position relative to the
 * scroller's top edge. The retained focus-proxy row is absolutely positioned out of layout and is
 * never a valid anchor.
 */
function findAnchorRowElement(
  rowsParent: HTMLElement,
  scrollerTop: number,
  scrollerBottom: number,
) {
  for (const child of getLaidOutRowElements(rowsParent)) {
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
