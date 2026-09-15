'use client';
import * as React from 'react';
import { ownerWindow } from '@base-ui/utils/owner';
import { useForcedRerendering } from '@base-ui/utils/useForcedRerendering';
import { useInsertionEffect } from '@base-ui/utils/useInsertionEffect';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
import { useRefWithInit } from '@base-ui/utils/useRefWithInit';
import { useStableCallback } from '@base-ui/utils/useStableCallback';
import { warn } from '@base-ui/utils/warn';
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
import type {
  VirtualizerActions,
  VirtualizerScrollToIndexOptions,
} from '../internals/virtualization/ListVirtualizationRegistry';
import { useListVirtualization } from '../internals/virtualization/ListVirtualizationHostContext';
import { useListBinding } from '../internals/virtualization/useListBinding';
import {
  isGroupHeaderRowId,
  isObjectValue,
  useGroupedRowModels,
  useRowModels,
  type GroupedRows,
} from '../internals/virtualization/useRowModels';
import {
  isGroupHeaderRow,
  type VirtualizerActiveIndex,
  type VirtualizerActiveItem,
  type VirtualizerGroup,
  type VirtualizerEstimateGroupHeaderHeight,
  type VirtualizerGroupHeaderElement,
  type VirtualizerGroupHeaderProps,
  type VirtualizerRenderGroupHeader,
  type VirtualizerGetGroupKey,
  type VirtualizerItemProps,
  type VirtualizerItemRowModel,
  type VirtualizerRenderRowParameters,
  type VirtualizerRow,
  type VirtualizerRowModel,
  type VirtualizerRowProps,
} from '../internals/virtualization/types';
import type { RowsGeometry, RowWindow } from './geometry';
import { getLaidOutRowElements } from './getLaidOutRowElements';
import { useGroupHeaderHeightEstimate } from './useGroupHeaderHeightEstimate';
import {
  EMPTY_SCROLLPORT_PADDING,
  createScrollOffsetReader,
  findScrollContainer,
  getScrollportPadding,
} from './scrollport';
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
  /**
   * Whether the element the renderer returns is the row itself. Its binding to the virtualizer
   * then travels through the renderer's metadata argument rather than a wrapper of the
   * virtualizer's own, which a table section could not contain.
   */
  bare: boolean;
  isVirtualFocusRow: boolean;
  renderRow: (params: VirtualizerRenderRowParameters<RowModel>) => React.ReactElement;
  /**
   * Whether the row is mounted for its content alone — a group header kept so the group's name
   * resolves while the header itself is outside the window. A retained row is hidden, takes no
   * space, and is not measured.
   */
  retained: boolean;
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

// A block formatting context, so a row's own box contains its content's margins and measuring
// the box measures what the content occupies.
const virtualRowStyle: React.CSSProperties = {
  display: 'flow-root',
};

// The same containment for the trailing content in normal flow. Its positioned wrapper in the
// windowed layout gets it for free.
const trailingFlowStyle: React.CSSProperties = virtualRowStyle;

function VirtualRowImpl<RowModel>(props: VirtualRowProps<RowModel>) {
  const { apiRef, bare, isVirtualFocusRow, renderRow, retained, row, rowIndex } = props;

  const measureCleanupRef = React.useRef<(() => void) | undefined>(undefined);
  const measureRef = useStableCallback((element: HTMLElement | null) => {
    measureCleanupRef.current?.();
    measureCleanupRef.current = element
      ? apiRef.current?.rowsMeta.observeRowHeight(element, row.id)
      : undefined;
  });

  const inLayout = !isVirtualFocusRow && !retained;

  useIsoLayoutEffect(() => {
    if (inLayout) {
      // Dynamic row measurement is incremental in MUI Virtualizer. Mark real rows as measured so their
      // metadata can advance the measured boundary; the zero-sized focus proxy must not count.
      apiRef.current?.rowsMeta.setLastMeasuredRowIndex(rowIndex);
    }
  }, [apiRef, inLayout, rowIndex]);

  if (process.env.NODE_ENV !== 'production') {
    // NODE_ENV doesn't change at runtime
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useIsoLayoutEffect(() => {
      // The ref reaches the element during the commit, before this effect runs: a laid-out row
      // whose ref was never called did not receive the renderer's metadata argument, and neither
      // its height nor its position can be known.
      if (bare && inLayout && measureCleanupRef.current == null) {
        warn(
          '<Virtualizer layout="table"> rendered a row that did not receive the third argument ' +
            'of its renderer. Spread it onto the `<tr>` element the renderer returns, so the ' +
            'row can be measured and positioned.',
        );
      }
    }, [bare, inLayout]);
  }

  // MUI Virtualizer can retain a focused row outside the visible range. Keep its semantic content mounted,
  // but remove it from layout and measurement until the real row enters the rendered window.
  // Dropping the measurement ref while a row is retained detaches its observer through the ref's
  // own cleanup, so no hidden height reaches the cache.
  // A bare row is never retained for its content alone: that is a grouped window's header, and
  // a bare window is flat.
  const rowProps = React.useMemo<VirtualizerRowProps | undefined>(
    () =>
      bare
        ? {
            ref: inLayout ? measureRef : undefined,
            'data-row-index': rowIndex,
            style: isVirtualFocusRow ? focusProxyStyle : undefined,
          }
        : undefined,
    [bare, inLayout, isVirtualFocusRow, measureRef, rowIndex],
  );

  if (bare) {
    return renderRow({ row, rowIndex, rowProps });
  }

  const content = renderRow({
    row,
    rowIndex,
  });

  // A retained row carries no inline display: the `hidden` attribute only removes an element
  // from layout through the browser's own `display: none`, which any inline display overrides.
  let style: React.CSSProperties | undefined = virtualRowStyle;
  if (isVirtualFocusRow) {
    style = focusProxyStyle;
  } else if (retained) {
    style = undefined;
  }

  return (
    <div
      ref={inLayout ? measureRef : undefined}
      role="presentation"
      data-row-index={rowIndex}
      hidden={retained || undefined}
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
 * Where a sticky box stands, relative to the scrollport's start edge, given where it would stand
 * without sticking and the end of the block it may not leave, both relative to that edge. A
 * sticky box is shifted down from its normal position by just enough to keep its start edge at
 * the scrollport's, and no further than its containing block allows.
 */
function getStuckTop(normalTop: number, containingBlockEnd: number, height: number) {
  const desiredShift = Math.max(0, -normalTop);
  const maxShift = Math.max(0, containingBlockEnd - normalTop - height);
  return normalTop + Math.min(desiredShift, maxShift);
}

/**
 * Keeps the browser's own scroll anchoring off the space a table layout reserves: it would see
 * that space change size, as the window moves and as the estimate is refined, and compensate on
 * top of the compensation the scroll-anchoring effect makes from the same measurements. The
 * effect's is kept, since it also serves engines without a native one.
 */
const spacerSectionStyle: React.CSSProperties = {
  overflowAnchor: 'none',
};

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

/**
 * The element rendered for one row of the window.
 */
type RenderVirtualRow = (params: {
  id: React.Key;
  model: MuiVirtualizerRow;
  rowIndex: number;
  isVirtualFocusRow: boolean;
  retained: boolean;
}) => React.ReactElement;

interface WindowEntry {
  rowIndex: number;
  isVirtualFocusRow: boolean;
}

/**
 * The rows of a half-open window in order, plus the pinned row when it falls outside the window.
 *
 * This is what the engine's own row getter does for a flat list, written here so the component
 * owns the element tree it mounts: the getter's typings are `any`, and it also carries the grid
 * machinery (pinned sections, detail panels, column spans) this list never enables. The pinned
 * row keeps the engine's rule — it is spliced in before the window when it lies above it and
 * after it when it lies beyond the exclusive end, and it is the focus proxy only in those
 * positions; a pinned row inside the window is an ordinary row.
 */
function getWindowEntries(
  window: RowWindow,
  pinnedRowIndex: number | undefined,
  rowCount: number,
): WindowEntry[] {
  const firstRowIndex = Math.max(0, window.firstRowIndex);
  const lastRowIndex = Math.min(window.lastRowIndex, rowCount);
  const entries: WindowEntry[] = [];
  const hasPinnedRow = pinnedRowIndex != null && pinnedRowIndex >= 0 && pinnedRowIndex < rowCount;

  if (hasPinnedRow && pinnedRowIndex < firstRowIndex) {
    entries.push({ rowIndex: pinnedRowIndex, isVirtualFocusRow: true });
  }

  for (let rowIndex = firstRowIndex; rowIndex < lastRowIndex; rowIndex += 1) {
    entries.push({ rowIndex, isVirtualFocusRow: false });
  }

  if (hasPinnedRow && pinnedRowIndex > lastRowIndex) {
    entries.push({ rowIndex: pinnedRowIndex, isVirtualFocusRow: true });
  }

  return entries;
}

/**
 * Renders the window of a flat list: its rows, as siblings.
 */
function renderFlatWindow<RowModel>(
  entries: WindowEntry[],
  rows: VirtualizerRow<RowModel>[],
  renderRow: RenderVirtualRow,
): React.ReactNode {
  return entries.map(({ rowIndex, isVirtualFocusRow }) => {
    const row = rows[rowIndex];
    return renderRow({
      id: row.id,
      model: row.model as MuiVirtualizerRow,
      rowIndex,
      isVirtualFocusRow,
      retained: false,
    });
  });
}

/**
 * Renders the window of a grouped list: each run of consecutive rows from one group inside that
 * group's wrapper, which is what associates the options with their group's name.
 *
 * The wrapper spans only the window's slice of the group, so it carries no styling of its own.
 * Its first child is always the group's header: laid out when the header row is in the window,
 * and otherwise retained hidden, so the `aria-labelledby` reference resolves for as long as any
 * of the group's rows is mounted. The header is the same element either way, so a header
 * scrolling into the window changes a prop rather than remounting. A pinned row from another
 * group forms a run of its own, with that group's header retained beside it.
 */
function renderGroupedWindow<RowModel>(
  entries: WindowEntry[],
  rows: VirtualizerRow<RowModel>[],
  grouped: GroupedRows<unknown>,
  getGroupHeaderId: (ordinal: number) => string | undefined,
  renderRow: RenderVirtualRow,
): React.ReactNode {
  const elements: React.ReactElement[] = [];
  let runGroupIndex = -1;
  let run: WindowEntry[] = [];

  const flush = () => {
    if (run.length === 0) {
      return;
    }

    const descriptor = grouped.groups[runGroupIndex];
    const children: React.ReactElement[] = [];
    // Row order places a group's header before its items, and the entries keep row order, so a
    // header in the run is its first entry.
    if (run[0].rowIndex !== descriptor.headerRowIndex) {
      const header = rows[descriptor.headerRowIndex];
      children.push(
        renderRow({
          id: header.id,
          model: header.model as MuiVirtualizerRow,
          rowIndex: descriptor.headerRowIndex,
          isVirtualFocusRow: false,
          retained: true,
        }),
      );
    }

    for (const { rowIndex, isVirtualFocusRow } of run) {
      const row = rows[rowIndex];
      children.push(
        renderRow({
          id: row.id,
          model: row.model as MuiVirtualizerRow,
          rowIndex,
          isVirtualFocusRow,
          retained: false,
        }),
      );
    }

    elements.push(
      <div key={descriptor.key} role="group" aria-labelledby={getGroupHeaderId(descriptor.ordinal)}>
        {children}
      </div>,
    );
    run = [];
  };

  for (const entry of entries) {
    const groupIndex = grouped.rowToGroupIndex[entry.rowIndex];
    if (groupIndex !== runGroupIndex) {
      flush();
      runGroupIndex = groupIndex;
    }
    run.push(entry);
  }
  flush();

  return elements;
}

const stateAttributesMapping: StateAttributesMapping<VirtualizerState> = {
  totalSize: () => null,
};

/**
 * Renders a window of visible and overscanned items in a flat list.
 * Renders a scrollable `<div>` element, or a `<tbody>` element in the table layout.
 *
 * Pass the collection to the `items` prop to virtualize any list, or omit it inside a list that
 * supports virtualization to window that list's own collection. The latter requires the `items`
 * prop on the list root, and the virtualizer must be the only item-rendering child of the list.
 *
 * The element must have a constrained height or maximum height for virtualization to limit the
 * number of mounted items. In the table layout, the scroll container around the table must.
 *
 * Grid mode is not currently supported.
 *
 * Documentation: [Base UI Virtualizer](https://base-ui.com/react/utils/virtualizer)
 */
export const Virtualizer = React.forwardRef(function Virtualizer<Value>(
  componentProps: Virtualizer.Props<Value>,
  forwardedRef: React.ForwardedRef<HTMLElement>,
) {
  const {
    actionsRef,
    activeIndex,
    children,
    className,
    enabled: enabledProp = true,
    endReachedThreshold = 0,
    estimatedGroupHeaderHeight: estimatedGroupHeaderHeightProp,
    estimatedItemHeight: estimatedItemHeightProp,
    getGroupKey,
    getItemKey,
    items,
    layout: layoutProp = 'list',
    onEndReached,
    renderGroupHeader,
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
    enabled: windowingRequested,
    getGroupHeaderId,
    groups,
    items: collection,
    pinnedItemIndex,
    renderRow: renderRowProp,
    scrollportProps,
    scrollToRowAlignment,
    scrollToItemIndex,
    windowingSuspended,
  } = useListBinding<Value>({
    actionsRef,
    activeIndex,
    totalItems,
    children,
    enabled: enabledProp,
    host,
    items,
    listState,
    renderGroupHeader,
  });

  const isTable = layoutProp === 'table';
  // A table section is windowed against a scroll container of the consumer's, found among its
  // ancestors when it mounts. Without one there is nothing to window against, so every row is
  // rendered, as the table would render them without a virtualizer.
  const [scrollContainerMissing, setScrollContainerMissing] = React.useState(false);
  const enabled = windowingRequested && !(isTable && scrollContainerMissing);

  // The item rows are the collection as the flat concerns know it — estimates, the adaptive
  // average — and the engine windows either them or, for a grouped collection, the projection that
  // interleaves the group headers. Everything public speaks item indexes; the projection's tables
  // translate at the boundary, and a flat list has no projection to consult.
  const itemRows = useRowModels<Value>({ getItemKey, items: collection });
  const grouped = useGroupedRowModels<Value>({ getGroupKey, groups, itemRows });
  const rows: VirtualizerRow<VirtualizerRowModel<Value>>[] = grouped?.rows ?? itemRows;
  const toRowIndex = (itemIndex: number) =>
    grouped == null ? itemIndex : (grouped.itemToRowIndex[itemIndex] ?? -1);

  const itemHeightEstimate = useItemHeightEstimate<Value>({
    estimatedItemHeight: estimatedItemHeightProp,
    items: collection,
    rows: itemRows,
  });
  const { defaultEstimatedItemHeight, getEstimatedItemHeight } = itemHeightEstimate;
  const groupHeaderHeightEstimate = useGroupHeaderHeightEstimate<Value>({
    estimatedGroupHeaderHeight: estimatedGroupHeaderHeightProp,
    grouped,
    groups,
    staticEstimatedItemHeight: itemHeightEstimate.staticEstimatedItemHeight,
  });
  const { getEstimatedGroupHeaderHeight } = groupHeaderHeightEstimate;

  const scrollElementRef = React.useRef<HTMLElement | null>(null);
  const rootElementRef = React.useRef<HTMLElement | null>(null);
  const renderZoneRef = React.useRef<HTMLDivElement | null>(null);
  /**
   * The row group holding the space of the rows outside the window, in the table layout: a
   * sibling of the root in normal flow, from which the root's own place in the table is read.
   */
  const spacerSectionRef = React.useRef<HTMLTableSectionElement | null>(null);
  /**
   * The row inside it that holds that space: where the rows' reserved space ends, which is what
   * the section's surroundings are measured from.
   */
  const endSpacerRef = React.useRef<HTMLTableRowElement | null>(null);
  /**
   * Where the table ends, in scroll coordinates: the block a sticky row group may not leave, which
   * decides how far it can be held at the scrollport's start edge.
   */
  const containingBlockEndRef = React.useRef(0);
  /**
   * The element the laid-out rows are children of — grandchildren, one group wrapper deep — in
   * whichever layout the rows are currently in: the render zone while a list windows, and the
   * root otherwise, which is the scroll element for a list mounting every row and the table
   * section in the table layout.
   */
  const getRowsParent = useStableCallback(
    (): HTMLElement | null => renderZoneRef.current ?? rootElementRef.current,
  );
  const renderZoneOffsetTopRef = React.useRef(0);
  /**
   * Virtual position of the end of the rendered range when it includes the final row, or `null`
   * otherwise. Anchors the rendered tail to the virtual content end.
   */
  const renderZoneVirtualEndRef = React.useRef<number | null>(null);
  const scrollTopRef = React.useRef(0);
  const muiApiRef = React.useRef<MuiVirtualizer['api'] | null>(null);
  // The concerns below are handed the engine operations they use, in this component's vocabulary,
  // and nothing more: this is the only file that knows the engine. Read through the ref, since
  // the gesture concern is declared before the engine is.
  const settleGeometry = useStableCallback(() => {
    muiApiRef.current?.rowsMeta.hydrateRowsMeta();
  });
  /**
   * The scrollport's own block padding. Rows begin below it, scroll through it, and the virtual
   * content covers it, matching how a plain scrolling list treats its padding. The engine's
   * geometry counts rows alone, so this is the offset between its coordinates and `scrollTop`.
   */
  const [scrollportPadding, setScrollportPadding] = React.useState(EMPTY_SCROLLPORT_PADDING);
  /**
   * What the rows are laid out after and before in the scroll container, in scroll coordinates.
   * A list's rows fill its scrollport but for the padding; a table section sits among whatever
   * else its scroll container holds — the table's header, its footer, the container's own
   * padding — and that is measured from the DOM instead.
   */
  const [measuredInset, setMeasuredInset] = React.useState(EMPTY_SCROLLPORT_PADDING);
  const rowsInset = isTable ? measuredInset : scrollportPadding;
  // The trailing row is content, not an item: it sits after the last row, scrolls with the
  // collection, and is measured so the scrollable height covers it. Its height is state rather
  // than a ref because the geometry around it — the scroll height, the maximum scroll offset —
  // is computed during render. In the table layout it is rows of the section, after the rows'
  // reserved space, and counts among the section's surroundings instead.
  const [trailingHeight, setTrailingHeight] = React.useState(0);

  const scrollportPaddingTotal = scrollportPadding.start + scrollportPadding.end;
  const rowsInsetTotal = rowsInset.start + rowsInset.end;

  const gesture = useScrollGesture({ settleGeometry });
  // The running average describes items: it is fed the item rows alone, so headers neither seed
  // it nor count among the rows it is judged against.
  const adaptive = useAdaptiveEstimate({
    rows: itemRows,
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
    // A table's row group is its own render zone, once it is windowed.
    const renderZone = isTable ? rootElementRef.current : renderZoneRef.current;

    if (!renderZone || (isTable && !enabled)) {
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
    // The rows are stacked from the top of the sticky box they are held in. A list's sticky
    // viewport stands at the scrollport's start edge; a table's row group is held there once the
    // scrollport has moved past its place in the table, and no further than the table's end
    // allows, so where it stands is worked out from both.
    const zoneTop = isTable
      ? getStuckTop(
          rowsInset.start - scrollTop,
          containingBlockEndRef.current - scrollTop,
          renderZone.offsetHeight,
        )
      : 0;
    const stacked = rowsInset.start + renderZoneOffsetTopRef.current - scrollTop - zoneTop;
    let translate = stacked;
    const virtualEnd = renderZoneVirtualEndRef.current;

    if (virtualEnd != null) {
      const anchored = rowsInset.start + virtualEnd - scrollTop - renderZone.offsetHeight - zoneTop;
      translate =
        anchored <= stacked
          ? // The real tail is taller than estimated. Pulling it up cannot uncover the scrollport's
            // top edge: the extra real height always reaches at least as far down as before.
            anchored
          : // The real tail is shorter than estimated. Push it down to the virtual end, but never
            // below the scrollport's top edge, which would uncover rows above the rendered range.
            Math.max(stacked, Math.min(anchored, -zoneTop));
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

  const pinnedRowIndex = pinnedItemIndex == null ? undefined : toRowIndex(pinnedItemIndex);
  const validPinnedRowIndex =
    pinnedRowIndex != null && pinnedRowIndex >= 0 && rows[pinnedRowIndex] != null
      ? pinnedRowIndex
      : undefined;
  const scrollToRowIndex =
    scrollToItemIndex == null || scrollToItemIndex < 0 ? undefined : toRowIndex(scrollToItemIndex);
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

  const renderRow = React.useCallback<RenderVirtualRow>(
    (params) => {
      const row = rows[params.rowIndex];
      return (
        <VirtualRow
          key={params.id}
          apiRef={muiApiRef}
          bare={isTable}
          isVirtualFocusRow={params.isVirtualFocusRow}
          renderRow={renderRowProp}
          retained={params.retained}
          row={row}
          rowIndex={params.rowIndex}
        />
      );
    },
    [isTable, renderRowProp, rows],
  );

  const engineRenderRow = React.useCallback(
    (params: {
      id: React.Key;
      model: MuiVirtualizerRow;
      rowIndex: number;
      isVirtualFocusRow: boolean;
    }) => renderRow({ ...params, retained: false }),
    [renderRow],
  );

  const getRowHeight = React.useCallback(() => 'auto' as const, []);
  const rowIndexById = React.useMemo(() => {
    const map = new Map<React.Key, number>();
    rows.forEach((row, rowIndex) => {
      map.set(row.id, rowIndex);
    });
    return map;
  }, [rows]);
  const resolveRowIndexById = useStableCallback((rowId: React.Key) => rowIndexById.get(rowId));

  // MUI Virtualizer rehydrates row metadata when these callback identities change. This intentionally uses
  // a dependency-sensitive callback so estimate changes invalidate cached geometry.
  const adaptiveEnabled = adaptive.enabled;
  const adaptiveInvalidated = adaptive.invalidated;
  const readAdaptiveEstimate = adaptive.readEstimate;
  const hasGroupHeaders = grouped != null;
  const getEstimatedRowHeight = React.useCallback(
    (row: RowEntry) => {
      let model: VirtualizerRowModel<Value> | undefined;

      // A header has an estimate of its own, and the running average below describes items. Only
      // a grouped list looks the row up before the average: the engine asks for every unmeasured
      // row on every hydration, and a flat list has nothing to look for.
      if (hasGroupHeaders) {
        model = rows[rowIndexById.get(row.id as React.Key) ?? -1]?.model;
        if (model != null && isGroupHeaderRow(model)) {
          return getEstimatedGroupHeaderHeight(model.groupIndex);
        }
      }

      // A static estimate is refined with the running average of measured rows so the virtual
      // geometry converges quickly. Per-row estimate functions encode knowledge that a global
      // average would override, so they are used as provided. The average is read through the
      // module's own ref because the refresh republishes it without a re-render.
      const adaptiveEstimate = adaptiveInvalidated ? null : readAdaptiveEstimate();
      if (adaptiveEnabled && adaptiveEstimate != null) {
        return adaptiveEstimate;
      }

      model ??= rows[rowIndexById.get(row.id as React.Key) ?? -1]?.model;
      return model != null && !isGroupHeaderRow(model)
        ? getEstimatedItemHeight(model.itemIndex)
        : defaultEstimatedItemHeight;
    },
    [
      adaptiveEnabled,
      adaptiveInvalidated,
      defaultEstimatedItemHeight,
      getEstimatedGroupHeaderHeight,
      getEstimatedItemHeight,
      hasGroupHeaders,
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

      // A row measured at zero is not laid out — its list is inside a `display: none` ancestor,
      // as a popup that closed while keeping its list mounted is — and the observer reports the
      // collapse like any other resize. That is no row height: letting it into the geometry
      // shrinks the content to nothing and, through a running average of zeros, keeps it there
      // after the list is shown again. Hand the row back to its estimate until it is measured
      // for real.
      if (!entry.needsFirstMeasurement && entry.content <= 0) {
        entry.needsFirstMeasurement = true;
        entry.content = getEstimatedRowHeight(row);
        return;
      }

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
    // The engine requires a row renderer, though this component renders the window itself and
    // never asks the engine for rows.
    renderRow: engineRenderRow,
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

  const isModeApplied = useStableCallback((windowed: boolean) => {
    const mode = virtualizer.store.state.virtualization;
    return (
      mode.enabled === windowed &&
      mode.enabledForRows === windowed &&
      mode.enabledForColumns === false
    );
  });
  const setMode = useStableCallback((windowed: boolean) => {
    virtualizer.store.set('virtualization', {
      ...virtualizer.store.state.virtualization,
      enabled: windowed,
      enabledForColumns: false,
      enabledForRows: windowed,
    });
  });
  const scheduleWindowUpdate = useStableCallback(() =>
    virtualizer.api.scheduleUpdateRenderContext(),
  );
  const forceWindowUpdate = useStableCallback(() => virtualizer.api.forceUpdateRenderContext());
  const getViewportHeight = useStableCallback(() => virtualizer.store.state.rootSize.height);
  const setViewportHeight = useStableCallback((height: number) => {
    // The engine stores the ResizeObserver content-box height; keep that box model.
    virtualizer.store.set('rootSize', { ...virtualizer.store.state.rootSize, height });
    virtualizer.api.updateDimensions();
  });
  const isRowMeasured = useStableCallback(
    (rowId: React.Key) => !virtualizer.api.rowsMeta.getRowHeightEntry(rowId).needsFirstMeasurement,
  );
  const readRowsGeometry = useStableCallback((): RowsGeometry => virtualizer.store.state.rowsMeta);
  const readMeasuredHeight = useStableCallback((rowId: React.Key): number | null => {
    const entry = (virtualizer.store.state.rowHeights as Map<React.Key, HeightEntry>).get(rowId);
    return entry == null || entry.needsFirstMeasurement ? null : entry.content;
  });
  const readMeasuredHeights = useStableCallback(function* readMeasuredHeights() {
    for (const [rowId, entry] of virtualizer.store.state.rowHeights as Map<
      React.Key,
      HeightEntry
    >) {
      if (!entry.needsFirstMeasurement) {
        yield [rowId, entry.content] as [React.Key, number];
      }
    }
  });
  // The same cache without the headers, including headers of groups no longer in the collection:
  // the adaptive refresh demotes every measured row it did not sample to the item average, and a
  // header's measured height must survive that.
  const readMeasuredItemHeights = useStableCallback(function* readMeasuredItemHeights() {
    for (const [rowId, height] of readMeasuredHeights()) {
      if (!isGroupHeaderRowId(rowId)) {
        yield [rowId, height] as [React.Key, number];
      }
    }
  });
  // Reaches into the engine's height cache: it has `resetRowHeights` for every row but no way to
  // send one row back to its estimate, which the adaptive refresh needs for rows measured under a
  // transient layout. The entries are plain mutable objects, so this is what a per-row reset
  // would do; it is the one place that knows so.
  const demoteRowHeight = useStableCallback((rowId: React.Key, height: number) => {
    const entry = (virtualizer.store.state.rowHeights as Map<React.Key, HeightEntry>).get(rowId);
    if (entry != null) {
      entry.content = height;
      entry.needsFirstMeasurement = true;
    }
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
        element.clientHeight - rowsInsetTotal >= rowsMeta.currentPageTotalHeight
      ) {
        const subject = isTable
          ? 'The scroll container of <Virtualizer layout="table">'
          : '<Virtualizer>';
        warn(
          `${subject} must have a constrained height or maximum height. ` +
            'Without one, all items are rendered and virtualization provides no benefit.',
        );
      }
    }, [enabled, isTable, rows.length, rowsInsetTotal, rowsMeta]);
  }

  // Measured through the wrapper's ref rather than an effect: the wrapper is recreated when the
  // content appears, when the branch below switches, and when the `render` prop replaces the root,
  // and the observer has to follow it each time. Its content resizing is the observer's own
  // business, and a consumer writing the node inline hands over a new one on every render.
  const disconnectTrailingObserverRef = React.useRef<(() => void) | undefined>(undefined);
  const trailingRef = useStableCallback((element: HTMLDivElement | null) => {
    disconnectTrailingObserverRef.current?.();
    disconnectTrailingObserverRef.current = undefined;

    if (element == null) {
      return;
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
      return;
    }

    const observer = new win.ResizeObserver(measure);
    observer.observe(element);
    disconnectTrailingObserverRef.current = () => observer.disconnect();
  });
  const hasTrailing = trailing != null;
  useIsoLayoutEffect(() => {
    if (!hasTrailing) {
      setTrailingHeight(0);
    }
  }, [hasTrailing]);

  // Declared before the mode publication below, which arms it: the request then lands on the
  // commit that publication already schedules.
  const viewportRestore = useViewportRestore({
    dimensionsReady: dimensions.isReady,
    enabled,
    forceWindowUpdate,
    getViewportHeight,
    renderContext,
    rowCount: rows.length,
    scrollElementRef,
    rowsInsetTotal,
    setViewportHeight,
    totalSize,
    viewportMeasurement: rootSize,
  });

  useEngineMode({
    enabled,
    forceWindowUpdate,
    isModeApplied,
    onWindowingResumed: viewportRestore.arm,
    onWindowingSuspended: viewportRestore.disarm,
    scheduleWindowUpdate,
    setMode,
  });

  // The scrollport's padding is only read when one of its boxes changes, so unpadded lists never
  // pay for the style lookup per render. Padding changes the content box the engine observes
  // under `border-box` sizing, but under `content-box` with a fixed height only the border box
  // moves, so that box is watched too. Every notification, the first included, re-reads the
  // padding; an unchanged value keeps the previous state object, which is no render. Padding
  // moved from one edge to the other without changing the total moves neither box and waits for
  // the next resize.
  const publishScrollportPadding = useStableCallback((element: HTMLElement) => {
    const nextPadding = getScrollportPadding(element);
    setScrollportPadding((previousPadding) =>
      previousPadding.start === nextPadding.start && previousPadding.end === nextPadding.end
        ? previousPadding
        : nextPadding,
    );
  });
  const disconnectScrollportObserverRef = React.useRef<(() => void) | undefined>(undefined);
  const scrollportBoxRef = useStableCallback((element: HTMLElement | null) => {
    disconnectScrollportObserverRef.current?.();
    disconnectScrollportObserverRef.current = undefined;

    if (element == null) {
      return;
    }

    const win = ownerWindow(element);

    if (typeof win.ResizeObserver === 'undefined') {
      return;
    }

    const observer = new win.ResizeObserver(() => publishScrollportPadding(element));
    observer.observe(element, { box: 'border-box' });
    disconnectScrollportObserverRef.current = () => observer.disconnect();
  });

  useIsoLayoutEffect(() => {
    const element = scrollElementRef.current;

    if (!element) {
      return;
    }

    publishScrollportPadding(element);
  }, [enabled, publishScrollportPadding, rootSize]);

  // Where the table ends is read from the DOM on every commit: the row group's reserved space
  // moves with every window, and the clamp against the table's end has to follow it. Only a ref
  // is written here, so nothing can re-render because of it.
  useIsoLayoutEffect(() => {
    const scrollElement = scrollElementRef.current;
    const root = rootElementRef.current;

    if (!isTable || scrollElement == null || root == null) {
      return;
    }

    const at = createScrollOffsetReader(scrollElement);
    containingBlockEndRef.current = at((root.parentElement ?? root).getBoundingClientRect().bottom);
  });

  // A table section's surroundings are measured when something around it can have moved: the
  // scrollport was resized or padded differently, the layout was switched, or the rows after the
  // reserved space changed. Not on every commit: the measurement decides which rows the window
  // holds, and the window decides how the section is laid out, so a measurement that re-ran on
  // the commit it caused could feed itself indefinitely. A header that wraps onto another line
  // without the scrollport resizing is not caught, which is rare enough to leave.
  useIsoLayoutEffect(() => {
    const scrollElement = scrollElementRef.current;
    const root = rootElementRef.current;

    if (!isTable || scrollElement == null || root == null) {
      return;
    }

    const at = createScrollOffsetReader(scrollElement);
    const spacerSection = spacerSectionRef.current;
    const rootRect = root.getBoundingClientRect();
    // While windowing, the root is held by the scrollport and moved by a transform, so its rect
    // says nothing about where the table lays it out. The spacer row group after it is in normal
    // flow, and the root's own box ends where that begins; the box's height is read from the rect
    // rather than `offsetHeight`, which rounds, so the difference is exact whatever the window.
    const start =
      spacerSection == null
        ? at(rootRect.top)
        : at(spacerSection.getBoundingClientRect().top) - rootRect.height;
    const reservedEnd = endSpacerRef.current?.getBoundingClientRect().bottom ?? rootRect.bottom;
    const nextInset = {
      start: Math.max(0, start),
      end: Math.max(0, scrollElement.scrollHeight - at(reservedEnd)),
    };
    setMeasuredInset((previousInset) =>
      Math.abs(previousInset.start - nextInset.start) < 0.5 &&
      // `scrollHeight` is a whole number of pixels; the end it is measured against is not.
      Math.abs(previousInset.end - nextInset.end) < 1
        ? previousInset
        : nextInset,
    );
  }, [enabled, hasTrailing, isTable, rootSize, scrollportPadding]);

  // In the table layout the scroll container is not the root but an ancestor of it, found and
  // bound from the root's ref rather than from a layout effect: an ancestor's own ref is not
  // attached yet when a descendant's layout effects run, while the DOM around the root is
  // complete by the time its ref is. The binding follows the root through a replacement by the
  // `render` prop, and is released before the next one is made or when the root detaches.
  const { ref: containerRef, style: containerStyle, ...restContainerProps } = containerProps;
  const unbindScrollContainerRef = React.useRef<(() => void) | undefined>(undefined);
  const bindScrollContainer = useStableCallback((root: HTMLElement | null) => {
    unbindScrollContainerRef.current?.();
    unbindScrollContainerRef.current = undefined;

    if (root == null) {
      return;
    }

    const scrollContainer = findScrollContainer(root);

    if (scrollContainer == null) {
      if (process.env.NODE_ENV !== 'production') {
        warn(
          '<Virtualizer layout="table"> has no scrollable ancestor to window its rows against, ' +
            'so every row is rendered. Give an element around the table `overflow: auto` and a ' +
            "constrained height, so that it is the table's scroll container.",
        );
      }
      setScrollContainerMissing(true);
      return;
    }

    setScrollContainerMissing(false);
    // The same bindings the root receives in the list layout, where it is the scroll element:
    // the engine's scroll and resize observation, the gesture listeners, and the padding
    // observer. Each is released with the element it was bound to.
    const bindEngine = containerRef;
    const bindGesture = gesture.scrollElementRefCallback;
    bindEngine(scrollContainer);
    bindGesture(scrollContainer);
    scrollportBoxRef(scrollContainer);
    unbindScrollContainerRef.current = () => {
      bindEngine(null);
      bindGesture(null);
      scrollportBoxRef(null);
    };
  });
  const rootRefCallback = React.useCallback(
    (element: HTMLElement | null) => {
      rootElementRef.current = element;
      if (isTable) {
        bindScrollContainer(element);
      }
    },
    [bindScrollContainer, isTable],
  );

  // Declared after the effects that publish the virtualization mode, so a request made as a list
  // opens is applied against the enabled window.
  const pendingScroll = usePendingScroll<VirtualizerRowModel<Value>>({
    adaptive,
    enabled,
    isRowMeasured,
    // Headers move an item's row index without changing which item it is. A request keeps
    // following its row by id through such a change; a flat list has no such change to follow.
    resolveRowIndex: grouped == null ? undefined : resolveRowIndexById,
    itemCountBeforeRow: grouped?.itemCountBeforeRow,
    onScrollApplied: (scrollTop) => handleScrollChange({ top: scrollTop }),
    refreshWindow,
    refreshWindowAfterCorrectiveScroll,
    renderContextRef: overscannedRenderContextRef,
    getRowsParent,
    rows,
    scrollElementRef,
    rowsInset,
    scrollToRowAlignment,
    readRowsGeometry,
    scrollToRowIndex,
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

  // Reported in scroll coordinates rather than the engine's: what the rows are laid out after is
  // the offset between the two, and a consumer holding a `scrollTop` has no way to know it.
  const getItemMetrics = useStableCallback((index: number) => {
    const currentGrouped = grouped;
    const rowIndex = currentGrouped == null ? index : (currentGrouped.itemToRowIndex[index] ?? -1);

    if (rows[rowIndex] == null) {
      return null;
    }

    const currentRowsMeta = virtualizer.store.state.rowsMeta;
    const offset = currentRowsMeta.positions[rowIndex];
    // The next row, whatever it is: a header following the group's last item is not the item's.
    const end = currentRowsMeta.positions[rowIndex + 1] ?? currentRowsMeta.currentPageTotalHeight;

    if (offset == null || end == null) {
      return null;
    }

    return {
      offset: offset + rowsInset.start,
      size: end - offset,
    };
  });

  const getIndexAtOffset = useStableCallback((offset: number) => {
    const currentRows = rows;
    const itemCount = collection.length;
    if (currentRows.length === 0 || itemCount === 0) {
      return null;
    }

    const currentRowsMeta = virtualizer.store.state.rowsMeta;
    const rowIndex = findRowIndexAtOffset(
      currentRowsMeta.positions,
      currentRows.length,
      Math.max(0, offset - rowsInset.start),
    );
    const model = currentRows[rowIndex].model;

    if (!isGroupHeaderRow(model)) {
      return model.itemIndex;
    }

    // A header stands for the group it introduces, so it answers with the group's first item. An
    // empty group has none, so the item that follows the header stands in, or the last item when
    // nothing follows: the collection has items, so the answer is one of them.
    return Math.min(model.itemStart, itemCount - 1);
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
    groupHeaderHeightEstimate.invalidate();
    adaptive.reset();
    gesture.clearDeferredRowHeights();

    const api = muiApiRef.current;

    if (api != null) {
      api.rowsMeta.resetRowHeights();

      // Rows are measured wherever they are laid out.
      const rowsParent = getRowsParent();

      if (rowsParent != null) {
        // Only rows in layout: the retained focus proxy and a retained header carry no usable
        // height, and a hidden one stored as zero would be worse than its estimate.
        for (const element of getLaidOutRowElements(rowsParent)) {
          const rowIndex = Number(element.dataset.rowIndex);
          const row = rows[rowIndex];
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

  // Public requests name items; the pending scroll works in rows.
  const scrollToIndex = useStableCallback(
    (index: number, options?: VirtualizerScrollToIndexOptions) => {
      if (!Number.isInteger(index) || index < 0 || index >= collection.length) {
        return;
      }
      const currentGrouped = grouped;
      pendingScroll.scrollToIndex(
        currentGrouped == null ? index : currentGrouped.itemToRowIndex[index],
        options,
      );
    },
  );

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

  const anchor = useScrollAnchor<VirtualizerRowModel<Value>>({
    enabled,
    gesture,
    onScrollApplied: (scrollTop) => handleScrollChange({ top: scrollTop }),
    pendingScroll,
    refreshWindowAfterCorrectiveScroll,
    getRowsParent,
    rows,
    readRowsGeometry,
    rowsMeta,
    scrollElementRef,
    rowsInsetTotal,
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
          rowsMeta.currentPageTotalHeight + rowsInsetTotal + trailingHeight,
          dimensions.viewportInnerSize.height + scrollportPaddingTotal,
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
  // The engine learns the viewport from a ResizeObserver, a frame after the scrollport is laid
  // out. A list that opens straight onto a distant row — a popup at its selected item — computes
  // its first window before that arrives, and a window sized for no viewport at all stops short
  // of the row it was asked to show: the row mounts only as the offscreen focus proxy, which is
  // never measured, so the request that would correct it has nothing to measure. The scrollport
  // already has its box by then, so size the window from it until the engine catches up.
  const windowViewportHeight =
    dimensions.viewportInnerSize.height > 0
      ? dimensions.viewportInnerSize.height + scrollportPaddingTotal
      : (scrollElementRef.current?.clientHeight ?? 0);

  const overscannedRenderContext = getOverscannedRenderContext(
    anticipateBottomPin
      ? // Seed the overscan expansion from the final row; it walks back to cover the new bottom.
        { ...renderContext, firstRowIndex: rows.length - 1, lastRowIndex: rows.length }
      : renderContext,
    rowsMeta.positions,
    rows.length,
    validPinnedRowIndex,
    renderBufferPx,
    // Row positions exclude what the rows are laid out after, but rows are visible anywhere in
    // the scrollport, padding included, so the window is computed for the whole scrollport in
    // the engine's coordinates.
    renderScrollTop - rowsInset.start,
    windowViewportHeight,
  );
  const renderZoneOffsetTop = rowsMeta.positions[overscannedRenderContext.firstRowIndex] ?? 0;
  // When the whole collection is rendered, the first row's exact position (zero) takes priority
  // over the estimated content end, so tail anchoring must stay off.
  const renderZoneVirtualEnd =
    overscannedRenderContext.firstRowIndex > 0 &&
    overscannedRenderContext.lastRowIndex >= rows.length
      ? rowsMeta.currentPageTotalHeight
      : null;
  // Published at commit time, in the phase that precedes every layout effect of this commit —
  // the pending-scroll and anchoring effects declared above read these — and that a render
  // suspending inside a transition never reaches, so a scroll event between such a render and its
  // commit still transforms the committed rows by the committed window.
  useInsertionEffect(() => {
    overscannedRenderContextRef.current = overscannedRenderContext;
    renderScrollTopRef.current = renderScrollTop;
    renderZoneOffsetTopRef.current = renderZoneOffsetTop;
    renderZoneVirtualEndRef.current = renderZoneVirtualEnd;
  });

  const handleEndReached = useStableCallback(() => onEndReached?.());
  /**
   * Whether reaching the end again would be a new arrival. Held down while the window stays at
   * the end so a list that renders its last item does not ask for another page on every commit,
   * and released as soon as the window moves away or the collection grows past it.
   */
  const endReachedArmedRef = React.useRef(true);
  // Only whether a key function exists matters below; its identity is inline for most consumers.
  const hasGetItemKey = getItemKey != null;
  /** The end the flag was last held down against: an item count and the row that ends it. */
  const endReachedEndRef = React.useRef<{ length: number; lastRowId: React.Key | undefined }>({
    length: 0,
    lastRowId: undefined,
  });

  useIsoLayoutEffect(() => {
    // A different collection has a different end, whatever the window did: a shorter result set
    // whose end is in view from the start, or one of the same length made of other items, is a
    // new arrival. The same length with other items is told apart by the last item's key: the
    // last *item*, since a grouped list can end in an empty group's header that stays while every
    // item behind it changes, and only a key the consumer chose, since an object item without
    // `getItemKey` is keyed by identity and a consumer rebuilding items per render would renew
    // that end on every commit.
    const lastItemRow = itemRows[itemRows.length - 1];
    const lastRowId =
      lastItemRow == null || (!hasGetItemKey && isObjectValue(lastItemRow.model.item))
        ? undefined
        : lastItemRow.id;
    const previousEnd = endReachedEndRef.current;
    const endChanged =
      previousEnd.length !== collection.length || previousEnd.lastRowId !== lastRowId;
    if (endChanged) {
      endReachedEndRef.current = { length: collection.length, lastRowId };
    }

    // Every row mounted at once for the host's own purposes (rendered labels for browser autofill)
    // is not the user arriving anywhere. The flag is held down for the pass and for the commits
    // after it that still describe the whole collection, since the engine takes two commits to
    // window again; the first windowed context short of the end releases it, as any window
    // moving away from the end does.
    if (windowingSuspended) {
      endReachedArmedRef.current = false;
      return;
    }

    if (endChanged) {
      endReachedArmedRef.current = true;
    }

    // Items, not rows: a grouped collection with headers and no items has no end to reach.
    if (onEndReached == null || collection.length === 0) {
      return;
    }

    // The rendered range is half-open, so the final item is included once the end index reaches
    // the collection length. The threshold counts items short of that.
    // Headers are rows but not items: in a grouped list the count of items before the window's
    // end is what the threshold is measured against.
    const renderedItemCount =
      grouped == null
        ? overscannedRenderContext.lastRowIndex
        : grouped.itemCountBeforeRow[Math.min(overscannedRenderContext.lastRowIndex, rows.length)];
    const reachedEnd = renderedItemCount >= collection.length - Math.max(0, endReachedThreshold);

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
    collection.length,
    endReachedThreshold,
    grouped,
    handleEndReached,
    hasGetItemKey,
    itemRows,
    onEndReached,
    overscannedRenderContext.lastRowIndex,
    rows.length,
    windowingSuspended,
  ]);

  // The refresh samples the settled window and demotes every cached height it did not sample;
  // both must see items only, so a grouped list hands it the window in item space and a view of
  // the cache without the headers.
  const itemRenderContext: RowWindow =
    grouped == null
      ? overscannedRenderContext
      : {
          firstRowIndex: grouped.itemCountBeforeRow[overscannedRenderContext.firstRowIndex] ?? 0,
          lastRowIndex:
            grouped.itemCountBeforeRow[
              Math.min(overscannedRenderContext.lastRowIndex, rows.length)
            ] ?? collection.length,
        };

  // Declared after `useScrollAnchor`: refreshing the estimate re-positions rows above the
  // viewport, and anchoring compensates for that on the resulting commit.
  useAdaptiveEstimateRefresh<VirtualizerItemRowModel<Value>>({
    adaptive,
    defaultEstimatedItemHeight,
    demoteRowHeight,
    gesture,
    readMeasuredHeight,
    readMeasuredHeights: grouped == null ? readMeasuredHeights : readMeasuredItemHeights,
    renderContext: itemRenderContext,
    rows: itemRows,
    rowsMeta,
    settleGeometry,
  });

  // Declared last: anchoring reads an outstanding request while it still stands, and a request
  // waiting on a settled estimate sees the refresh above in the same commit.
  usePendingScrollRetry<VirtualizerRowModel<Value>>({
    pendingScroll,
    renderContext: overscannedRenderContext,
    rows,
    rowsInset,
    rowsMeta,
  });

  const rowsWindow: RowWindow = enabled
    ? overscannedRenderContext
    : { firstRowIndex: 0, lastRowIndex: rows.length };
  const windowEntries = getWindowEntries(rowsWindow, validPinnedRowIndex, rows.length);
  // A table section holds rows and nothing else, so a grouped collection renders its headers as
  // rows among the items, with no wrapper to associate the two and no header retained for one.
  const renderedRows =
    grouped == null || isTable
      ? renderFlatWindow(windowEntries, rows, renderRow)
      : renderGroupedWindow(windowEntries, rows, grouped, getGroupHeaderId, renderRow);

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
  // The scrollable content spans the rows plus what they are laid out inside of, which is the
  // height a scrollport needs to show the collection without scrolling. An empty collection has
  // nothing to surround, so it stays at zero.
  const scrollableSize =
    totalSize > 0 ? totalSize + rowsInsetTotal + trailingHeight : totalSize + trailingHeight;

  const state: VirtualizerState = {
    // Items, not rows: a collection of empty groups renders their headers and is still empty.
    empty: collection.length === 0,
    totalSize: scrollableSize,
  };

  let defaultProps: HTMLProps;
  // The space of the rows outside the window, in the table layout.
  let spacerHeight = 0;

  if (isTable) {
    // A table section can hold rows and nothing else, so the section itself is the sticky box the
    // rows are held in and the render zone a transform moves, both at once: held at the
    // scrollport's start edge while the scrollport moves through the table, and translated to
    // where the window's rows belong. The space of the rows outside the window is held by a
    // row group rendered after it, in normal flow. As in a list, native scrolling moves the
    // scrollport under the rows it has, which stay where they are until the next window is
    // committed, rather than uncovering the space reserved for the rest.
    const renderedRangeEndInTable =
      rowsMeta.positions[overscannedRenderContext.lastRowIndex] ?? rowsMeta.currentPageTotalHeight;
    const renderedHeight = renderedRangeEndInTable - renderZoneOffsetTop;
    spacerHeight = Math.max(0, rowsMeta.currentPageTotalHeight - renderedHeight);
    // Where the row group stands, from the geometry this render knows; the anchoring effect
    // takes it again from the DOM before paint.
    const zoneTop = getStuckTop(
      rowsInset.start - renderScrollTop,
      containingBlockEndRef.current - renderScrollTop,
      renderedHeight,
    );
    defaultProps = {
      style: {
        [VirtualizerCssVars.totalSize]: `${scrollableSize}px`,
        overflowAnchor: 'none',
        ...(enabled
          ? {
              position: 'sticky',
              // Sticky boxes are pinned against the content edge; pulled up by the padding, the
              // group is held at the scrollport's own edge, and rows scroll through the padding.
              top: -scrollportPadding.start,
              transform: `translate3d(0, ${rowsInset.start + renderZoneOffsetTop - renderScrollTop - zoneTop}px, 0)`,
            }
          : null),
      } as React.CSSProperties,
      children: (
        <React.Fragment>
          {renderedRows}
          {!enabled && trailing}
        </React.Fragment>
      ),
    };
  } else {
    defaultProps = {
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
                // `clip` rather than `hidden`: a hidden overflow is still a scroll container, and
                // focusing a row without `preventScroll`, or scrolling one into view, scrolls it
                // instead of the scrollport — shifting every row up inside a box that is meant to
                // stay put. A clipped box cannot be scrolled by anything.
                overflow: 'clip',
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
          {/* In normal flow after the rows, which are in normal flow here too; still measured, so
            the published total covers it in both modes. */}
          {trailing != null && (
            <div ref={trailingRef} role="presentation" style={trailingFlowStyle}>
              {trailing}
            </div>
          )}
        </React.Fragment>
      ),
    };
  }

  const element = useRenderElement(isTable ? 'tbody' : 'div', componentProps, {
    state,
    stateAttributesMapping,
    // The root is the scroll element in the list layout, and receives its bindings directly. In
    // the table layout they go to the scroll container the root's ref finds.
    ref: [
      forwardedRef,
      rootRefCallback,
      isTable ? null : containerRef,
      isTable ? null : gesture.scrollElementRefCallback,
      isTable ? null : scrollportBoxRef,
    ],
    // The owning list's scrollport props sit between the engine's own and the application's, so a
    // list can put its scroll handler and scrollbar styling on the element that actually scrolls
    // while props passed to `<Virtualizer>` still win.
    props: [defaultProps, scrollportProps, elementProps],
  });

  if (!isTable || !enabled) {
    return element;
  }

  // The row group holding the space of the rows outside the window, after the one holding the
  // rows: a sibling of the root rather than part of it, since a row group holds rows alone.
  // Trailing content is rows of the consumer's own after the reserved space, measured as part of
  // the section's surroundings rather than on their own.
  return (
    <React.Fragment>
      {element}
      <tbody ref={spacerSectionRef} style={spacerSectionStyle}>
        <tr ref={endSpacerRef} aria-hidden style={{ height: spacerHeight }} />
        {trailing}
      </tbody>
    </React.Fragment>
  );
}) as {
  <Value>(props: Virtualizer.Props<Value> & React.RefAttributes<HTMLElement>): React.JSX.Element;
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
   * Total scrollable content size in pixels, including the scrollport's block padding, or, in
   * the table layout, everything the scroll container holds around the table section.
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
   * How the rows are laid out.
   *
   * - `list`: the virtualizer is the scroll container, a `<div>`, and lays its rows out itself.
   * - `table`: the virtualizer is a table section, a `<tbody>`, whose rows are the `<tr>`
   *   elements the item renderer returns, inside a scroll container of your own around the
   *   table: the nearest ancestor with `overflow: auto` or `scroll`. The section is held in
   *   place by the scrollport and moved by a transform, as a list's rows are, and a second
   *   section rendered after it reserves the space of the rows outside the window. Spread the
   *   renderer's third argument onto each `<tr>`; it carries the row's measurement along with
   *   its metadata. Group headers are rendered as rows among the items, and trailing content as
   *   rows after the reserved space.
   *
   * @default 'list'
   */
  layout?: VirtualizerLayout | undefined;
  /**
   * Estimated item height in CSS pixels used before item elements have been measured.
   * A static number is automatically refined with the running average of measured items.
   * Provide a function to keep full control over per-item estimates.
   * @default 32
   */
  estimatedItemHeight?: number | ((item: Value, index: number) => number) | undefined;
  /**
   * Returns a stable key for a group. Defaults to the group's index in the collection, which is
   * enough while groups keep their order; a filtered collection that can drop a group should
   * provide one so the groups behind it keep their identity.
   */
  getGroupKey?: VirtualizerGetGroupKey<Value> | undefined;
  /**
   * Estimated group header height in CSS pixels used before header elements have been measured.
   * Provide a function to keep full control over per-group estimates.
   * @default the static `estimatedItemHeight`, or `32` when that is a function
   */
  estimatedGroupHeaderHeight?: number | VirtualizerEstimateGroupHeaderHeight<Value> | undefined;
  /**
   * The collection to virtualize: a flat array of items, or an array of groups, each an object
   * with an `items` array. A grouped collection also needs `renderGroupHeader`.
   *
   * When omitted, the collection and its highlight state come from the surrounding list, which
   * requires a list that supports virtualization, such as `<Combobox.List>`.
   */
  items?: readonly Value[] | ReadonlyArray<VirtualizerGroup<Value>> | undefined;
  /**
   * Renders the header of a group in a grouped collection: exactly one element carrying the
   * group's name. The third argument holds the `id` the group is labeled by, to spread onto
   * that element; `<Combobox.GroupLabel>` applies it automatically. The virtualizer wraps each
   * group's rendered rows in a `role="group"` element itself, so no group part is needed.
   */
  renderGroupHeader?: VirtualizerRenderGroupHeader<Value> | undefined;
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
   * Each item's `aria-posinset` is its position in `items`, counted from the first one, so the
   * items rendered must be the collection from its start: pages loaded so far, appended to the
   * ones before them, rather than a later page on its own.
   *
   * Pass `-1` when the size is not known yet, which is the ARIA convention for it.
   * @default the number of items in the list
   */
  totalItems?: number | undefined;
}

/**
 * How the rows are laid out: by the virtualizer itself, as a scrolling list, or by a table, as
 * the rows of one of its sections.
 */
export type VirtualizerLayout = 'list' | 'table';

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
   * A group in a grouped collection: an object with an `items` array, plus anything else the
   * group's header needs.
   */
  export type Group<Value = unknown> = VirtualizerGroup<Value>;
  /**
   * Attributes to spread onto the element carrying a group's name.
   */
  export type GroupHeaderProps = VirtualizerGroupHeaderProps;
  /**
   * A `React.ReactElement`, as returned by a group header renderer.
   */
  export type GroupHeaderElement = VirtualizerGroupHeaderElement;
  /**
   * Attributes to spread onto the element representing an item, the third argument of the item
   * renderer.
   */
  export type ItemProps = VirtualizerItemProps;
  /**
   * How the rows are laid out.
   */
  export type Layout = VirtualizerLayout;
  /**
   * Attributes that bind a row element to the virtualizer in the table layout, carried by the
   * item and group header props.
   */
  export type RowProps = VirtualizerRowProps;
  /**
   * State metadata exposed to render props.
   */
  export type State = VirtualizerState;
  /**
   * Props accepted by the component.
   */
  export type Props<Value = unknown> = VirtualizerProps<Value>;
}
