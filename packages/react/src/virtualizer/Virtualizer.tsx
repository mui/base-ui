'use client';
import * as React from 'react';
import { ownerWindow } from '@base-ui/utils/owner';
import { useForcedRerendering } from '@base-ui/utils/useForcedRerendering';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
import { useRefWithInit } from '@base-ui/utils/useRefWithInit';
import { useStableCallback } from '@base-ui/utils/useStableCallback';
import {
  Dimensions,
  LayoutList,
  Virtualization,
  useVirtualizer,
  type HeightEntry,
  type Row as MuiVirtualizerRow,
  type RowEntry,
  type RenderContext,
  type Virtualizer as MuiVirtualizer,
} from '@mui/x-virtualizer';
import { getMaxScrollOffset } from '../utils/scrollEdges';
import type { StateAttributesMapping } from '../internals/getStateAttributesProps';
import type { BaseUIComponentProps, HTMLProps } from '../internals/types';
import { useRenderElement } from '../internals/useRenderElement';
import type { VirtualizerActions } from '../internals/virtualization/ListVirtualizationRegistry';
import { useListVirtualization } from '../internals/virtualization/ListVirtualizationHostContext';
import { useListBinding } from '../internals/virtualization/useListBinding';
import { useRowModels } from '../internals/virtualization/useRowModels';
import type {
  VirtualizerActiveIndex,
  VirtualizerActiveItem,
  VirtualizerItemProps,
  VirtualizerItemRowModel,
  VirtualizerRenderRowParameters,
  VirtualizerRow,
} from '../internals/virtualization/types';
import { EMPTY_SCROLLPORT_PADDING, getScrollportPadding } from './scrollport';
import { useAdaptiveEstimate, useAdaptiveEstimateRefresh } from './useAdaptiveEstimate';
import { useEngineMode } from './useEngineMode';
import { useItemHeightEstimate } from './useItemHeightEstimate';
import { usePendingScroll, usePendingScrollRetry, type PendingScroll } from './usePendingScroll';
import { useScrollAnchor } from './useScrollAnchor';
import { useScrollGesture } from './useScrollGesture';
import { useViewportRestore } from './useViewportRestore';
import { VirtualizerCssVars } from './VirtualizerCssVars';

interface VirtualRowProps<RowModel> {
  apiRef: React.RefObject<MuiVirtualizer['api'] | null>;
  isVirtualFocusRow: boolean;
  renderRow: (params: VirtualizerRenderRowParameters<RowModel>) => React.ReactElement;
  row: VirtualizerRow<RowModel>;
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

function VirtualRowImpl<RowModel>(props: VirtualRowProps<RowModel>) {
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

const VirtualRow = React.memo(VirtualRowImpl) as typeof VirtualRowImpl;

function getRenderZoneTransform(offsetTop: number, scrollTop: number, paddingStart: number) {
  return `translate3d(0, ${offsetTop - scrollTop + paddingStart}px, 0)`;
}

/**
 * Stands in for the rendered window before the first render has computed one, so the concerns
 * that read it from a ref never have to describe a state that cannot reach them.
 */
const EMPTY_RENDER_CONTEXT: RenderContext = {
  firstColumnIndex: 0,
  lastColumnIndex: 0,
  firstRowIndex: 0,
  lastRowIndex: 0,
};

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

const stateAttributesMapping: StateAttributesMapping<VirtualizerState> = {
  totalSize: () => null,
};

/**
 * Renders a window of visible and overscanned items in a flat list.
 * Renders a scrollable `<div>` element.
 *
 * Pass the collection to the `items` prop to virtualize any list, or omit it inside a list that
 * supports virtualization to window that list's own collection. The latter requires the `items`
 * prop on the list root, and the virtualizer must be the only item-rendering child of the list.
 *
 * The element must have a constrained height or maximum height for virtualization to limit the
 * number of mounted items.
 *
 * Grouped collections and grid mode are not currently supported.
 *
 * Documentation: [Base UI Virtualizer](https://base-ui.com/react/utils/virtualizer)
 */
export const Virtualizer = React.forwardRef(function Virtualizer<Value>(
  componentProps: Virtualizer.Props<Value>,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const {
    actionsRef,
    activeIndex,
    children,
    className,
    enabled: enabledProp = true,
    endReachedThreshold = 0,
    estimatedItemHeight: estimatedItemHeightProp,
    getItemKey,
    items,
    onEndReached,
    trailing,
    overscanPx,
    render,
    totalItems,
    style,
    ...elementProps
  } = componentProps;

  const { host, listState } = useListVirtualization(items != null);

  const {
    apiRef: apiRefProp,
    enabled,
    items: collection,
    onUnconstrainedHeight,
    pinnedRowIndex,
    renderRow: renderRowProp,
    scrollportProps,
    scrollToRowAlignment,
    scrollToRowIndex,
  } = useListBinding<Value>({
    actionsRef,
    activeIndex,
    totalItems,
    children,
    enabled: enabledProp,
    host,
    items,
    listState,
  });

  const rows = useRowModels<Value>({ getItemKey, items: collection });
  const itemHeightEstimate = useItemHeightEstimate<Value>({
    estimatedItemHeight: estimatedItemHeightProp,
    items: collection,
    rows,
  });
  const { defaultEstimatedItemHeight, getEstimatedItemHeight } = itemHeightEstimate;

  const scrollElementRef = React.useRef<HTMLDivElement | null>(null);
  const renderZoneRef = React.useRef<HTMLDivElement | null>(null);
  const renderZoneOffsetTopRef = React.useRef(0);
  /**
   * Virtual position of the end of the rendered range when it includes the final row, or `null`
   * otherwise. Anchors the rendered tail to the virtual content end.
   */
  const renderZoneVirtualEndRef = React.useRef<number | null>(null);
  const scrollTopRef = React.useRef(0);
  const muiApiRef = React.useRef<MuiVirtualizer['api'] | null>(null);
  /**
   * The scrollport's own block padding. Rows begin below it, scroll through it, and the virtual
   * content covers it, matching how a plain scrolling list treats its padding. The engine's
   * geometry counts rows alone, so this is the offset between its coordinates and `scrollTop`.
   */
  const [scrollportPadding, setScrollportPadding] = React.useState(EMPTY_SCROLLPORT_PADDING);
  // The trailing row is content, not an item: it sits after the last row, scrolls with the
  // collection, and is measured so the scrollable height covers it. Its height is state rather
  // than a ref because the geometry around it — the scroll height, the maximum scroll offset —
  // is computed during render.
  const [trailingHeight, setTrailingHeight] = React.useState(0);
  const trailingRef = React.useRef<HTMLDivElement | null>(null);

  const scrollportPaddingTotal = scrollportPadding.start + scrollportPadding.end;

  const gesture = useScrollGesture({ apiRef: muiApiRef, scrollElementRef });
  const adaptive = useAdaptiveEstimate({
    rows,
    staticEstimatedItemHeight: itemHeightEstimate.staticEstimatedItemHeight,
  });

  // Forces the rendered window to recompute after a corrective scroll write moved the viewport
  // beyond the rows the current commit mounted. Called from a layout effect, so the follow-up
  // commit still lands before paint.
  const refreshWindow = useForcedRerendering();
  const renderScrollTopRef = React.useRef(0);
  const overscannedRenderContextRef = React.useRef<RenderContext>(EMPTY_RENDER_CONTEXT);
  // The scroll-to-row and anchoring concerns both write corrective scroll positions, and both are
  // declared below the callbacks that read them. Their handle is published here so those
  // callbacks — which only ever run after the render that publishes it — can reach it.
  const pendingScrollRef = React.useRef<PendingScroll | null>(null);

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
      pendingScrollRef.current?.getViewportScrollTop() ??
      scrollElementRef.current?.scrollTop ??
      scrollTopRef.current;
    const stacked = renderZoneOffsetTopRef.current - scrollTop + scrollportPadding.start;
    let translate = stacked;
    const virtualEnd = renderZoneVirtualEndRef.current;

    if (virtualEnd != null) {
      const anchored = virtualEnd - scrollTop - renderZone.offsetHeight + scrollportPadding.start;
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
    // corrective writes; only genuine user scrolling affects gesture state.
    const isUserScroll = gesture.noteScroll(
      (evidence) =>
        pendingScrollRef.current?.isProgrammaticEcho(scrollPosition.top, evidence) ?? false,
    );

    if (isUserScroll) {
      // User scrolling supersedes a pending scroll-to-row request: retrying the retained
      // destination after the user took over would yank the list away from where they scrolled.
      pendingScrollRef.current?.cancel();
    }

    scrollTopRef.current = scrollPosition.top;
    updateRenderZoneTransform();
  });

  const layout = useRefWithInit(
    () =>
      new LayoutList({
        container: scrollElementRef,
        scroller: scrollElementRef,
      }),
  ).current;

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
        <VirtualRow
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
  const adaptiveEnabled = adaptive.enabled;
  const adaptiveInvalidated = adaptive.invalidated;
  const readAdaptiveEstimate = adaptive.readEstimate;
  const getEstimatedRowHeight = React.useCallback(
    (row: RowEntry) => {
      // A static estimate is refined with the running average of measured rows so the virtual
      // geometry converges quickly. Per-row estimate functions encode knowledge that a global
      // average would override, so they are used as provided. The average is read through the
      // module's own ref because the refresh republishes it without a re-render.
      const adaptiveEstimate = adaptiveInvalidated ? null : readAdaptiveEstimate();
      if (adaptiveEnabled && adaptiveEstimate != null) {
        return adaptiveEstimate;
      }

      const rowIndex = rowIndexById.get(row.id as React.Key) ?? -1;
      return rows[rowIndex] != null ? getEstimatedItemHeight(rowIndex) : defaultEstimatedItemHeight;
    },
    [
      adaptiveEnabled,
      adaptiveInvalidated,
      defaultEstimatedItemHeight,
      getEstimatedItemHeight,
      readAdaptiveEstimate,
      rowIndexById,
      rows,
    ],
  );
  const resolvedEstimatedItemHeight =
    adaptiveEnabled && adaptive.estimate != null ? adaptive.estimate : defaultEstimatedItemHeight;
  // Depends on the individual members rather than the whole handles: the engine rehydrates its
  // geometry when this identity changes, and the handles are republished on every settled gesture
  // and every measurement pass.
  const { deferRowHeight, isScrollbarDrag, releaseRowHeight } = gesture;
  const { isMeasured, markMeasured } = adaptive;
  const applyRowHeight = React.useCallback(
    (entry: HeightEntry, row: RowEntry) => {
      const rowId = row.id as React.Key;

      if (!isScrollbarDrag()) {
        const releasedHeight = releaseRowHeight(rowId);
        if (releasedHeight != null) {
          entry.content = releasedHeight;
        }
        if (!entry.needsFirstMeasurement) {
          markMeasured(rowId);
        }
        return;
      }

      if (entry.needsFirstMeasurement || isMeasured(rowId)) {
        return;
      }

      entry.content = deferRowHeight(rowId, entry.content, getEstimatedRowHeight(row));
    },
    [
      deferRowHeight,
      getEstimatedRowHeight,
      isMeasured,
      isScrollbarDrag,
      markMeasured,
      releaseRowHeight,
    ],
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

  const refreshWindowAfterCorrectiveScroll = useStableCallback((scrollTop: number) => {
    // A correction that lands far from the position this commit's window was rendered for can
    // move the viewport beyond the mounted rows. Re-render before paint so the window follows.
    if (Math.abs(scrollTop - renderScrollTopRef.current) >= renderBufferPx) {
      refreshWindow();
    }
  });

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
        element.clientHeight - scrollportPaddingTotal >= rowsMeta.currentPageTotalHeight
      ) {
        onUnconstrainedHeight?.();
      }
    }, [enabled, onUnconstrainedHeight, rows.length, rowsMeta, scrollportPaddingTotal]);
  }

  useIsoLayoutEffect(() => {
    const element = trailingRef.current;

    if (element == null) {
      setTrailingHeight(0);
      return undefined;
    }

    const win = ownerWindow(element);
    const measure = () => {
      setTrailingHeight((previous) => {
        const next = element.getBoundingClientRect().height;
        return Math.abs(previous - next) < 1 ? previous : next;
      });
    };

    measure();

    if (typeof win.ResizeObserver === 'undefined') {
      return undefined;
    }

    const observer = new win.ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, [trailing]);

  // Declared before the mode publication below, which arms it: the request then lands on the
  // commit that publication already schedules.
  const viewportRestore = useViewportRestore({
    api: virtualizer.api,
    dimensionsReady: dimensions.isReady,
    enabled,
    renderContext,
    rootSize,
    rowCount: rows.length,
    scrollElementRef,
    scrollportPaddingTotal,
    store: virtualizer.store,
    totalSize,
  });

  useEngineMode({
    api: virtualizer.api,
    enabled,
    onWindowingResumed: viewportRestore.arm,
    onWindowingSuspended: viewportRestore.disarm,
    store: virtualizer.store,
  });

  // The scrollport's padding is only read when its box changes, so unpadded lists never pay for
  // the style lookup. Padding always resizes the content box the engine observes, unless the
  // scrollport is sized by its own content, where the next resize picks the change up.
  useIsoLayoutEffect(() => {
    const element = scrollElementRef.current;

    if (!element) {
      return;
    }

    const nextPadding = getScrollportPadding(element);
    setScrollportPadding((previousPadding) =>
      previousPadding.start === nextPadding.start && previousPadding.end === nextPadding.end
        ? previousPadding
        : nextPadding,
    );
  }, [enabled, rootSize]);

  // Declared after the effects that publish the virtualization mode, so a request made as a list
  // opens is applied against the enabled window.
  const pendingScroll = usePendingScroll<VirtualizerItemRowModel<Value>>({
    adaptive,
    api: virtualizer.api,
    enabled,
    onScrollApplied: (scrollTop) => handleScrollChange({ top: scrollTop }),
    refreshWindow,
    refreshWindowAfterCorrectiveScroll,
    renderContextRef: overscannedRenderContextRef,
    renderZoneRef,
    rows,
    rowsRef,
    scrollElementRef,
    scrollportPadding,
    scrollToRowAlignment,
    scrollToRowIndex,
    store: virtualizer.store,
    trailingHeight,
  });
  pendingScrollRef.current = pendingScroll;

  const resetScroll = useStableCallback(() => {
    pendingScroll.noteProgrammaticScroll(0);
    scrollElementRef.current?.scrollTo({
      behavior: 'instant' as ScrollBehavior,
      top: 0,
    });
    handleScrollChange({ top: 0 });
  });

  // Reported in scroll coordinates rather than the engine's: the scrollport's block padding is
  // the offset between the two, and a consumer holding a `scrollTop` has no way to know it.
  const getItemMetrics = useStableCallback((index: number) => {
    if (rowsRef.current[index] == null) {
      return null;
    }

    const currentRowsMeta = virtualizer.store.state.rowsMeta;
    const offset = currentRowsMeta.positions[index];
    const end = currentRowsMeta.positions[index + 1] ?? currentRowsMeta.currentPageTotalHeight;

    if (offset == null || end == null) {
      return null;
    }

    return {
      offset: offset + scrollportPadding.start,
      size: end - offset,
    };
  });

  const getIndexAtOffset = useStableCallback((offset: number) => {
    const rowCount = rowsRef.current.length;
    if (rowCount === 0) {
      return null;
    }

    const currentRowsMeta = virtualizer.store.state.rowsMeta;
    return findRowIndexAtOffset(
      currentRowsMeta.positions,
      rowCount,
      Math.max(0, offset - scrollportPadding.start),
    );
  });

  /**
   * Drops every height learned so far, so rows are measured again against the layout they are in
   * now. Heights cached for rows that are not mounted are the reason this exists: a change that
   * resizes the collection — a breakpoint, a font, a density toggle — resizes the mounted rows
   * through their own observers, while the rest keep reporting what they measured under the old
   * layout. Rows currently on screen are re-measured here rather than left to their observers,
   * which only fire when a size actually changes, so the visible geometry stays exact even when
   * this is called and nothing moved.
   */
  const remeasure = useStableCallback(() => {
    // A per-item estimate resolves against the layout too, and it is derived per collection rather
    // than per render, so an invalidation has to reach it as well. Re-rendering is what re-derives
    // it, and the engine rehydrates again once the new estimates arrive.
    itemHeightEstimate.invalidate();
    adaptive.reset();
    gesture.clearDeferredRowHeights();

    const api = muiApiRef.current;

    if (api != null) {
      api.rowsMeta.resetRowHeights();

      const renderZone = renderZoneRef.current;

      if (renderZone != null) {
        for (let index = 0; index < renderZone.children.length; index += 1) {
          const element = renderZone.children[index] as HTMLElement;

          // The retained focus proxy is out of layout and never carries a usable height.
          if (element.style.position === 'absolute') {
            continue;
          }

          const rowIndex = Number(element.dataset.rowIndex);
          const row = rowsRef.current[rowIndex];
          const height = element.getBoundingClientRect().height;

          if (row != null && height > 0) {
            api.rowsMeta.storeRowHeightMeasurement(row.id, height);
            adaptive.markMeasured(row.id);
            api.rowsMeta.setLastMeasuredRowIndex(rowIndex);
          }
        }
      }

      api.rowsMeta.hydrateRowsMeta();
    }

    // Scroll anchoring compensates for whatever the rewrite moved, which is what keeps the
    // position across an invalidation that remounting to drop the caches would lose.
    adaptive.noteMeasurements();
  });

  const scrollToIndex = pendingScroll.scrollToIndex;

  const getScrollElement = useStableCallback(() => scrollElementRef.current);

  React.useImperativeHandle(
    apiRefProp,
    () => ({
      getIndexAtOffset,
      getItemMetrics,
      getScrollElement,
      remeasure,
      resetScroll,
      scrollToIndex,
    }),
    [getIndexAtOffset, getItemMetrics, getScrollElement, remeasure, resetScroll, scrollToIndex],
  );

  const anchor = useScrollAnchor<VirtualizerItemRowModel<Value>>({
    enabled,
    gesture,
    onScrollApplied: (scrollTop) => handleScrollChange({ top: scrollTop }),
    pendingScroll,
    refreshWindowAfterCorrectiveScroll,
    renderZoneRef,
    rows,
    rowsMeta,
    scrollElementRef,
    scrollportPaddingTotal,
    store: virtualizer.store,
    trailingHeight,
    updateRenderZoneTransform,
  });

  // The engine publishes a recomputed render context inside the scroll event before this
  // component's own scroll bookkeeping observes it, while corrective writes move the
  // scrollport before the engine hears about them. The live scroll position is the only basis
  // consistent with both orderings.
  const liveScrollTop = scrollElementRef.current?.scrollTop ?? 0;
  const currentMaxScrollTop =
    dimensions.viewportInnerSize.height > 0
      ? getMaxScrollOffset(
          rowsMeta.currentPageTotalHeight + trailingHeight,
          dimensions.viewportInnerSize.height,
        )
      : null;
  // When a geometry rewrite shrinks the content below the current scroll position, the browser
  // clamps `scrollTop` the moment the commit lays out — before any scroll event reports it.
  // Target that inevitable position now so this commit's window and transform match what paints.
  const clampedLiveScrollTop =
    currentMaxScrollTop === null ? liveScrollTop : Math.min(liveScrollTop, currentMaxScrollTop);

  // A geometry rewrite that lands while the viewport rests at the maximum scroll position is
  // followed by a bottom pin in the scroll-anchoring effect, within this same commit.
  // The engine's render context was computed for the pre-rewrite scroll position, so the rows it
  // mounts end short of the rewritten content end; painting that window at the pinned position
  // would briefly blank the bottom of the scrollport. Render the window for the anticipated
  // pinned position instead so the same commit that moves the viewport also covers it.
  const scrollAnchor = anchor.readSnapshot();
  const anticipatedMaxScrollTop =
    enabled &&
    currentMaxScrollTop !== null &&
    scrollAnchor !== null &&
    scrollAnchor.rows === rows &&
    scrollAnchor.rowsMeta !== rowsMeta &&
    scrollAnchor.maxScrollTop > 0 &&
    Math.abs(scrollAnchor.scrollTop - scrollAnchor.maxScrollTop) < 1 &&
    !gesture.isScrollbarDrag() &&
    !pendingScroll.isPending()
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
  const renderScrollTop = pendingScroll.getViewportScrollTop() ?? settledRenderScrollTop;

  const overscannedRenderContext = getOverscannedRenderContext(
    anticipateBottomPin
      ? // Seed the overscan expansion from the final row; it walks back to cover the new bottom.
        { ...renderContext, firstRowIndex: rows.length - 1, lastRowIndex: rows.length }
      : renderContext,
    rowsMeta.positions,
    rows.length,
    validPinnedRowIndex,
    renderBufferPx,
    // Row positions exclude the scrollport's padding, but rows are visible inside it, so the
    // window is computed for the whole scrollport in the engine's coordinates.
    renderScrollTop - scrollportPadding.start,
    dimensions.viewportInnerSize.height + scrollportPaddingTotal,
  );
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

  const handleEndReached = useStableCallback(() => onEndReached?.());
  /**
   * Whether reaching the end again would be a new arrival. Held down while the window stays at
   * the end so a list that renders its last item does not ask for another page on every commit,
   * and released as soon as the window moves away or the collection grows past it.
   */
  const endReachedArmedRef = React.useRef(true);

  useIsoLayoutEffect(() => {
    if (onEndReached == null || rows.length === 0) {
      return;
    }

    // The rendered range is half-open, so the final item is included once the end index reaches
    // the collection length. The threshold counts items short of that.
    const reachedEnd =
      overscannedRenderContext.lastRowIndex >= rows.length - Math.max(0, endReachedThreshold);

    if (!reachedEnd) {
      endReachedArmedRef.current = true;
      return;
    }

    if (!endReachedArmedRef.current) {
      return;
    }

    endReachedArmedRef.current = false;
    handleEndReached();
  }, [
    endReachedThreshold,
    handleEndReached,
    onEndReached,
    overscannedRenderContext.lastRowIndex,
    rows.length,
  ]);

  // Declared after `useScrollAnchor`: refreshing the estimate re-positions rows above the
  // viewport, and anchoring compensates for that on the resulting commit.
  useAdaptiveEstimateRefresh<VirtualizerItemRowModel<Value>>({
    adaptive,
    apiRef: muiApiRef,
    defaultEstimatedItemHeight,
    gesture,
    renderContext: overscannedRenderContext,
    rows,
    rowsMeta,
    store: virtualizer.store,
  });

  // Declared last: anchoring reads an outstanding request while it still stands, and a request
  // waiting on a settled estimate sees the refresh above in the same commit.
  usePendingScrollRetry<VirtualizerItemRowModel<Value>>({
    pendingScroll,
    renderContext: overscannedRenderContext,
    rows,
    rowsMeta,
  });

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
    (rows.length === 0
      ? 0
      : Math.min(totalSize, Math.max(resolvedEstimatedItemHeight, renderedRangeEnd))) +
    trailingHeight;
  // The scrollable content spans the rows plus the padding they are laid out inside of, which is
  // the height a scrollport needs to show the collection without scrolling. An empty collection
  // has nothing to surround, so it stays at zero.
  const scrollableSize =
    totalSize > 0
      ? totalSize + scrollportPaddingTotal + trailingHeight
      : totalSize + trailingHeight;

  const state: VirtualizerState = {
    empty: rows.length === 0,
    totalSize: scrollableSize,
  };

  const defaultProps: HTMLProps = {
    ...restContainerProps,
    style: {
      ...containerStyle,
      [VirtualizerCssVars.totalSize]: `${scrollableSize}px`,
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
            // Absolute content is placed against the padding edge, so it must also span the
            // padding to keep the scroll height exact and to leave the sticky viewport below
            // room to cover the scrollport at the maximum scroll position.
            ...(scrollableSize > 0 ? { height: scrollableSize } : null),
          }}
        >
          <div
            role="presentation"
            style={{
              // Sticky boxes are pinned against the content edge. Growing the viewport into the
              // padding and pulling it back up by the same amount covers the whole scrollport,
              // so rows scroll through the padding as they do in a plain list.
              height: dimensions.viewportOuterSize.height + scrollportPaddingTotal,
              overflow: 'hidden',
              position: 'sticky',
              top: -scrollportPadding.start,
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
                transform: getRenderZoneTransform(
                  renderZoneOffsetTop,
                  renderScrollTop,
                  scrollportPadding.start,
                ),
              }}
            >
              {renderedRows}
            </div>
          </div>
          {trailing != null && (
            <div
              ref={trailingRef}
              role="presentation"
              style={{
                left: 0,
                position: 'absolute',
                right: 0,
                // Where the rows end, inside the same absolute content they are laid out in, so it
                // scrolls with them rather than being pinned to the scrollport.
                top: totalSize + scrollportPadding.start,
              }}
            >
              {trailing}
            </div>
          )}
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
    // The owning list's scrollport props sit between the engine's own and the application's, so a
    // list can put its scroll handler and scrollbar styling on the element that actually scrolls
    // while props passed to `<Virtualizer>` still win.
    props: [defaultProps, scrollportProps, elementProps],
  });
}) as {
  <Value>(props: Virtualizer.Props<Value> & React.RefAttributes<HTMLDivElement>): React.JSX.Element;
};

/**
 * State metadata exposed to the `Virtualizer` render props.
 */
export interface VirtualizerState {
  /**
   * Whether the virtualized collection has no items.
   */
  empty: boolean;
  /**
   * Total scrollable content size in pixels, including the scrollport's block padding.
   */
  totalSize: number;
}

/**
 * Makes stable keys optional for primitive values and required for object or unknown values.
 */
export type VirtualizerKeyProps<Value> = unknown extends Value
  ? {
      /**
       * Returns a stable key for the item value.
       *
       * Primitive item values use the value itself by default. Required when item values are
       * objects or the item type cannot be inferred.
       */
      getItemKey: (item: Value) => string | number;
    }
  : [Extract<Value, object>] extends [never]
    ? {
        /**
         * Returns a stable key for the item value.
         *
         * Primitive item values use the value itself by default. Required when item values are
         * objects.
         */
        getItemKey?: ((item: Value) => string | number) | undefined;
      }
    : {
        /**
         * Returns a stable key for the item value.
         *
         * Primitive item values use the value itself by default. Required when item values are
         * objects.
         */
        getItemKey: (item: Value) => string | number;
      };

export interface VirtualizerBaseProps<Value> extends Omit<
  BaseUIComponentProps<'div', VirtualizerState>,
  'children'
> {
  /**
   * A ref to imperative actions.
   * - `getIndexAtOffset`: Returns the item a scroll position lands on.
   * - `getItemMetrics`: Returns an item's logical offset and size, including outside the window.
   * - `remeasure`: Discards measured item heights so they are taken again.
   * - `scrollToIndex`: Scrolls an item into view by its logical collection index.
   */
  actionsRef?: React.RefObject<VirtualizerActions | null> | undefined;
  /**
   * The active item in `items`, kept mounted even when it falls outside the rendered window so it
   * can hold focus or be referenced by `aria-activedescendant`.
   *
   * An index alone scrolls the item into view. Pass `{ index, scroll: false }` for activations
   * that must leave the viewport alone, such as a highlight following the pointer, and `align` to
   * choose where a scrolled item lands.
   *
   * Ignored without the `items` prop: a list that provides the collection tracks its own highlight.
   */
  activeIndex?: VirtualizerActiveIndex | null | undefined;
  /**
   * Renders exactly one item for the given value and its index in the collection.
   * The third argument carries the item's accessibility and collection metadata, to spread onto
   * the element representing the item. A list's own item component applies it automatically.
   */
  children: (item: Value, index: number, itemProps: VirtualizerItemProps) => React.ReactElement;
  /**
   * Whether virtualization is enabled. When `false`, all items are rendered.
   * @default true
   */
  enabled?: boolean | undefined;
  /**
   * Estimated item height in CSS pixels used before item elements have been measured.
   * A static number is automatically refined with the running average of measured items.
   * Provide a function to keep full control over per-item estimates.
   * @default 32
   */
  estimatedItemHeight?: number | ((item: Value, index: number) => number) | undefined;
  /**
   * The flat collection to virtualize.
   *
   * When omitted, the collection and its highlight state come from the surrounding list, which
   * requires a list that supports virtualization, such as `<Combobox.List>`.
   */
  items?: readonly Value[] | undefined;
  /**
   * Pixel buffer rendered before and after the visible range.
   * Defaults to the larger of 150px and the estimated size of the first item. The render buffer
   * always includes at least one estimated row, even when this prop is `0`.
   */
  overscanPx?: number | undefined;
  /**
   * How many items short of the end `onEndReached` fires. `0` fires once the last item enters the
   * rendered window, which already extends past the visible range by `overscanPx`.
   * @default 0
   */
  endReachedThreshold?: number | undefined;
  /**
   * Called when the rendered window reaches the end of the collection, for loading the next page
   * of a longer list. Fires once per arrival: it does not repeat while the window stays at the
   * end, and arms again when the window moves away or the collection grows past it.
   */
  onEndReached?: (() => void) | undefined;
  /**
   * Content rendered after the last item, inside the scroll container, for a loading indicator or
   * an end-of-results note. It scrolls with the items and is measured into the scrollable height,
   * rather than being pinned below the list.
   *
   * It is not an item: it takes no index, and is left out of `aria-setsize` and `aria-posinset`.
   * A list is only allowed to contain options, so this content must not present itself as one —
   * keep it out of the accessibility tree and convey the state it stands for another way, such as
   * `aria-busy` on the list with a live region outside it. Interactive controls belong outside the
   * list, where they can be reached with the keyboard.
   */
  trailing?: React.ReactNode | undefined;
  /**
   * Number of items in the whole collection, when the items rendered are only part of it — a page
   * of a larger result set, say. Rendered items report it as their `aria-setsize`, so assistive
   * technology describes the collection rather than the part of it currently loaded.
   *
   * Pass `-1` when the size is not known yet, which is the ARIA convention for it.
   * @default the number of items in the list
   */
  totalItems?: number | undefined;
}

/**
 * Props accepted by the `Virtualizer` component.
 */
export type VirtualizerProps<Value = unknown> = VirtualizerBaseProps<Value> &
  VirtualizerKeyProps<Value>;

/**
 * Type helpers for the `Virtualizer` component.
 */
export namespace Virtualizer {
  /**
   * Imperative actions exposed by the component.
   */
  export type Actions = VirtualizerActions;
  /**
   * The active item, as an index alone or as an activation that also describes the scroll it wants.
   */
  export type ActiveIndex = VirtualizerActiveIndex;
  /**
   * An activation of an item, describing what should happen to the viewport along with it.
   */
  export type ActiveItem = VirtualizerActiveItem;
  /**
   * State metadata exposed to render props.
   */
  export type State = VirtualizerState;
  /**
   * Props accepted by the component.
   */
  export type Props<Value = unknown> = VirtualizerProps<Value>;
}
