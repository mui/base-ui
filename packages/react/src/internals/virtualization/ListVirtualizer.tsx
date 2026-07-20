'use client';
import * as React from 'react';
import { ownerDocument, ownerWindow } from '@base-ui/utils/owner';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
import { useRefWithInit } from '@base-ui/utils/useRefWithInit';
import { useStableCallback } from '@base-ui/utils/useStableCallback';
import {
  Dimensions,
  LayoutList,
  Virtualization,
  useVirtualizer,
  type Row as MuiVirtualizerRow,
  type RowEntry,
  type RenderContext,
  type Virtualizer,
} from '@mui/x-virtualizer';
import type { StateAttributesMapping } from '../getStateAttributesProps';
import type { BaseUIComponentProps, HTMLProps } from '../types';
import { useRenderElement } from '../useRenderElement';
import type { ListVirtualizerHandle } from './ListVirtualizationRegistry';

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
   * Whether this is an offscreen copy retained to preserve focus semantics.
   */
  isVirtualFocusRow: boolean;
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
      // Dynamic row measurement is incremental in MUI X Virtualizer. Mark real rows as measured so their
      // metadata can advance the measured boundary; the zero-sized focus proxy must not count.
      apiRef.current?.rowsMeta.setLastMeasuredRowIndex(rowIndex);
    }
  }, [apiRef, isVirtualFocusRow, rowIndex]);

  const content = renderRow({
    isVirtualFocusRow,
    row,
    rowIndex,
  });

  const style = isVirtualFocusRow ? focusProxyStyle : virtualRowStyle;

  // MUI X Virtualizer can retain a focused row outside the visible range. Keep its semantic content mounted,
  // but remove it from layout and measurement until the real row enters the rendered window.
  return (
    <div ref={isVirtualFocusRow ? undefined : measureRef} role="presentation" style={style}>
      {content}
    </div>
  );
}

const ListVirtualRow = React.memo(ListVirtualRowImpl) as typeof ListVirtualRowImpl;

function getRenderZoneTransform(offsetTop: number, scrollTop: number) {
  return `translate3d(0, ${offsetTop - scrollTop}px, 0)`;
}

function getOverscannedRenderContext(
  renderContext: RenderContext,
  rowPositions: readonly number[],
  rowCount: number,
  overscanPx: number,
  scrollTop: number,
  viewportHeight: number,
) {
  let firstRowIndex = renderContext.firstRowIndex;
  let lastRowIndex = renderContext.lastRowIndex;
  const overscanStart = Math.max(0, scrollTop - overscanPx);
  const overscanEnd = scrollTop + viewportHeight + overscanPx;

  while (firstRowIndex > 0 && (rowPositions[firstRowIndex] ?? 0) > overscanStart) {
    firstRowIndex -= 1;
  }

  while (
    lastRowIndex < rowCount &&
    (rowPositions[lastRowIndex] ?? Number.POSITIVE_INFINITY) <= overscanEnd
  ) {
    lastRowIndex += 1;
  }

  return {
    ...renderContext,
    firstRowIndex,
    lastRowIndex,
  };
}

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
    pinnedRowIndexes,
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
  const scrollTopRef = React.useRef(0);
  // The browser moves a native scrollport before dispatching its scroll event. Keep the existing
  // rows pinned in a sticky viewport during that interval, then move the render zone once
  // MUI X Virtualizer has synchronously committed the next row window.
  const handleScrollChange = useStableCallback((scrollPosition: { top: number }) => {
    scrollTopRef.current = scrollPosition.top;

    if (renderZoneRef.current) {
      renderZoneRef.current.style.transform = getRenderZoneTransform(
        renderZoneOffsetTopRef.current,
        scrollPosition.top,
      );
    }
  });
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

  const validPinnedRowIndexes = React.useMemo(() => {
    const seen = new Set<number>();
    return (pinnedRowIndexes ?? []).filter((rowIndex) => {
      if (rowIndex < 0 || rows[rowIndex] == null || seen.has(rowIndex)) {
        return false;
      }
      seen.add(rowIndex);
      return true;
    });
  }, [pinnedRowIndexes, rows]);

  const primaryPinnedRowIndex = validPinnedRowIndexes[0];
  const focusedVirtualCellRef = React.useRef<{
    columnIndex: number;
    id: React.Key;
    rowIndex: number;
  } | null>(null);
  focusedVirtualCellRef.current =
    primaryPinnedRowIndex == null
      ? null
      : {
          columnIndex: 0,
          id: rows[primaryPinnedRowIndex].id,
          rowIndex: primaryPinnedRowIndex,
        };

  const getFocusedVirtualCell = React.useCallback(() => focusedVirtualCellRef.current, []);
  const muiApiRef = React.useRef<Virtualizer['api'] | null>(null);

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

  // MUI X Virtualizer rehydrates row metadata when these callback identities change. This intentionally uses
  // a dependency-sensitive callback so estimate changes invalidate cached geometry.
  const getEstimatedRowHeight = React.useCallback(
    (row: RowEntry) => {
      const rowIndex = rowIndexById.get(row.id as React.Key) ?? -1;
      const listRow = rows[rowIndex];
      return listRow ? getEstimatedItemHeight(listRow, rowIndex) : defaultEstimatedItemHeight;
    },
    [defaultEstimatedItemHeight, getEstimatedItemHeight, rowIndexById, rows],
  );
  const range = React.useMemo(
    () =>
      rows.length === 0
        ? null
        : {
            // MUI X Virtualizer ranges are half-open: the last row index is excluded.
            firstRowIndex: 0,
            lastRowIndex: rows.length,
          },
    [rows.length],
  );
  const rowBufferPx = Math.max(0, overscanPx ?? Math.max(150, defaultEstimatedItemHeight));
  // MUI X Virtualizer waits for one estimated row of accumulated scrolling before recomputing an unchanged
  // controlled range. Keep at least that much measured content mounted when an estimate is taller
  // than the real rows, even when the requested overscan is smaller.
  const renderBufferPx = Math.max(rowBufferPx, defaultEstimatedItemHeight);

  const virtualizer = useVirtualizer({
    layout,
    dimensions: {
      rowHeight: defaultEstimatedItemHeight,
    },
    virtualization: {
      // Controlled range calculation avoids MUI X Virtualizer's fixed 15-row directional buffer. Base UI
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
  const currentScrollTop = virtualizer.store.state.virtualization.scrollPosition.current.top;
  const overscannedRenderContext = getOverscannedRenderContext(
    renderContext,
    rowsMeta.positions,
    rows.length,
    renderBufferPx,
    currentScrollTop,
    dimensions.viewportInnerSize.height,
  );
  const renderZoneOffsetTop = rowsMeta.positions[overscannedRenderContext.firstRowIndex] ?? 0;
  renderZoneOffsetTopRef.current = renderZoneOffsetTop;

  const resetScroll = useStableCallback(() => {
    scrollElementRef.current?.scrollTo({
      behavior: 'instant' as ScrollBehavior,
      top: 0,
    });
    handleScrollChange({ top: 0 });
  });

  React.useImperativeHandle(apiRefProp, () => ({ resetScroll }), [resetScroll]);

  if (process.env.NODE_ENV !== 'production') {
    // NODE_ENV doesn't change at runtime
    // eslint-disable-next-line react-hooks/rules-of-hooks
    React.useEffect(() => {
      const element = scrollElementRef.current;
      if (
        enabled &&
        rows.length >= 100 &&
        element &&
        totalSize > 0 &&
        element.clientHeight >= totalSize
      ) {
        onUnconstrainedHeight?.();
      }
    }, [enabled, onUnconstrainedHeight, rows.length, totalSize]);
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

    // Updating the store flag alone does not recompute the rendered range. Schedule the MUI X Virtualizer
    // render-context update before publishing the new virtualization mode.
    pendingVirtualizationUpdateRef.current = true;
    virtualizer.api.scheduleUpdateRenderContext();
    virtualizer.store.set('virtualization', {
      ...virtualization,
      enabled,
      enabledForColumns: false,
      enabledForRows: enabled,
    });
    // The mode fields are consumed inside the MUI X Virtualizer hook. Guarantee another render before forcing
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

    // MUI X Virtualizer stores the ResizeObserver content-box height. Preserve that same box model even if a
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

  const scrollRowIntoView = useStableCallback((rowIndex: number, requireMeasurement = false) => {
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

    if (rowSize > viewportSize) {
      nextScrollTop = start - scrollPaddingStart;
    } else if (start < viewportStart) {
      nextScrollTop = start - scrollPaddingStart;
    } else if (end > viewportEnd) {
      nextScrollTop = end - scrollElement.clientHeight + scrollPaddingEnd;
    }

    if (nextScrollTop != null) {
      const maxScrollTop = Math.max(
        0,
        currentRowsMeta.currentPageTotalHeight - scrollElement.clientHeight,
      );
      scrollElement.scrollTo({
        behavior: 'instant' as ScrollBehavior,
        top: Math.max(0, Math.min(nextScrollTop, maxScrollTop)),
      });
    }

    // `false` keeps the request pending even if an estimated scroll was performed.
    return measured;
  });

  const pendingScrollRowIndexRef = React.useRef<number | null>(null);
  const pendingScrollRowsRef = React.useRef<ListVirtualizerRow<RowModel>[] | null>(null);

  useIsoLayoutEffect(() => {
    if (
      !enabled ||
      scrollToRowIndex == null ||
      scrollToRowIndex < 0 ||
      rowsRef.current[scrollToRowIndex] == null
    ) {
      pendingScrollRowIndexRef.current = null;
      pendingScrollRowsRef.current = null;
      return;
    }

    pendingScrollRowIndexRef.current = scrollToRowIndex;
    pendingScrollRowsRef.current = rowsRef.current;

    // Try immediately with estimated metadata. If the destination is still unmeasured, the
    // rowsMeta effect below corrects the position once ResizeObserver updates it.
    if (scrollRowIntoView(scrollToRowIndex)) {
      pendingScrollRowIndexRef.current = null;
      pendingScrollRowsRef.current = null;
    }
  }, [enabled, scrollRowIntoView, scrollToRowIndex]);

  useIsoLayoutEffect(() => {
    const rowIndex = pendingScrollRowIndexRef.current;

    // Replacing the row collection invalidates a pending correction even when the same index
    // exists in the new collection.
    if (pendingScrollRowsRef.current !== rows) {
      pendingScrollRowIndexRef.current = null;
      pendingScrollRowsRef.current = null;
      return;
    }

    if (rowIndex != null && scrollRowIntoView(rowIndex, true)) {
      pendingScrollRowIndexRef.current = null;
      pendingScrollRowsRef.current = null;
    }
  }, [rows, rowsMeta, scrollRowIntoView]);

  const renderedRows = virtualizer.api.getters.getRows({
    renderContext: overscannedRenderContext,
  });

  validPinnedRowIndexes.forEach((rowIndex) => {
    if (
      rowIndex >= overscannedRenderContext.firstRowIndex &&
      rowIndex < overscannedRenderContext.lastRowIndex
    ) {
      return;
    }
    if (
      rowIndex === primaryPinnedRowIndex &&
      (rowIndex < overscannedRenderContext.firstRowIndex ||
        rowIndex > overscannedRenderContext.lastRowIndex)
    ) {
      return;
    }

    const row = rows[rowIndex];
    renderedRows.push(
      renderRow({
        id: row.id,
        model: row.model,
        rowIndex,
        isVirtualFocusRow: true,
      }),
    );
  });

  const { ref: containerRef, style: containerStyle, ...restContainerProps } = containerProps;
  const { style: contentStyle, ...restContentProps } = contentProps;
  const renderedRangeEnd =
    rowsMeta.positions[overscannedRenderContext.lastRowIndex] ??
    renderZoneOffsetTop +
      (overscannedRenderContext.lastRowIndex - overscannedRenderContext.firstRowIndex) *
        defaultEstimatedItemHeight;
  const layoutSizerHeight =
    rows.length === 0
      ? 0
      : Math.min(totalSize, Math.max(defaultEstimatedItemHeight, renderedRangeEnd));

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
              width: dimensions.viewportOuterSize.width,
            }}
          >
            <div
              ref={renderZoneRef}
              role="presentation"
              style={{
                transform: getRenderZoneTransform(renderZoneOffsetTop, scrollTopRef.current),
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
   * Whether the virtual row collection is empty.
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
   */
  estimatedItemHeight: number | ((row: RowModel, rowIndex: number) => number);
  /**
   * Called when a large enabled collection has no effective height constraint.
   * This is only called in development mode and should be used to alert the developer.
   */
  onUnconstrainedHeight?: (() => void) | undefined;
  /**
   * Pixel buffer rendered before and after the visible range.
   * Defaults to the larger of 150px and the estimated item height.
   */
  overscanPx?: number | undefined;
  /**
   * Rows retained outside the rendered range for component-specific focus or measurement
   * semantics.
   */
  pinnedRowIndexes?: readonly number[] | undefined;
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
  export type RenderRowParameters<RowModel extends MuiVirtualizerRow> =
    ListVirtualizerRenderRowParameters<RowModel>;
  export type Row<RowModel extends MuiVirtualizerRow> = ListVirtualizerRow<RowModel>;
  export type State = ListVirtualizerState;
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
