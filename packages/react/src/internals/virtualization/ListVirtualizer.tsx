'use client';
import * as React from 'react';
import { ownerDocument, ownerWindow } from '@base-ui/utils/owner';
import { useAnimationFrame } from '@base-ui/utils/useAnimationFrame';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
import { useRefWithInit } from '@base-ui/utils/useRefWithInit';
import { useStableCallback } from '@base-ui/utils/useStableCallback';
import { useTimeout } from '@base-ui/utils/useTimeout';
import {
  Dimensions,
  LayoutList,
  Virtualization,
  useVirtualizer,
  type HeightEntry,
  type Row as MuiVirtualizerRow,
  type RowEntry,
  type RenderContext,
  type Virtualizer,
} from '@mui/x-virtualizer';
import { getMaxScrollOffset } from '../../utils/scrollEdges';
import { clamp } from '../clamp';
import type { StateAttributesMapping } from '../getStateAttributesProps';
import type { BaseUIComponentProps, HTMLProps } from '../types';
import { useRenderElement } from '../useRenderElement';
import type {
  ListVirtualizerHandle,
  ListVirtualizerScrollAlignment,
  ListVirtualizerScrollToIndexOptions,
} from './ListVirtualizationRegistry';

/**
 * A row consumed by the internal list virtualizer.
 */
export interface ListVirtualizerRow<RowModel extends MuiVirtualizerRow> {
  /**
   * Stable identity used by React and the measurement cache.
   */
  id: React.Key;
  /**
   * Component-specific data associated with the row.
   */
  model: RowModel;
}

/**
 * Parameters provided when rendering a row.
 */
export interface ListVirtualizerRenderRowParameters<RowModel extends MuiVirtualizerRow> {
  /**
   * The row being rendered.
   */
  row: ListVirtualizerRow<RowModel>;
  /**
   * Index in the virtual row collection.
   */
  rowIndex: number;
}

interface ListVirtualRowProps<RowModel extends MuiVirtualizerRow> {
  apiRef: React.RefObject<Virtualizer['api'] | null>;
  isVirtualFocusRow: boolean;
  renderRow: (params: ListVirtualizerRenderRowParameters<RowModel>) => React.ReactElement;
  row: ListVirtualizerRow<RowModel>;
  rowIndex: number;
}

/**
 * Removes a retained offscreen focus row from layout while keeping its content mounted.
 */
const focusProxyStyle: React.CSSProperties = {
  pointerEvents: 'none',
  position: 'absolute',
  top: 0,
  // Keep the focused item's content measurable and exposed to assistive technology while
  // removing it from the scroll layout.
  transform: 'translateX(-10000px)',
};

const virtualRowStyle: React.CSSProperties = {
  display: 'flow-root',
};

function ListVirtualRowImpl<RowModel extends MuiVirtualizerRow>(
  props: ListVirtualRowProps<RowModel>,
) {
  const { apiRef, isVirtualFocusRow, renderRow, row, rowIndex } = props;

  const measureCleanupRef = React.useRef<(() => void) | undefined>(undefined);
  const measureRef = useStableCallback((element: HTMLElement | null) => {
    measureCleanupRef.current?.();
    measureCleanupRef.current = element
      ? apiRef.current?.rowsMeta.observeRowHeight(element, row.id)
      : undefined;
  });

  useIsoLayoutEffect(() => {
    if (!isVirtualFocusRow) {
      // Dynamic row measurement is incremental in MUI Virtualizer. Mark real rows as measured so their
      // metadata can advance the measured boundary; the zero-sized focus proxy must not count.
      apiRef.current?.rowsMeta.setLastMeasuredRowIndex(rowIndex);
    }
  }, [apiRef, isVirtualFocusRow, rowIndex]);

  const content = renderRow({
    row,
    rowIndex,
  });

  const style = isVirtualFocusRow ? focusProxyStyle : virtualRowStyle;

  // MUI Virtualizer can retain a focused row outside the visible range. Keep its semantic content mounted,
  // but remove it from layout and measurement until the real row enters the rendered window.
  return (
    <div
      ref={isVirtualFocusRow ? undefined : measureRef}
      role="presentation"
      data-row-index={rowIndex}
      style={style}
    >
      {content}
    </div>
  );
}

const ListVirtualRow = React.memo(ListVirtualRowImpl) as typeof ListVirtualRowImpl;

function getRenderZoneTransform(offsetTop: number, scrollTop: number) {
  return `translate3d(0, ${offsetTop - scrollTop}px, 0)`;
}

/**
 * Index of the last row starting at or before the given virtual offset.
 */
function findRowIndexAtOffset(rowPositions: readonly number[], rowCount: number, offset: number) {
  let low = 0;
  let high = rowCount - 1;

  while (low < high) {
    const middle = Math.ceil((low + high) / 2);
    if ((rowPositions[middle] ?? 0) <= offset) {
      low = middle;
    } else {
      high = middle - 1;
    }
  }

  return low;
}

function getOverscannedRenderContext(
  renderContext: RenderContext,
  rowPositions: readonly number[],
  rowCount: number,
  pinnedRowIndex: number | undefined,
  overscanPx: number,
  scrollTop: number,
  viewportHeight: number,
) {
  let firstRowIndex = renderContext.firstRowIndex;
  let lastRowIndex = renderContext.lastRowIndex;
  const overscanStart = Math.max(0, scrollTop - overscanPx);
  const overscanEnd = scrollTop + viewportHeight + overscanPx;

  // The engine only observes native scroll events, so a corrective scroll write can supersede
  // the position its render context was computed for, leaving that window entirely outside the
  // viewport until the event arrives a task later. Painting it would blank the scrollport, and
  // the expansion below only widens windows, which would mount every row in between. Rebuild the
  // window at the viewport instead.
  if (rowCount > 0) {
    const windowStart = rowPositions[firstRowIndex] ?? 0;
    const windowEnd =
      lastRowIndex >= rowCount ? Number.POSITIVE_INFINITY : (rowPositions[lastRowIndex] ?? 0);
    if (windowEnd < overscanStart || windowStart > overscanEnd) {
      firstRowIndex = findRowIndexAtOffset(rowPositions, rowCount, overscanStart);
      lastRowIndex = firstRowIndex;
    }
  }

  while (firstRowIndex > 0 && (rowPositions[firstRowIndex] ?? 0) > overscanStart) {
    firstRowIndex -= 1;
  }

  while (
    lastRowIndex < rowCount &&
    (rowPositions[lastRowIndex] ?? Number.POSITIVE_INFINITY) <= overscanEnd
  ) {
    lastRowIndex += 1;
  }

  // MUI Virtualizer renders a half-open range but only retains a focused row when it is strictly beyond
  // the end index. Include the pinned row when it lands exactly on that boundary.
  if (lastRowIndex === pinnedRowIndex) {
    lastRowIndex = Math.min(rowCount, lastRowIndex + 1);
  }

  return {
    ...renderContext,
    firstRowIndex,
    lastRowIndex,
  };
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

/**
 * Minimum number of measured rows before a static estimate is replaced with their running
 * average, so a single unusual first row cannot skew the whole virtual geometry while still
 * allowing tall rows to reduce the settled render window.
 */
const ADAPTIVE_ESTIMATE_MIN_SAMPLES = 3;

/**
 * Nearby rows do not accumulate enough estimate error to justify delaying scroll completion.
 */
const ADAPTIVE_SCROLL_TARGET_MIN_DISTANCE = 10;

/**
 * How long after the last scroll position change a gesture is considered finished. Refreshing the
 * estimate rewrites the height of every unmeasured row at once, so it is held back until then.
 */
const SCROLL_IDLE_MS = 150;

/**
 * How recently a wheel or touch event must have occurred for a scroll event to be attributed to
 * it. Scroll bursts without such input while a mouse button is held are native scrollbar drags.
 */
const DIRECT_INPUT_WINDOW_MS = 250;

const stateAttributesMapping: StateAttributesMapping<ListVirtualizerState> = {
  totalSize: () => null,
};

/**
 * Internal component-agnostic engine for virtualized one-dimensional lists.
 *
 * Component adapters supply stable rows and render their own semantic item elements. This
 * component owns layout, measurement, windowing, focus-row retention, and scroll correction.
 */
export const ListVirtualizer = React.forwardRef(function ListVirtualizer<
  RowModel extends MuiVirtualizerRow,
>(
  componentProps: ListVirtualizer.Props<RowModel>,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const {
    apiRef: apiRefProp,
    className,
    enabled = true,
    estimatedItemHeight,
    onUnconstrainedHeight,
    overscanPx,
    pinnedRowIndex,
    render,
    renderRow: renderRowProp,
    restoreViewportVersion = 0,
    rows,
    scrollToRowIndex,
    style,
    totalSizeCssVariable,
    ...elementProps
  } = componentProps;

  const scrollElementRef = React.useRef<HTMLDivElement | null>(null);
  const renderZoneRef = React.useRef<HTMLDivElement | null>(null);
  const renderZoneOffsetTopRef = React.useRef(0);
  /**
   * Virtual position of the end of the rendered range when it includes the final row, or `null`
   * otherwise. Anchors the rendered tail to the virtual content end.
   */
  const renderZoneVirtualEndRef = React.useRef<number | null>(null);
  const scrollTopRef = React.useRef(0);
  const muiApiRef = React.useRef<Virtualizer['api'] | null>(null);

  const useAdaptiveEstimate = typeof estimatedItemHeight === 'number';
  const adaptiveEstimateRef = React.useRef<number | null>(null);
  const adaptiveMeasurementsRef = useRefWithInit(() => ({
    heights: new Map<React.Key, number>(),
    total: 0,
  }));
  const measuredRowsRef = useRefWithInit(() => new Set<React.Key>());
  const adaptiveRowsRef = React.useRef(rows);
  const adaptiveEstimatedItemHeightRef = React.useRef(
    typeof estimatedItemHeight === 'number' ? estimatedItemHeight : null,
  );
  // Filtering replaces the row array, but measurements from the same keyed collection remain
  // useful when the full list returns. Reset only when the estimate or logical collection changes.
  const adaptiveKnownRowIdsRef = useRefWithInit(() => new Set(rows.map((row) => row.id)));
  const staticEstimatedItemHeight =
    typeof estimatedItemHeight === 'number' ? estimatedItemHeight : null;
  if (
    adaptiveRowsRef.current !== rows ||
    adaptiveEstimatedItemHeightRef.current !== staticEstimatedItemHeight
  ) {
    const knownRowIds = adaptiveKnownRowIdsRef.current;
    const nextRowIds = new Set(rows.map((row) => row.id));
    const estimateChanged = adaptiveEstimatedItemHeightRef.current !== staticEstimatedItemHeight;
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

    adaptiveRowsRef.current = rows;
    adaptiveEstimatedItemHeightRef.current = staticEstimatedItemHeight;

    if (estimateChanged || collectionChanged) {
      adaptiveEstimateRef.current = null;
      adaptiveMeasurementsRef.current.heights.clear();
      adaptiveMeasurementsRef.current.total = 0;
      measuredRowsRef.current.clear();
      knownRowIds.clear();
    }

    rows.forEach((row) => knownRowIds.add(row.id));
  }

  const pendingScrollRowIndexRef = React.useRef<number | null>(null);
  const pendingScrollRowIdRef = React.useRef<React.Key | null>(null);
  const pendingScrollAlignmentRef = React.useRef<ListVirtualizerScrollAlignment>('auto');
  const pendingScrollRequiresMeasurementRef = React.useRef(false);
  const pendingScrollRequiresAdaptiveEstimateRef = React.useRef(false);
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
  const pendingViewportScrollTopRef = React.useRef<number | null>(null);
  const pendingViewportScrollFrame = useAnimationFrame();

  // Scrolling is treated as ongoing until this long without a scroll position change, so that
  // geometry rewrites can be held back for the duration of a gesture.
  const scrollIdleTimeout = useTimeout();
  const isScrollingRef = React.useRef(false);
  const [scrollIdleRevision, bumpScrollIdleRevision] = React.useReducer((value) => value + 1, 0);
  // Forces the rendered window to recompute after a corrective scroll write moved the viewport
  // beyond the rows the current commit mounted. Bumped from a layout effect, so the follow-up
  // commit still lands before paint.
  const [, bumpWindowRevision] = React.useReducer((value) => value + 1, 0);
  const renderScrollTopRef = React.useRef(0);
  const adaptiveEstimateTimeout = useTimeout();
  const adaptiveRowsMetaRef = React.useRef<unknown>(null);
  const [adaptiveMeasurementRevision, bumpAdaptiveMeasurementRevision] = React.useReducer(
    (value) => value + 1,
    0,
  );

  /** Timestamp of the last wheel/touch input on the scroller. */
  const lastDirectInputTimeRef = React.useRef(Number.NEGATIVE_INFINITY);
  /** Whether a pointer or mouse button is currently pressed, tracked on the owner document. */
  const pointerDownRef = React.useRef(false);
  /**
   * Whether the current scroll burst arrives without wheel/touch input while a mouse button is
   * held — a native scrollbar drag. The user then dictates the absolute scroll position, so
   * anchoring corrections and estimate refreshes are suspended until release.
   */
  const isScrollbarDragRef = React.useRef(false);
  const deferredRowHeightsRef = useRefWithInit(() => new Map<React.Key, number>());
  const releaseScrollbarDragFrame = useAnimationFrame();

  /**
   * Positions the render zone for the scroll position last processed by the engine. Rows are
   * normally stacked downward from the estimated position of the first rendered row, but rows
   * carry their real DOM heights, so accumulated estimate error would misplace the end of the
   * collection: at the maximum scroll position a taller-than-estimated tail clips the final row
   * against the scrollport while a shorter one detaches it from the bottom edge. When the
   * rendered range includes the final row, anchor it to the virtual content end instead so the
   * bottom edge is exact wherever estimate error still exists (primarily while a scrollbar drag
   * defers measurements).
   */
  const updateRenderZoneTransform = useStableCallback(() => {
    const renderZone = renderZoneRef.current;

    if (!renderZone) {
      return;
    }

    // A geometry commit that shrinks the content makes the browser clamp the scroll position
    // during layout, before any scroll event updates the engine's bookkeeping. The live DOM
    // position is authoritative; the ref only bridges the moments without a scroll element.
    // While a requested position is still waiting for the scrollport to accept it, that position
    // is what the rows are rendered for, so the transform must use it too.
    const scrollTop =
      pendingViewportScrollTopRef.current ??
      scrollElementRef.current?.scrollTop ??
      scrollTopRef.current;
    const stacked = renderZoneOffsetTopRef.current - scrollTop;
    let translate = stacked;
    const virtualEnd = renderZoneVirtualEndRef.current;

    if (virtualEnd != null) {
      const anchored = virtualEnd - scrollTop - renderZone.offsetHeight;
      translate =
        anchored <= stacked
          ? // The real tail is taller than estimated. Pulling it up cannot uncover the scrollport's
            // top edge: the extra real height always reaches at least as far down as before.
            anchored
          : // The real tail is shorter than estimated. Push it down to the virtual end, but never
            // below the scrollport's top edge, which would uncover rows above the rendered range.
            Math.max(stacked, Math.min(anchored, 0));
    }

    renderZone.style.transform = `translate3d(0, ${translate}px, 0)`;
  });

  // The browser moves a native scrollport before dispatching its scroll event. Keep the existing
  // rows pinned in a sticky viewport during that interval, then move the render zone once
  // MUI Virtualizer has synchronously committed the next row window.
  const handleScrollChange = useStableCallback((scrollPosition: { top: number }) => {
    // Scroll events matching the last position this component wrote are echoes of its own
    // corrective writes; only genuine user scrolling affects gesture state below.
    const hasRecentDirectInput =
      performance.now() - lastDirectInputTimeRef.current <= DIRECT_INPUT_WINDOW_MS;
    const isProgrammatic =
      (programmaticScrollTopRef.current != null &&
        Math.abs(scrollPosition.top - programmaticScrollTopRef.current) <= 1) ||
      // Expanding a collection can queue several corrective native scroll events while its
      // adaptive estimate settles. None of those are user takeovers unless direct input occurred.
      (pendingScrollRequiresAdaptiveEstimateRef.current &&
        !hasRecentDirectInput &&
        !pointerDownRef.current);

    if (!isProgrammatic) {
      isScrollingRef.current = true;
      scrollIdleTimeout.start(SCROLL_IDLE_MS, () => {
        isScrollingRef.current = false;
        bumpScrollIdleRevision();
      });

      const isScrollbarDrag = pointerDownRef.current && !hasRecentDirectInput;
      isScrollbarDragRef.current = isScrollbarDrag;

      // User scrolling supersedes a pending scroll-to-row request: retrying the retained
      // destination after the user took over would yank the list away from where they scrolled.
      pendingScrollRowIndexRef.current = null;
      pendingScrollRowIdRef.current = null;
      pendingScrollRequiresAdaptiveEstimateRef.current = false;
      pendingViewportScrollTopRef.current = null;
      pendingViewportScrollFrame.cancel();
    }

    scrollTopRef.current = scrollPosition.top;
    updateRenderZoneTransform();
  });

  React.useEffect(() => {
    const scrollElement = scrollElementRef.current;
    if (!scrollElement) {
      return undefined;
    }

    const doc = ownerDocument(scrollElement);
    const win = ownerWindow(scrollElement);
    const commitScrollbarDrag = () => {
      if (!isScrollbarDragRef.current && deferredRowHeightsRef.current.size === 0) {
        return;
      }

      isScrollbarDragRef.current = false;
      releaseScrollbarDragFrame.request(() => {
        // Commit real heights collected during the drag in one geometry update after release.
        muiApiRef.current?.rowsMeta.hydrateRowsMeta();
        bumpScrollIdleRevision();
      });
    };
    const onDirectInput = () => {
      lastDirectInputTimeRef.current = performance.now();
      commitScrollbarDrag();
    };
    const onPressStart = () => {
      pointerDownRef.current = true;
    };
    const endScrollbarDrag = () => {
      pointerDownRef.current = false;
      commitScrollbarDrag();
    };

    const options: AddEventListenerOptions = { passive: true };
    scrollElement.addEventListener('wheel', onDirectInput, options);
    scrollElement.addEventListener('touchmove', onDirectInput, options);
    // Pointer and compat mouse events complement each other: list items cancel `pointerdown` to
    // protect the anchor's focus, which suppresses the compat `mousedown`/`mouseup` for that
    // press, while native scrollbar presses may dispatch only mouse events. Setting the shared
    // flag twice for the same press is harmless.
    doc.addEventListener('pointerdown', onPressStart, options);
    doc.addEventListener('mousedown', onPressStart, options);
    doc.addEventListener('pointerup', endScrollbarDrag, options);
    doc.addEventListener('pointercancel', endScrollbarDrag, options);
    doc.addEventListener('mouseup', endScrollbarDrag, options);
    // A drag can end outside the window; treat losing focus as releasing the button.
    win.addEventListener('blur', endScrollbarDrag);
    return () => {
      scrollElement.removeEventListener('wheel', onDirectInput, options);
      scrollElement.removeEventListener('touchmove', onDirectInput, options);
      doc.removeEventListener('pointerdown', onPressStart, options);
      doc.removeEventListener('mousedown', onPressStart, options);
      doc.removeEventListener('pointerup', endScrollbarDrag, options);
      doc.removeEventListener('pointercancel', endScrollbarDrag, options);
      doc.removeEventListener('mouseup', endScrollbarDrag, options);
      win.removeEventListener('blur', endScrollbarDrag);
    };
  }, [deferredRowHeightsRef, releaseScrollbarDragFrame]);
  const [virtualizationRevision, bumpVirtualizationRevision] = React.useReducer(
    (value) => value + 1,
    0,
  );
  const layout = useRefWithInit(
    () =>
      new LayoutList({
        container: scrollElementRef,
        scroller: scrollElementRef,
      }),
  ).current;

  const getEstimatedItemHeight = React.useCallback(
    (row: ListVirtualizerRow<RowModel>, rowIndex: number) => {
      const size =
        typeof estimatedItemHeight === 'function'
          ? estimatedItemHeight(row.model, rowIndex)
          : estimatedItemHeight;
      return Math.max(1, size);
    },
    [estimatedItemHeight],
  );

  const defaultEstimatedItemHeight =
    rows.length === 0
      ? Math.max(1, typeof estimatedItemHeight === 'number' ? estimatedItemHeight : 1)
      : getEstimatedItemHeight(rows[0], 0);

  const rowsRef = React.useRef(rows);
  rowsRef.current = rows;

  const validPinnedRowIndex =
    pinnedRowIndex != null && pinnedRowIndex >= 0 && rows[pinnedRowIndex] != null
      ? pinnedRowIndex
      : undefined;
  const focusedVirtualCellRef = React.useRef<{
    columnIndex: number;
    id: React.Key;
    rowIndex: number;
  } | null>(null);
  focusedVirtualCellRef.current =
    validPinnedRowIndex == null
      ? null
      : {
          columnIndex: 0,
          id: rows[validPinnedRowIndex].id,
          rowIndex: validPinnedRowIndex,
        };

  const getFocusedVirtualCell = React.useCallback(() => focusedVirtualCellRef.current, []);

  const renderRow = React.useCallback(
    (params: {
      id: React.Key;
      model: MuiVirtualizerRow;
      rowIndex: number;
      isVirtualFocusRow: boolean;
    }) => {
      const row = rows[params.rowIndex];
      return (
        <ListVirtualRow
          key={params.id}
          apiRef={muiApiRef}
          isVirtualFocusRow={params.isVirtualFocusRow}
          renderRow={renderRowProp}
          row={row}
          rowIndex={params.rowIndex}
        />
      );
    },
    [renderRowProp, rows],
  );

  const getRowHeight = React.useCallback(() => 'auto' as const, []);
  const rowIndexById = React.useMemo(() => {
    const map = new Map<React.Key, number>();
    rows.forEach((row, rowIndex) => {
      map.set(row.id, rowIndex);
    });
    return map;
  }, [rows]);

  // MUI Virtualizer rehydrates row metadata when these callback identities change. This intentionally uses
  // a dependency-sensitive callback so estimate changes invalidate cached geometry.
  const getEstimatedRowHeight = React.useCallback(
    (row: RowEntry) => {
      // A static estimate is refined with the running average of measured rows so the virtual
      // geometry converges quickly. Per-row estimate functions encode knowledge that a global
      // average would override, so they are used as provided.
      if (useAdaptiveEstimate && adaptiveEstimateRef.current != null) {
        return adaptiveEstimateRef.current;
      }

      const rowIndex = rowIndexById.get(row.id as React.Key) ?? -1;
      const listRow = rows[rowIndex];
      return listRow ? getEstimatedItemHeight(listRow, rowIndex) : defaultEstimatedItemHeight;
    },
    [defaultEstimatedItemHeight, getEstimatedItemHeight, rowIndexById, rows, useAdaptiveEstimate],
  );
  const resolvedEstimatedItemHeight =
    useAdaptiveEstimate && adaptiveEstimateRef.current != null
      ? adaptiveEstimateRef.current
      : defaultEstimatedItemHeight;
  const applyRowHeight = React.useCallback(
    (entry: HeightEntry, row: RowEntry) => {
      const deferredHeight = deferredRowHeightsRef.current.get(row.id as React.Key);

      if (!isScrollbarDragRef.current) {
        if (deferredHeight != null) {
          entry.content = deferredHeight;
          deferredRowHeightsRef.current.delete(row.id as React.Key);
        }
        if (!entry.needsFirstMeasurement) {
          measuredRowsRef.current.add(row.id as React.Key);
        }
        return;
      }

      if (entry.needsFirstMeasurement || measuredRowsRef.current.has(row.id as React.Key)) {
        return;
      }

      const estimatedHeight = getEstimatedRowHeight(row);
      // ResizeObserver may report the same mounted row more than once during a drag. Preserve the
      // newest real height, but do not mistake our committed estimate for a new measurement.
      if (deferredHeight == null || entry.content !== estimatedHeight) {
        deferredRowHeightsRef.current.set(row.id as React.Key, entry.content);
      }
      entry.content = estimatedHeight;
    },
    [deferredRowHeightsRef, getEstimatedRowHeight, measuredRowsRef],
  );
  const range = React.useMemo(
    () =>
      rows.length === 0
        ? null
        : {
            // MUI Virtualizer ranges are half-open: the last row index is excluded.
            firstRowIndex: 0,
            lastRowIndex: rows.length,
          },
    [rows.length],
  );
  const rowBufferPx = Math.max(0, overscanPx ?? Math.max(150, resolvedEstimatedItemHeight));
  // MUI Virtualizer waits for one estimated row of accumulated scrolling before recomputing an unchanged
  // controlled range. Keep at least that much measured content mounted when an estimate is taller
  // than the real rows, even when the requested overscan is smaller.
  const renderBufferPx = Math.max(rowBufferPx, resolvedEstimatedItemHeight);

  const scrollAnchorRef = React.useRef<{
    element: HTMLElement;
    rowIndex: number;
    relativeTop: number;
    maxScrollTop: number;
    scrollTop: number;
    virtualOffset: number | null;
    rowsMeta: unknown;
    rows: ListVirtualizerRow<RowModel>[];
  } | null>(null);

  const virtualizer = useVirtualizer({
    layout,
    dimensions: {
      // Keep the engine's scroll threshold in sync with the estimate used for unmeasured rows.
      // Otherwise a deliberately low initial estimate keeps forcing synchronous range updates
      // every few pixels even after the virtual geometry has converged.
      rowHeight: resolvedEstimatedItemHeight,
    },
    virtualization: {
      // Controlled range calculation avoids MUI Virtualizer's fixed 15-row directional buffer. Base UI
      // applies the requested pixel buffer to the returned range below.
      layoutMode: 'controlled',
      rowBufferPx,
    },
    initialState: {
      virtualization: {
        enabled,
        enabledForColumns: false,
        enabledForRows: enabled,
      },
    },
    rows,
    range,
    rowCount: rows.length,
    applyRowHeight,
    getRowHeight,
    getEstimatedRowHeight,
    focusedVirtualCell: getFocusedVirtualCell,
    renderRow,
    onScrollChange: handleScrollChange,
  });
  muiApiRef.current = virtualizer.api;

  const totalSize = virtualizer.store.use(Dimensions.selectors.contentHeight);
  // This subscription also drives the second phase of scrolling after ResizeObserver replaces
  // estimates with measured row positions.
  const rowsMeta = virtualizer.store.use(Dimensions.selectors.rowsMeta);
  const dimensions = virtualizer.store.use(Dimensions.selectors.dimensions);
  const rootSize = virtualizer.store.use(Dimensions.selectors.rootSize);
  const containerProps = virtualizer.store.use(LayoutList.selectors.containerProps);
  const contentProps = virtualizer.store.use(LayoutList.selectors.contentProps);
  const positionerProps = virtualizer.store.use(LayoutList.selectors.positionerProps);
  const renderContext = virtualizer.store.use(Virtualization.selectors.renderContext);

  // The engine publishes a recomputed render context inside the scroll event before this
  // component's own scroll bookkeeping observes it, while corrective writes below move the
  // scrollport before the engine hears about them. The live scroll position is the only basis
  // consistent with both orderings.
  const liveScrollTop = scrollElementRef.current?.scrollTop ?? 0;
  const currentMaxScrollTop =
    dimensions.viewportInnerSize.height > 0
      ? getMaxScrollOffset(rowsMeta.currentPageTotalHeight, dimensions.viewportInnerSize.height)
      : null;
  // When a geometry rewrite shrinks the content below the current scroll position, the browser
  // clamps `scrollTop` the moment the commit lays out — before any scroll event reports it.
  // Target that inevitable position now so this commit's window and transform match what paints.
  const clampedLiveScrollTop =
    currentMaxScrollTop === null ? liveScrollTop : Math.min(liveScrollTop, currentMaxScrollTop);

  // A geometry rewrite that lands while the viewport rests at the maximum scroll position is
  // followed by a bottom pin in the scroll-anchoring effect below, within this same commit.
  // The engine's render context was computed for the pre-rewrite scroll position, so the rows it
  // mounts end short of the rewritten content end; painting that window at the pinned position
  // would briefly blank the bottom of the scrollport. Render the window for the anticipated
  // pinned position instead so the same commit that moves the viewport also covers it.
  const scrollAnchor = scrollAnchorRef.current;
  const anticipatedMaxScrollTop =
    enabled &&
    currentMaxScrollTop !== null &&
    scrollAnchor !== null &&
    scrollAnchor.rows === rows &&
    scrollAnchor.rowsMeta !== rowsMeta &&
    scrollAnchor.maxScrollTop > 0 &&
    Math.abs(scrollAnchor.scrollTop - scrollAnchor.maxScrollTop) < 1 &&
    !isScrollbarDragRef.current &&
    pendingScrollRowIndexRef.current == null
      ? currentMaxScrollTop
      : null;
  const anticipateBottomPin =
    anticipatedMaxScrollTop !== null &&
    scrollAnchor !== null &&
    // Mirrors the effect's own takeover guard: the user has not scrolled away since the snapshot.
    (Math.abs(liveScrollTop - scrollAnchor.scrollTop) < 1 ||
      Math.abs(liveScrollTop - anticipatedMaxScrollTop) < 1);
  const settledRenderScrollTop =
    anticipateBottomPin && anticipatedMaxScrollTop !== null
      ? anticipatedMaxScrollTop
      : clampedLiveScrollTop;
  // A position the scrollport has not accepted yet still decides what the user sees, because the
  // rows paint inside the sticky viewport rather than at `scrollTop`. Render for it so the first
  // paint after a scroll request already shows the destination.
  const renderScrollTop = pendingViewportScrollTopRef.current ?? settledRenderScrollTop;

  const overscannedRenderContext = getOverscannedRenderContext(
    anticipateBottomPin
      ? // Seed the overscan expansion from the final row; it walks back to cover the new bottom.
        { ...renderContext, firstRowIndex: rows.length - 1, lastRowIndex: rows.length }
      : renderContext,
    rowsMeta.positions,
    rows.length,
    validPinnedRowIndex,
    renderBufferPx,
    renderScrollTop,
    dimensions.viewportInnerSize.height,
  );
  const overscannedRenderContextRef = React.useRef(overscannedRenderContext);
  overscannedRenderContextRef.current = overscannedRenderContext;
  renderScrollTopRef.current = renderScrollTop;
  const renderZoneOffsetTop = rowsMeta.positions[overscannedRenderContext.firstRowIndex] ?? 0;
  renderZoneOffsetTopRef.current = renderZoneOffsetTop;
  // When the whole collection is rendered, the first row's exact position (zero) takes priority
  // over the estimated content end, so tail anchoring must stay off.
  renderZoneVirtualEndRef.current =
    overscannedRenderContext.firstRowIndex > 0 &&
    overscannedRenderContext.lastRowIndex >= rows.length
      ? rowsMeta.currentPageTotalHeight
      : null;

  const resetScroll = useStableCallback(() => {
    programmaticScrollTopRef.current = 0;
    scrollElementRef.current?.scrollTo({
      behavior: 'instant' as ScrollBehavior,
      top: 0,
    });
    handleScrollChange({ top: 0 });
  });

  const getRowMetrics = useStableCallback((rowIndex: number) => {
    if (rowsRef.current[rowIndex] == null) {
      return null;
    }

    const currentRowsMeta = virtualizer.store.state.rowsMeta;
    const offset = currentRowsMeta.positions[rowIndex];
    const end = currentRowsMeta.positions[rowIndex + 1] ?? currentRowsMeta.currentPageTotalHeight;

    if (offset == null || end == null) {
      return null;
    }

    return {
      offset,
      size: end - offset,
    };
  });

  if (process.env.NODE_ENV !== 'production') {
    // NODE_ENV doesn't change at runtime
    // eslint-disable-next-line react-hooks/rules-of-hooks
    React.useEffect(() => {
      const element = scrollElementRef.current;
      if (
        enabled &&
        rows.length >= 100 &&
        // Row metadata updates after the row collection. Ignore geometry retained from the
        // previous collection while the virtualizer hydrates the new rows.
        rowsMeta.positions.length === rows.length &&
        element &&
        rowsMeta.currentPageTotalHeight > 0 &&
        element.clientHeight >= rowsMeta.currentPageTotalHeight
      ) {
        onUnconstrainedHeight?.();
      }
    }, [enabled, onUnconstrainedHeight, rows.length, rowsMeta]);
  }

  const pendingVirtualizationUpdateRef = React.useRef(false);
  const restoreViewportRef = React.useRef(false);
  const handledRestoreViewportVersionRef = React.useRef(0);

  useIsoLayoutEffect(() => {
    if (
      restoreViewportVersion === 0 ||
      restoreViewportVersion === handledRestoreViewportVersionRef.current
    ) {
      return;
    }

    handledRestoreViewportVersionRef.current = restoreViewportVersion;
    restoreViewportRef.current = true;
  }, [restoreViewportVersion]);

  useIsoLayoutEffect(() => {
    const virtualization = virtualizer.store.state.virtualization;

    if (!enabled) {
      restoreViewportRef.current = false;
    }

    if (
      virtualization.enabled === enabled &&
      virtualization.enabledForRows === enabled &&
      virtualization.enabledForColumns === false
    ) {
      return;
    }

    if (enabled) {
      restoreViewportRef.current = true;
    }

    // Updating the store flag alone does not recompute the rendered range. Schedule the MUI Virtualizer
    // render-context update before publishing the new virtualization mode.
    pendingVirtualizationUpdateRef.current = true;
    virtualizer.api.scheduleUpdateRenderContext();
    virtualizer.store.set('virtualization', {
      ...virtualization,
      enabled,
      enabledForColumns: false,
      enabledForRows: enabled,
    });
    // The mode fields are consumed inside the MUI Virtualizer hook. Guarantee another render before forcing
    // the update so the API closes over the new enabled state.
    bumpVirtualizationRevision();
  }, [enabled, virtualizer.api, virtualizer.store]);

  useIsoLayoutEffect(() => {
    if (!pendingVirtualizationUpdateRef.current) {
      return;
    }

    pendingVirtualizationUpdateRef.current = false;
    virtualizer.api.forceUpdateRenderContext();
  }, [virtualizationRevision, virtualizer.api]);

  useIsoLayoutEffect(() => {
    const element = scrollElementRef.current;
    const viewportHeight = element ? getContentHeight(element) : 0;

    if (!restoreViewportRef.current || viewportHeight <= 0) {
      return;
    }

    // A completed render-all pass needs this correction at most once. Keeping the flag armed
    // would overwrite every later ResizeObserver update.
    restoreViewportRef.current = false;

    if (Math.abs(rootSize.height - viewportHeight) < 1) {
      return;
    }

    // MUI Virtualizer stores the ResizeObserver content-box height. Preserve that same box model even if a
    // preceding render-all pass temporarily expanded the observed content box.
    virtualizer.store.set('rootSize', {
      ...rootSize,
      height: viewportHeight,
    });
    virtualizer.api.updateDimensions();
    virtualizer.api.forceUpdateRenderContext();
  }, [enabled, rootSize, virtualizer.api, virtualizer.store]);

  const staleRenderAllRangeRef = React.useRef<string | null>(null);
  useIsoLayoutEffect(() => {
    const element = scrollElementRef.current;
    const isRenderAllRange =
      renderContext.firstRowIndex === 0 && renderContext.lastRowIndex >= rows.length;
    const needsWindowRefresh =
      restoreViewportRef.current &&
      rows.length > 0 &&
      dimensions.isReady &&
      element != null &&
      element.clientHeight < totalSize &&
      isRenderAllRange;

    if (!needsWindowRefresh) {
      staleRenderAllRangeRef.current = null;
      return;
    }

    const refreshKey = `${rows.length}:${element.clientHeight}:${totalSize}`;
    if (staleRenderAllRangeRef.current === refreshKey) {
      return;
    }

    // Enabling while hidden can make the scheduled update run before dimensions are ready.
    // Retry after a constrained viewport renders so reopening cannot retain the render-all range.
    staleRenderAllRangeRef.current = refreshKey;
    virtualizer.api.forceUpdateRenderContext();
  }, [
    dimensions.isReady,
    enabled,
    renderContext.firstRowIndex,
    renderContext.lastRowIndex,
    rows.length,
    totalSize,
    virtualizer.api,
  ]);

  /**
   * Re-applies a position the scrollport rejected, on the frame where its scrollable overflow
   * exists. The rows already paint at that position, so this only brings `scrollTop` and the
   * scrollbar in line. A single attempt is enough to schedule: the pending scroll request retries
   * the write on each of its own measurement passes, and the rows keep rendering for the requested
   * position until one of them lands, so a scrollport that stays unscrollable never spins a frame
   * loop for as long as the request stands.
   */
  const applyPendingViewportScroll = useStableCallback(() => {
    const scrollElement = scrollElementRef.current;
    const pendingScrollTop = pendingViewportScrollTopRef.current;

    if (pendingScrollTop == null) {
      return;
    }

    if (scrollElement == null || pendingScrollRowIndexRef.current == null) {
      pendingViewportScrollTopRef.current = null;
      return;
    }

    programmaticScrollTopRef.current = pendingScrollTop;
    scrollElement.scrollTo({ behavior: 'instant' as ScrollBehavior, top: pendingScrollTop });
    const appliedScrollTop = scrollElement.scrollTop;

    if (Math.abs(appliedScrollTop - pendingScrollTop) <= 1) {
      pendingViewportScrollTopRef.current = null;
      handleScrollChange({ top: appliedScrollTop });
    }
  });

  const scrollRowIntoView = useStableCallback(
    (
      rowIndex: number,
      requireMeasurement = false,
      align: ListVirtualizerScrollAlignment = 'auto',
    ) => {
      const scrollElement = scrollElementRef.current;
      const row = rowsRef.current[rowIndex];

      if (!scrollElement || !row) {
        return false;
      }

      const measured = !virtualizer.api.rowsMeta.getRowHeightEntry(row.id).needsFirstMeasurement;

      // The first pass may scroll using estimates so the destination mounts. The retry waits for
      // the real row measurement; treating an estimated position as final can leave only the
      // zero-sized focus proxy mounted after row heights expand.
      if (requireMeasurement && !measured) {
        return false;
      }

      const currentRowsMeta = virtualizer.store.state.rowsMeta;
      const start = currentRowsMeta.positions[rowIndex];
      const end = currentRowsMeta.positions[rowIndex + 1] ?? currentRowsMeta.currentPageTotalHeight;

      if (start == null || end == null) {
        return false;
      }

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
      let nextScrollTop: number | null = null;
      let resolvedAlignment = align;

      if (align === 'start') {
        nextScrollTop = start - scrollPaddingStart;
      } else if (align === 'center') {
        nextScrollTop = start - scrollPaddingStart - (viewportSize - rowSize) / 2;
      } else if (align === 'end') {
        nextScrollTop = end - scrollElement.clientHeight + scrollPaddingEnd;
      } else if (rowSize > viewportSize || start < viewportStart) {
        resolvedAlignment = 'start';
        nextScrollTop = start - scrollPaddingStart;
      } else if (end > viewportEnd) {
        resolvedAlignment = 'end';
        nextScrollTop = end - scrollElement.clientHeight + scrollPaddingEnd;
      }

      if (
        align === 'auto' &&
        resolvedAlignment !== 'auto' &&
        pendingScrollRowIndexRef.current === rowIndex
      ) {
        // Measurements can move the requested row across the opposite viewport edge. Keep the
        // edge chosen by the initial estimated pass so corrective retries do not visibly move a
        // selected row from the bottom of the popup to the top (or vice versa).
        pendingScrollAlignmentRef.current = resolvedAlignment;
      }

      if (nextScrollTop != null) {
        const maxScrollTop = getMaxScrollOffset(
          currentRowsMeta.currentPageTotalHeight,
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
          pendingViewportScrollTopRef.current = null;
          pendingViewportScrollFrame.cancel();
          pendingScrollRequiresMeasurementRef.current = true;
          // The native scroll event is asynchronous. Realign the sticky render zone immediately so
          // keyboard navigation cannot expose a blank edge or leave the highlighted row offscreen
          // for a frame while the virtual window catches up.
          handleScrollChange({ top: appliedScrollTop });
          if (Math.abs(appliedScrollTop - renderScrollTopRef.current) >= renderBufferPx) {
            bumpWindowRevision();
          }
        } else {
          // A newly opened popup runs this before its scrollable overflow exists, and the browser
          // clamps the write back to the top. The destination is still known, so hold it as the
          // position to render for: the window below is built from it and the sticky render zone
          // is offset by it, which puts the requested row on screen in this same commit. Only the
          // scrollbar still lags, until the retry below lands once the scrollport can accept it.
          programmaticScrollTopRef.current = clampedScrollTop;
          pendingViewportScrollTopRef.current = clampedScrollTop;
          pendingScrollRequiresMeasurementRef.current = false;
          bumpWindowRevision();
          pendingViewportScrollFrame.request(applyPendingViewportScroll);
          return false;
        }
      } else {
        pendingScrollRequiresMeasurementRef.current = true;
      }

      if (!measured) {
        return false;
      }

      // A distant row measured while the collection was filtered can make the estimate-based first
      // pass look complete even though the expanded collection retained it only as an offscreen
      // focus proxy. Keep that request pending until the static estimate settles and the real row
      // is visible; otherwise the first refinement can move it back out of view.
      if (!pendingScrollRequiresAdaptiveEstimateRef.current) {
        return true;
      }
      if (adaptiveEstimateRef.current == null) {
        return false;
      }

      const renderedRow = Array.from(renderZoneRef.current?.children ?? []).find(
        (element) =>
          Number((element as HTMLElement).dataset.rowIndex) === rowIndex &&
          (element as HTMLElement).style.position !== 'absolute',
      );
      const renderedRowRect = renderedRow?.getBoundingClientRect();
      const scrollElementRect = scrollElement.getBoundingClientRect();
      return (
        renderedRowRect != null &&
        renderedRowRect.bottom > scrollElementRect.top &&
        renderedRowRect.top < scrollElementRect.bottom
      );
    },
  );

  const scrollToIndex = useStableCallback(
    (rowIndex: number, options?: ListVirtualizerScrollToIndexOptions) => {
      const row = rowsRef.current[rowIndex];

      if (!Number.isInteger(rowIndex) || rowIndex < 0 || !row) {
        return;
      }

      const align = options?.align ?? 'auto';
      pendingScrollRowIndexRef.current = rowIndex;
      pendingScrollRowIdRef.current = row.id;
      pendingScrollAlignmentRef.current = align;
      pendingScrollRequiresMeasurementRef.current = false;
      pendingScrollRequiresAdaptiveEstimateRef.current = false;

      if (scrollRowIntoView(rowIndex, false, align)) {
        pendingScrollRowIndexRef.current = null;
        pendingScrollRowIdRef.current = null;
        pendingScrollRequiresAdaptiveEstimateRef.current = false;
      }
    },
  );

  React.useImperativeHandle(apiRefProp, () => ({ getRowMetrics, resetScroll, scrollToIndex }), [
    getRowMetrics,
    resetScroll,
    scrollToIndex,
  ]);

  const scrollToRowId = scrollToRowIndex == null ? null : (rows[scrollToRowIndex]?.id ?? null);

  useIsoLayoutEffect(() => {
    if (!enabled || scrollToRowIndex == null || scrollToRowIndex < 0 || scrollToRowId == null) {
      pendingScrollRowIndexRef.current = null;
      pendingScrollRowIdRef.current = null;
      pendingScrollRequiresAdaptiveEstimateRef.current = false;
      pendingViewportScrollTopRef.current = null;
      pendingViewportScrollFrame.cancel();
      return;
    }

    pendingScrollRowIndexRef.current = scrollToRowIndex;
    pendingScrollRowIdRef.current = scrollToRowId;
    pendingScrollAlignmentRef.current = 'auto';
    pendingScrollRequiresMeasurementRef.current = false;
    const currentRenderContext = overscannedRenderContextRef.current;
    pendingScrollRequiresAdaptiveEstimateRef.current =
      pendingScrollRequiresAdaptiveEstimateRef.current ||
      (useAdaptiveEstimate &&
        adaptiveEstimateRef.current == null &&
        (scrollToRowIndex <
          currentRenderContext.firstRowIndex - ADAPTIVE_SCROLL_TARGET_MIN_DISTANCE ||
          scrollToRowIndex >
            currentRenderContext.lastRowIndex + ADAPTIVE_SCROLL_TARGET_MIN_DISTANCE));

    // Try immediately with estimated metadata. If the destination is still unmeasured, the
    // rowsMeta effect below corrects the position once ResizeObserver updates it.
    if (scrollRowIntoView(scrollToRowIndex)) {
      pendingScrollRowIndexRef.current = null;
      pendingScrollRowIdRef.current = null;
      pendingScrollRequiresAdaptiveEstimateRef.current = false;
    }
  }, [
    enabled,
    pendingViewportScrollFrame,
    scrollRowIntoView,
    scrollToRowId,
    scrollToRowIndex,
    useAdaptiveEstimate,
  ]);

  // Scroll anchoring: geometry updates (measurements replacing estimates, mounts realizing real
  // heights, estimate refreshes) can move the rendered rows relative to the scrollport while the
  // browser keeps `scrollTop` unchanged, so the content the user is looking at would jump. Track
  // the on-screen position of the topmost visible row element and compensate by scrolling by
  // however much it actually moved beyond the user's own scrolling. Comparing real DOM positions
  // rather than virtual position deltas matters: a row measured after the window has already
  // scrolled past it changes its virtual position without moving anything on screen, and
  // "correcting" for that would push the viewport around for no visual reason. When the viewport
  // was at the previous maximum scroll position, keep the bottom pinned instead: preserving the
  // top row in that case would leave newly measured content below the viewport.
  // TODO: If this proves to be an improvement, move it upstream into @mui/x-virtualizer (next to
  // `hydrateRowsMeta`, where it can set `ignoreNextScrollEvent` and avoid the redundant
  // scroll-event round trip that an external `scrollTop` write causes).
  useIsoLayoutEffect(() => {
    const scrollElement = scrollElementRef.current;
    const renderZone = renderZoneRef.current;

    if (!enabled || scrollElement == null || renderZone == null) {
      scrollAnchorRef.current = null;
      return;
    }

    // The inline render style stacks rows from the top without DOM knowledge. Re-anchor the
    // rendered tail before any measurement below so anchor snapshots see final positions.
    updateRenderZoneTransform();

    // A pending scrollToIndex request repositions absolutely from the fresh geometry instead.
    if (pendingScrollRowIndexRef.current != null) {
      scrollAnchorRef.current = null;
      return;
    }

    const latestRowsMeta = virtualizer.store.state.rowsMeta;
    // MUI publishes the store update before React commits the matching row positions. We can still
    // compensate from the logical row offsets, but must not snapshot the stale DOM in that commit.
    const hasPendingRowsMeta = rowsMeta !== latestRowsMeta;
    const previous = scrollAnchorRef.current;
    const geometryChanged = previous?.rowsMeta !== latestRowsMeta;
    const scrollerRect = scrollElement.getBoundingClientRect();
    const scrollerTop = scrollerRect.top;
    let scrollTop = scrollElement.scrollTop;
    const maxScrollTop = getMaxScrollOffset(
      latestRowsMeta.currentPageTotalHeight,
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
      !isScrollbarDragRef.current &&
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
          programmaticScrollTopRef.current = nextScrollTop;
          scrollElement.scrollTo({ behavior: 'instant' as ScrollBehavior, top: nextScrollTop });
          // Realign the mounted rows before paint. The engine observes the same value when the
          // asynchronous scroll event arrives, making this idempotent.
          handleScrollChange({ top: nextScrollTop });
          // A correction that lands far from the position this commit's window was rendered for
          // can move the viewport beyond the mounted rows. Re-render before paint so the window
          // follows the corrected position.
          if (Math.abs(nextScrollTop - renderScrollTopRef.current) >= renderBufferPx) {
            bumpWindowRevision();
          }
        }
      }
    }

    if (hasPendingRowsMeta) {
      if (previous != null) {
        const virtualOffset = latestRowsMeta.positions[previous.rowIndex];
        if (virtualOffset != null) {
          scrollAnchorRef.current = {
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
      !isScrollbarDragRef.current &&
      Math.abs(userScrollDelta) >= 1 &&
      Math.abs(userScrollDelta) <= scrollElement.clientHeight
    ) {
      const virtualOffset = rowsMeta.positions[previous.rowIndex];
      if (virtualOffset != null) {
        // A small scroll can replace the whole virtual window before its newly mounted rows are
        // measured. Keep the prior logical anchor for one measurement cycle so growth between the
        // old and new windows is not lost merely because its DOM node was recycled.
        scrollAnchorRef.current = {
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
    scrollAnchorRef.current =
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

  // Adaptive estimates: a static `estimatedItemHeight` is replaced with the running average of
  // settled rendered rows once enough samples exist, so the virtual total converges after the
  // first measured window instead of accumulating the estimate error row by row.
  //
  // The refresh is deferred until scrolling stops. It reassigns the height of every unmeasured
  // row, so on a long list even a small change in the average moves the total by thousands of
  // pixels; doing that mid-gesture is what drags the scrollbar thumb out from under the pointer.
  // Waiting for idle also lets the first measurements settle, which keeps the list from chasing
  // an average that is still wrong. Re-estimating rows above the viewport shifts their positions;
  // the scroll-anchoring effect above compensates on the resulting commit, which is why it must
  // be declared first.
  useIsoLayoutEffect(() => {
    if (!useAdaptiveEstimate) {
      return;
    }

    // Coalesce ResizeObserver hydrations before accepting measurements. Opening popups can
    // temporarily lay rows out at an intermediate width; those sizes must not seed a collection-
    // wide estimate before the final layout has settled.
    if (adaptiveRowsMetaRef.current !== rowsMeta) {
      adaptiveRowsMetaRef.current = rowsMeta;
      adaptiveEstimateTimeout.start(SCROLL_IDLE_MS, bumpAdaptiveMeasurementRevision);
      return;
    }

    // While a scrollbar drag is in progress the gesture owns the geometry even when the thumb is
    // held still, so the idle timer alone must not release the refresh.
    if (isScrollingRef.current || isScrollbarDragRef.current) {
      return;
    }

    // Only sample the settled rendered range. MUI's cache retains measurements after rows unmount,
    // including transient measurements taken while a popup is initially resolving its width.
    // Treating every cached entry as authoritative biases the estimate long after the DOM settles.
    const heightCache = virtualizer.store.state.rowHeights as Map<React.Key, HeightEntry>;
    const measurements = adaptiveMeasurementsRef.current;
    for (
      let rowIndex = overscannedRenderContext.firstRowIndex;
      rowIndex < overscannedRenderContext.lastRowIndex;
      rowIndex += 1
    ) {
      const row = rows[rowIndex];
      const entry = row == null ? undefined : heightCache.get(row.id);
      if (row != null && entry != null && !entry.needsFirstMeasurement) {
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
    const applied = adaptiveEstimateRef.current;

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
        measuredRowsRef.current.delete(rowId as React.Key);
      }
    }

    adaptiveEstimateRef.current = average;
    muiApiRef.current?.rowsMeta.hydrateRowsMeta();
  }, [
    adaptiveEstimateTimeout,
    adaptiveMeasurementRevision,
    adaptiveMeasurementsRef,
    defaultEstimatedItemHeight,
    measuredRowsRef,
    rows.length,
    rowsMeta,
    scrollIdleRevision,
    useAdaptiveEstimate,
    virtualizer.store,
    overscannedRenderContext.firstRowIndex,
    overscannedRenderContext.lastRowIndex,
    rows,
  ]);

  useIsoLayoutEffect(() => {
    const rowIndex = pendingScrollRowIndexRef.current;

    // Array identity may change without the logical destination changing. Only invalidate a
    // pending correction when a different row now occupies the requested collection index.
    if (rowIndex != null && rowsRef.current[rowIndex]?.id !== pendingScrollRowIdRef.current) {
      pendingScrollRowIndexRef.current = null;
      pendingScrollRowIdRef.current = null;
      pendingScrollRequiresAdaptiveEstimateRef.current = false;
      pendingViewportScrollTopRef.current = null;
      pendingViewportScrollFrame.cancel();
      return;
    }

    if (
      rowIndex != null &&
      scrollRowIntoView(
        rowIndex,
        pendingScrollRequiresMeasurementRef.current,
        pendingScrollAlignmentRef.current,
      )
    ) {
      pendingScrollRowIndexRef.current = null;
      pendingScrollRowIdRef.current = null;
      pendingScrollRequiresAdaptiveEstimateRef.current = false;
    }
  }, [
    overscannedRenderContext.firstRowIndex,
    overscannedRenderContext.lastRowIndex,
    pendingViewportScrollFrame,
    rows,
    rowsMeta,
    scrollRowIntoView,
  ]);

  const rowsRenderContext: RenderContext = enabled
    ? overscannedRenderContext
    : {
        ...overscannedRenderContext,
        firstRowIndex: 0,
        lastRowIndex: rows.length,
      };
  const renderedRows = virtualizer.api.getters.getRows({
    renderContext: rowsRenderContext,
  });

  const { ref: containerRef, style: containerStyle, ...restContainerProps } = containerProps;
  const { style: contentStyle, ...restContentProps } = contentProps;
  const renderedRangeEnd =
    rowsMeta.positions[overscannedRenderContext.lastRowIndex] ??
    renderZoneOffsetTop +
      (overscannedRenderContext.lastRowIndex - overscannedRenderContext.firstRowIndex) *
        resolvedEstimatedItemHeight;
  const layoutSizerHeight =
    rows.length === 0
      ? 0
      : Math.min(totalSize, Math.max(resolvedEstimatedItemHeight, renderedRangeEnd));

  const state: ListVirtualizerState = {
    empty: rows.length === 0,
    totalSize,
  };

  const defaultProps: HTMLProps = {
    ...restContainerProps,
    style: {
      ...containerStyle,
      ...(totalSizeCssVariable ? { [totalSizeCssVariable]: `${totalSize}px` } : null),
      overflow: 'auto',
    } as React.CSSProperties,
    // The absolute content establishes the full scroll height without expanding an unconstrained
    // list. Its sticky viewport keeps the mounted rows covering the visible area while native
    // scrolling waits for the JavaScript scroll handler.
    children: enabled ? (
      <React.Fragment>
        <div
          {...restContentProps}
          style={{
            ...contentStyle,
            display: 'block',
            zIndex: undefined,
          }}
        >
          <div
            role="presentation"
            style={{
              height: dimensions.viewportOuterSize.height,
              overflow: 'hidden',
              position: 'sticky',
              top: 0,
              // The measured viewport width only arrives a frame after the scrollport is laid
              // out. A popup sized from its anchor has no width at all until it is positioned,
              // and the rows cannot supply one because they render inside the absolute content
              // above. Clipping to a measured width would blank the list until that measurement
              // lands; the content box the rows already span is known without measuring.
              width: '100%',
            }}
          >
            <div
              ref={renderZoneRef}
              role="presentation"
              style={{
                transform: getRenderZoneTransform(renderZoneOffsetTop, renderScrollTop),
              }}
            >
              {renderedRows}
            </div>
          </div>
        </div>
        {/* Preserve intrinsic sizing for max-height-only scrollports without putting the full
            virtual content height in normal flow. */}
        <div role="presentation" style={{ height: layoutSizerHeight }} />
      </React.Fragment>
    ) : (
      <React.Fragment>
        <div {...contentProps} />
        <div role="presentation" {...positionerProps} />
        {renderedRows}
      </React.Fragment>
    ),
  };

  return useRenderElement('div', componentProps, {
    state,
    stateAttributesMapping,
    ref: [forwardedRef, containerRef],
    props: [defaultProps, elementProps],
  });
}) as {
  <RowModel extends MuiVirtualizerRow>(
    props: ListVirtualizer.Props<RowModel> & React.RefAttributes<HTMLDivElement>,
  ): React.JSX.Element;
};

/**
 * State exposed by the internal list virtualizer.
 */
export interface ListVirtualizerState {
  /**
   * Whether the virtualized collection has no items.
   */
  empty: boolean;
  /**
   * Total virtual content size in pixels.
   */
  totalSize: number;
}

export interface ListVirtualizerProps<RowModel extends MuiVirtualizerRow> extends Omit<
  BaseUIComponentProps<'div', ListVirtualizerState>,
  'children'
> {
  /**
   * Ref to the virtualizer's imperative operations.
   */
  apiRef?: React.Ref<ListVirtualizerHandle> | undefined;
  /**
   * Whether row virtualization is enabled.
   * @default true
   */
  enabled?: boolean | undefined;
  /**
   * Estimated item height in CSS pixels used before measuring the rendered element.
   * A static number is automatically refined with the running average of measured rows;
   * provide a function to keep full control over per-row estimates.
   */
  estimatedItemHeight: number | ((row: RowModel, rowIndex: number) => number);
  /**
   * Called when a large enabled collection has no effective height constraint.
   * This is only called in development mode and should be used to alert the developer.
   */
  onUnconstrainedHeight?: (() => void) | undefined;
  /**
   * Pixel buffer rendered before and after the visible range.
   * Defaults to the larger of 150px and the estimated item height. The render buffer always
   * includes at least one estimated row, even when this prop is `0`.
   */
  overscanPx?: number | undefined;
  /**
   * Row retained outside the rendered range for component-specific focus semantics.
   */
  pinnedRowIndex?: number | undefined;
  /**
   * Renders the component-specific semantic content for a virtual row.
   */
  renderRow: (params: ListVirtualizerRenderRowParameters<RowModel>) => React.ReactElement;
  /**
   * Version incremented after a temporary render-all pass. Changing it restores the constrained
   * client height as the virtualizer viewport, including when the component remounts.
   * @default 0
   */
  restoreViewportVersion?: number | undefined;
  /**
   * Virtual rows to measure and window.
   */
  rows: ListVirtualizerRow<RowModel>[];
  /**
   * Row that should be scrolled into view, or `undefined` when no scroll is requested.
   */
  scrollToRowIndex?: number | undefined;
  /**
   * CSS custom property populated with the total virtual content size.
   */
  totalSizeCssVariable?: string | undefined;
}

export namespace ListVirtualizer {
  export type Props<RowModel extends MuiVirtualizerRow> = ListVirtualizerProps<RowModel>;
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

function getContentHeight(element: HTMLElement) {
  const styles = ownerWindow(element).getComputedStyle(element);
  const padding =
    (Number.parseFloat(styles.paddingTop) || 0) + (Number.parseFloat(styles.paddingBottom) || 0);
  return Math.max(0, element.clientHeight - padding);
}
