'use client';
import * as React from 'react';
import { ownerWindow } from '@base-ui/utils/owner';
import { useInsertionEffect } from '@base-ui/utils/useInsertionEffect';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
import { useRefWithInit } from '@base-ui/utils/useRefWithInit';
import { useStableCallback } from '@base-ui/utils/useStableCallback';
import { warn } from '@base-ui/utils/warn';
import {
  Dimensions,
  LayoutList,
  LayoutListSticky,
  Virtualization,
  useVirtualizer,
  type HeightEntry,
  type Row as MuiVirtualizerRow,
  type RowEntry,
  type RenderContext,
  type Virtualizer as MuiVirtualizer,
} from '@mui/x-virtualizer';
import type { StateAttributesMapping } from '../internals/getStateAttributesProps';
import type { BaseUIComponentProps, HTMLProps } from '../internals/types';
import { useRenderElement } from '../internals/useRenderElement';
import { useListBinding, useVirtualizerSources } from '../internals/virtualization/useListBinding';
import {
  isGroupHeaderRowId,
  isObjectValue,
  useGroupedRowModels,
  useRowModels,
  type GroupedRows,
} from '../internals/virtualization/useRowModels';
import {
  isGroupHeaderRow,
  type VirtualizerItemRowModel,
  type VirtualizerRenderRowParameters,
  type VirtualizerRow,
  type VirtualizerRowModel,
} from '../internals/virtualization/types';
import type {
  VirtualizerHandle,
  VirtualizerHost,
  VirtualizerHostState,
  VirtualizerRegistration,
  VirtualizerRegistry,
} from './host';
import type {
  VirtualizerActions,
  VirtualizerActiveIndex,
  VirtualizerActiveItem,
  VirtualizerEstimateGroupHeaderHeight,
  VirtualizerGetGroupKey,
  VirtualizerGroup,
  VirtualizerGroupHeaderElement,
  VirtualizerGroupHeaderMetadata,
  VirtualizerGroupHeaderProps,
  VirtualizerItemAria,
  VirtualizerItemMetadata,
  VirtualizerItemProps,
  VirtualizerRenderGroupHeader,
  VirtualizerRowProps,
  VirtualizerScrollToIndexOptions,
} from './types';
import type { RowsGeometry, RowWindow } from './geometry';
import { getLaidOutRowElements } from './getLaidOutRowElements';
import { useGroupHeaderHeightEstimate } from './useGroupHeaderHeightEstimate';
import {
  EMPTY_SCROLLPORT_PADDING,
  createScrollOffsetReader,
  findScrollContainer,
  getScrollportPadding,
  type RowsInset,
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
  /**
   * Whether the row's height is measured from the DOM. A row whose height the consumer declared
   * is positioned from that number instead, and carries no observer.
   */
  measured: boolean;
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
  const { apiRef, bare, isVirtualFocusRow, measured, renderRow, retained, row, rowIndex } = props;

  const measureCleanupRef = React.useRef<(() => void) | undefined>(undefined);
  /**
   * The element the row's binding reached, whether or not it is measured. A row with a declared
   * height is bound just as a measured one is — the binding is what a bare layout's renderer has
   * to spread — and only the observer is left off.
   */
  const rowElementRef = React.useRef<HTMLElement | null>(null);
  const measureRef = useStableCallback((element: HTMLElement | null) => {
    measureCleanupRef.current?.();
    measureCleanupRef.current = undefined;
    rowElementRef.current = element;

    if (element != null && measured) {
      measureCleanupRef.current = apiRef.current?.rowsMeta.observeRowHeight(element, row.id);
    }
  });
  // The ref keeps its identity, so React does not call it again when a mounted row starts or
  // stops being measured — a consumer adding or removing `itemHeight`. Bind it again here, which
  // attaches or detaches the observer for the element the row already has.
  const measuredRef = React.useRef(measured);
  useIsoLayoutEffect(() => {
    if (measuredRef.current === measured) {
      return;
    }

    measuredRef.current = measured;

    if (rowElementRef.current != null) {
      measureRef(rowElementRef.current);
    }
  }, [measureRef, measured]);

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
      if (bare && inLayout && rowElementRef.current == null) {
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

/**
 * Keeps the browser's own scroll anchoring off the rows and the space reserved around them: it
 * would see that space change size, as the window moves and as the estimate is refined, and
 * compensate on top of the compensation the scroll-anchoring effect makes from the same
 * measurements. The effect's is kept, since it also serves engines without a native one.
 */
const noScrollAnchoringStyle: React.CSSProperties = {
  overflowAnchor: 'none',
};

/**
 * Stands in for the rendered window before the first render has computed one, so the concerns
 * that read it from a ref never have to describe a state that cannot reach them.
 */
const EMPTY_ROW_WINDOW: RowWindow = { firstRowIndex: 0, lastRowIndex: 0 };

/**
 * Where the window stands in the scroll container as of the latest commit, in scroll
 * coordinates: what tells a window held at the scrollport's edge from one standing where its
 * rows belong, without measuring either.
 */
interface WindowPlacement {
  /** Whether the rows are windowed at all; every row is in place otherwise. */
  windowed: boolean;
  /** Where the window's box begins when nothing holds it: the rows' inset plus its offset. */
  top: number;
  /** The height its insets were computed for. */
  height: number;
  insetTop: number;
  insetBottom: number;
  /** The block the window may not leave: its containing block. */
  blockStart: number;
  blockEnd: number;
  /** Where the scrollport's content edge begins past `scrollTop`, and how tall the content box is. */
  scrollportPaddingStart: number;
  viewportHeight: number;
}

const EMPTY_WINDOW_PLACEMENT: WindowPlacement = {
  windowed: false,
  top: 0,
  height: 0,
  insetTop: 0,
  insetBottom: 0,
  blockStart: 0,
  blockEnd: 0,
  scrollportPaddingStart: 0,
  viewportHeight: 0,
};

/**
 * Whether a sticky window is displaced from its normal position at the given scroll position.
 * A sticky box moves only while an inset asks it to and its containing block leaves room, which
 * is the rule the browser applies, here on the numbers the window was laid out with. Sticky
 * boxes are stuck against the scrollport's content edge, inside its padding.
 */
function isWindowDisplaced(placement: WindowPlacement, scrollTop: number) {
  const { top, height, insetTop, insetBottom, blockStart, blockEnd } = placement;
  const contentTop = scrollTop + placement.scrollportPaddingStart;
  const contentBottom = contentTop + placement.viewportHeight;
  const bottom = top + height;
  const pushedDown = top < contentTop + insetTop - 1 && bottom < blockEnd - 1;
  const pushedUp = bottom > contentBottom - insetBottom + 1 && top > blockStart + 1;
  return pushedDown || pushedUp;
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

/**
 * The window the engine computed, as the rows it holds. The engine renders a half-open range but
 * only retains a focused row when it is strictly beyond the end index, so the pinned row is taken
 * into the window when it lands exactly on that boundary.
 */
function getWindowRows(
  renderContext: RenderContext,
  rowCount: number,
  pinnedRowIndex: number | undefined,
): RowWindow {
  const lastRowIndex =
    renderContext.lastRowIndex === pinnedRowIndex
      ? Math.min(rowCount, renderContext.lastRowIndex + 1)
      : renderContext.lastRowIndex;

  return { firstRowIndex: renderContext.firstRowIndex, lastRowIndex };
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
    itemAria,
    itemHeight: itemHeightProp,
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

  const { host, hostState } = useVirtualizerSources(items != null);

  const {
    apiRef: apiRefProp,
    enabled: windowingRequested,
    getGroupHeaderId,
    groups,
    items: collection,
    pinnedItemIndex,
    renderRow: renderRowProp,
    scrollToRowAlignment,
    scrollToItemIndex,
    scrollToRowPaddingEnd,
    scrollToRowPaddingStart,
    windowingSuspended,
  } = useListBinding<Value>({
    actionsRef,
    activeIndex,
    totalItems,
    children,
    enabled: enabledProp,
    host,
    itemAria,
    items,
    hostState,
    renderGroupHeader,
  });

  // A declared height positions the rows arithmetically: no row is observed, and nothing about
  // the geometry is an estimate. A height that cannot be laid out is no height at all.
  const fixedItemHeight =
    itemHeightProp != null && Number.isFinite(itemHeightProp) && itemHeightProp > 0
      ? itemHeightProp
      : undefined;

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
    // A declared height is also what an unmeasured row is worth: nothing is estimated then, but
    // the geometry around the rows — the render buffer, the layout sizer, a group header's
    // default estimate — still asks what a row is.
    estimatedItemHeight: fixedItemHeight ?? estimatedItemHeightProp,
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
  /** The engine's window content, which the laid-out rows are children of while a list windows. */
  const windowContentRef = React.useRef<HTMLDivElement | null>(null);
  /**
   * The row group holding the space of the rows above the window, in the table layout: a
   * sibling of the root in normal flow, from which the rows' place in the table is read.
   */
  const startSpacerSectionRef = React.useRef<HTMLTableSectionElement | null>(null);
  /** The row inside it that holds that space, sized from the section's own height. */
  const startSpacerRowRef = React.useRef<HTMLTableRowElement | null>(null);
  /**
   * The row holding the space of the rows below the window, in the table layout: where the rows'
   * reserved space ends, which is what the section's surroundings are measured from.
   */
  const endSpacerRef = React.useRef<HTMLTableRowElement | null>(null);
  /**
   * The element the laid-out rows are children of — grandchildren, one group wrapper deep — in
   * whichever layout the rows are currently in: the window content while a list windows, and the
   * root otherwise, which is the scroll element for a list mounting every row and the table
   * section in the table layout.
   */
  const getRowsParent = useStableCallback(
    (): HTMLElement | null => windowContentRef.current ?? rootElementRef.current,
  );
  const windowPlacementRef = React.useRef<WindowPlacement>(EMPTY_WINDOW_PLACEMENT);
  /**
   * Whether the window stands where its rows belong, rather than held at the scrollport's edge
   * after a scroll outran it, until the engine places the next window from inside the scroll
   * event. Worked out from the numbers the window was laid out with rather than measured: no
   * layout is forced by asking, and a test environment without layout reports every rectangle
   * empty.
   */
  const isWindowInPlace = useStableCallback(() => {
    const scrollElement = scrollElementRef.current;
    const placement = windowPlacementRef.current;

    if (scrollElement == null || !placement.windowed) {
      return true;
    }

    return !isWindowDisplaced(placement, scrollElement.scrollTop);
  });
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

  const rowsInsetTotal = rowsInset.start + rowsInset.end;

  const gesture = useScrollGesture({ settleGeometry });
  // The running average describes items: it is fed the item rows alone, so headers neither seed
  // it nor count among the rows it is judged against.
  const adaptive = useAdaptiveEstimate({
    rows: itemRows,
    // There is no estimate to refine when the items' height is declared: the average exists to
    // converge on what measuring would have found, and measuring is what this replaces.
    staticEstimatedItemHeight:
      fixedItemHeight != null ? null : itemHeightEstimate.staticEstimatedItemHeight,
  });

  const renderContextRef = React.useRef<RowWindow>(EMPTY_ROW_WINDOW);
  // The scroll-to-row and anchoring concerns both write corrective scroll positions, and both are
  // declared below the callbacks that read them. Their handle is published here so those
  // callbacks — which only ever run after the render that publishes it — can reach it.
  const pendingScrollRef = React.useRef<PendingScroll | null>(null);

  // The browser moves a native scrollport before dispatching its scroll event, and the window's
  // sticky insets keep the rows it has in view until the engine commits the next window from
  // inside that event. What is left for this component is the gesture bookkeeping.
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
  });

  /**
   * Hands a position this component wrote to the engine, which would otherwise learn it only
   * from the scroll event the browser dispatches a task later, and read a correction as the user
   * scrolling in whichever direction it went. The engine keeps the scroll direction and renders
   * the window for the position through its store, so this is safe to call from a layout effect,
   * and the window it renders is the one the next paint shows.
   */
  const syncEngineWithScrollWrite = useStableCallback(() => {
    muiApiRef.current?.syncScrollPosition();
  });

  const layout = useRefWithInit(
    () =>
      new LayoutListSticky({
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
          // A declared height covers the items. A group header is content of the consumer's own
          // whose height nothing declared, so it is measured as it always is.
          measured={fixedItemHeight == null || isGroupHeaderRow(row.model)}
          renderRow={renderRowProp}
          retained={params.retained}
          row={row}
          rowIndex={params.rowIndex}
        />
      );
    },
    [fixedItemHeight, isTable, renderRowProp, rows],
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

  /**
   * What the engine's row-height callback needs to answer for a row. Read through a ref because
   * the engine rehydrates its whole geometry when that callback's identity changes, and a
   * collection that changed rehydrates it on its own anyway.
   */
  const rowHeightLookupRef = React.useRef<{
    grouped: GroupedRows<Value> | null;
    rowIndexById: Map<React.Key, number>;
    rows: VirtualizerRow<VirtualizerRowModel<Value>>[];
  }>(null!);
  const getRowHeight = React.useCallback(
    (row: RowEntry) => {
      if (fixedItemHeight == null) {
        return 'auto' as const;
      }

      const lookup = rowHeightLookupRef.current;

      // A flat collection is items alone, so nothing needs looking up. A grouped one still
      // measures its headers, which are the only rows the engine is left to ask about.
      if (lookup.grouped == null) {
        return fixedItemHeight;
      }

      const model = lookup.rows[lookup.rowIndexById.get(row.id as React.Key) ?? -1]?.model;
      return model != null && isGroupHeaderRow(model) ? ('auto' as const) : fixedItemHeight;
    },
    [fixedItemHeight],
  );
  const rowIndexById = React.useMemo(() => {
    const map = new Map<React.Key, number>();
    rows.forEach((row, rowIndex) => {
      map.set(row.id, rowIndex);
    });
    return map;
  }, [rows]);
  rowHeightLookupRef.current = { grouped, rowIndexById, rows };
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

      // A row whose height was declared is already final: it is never measured, so there is no
      // measurement to defer through a scrollbar drag and none to sample for the average.
      if (!entry.autoHeight && !entry.needsFirstMeasurement) {
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
      // The engine's "inverse sticky" list layout: it places the window in normal flow where its
      // rows belong and sticks it with insets that let native scrolling move the rows within the
      // window's buffers, commits the next window from inside the scroll event once half a
      // buffer is crossed, and holds a commit off while a fling is at speed. The buffer is at
      // least fifteen estimated rows in total, whatever `overscanPx` asks for.
      layoutMode: 'sticky',
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
  const containerProps = virtualizer.store.use(LayoutListSticky.selectors.containerProps);
  // The engine's sticky list layout, for a list that windows: the block the window is stuck
  // within, and the anchored box the rows render in.
  const stickyContentProps = virtualizer.store.use(LayoutListSticky.selectors.contentProps);
  const windowContentProps = virtualizer.store.use(LayoutListSticky.selectors.windowContentProps);
  // The engine's plain list content and positioner, for a list mounting every row.
  const contentProps = virtualizer.store.use(LayoutList.selectors.contentProps);
  const positionerProps = virtualizer.store.use(LayoutList.selectors.positionerProps);
  const renderContext = virtualizer.store.use(Virtualization.selectors.renderContext);

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
      if (itemHeightProp != null && fixedItemHeight == null) {
        warn(
          `<Virtualizer> received an \`itemHeight\` of ${itemHeightProp}, which no item can be ` +
            'laid out as, so the items are measured instead. Pass the height the items actually ' +
            'have, in CSS pixels.',
        );
      } else if (fixedItemHeight != null && estimatedItemHeightProp != null) {
        warn(
          '<Virtualizer> received both `itemHeight` and `estimatedItemHeight`. Items of a ' +
            'declared height are never measured, so there is nothing to estimate; remove ' +
            '`estimatedItemHeight`.',
        );
      }
    }, [estimatedItemHeightProp, fixedItemHeight, itemHeightProp]);

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
    const startSpacerSection = startSpacerSectionRef.current;
    const rootRect = root.getBoundingClientRect();
    // While windowing, the root is stuck to the scrollport, so its rect says nothing about where
    // the table lays it out. The row group reserving the space of the rows above it is in normal
    // flow just before it, and begins where the rows' space does.
    const start =
      startSpacerSection == null
        ? at(rootRect.top)
        : at(startSpacerSection.getBoundingClientRect().top);
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

  // The window is the engine's: the rows it computed for the scroll position it last observed.
  // Native scrolling moves them within the window's buffers, the window's sticky insets hold
  // them in view beyond, and the engine commits the next window from inside the scroll event,
  // before the browser paints the position that event reports.
  const windowRows = getWindowRows(renderContext, rows.length, validPinnedRowIndex);
  const offsetTop = rowsMeta.positions[renderContext.firstRowIndex] ?? 0;
  // `lastRowIndex` is exclusive: when it points past the last row, the window extends to the
  // end of the content.
  const windowEnd =
    rowsMeta.positions[renderContext.lastRowIndex] ?? rowsMeta.currentPageTotalHeight;
  const rowsTotalHeight = rowsMeta.currentPageTotalHeight;
  // The window's height as far as it is known: the geometry's, but for the rows whose
  // measurements a scrollbar drag is holding back, which are as tall as they measured. The two
  // only differ during a drag, which is when the difference matters most: the geometry keeps
  // the estimates for as long as the drag lasts, while the window is as tall as its real rows,
  // and its insets and its place at the tail have to be worked out from that.
  let windowHeight = Math.max(0, windowEnd - offsetTop);
  if (rowsMeta.positions.length === rows.length) {
    const lastRowIndex = Math.min(renderContext.lastRowIndex, rows.length);
    let knownHeight = 0;
    for (let rowIndex = renderContext.firstRowIndex; rowIndex < lastRowIndex; rowIndex += 1) {
      const rowEnd = rowsMeta.positions[rowIndex + 1] ?? rowsTotalHeight;
      knownHeight +=
        gesture.getDeferredRowHeight(rows[rowIndex].id) ?? rowEnd - rowsMeta.positions[rowIndex];
    }
    windowHeight = knownHeight;
  }
  // When the window holds the final row, its rows end where the content does rather than where
  // the estimates put its end: a scrollbar drag defers measurements, and the tail has to stay
  // flush with the scrollport's end edge meanwhile. Off when the whole collection is rendered,
  // whose first row's exact position, zero, is what to keep.
  const tailAnchored = renderContext.firstRowIndex > 0 && renderContext.lastRowIndex >= rows.length;
  // The space of the rows above the window, which places the window where its rows belong.
  const spacerHeight = tailAnchored ? Math.max(0, rowsTotalHeight - windowHeight) : offsetTop;
  // The space of the rows below the window, in the table layout, whose block is not sized on
  // its own: what is left of the rows' space once the window's own height is taken out, so the
  // table keeps the height the geometry gives the rows whatever the window's rows measure.
  const endSpacerHeight = Math.max(0, rowsTotalHeight - spacerHeight - windowHeight);
  const viewportHeight = dimensions.viewportInnerSize.height;
  // What the block the window is stuck within holds around the rows' space. A list's holds the
  // rows' space alone. A table is the block its section is stuck within, and it holds more: what
  // the scroll container holds around that space besides its own padding — the table's header,
  // the rows after the reserved space — is what the section must not be pushed over at either
  // end of the collection, so each inset is pulled out by what lies at the other end.
  const surroundings: RowsInset = isTable
    ? {
        start: Math.max(0, rowsInset.start - scrollportPadding.start),
        end: Math.max(0, rowsInset.end - scrollportPadding.end),
      }
    : EMPTY_SCROLLPORT_PADDING;
  // Negative by however much taller than the scrollport the window is, so that native scrolling
  // moves the rows within the window and the scrollport never leaves it. Clamped at zero: a
  // window shorter than the scrollport, as a short collection's is, must not stick at all.
  const stickyInset = Math.min(0, viewportHeight - windowHeight);
  const insetTop = stickyInset - surroundings.end;
  const insetBottom = stickyInset - surroundings.start;
  const windowPlacement: WindowPlacement = {
    windowed: enabled,
    top: rowsInset.start + spacerHeight,
    height: windowHeight,
    insetTop,
    insetBottom,
    blockStart: rowsInset.start - surroundings.start,
    blockEnd: rowsInset.start + rowsTotalHeight + surroundings.end,
    scrollportPaddingStart: scrollportPadding.start,
    viewportHeight,
  };
  // Published at commit time, in the phase that precedes every layout effect of this commit —
  // the pending-scroll and anchoring effects declared below read these — and that a render
  // suspending inside a transition never reaches.
  useInsertionEffect(() => {
    renderContextRef.current = windowRows;
    windowPlacementRef.current = windowPlacement;
  });

  // A table section is as tall as its rows, whatever the geometry says they are: a row group
  // given a height shares the difference out among its rows. Its insets and its place are taken
  // from that height, read from the DOM once the rows are committed: a section stuck for the
  // estimated height is displaced by however much the rows differ from it, which is a whole
  // buffer of unmeasured rows while the list scrolls. Every commit, since the height moves with
  // the rows mounted, and before paint, so the first paint of a window is already placed and
  // stuck right. A list needs none of this: its window is given the height explicitly, and the
  // rows overflow it. This is the one layout read the table layout makes on every commit.
  //
  // Declared before the scroll-to-row and anchoring concerns, whose effects read where the
  // window stands: it has to be placed and stuck for this commit's rows by then.
  useIsoLayoutEffect(() => {
    const section = rootElementRef.current;
    const startSpacerRow = startSpacerRowRef.current;
    const endSpacerRow = endSpacerRef.current;

    if (!isTable || section == null || !enabled) {
      return;
    }

    const sectionHeight = section.offsetHeight;
    const sectionInset = Math.min(0, viewportHeight - sectionHeight);
    const sectionInsetTop = sectionInset - surroundings.end;
    const sectionInsetBottom = sectionInset - surroundings.start;
    const sectionSpacerHeight = tailAnchored
      ? Math.max(0, rowsTotalHeight - sectionHeight)
      : offsetTop;
    section.style.top = `${sectionInsetTop}px`;
    section.style.bottom = `${sectionInsetBottom}px`;
    if (startSpacerRow != null) {
      startSpacerRow.style.height = `${sectionSpacerHeight}px`;
    }
    if (endSpacerRow != null) {
      endSpacerRow.style.height = `${Math.max(0, rowsTotalHeight - sectionSpacerHeight - sectionHeight)}px`;
    }
    windowPlacementRef.current = {
      ...windowPlacementRef.current,
      top: rowsInset.start + sectionSpacerHeight,
      height: sectionHeight,
      insetTop: sectionInsetTop,
      insetBottom: sectionInsetBottom,
    };
  });

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
    onScrollApplied: syncEngineWithScrollWrite,
    renderContextRef,
    getRowsParent,
    isWindowInPlace,
    rows,
    scrollElementRef,
    rowsInset,
    scrollToRowAlignment,
    readRowsGeometry,
    scrollToRowIndex,
    scrollToRowPaddingEnd,
    scrollToRowPaddingStart,
    trailingHeight,
  });
  pendingScrollRef.current = pendingScroll;

  const resetScroll = useStableCallback(() => {
    pendingScroll.noteProgrammaticScroll(0);
    scrollElementRef.current?.scrollTo({
      behavior: 'instant' as ScrollBehavior,
      top: 0,
    });
    syncEngineWithScrollWrite();
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
          // A row whose height was declared has nothing to take again: the declaration outlives
          // the invalidation, and the hydration below restores it over anything stored here.
          const declared = row != null && fixedItemHeight != null && !isGroupHeaderRow(row.model);

          if (row != null && height > 0 && !declared) {
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

  React.useImperativeHandle(
    apiRefProp,
    () => ({ getIndexAtOffset, getItemMetrics, remeasure, resetScroll, scrollToIndex }),
    [getIndexAtOffset, getItemMetrics, remeasure, resetScroll, scrollToIndex],
  );

  const scrollAnchor = useScrollAnchor<VirtualizerRowModel<Value>>({
    enabled,
    gesture,
    onScrollApplied: syncEngineWithScrollWrite,
    settleGeometry,
    pendingScroll,
    getRowsParent,
    isWindowInPlace,
    rows,
    readRowsGeometry,
    rowsMeta,
    scrollElementRef,
    rowsInsetTotal,
    trailingHeight,
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
        ? windowRows.lastRowIndex
        : grouped.itemCountBeforeRow[Math.min(windowRows.lastRowIndex, rows.length)];
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
    windowRows.lastRowIndex,
    rows.length,
    windowingSuspended,
  ]);

  // The refresh samples the settled window and demotes every cached height it did not sample;
  // both must see items only, so a grouped list hands it the window in item space and a view of
  // the cache without the headers.
  const itemRenderContext: RowWindow =
    grouped == null
      ? windowRows
      : {
          firstRowIndex: grouped.itemCountBeforeRow[windowRows.firstRowIndex] ?? 0,
          lastRowIndex:
            grouped.itemCountBeforeRow[Math.min(windowRows.lastRowIndex, rows.length)] ??
            collection.length,
        };

  // Declared after `useScrollAnchor`: refreshing the estimate re-positions rows above the
  // viewport, and the refresh commits through anchoring so the content stays where it is.
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
    settleGeometry: scrollAnchor.settleGeometry,
  });

  // Declared last: anchoring reads an outstanding request while it still stands, and a request
  // waiting on a settled estimate sees the refresh above in the same commit.
  usePendingScrollRetry<VirtualizerRowModel<Value>>({
    pendingScroll,
    renderContext: windowRows,
    rows,
    rowsInset,
    rowsMeta,
  });

  const rowsWindow: RowWindow = enabled
    ? windowRows
    : { firstRowIndex: 0, lastRowIndex: rows.length };
  const windowEntries = getWindowEntries(rowsWindow, validPinnedRowIndex, rows.length);
  // A table section holds rows and nothing else, so a grouped collection renders its headers as
  // rows among the items, with no wrapper to associate the two and no header retained for one.
  const renderedRows =
    grouped == null || isTable
      ? renderFlatWindow(windowEntries, rows, renderRow)
      : renderGroupedWindow(windowEntries, rows, grouped, getGroupHeaderId, renderRow);

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

  if (isTable) {
    // A table section can hold rows and nothing else, so the section itself is the window the
    // rows are held in, stuck between the row groups reserving the space of the rows outside it:
    // one before it for the rows above, one after it for the rest. A row group given a height
    // shares the difference out among its rows, so the section is as tall as its rows are.
    defaultProps = {
      style: {
        [VirtualizerCssVars.totalSize]: `${scrollableSize}px`,
        ...noScrollAnchoringStyle,
        ...(enabled ? { position: 'sticky', top: insetTop, bottom: insetBottom } : null),
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
      children: enabled ? (
        <React.Fragment>
          {/* The block the window is stuck within, in normal flow after the scrollport's padding
            and spanning the rows' space alone: a sticky box never leaves its containing block,
            and the window's insets would push it over whatever else the block held at either
            end of the collection. */}
          <div
            {...stickyContentProps}
            style={{
              ...stickyContentProps.style,
              // Rows taller than the geometry has them overflow the window, and at the end of
              // the collection the block: clipped, so that the scrollable height stays the
              // geometry's while a scrollbar drag holds the measurements back. Clipping rather
              // than hiding the overflow, which would make the block a scroll container of its
              // own for the window to stick to.
              overflow: 'clip',
            }}
          >
            <div role="presentation" style={{ height: spacerHeight }} />
            <div
              role="presentation"
              style={{
                position: 'sticky',
                top: stickyInset,
                bottom: stickyInset,
                // The window's own height rather than its content's: the box the rows render in
                // carries an anchoring pad, which an automatic height would add to the window
                // and throw its insets off. The box overflows the window by the pad, which is
                // empty and cancelled visually by the box's translation.
                height: windowHeight,
              }}
            >
              {/* The rows render in an anchored box, the engine's paint-stable window content:
                the pad places them at their offset from the anchor and the translation cancels
                it visually, which holds the rows the window keeps from one commit to the next
                at fixed offsets in the layer they paint into, so that only entering rows are
                rasterized. */}
              <div ref={windowContentRef} {...windowContentProps}>
                {renderedRows}
              </div>
            </div>
          </div>
          {/* In normal flow after the rows' space, so it scrolls with the rows rather than being
            pinned to the scrollport; still measured, so the published total covers it. */}
          {trailing != null && (
            <div ref={trailingRef} role="presentation" style={trailingFlowStyle}>
              {trailing}
            </div>
          )}
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
    props: [defaultProps, elementProps],
  });

  if (!isTable || !enabled) {
    return element;
  }

  // The row groups holding the space of the rows outside the window, on either side of the one
  // holding the rows: siblings of the root rather than part of it, since a row group holds rows
  // alone. Trailing content is rows of the consumer's own after the reserved space, measured as
  // part of the section's surroundings rather than on their own.
  return (
    <React.Fragment>
      <tbody ref={startSpacerSectionRef} style={noScrollAnchoringStyle}>
        <tr ref={startSpacerRowRef} aria-hidden style={{ height: spacerHeight }} />
      </tbody>
      {element}
      <tbody style={noScrollAnchoringStyle}>
        <tr ref={endSpacerRef} aria-hidden style={{ height: endSpacerHeight }} />
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
   * choose where a scrolled item lands. `paddingStart` and `paddingEnd` keep the item clear of an
   * inset the activation knows about, in place of the scrollport's `scroll-padding`.
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
   *   table: the nearest ancestor with `overflow: auto` or `scroll`. The section is stuck to the
   *   scrollport, as a list's rows are, between two sections of the virtualizer's own that
   *   reserve the space of the rows outside the window, so the rows it holds stay on screen
   *   while the next window is rendered. Spread the renderer's third argument onto each `<tr>`;
   *   it carries the row's measurement along with its metadata. Group headers are rendered as
   *   rows among the items, and trailing content as rows after the reserved space.
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
   * Height of every item in CSS pixels, when the collection's items are known to be uniform.
   *
   * Items are then positioned arithmetically: no item is measured, and the geometry is exact
   * from the first render rather than converging as measurements arrive. It replaces
   * `estimatedItemHeight`, which describes a height to assume until one is measured.
   *
   * Only pass it when the height is genuinely fixed. Items that turn out to be a different
   * height are still laid out as this many pixels apart, and nothing corrects it. Leave it out
   * for items whose height depends on their content, on the width available, or on a font that
   * loads later. In a grouped collection it covers the items; group headers are measured as they
   * always are.
   */
  itemHeight?: number | undefined;
  /**
   * Which ARIA the item metadata states for an item's position in the collection.
   *
   * - `set`: `aria-posinset` and `aria-setsize` for the item's place in the flat collection,
   *   which is what the options of a listbox need.
   * - `none`: neither, for a collection whose items are placed relative to something else — the
   *   items of a tree, which are placed among their siblings, or the cells of a grid, which are
   *   placed by row and column. Everything else the metadata carries stays, so your own ARIA
   *   goes next to it.
   *
   * A host publishing its own collection declares what its items need, and this prop overrides
   * that declaration.
   *
   * @default what the host declares, or `'set'`
   */
  itemAria?: VirtualizerItemAria | undefined;
  /**
   * The collection to virtualize: a flat array of items, or an array of groups, each an object
   * with an `items` array. A grouped collection also needs `renderGroupHeader`.
   *
   * When omitted, the collection and its highlight state come from a surrounding component that
   * publishes them — a list that supports virtualization, such as `<Combobox.List>`, or a
   * component of your own that implements the host contract.
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
   * Defaults to the larger of 150px and the estimated size of the first item. The buffer is at
   * least fifteen estimated rows in total, whatever this prop asks for: half of it on each side
   * while the list is at rest, and all of it ahead while it scrolls.
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
   * Pass `-1` when the size is not known yet, which is the ARIA convention for it. It has
   * nothing to describe when `itemAria` is `none`.
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
   * Metadata a group header rendered by the virtualizer publishes to a host's `<GroupLabel>`.
   */
  export type GroupHeaderMetadata = VirtualizerGroupHeaderMetadata;
  /**
   * Imperative operations a virtualizer exposes to the component hosting it.
   */
  export type Handle = VirtualizerHandle;
  /**
   * Stable wiring published by a component so the virtualizer can window its collection.
   */
  export type Host = VirtualizerHost;
  /**
   * The collection and highlight state a host publishes for the virtualizer to window against.
   */
  export type HostState = VirtualizerHostState;
  /**
   * Attributes to spread onto the element carrying a group's name.
   */
  export type GroupHeaderProps = VirtualizerGroupHeaderProps;
  /**
   * A `React.ReactElement`, as returned by a group header renderer.
   */
  export type GroupHeaderElement = VirtualizerGroupHeaderElement;
  /**
   * Which ARIA an item states for its position in the collection.
   */
  export type ItemAria = VirtualizerItemAria;
  /**
   * Metadata an item rendered by the virtualizer publishes to a host's `<Item>`.
   */
  export type ItemMetadata = VirtualizerItemMetadata;
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
   * A virtualizer registered with its host, as the host's registry holds it.
   */
  export type Registration = VirtualizerRegistration;
  /**
   * Coordinates virtualized and non-virtualized content rendered by a single host.
   */
  export type Registry = VirtualizerRegistry;
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
