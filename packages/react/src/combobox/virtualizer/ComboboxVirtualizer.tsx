'use client';
import * as React from 'react';
import { useStore } from '@base-ui/utils/store';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
import { useRefWithInit } from '@base-ui/utils/useRefWithInit';
import { useStableCallback } from '@base-ui/utils/useStableCallback';
import {
  Dimensions,
  LayoutList,
  Virtualization,
  useVirtualizer,
  type Row,
  type RowEntry,
  type Virtualizer,
} from '@mui/x-virtualizer';
import type { BaseUIComponentProps, HTMLProps } from '../../internals/types';
import { useRenderElement } from '../../internals/useRenderElement';
import {
  useComboboxDerivedItemsContext,
  useComboboxRootContext,
} from '../root/ComboboxRootContext';
import { selectors } from '../store';
import { ComboboxVirtualItemContext } from './ComboboxVirtualItemContext';

type VirtualizerItemKey = string | number;

interface ComboboxVirtualRowModel<Value> {
  item: Value;
  index: number;
}

interface ComboboxVirtualRowProps<Value> {
  apiRef: React.RefObject<Virtualizer['api'] | null>;
  children: (item: Value, index: number) => React.ReactNode;
  id: VirtualizerItemKey;
  isVirtualFocusRow: boolean;
  model: ComboboxVirtualRowModel<Value>;
  paddingEnd: number;
  paddingStart: number;
  rowCount: number;
}

function ComboboxVirtualRowImpl<Value>(props: ComboboxVirtualRowProps<Value>) {
  const { apiRef, children, id, isVirtualFocusRow, model, paddingEnd, paddingStart, rowCount } =
    props;

  const cleanupRef = React.useRef<(() => void) | undefined>(undefined);

  const measureRef = useStableCallback((element: HTMLElement | null) => {
    cleanupRef.current?.();
    cleanupRef.current = element
      ? apiRef.current?.rowsMeta.observeRowHeight(element, id)
      : undefined;
  });

  useIsoLayoutEffect(() => {
    apiRef.current?.rowsMeta.setLastMeasuredRowIndex(model.index);
  }, [apiRef, model.index]);

  useIsoLayoutEffect(() => {
    return () => {
      cleanupRef.current?.();
    };
  }, []);

  const contextValue = React.useMemo(() => {
    const itemStyle: React.CSSProperties = isVirtualFocusRow
      ? {
          height: 0,
          opacity: 0,
          overflow: 'hidden',
          width: 0,
        }
      : {
          marginBottom: model.index === rowCount - 1 ? paddingEnd : undefined,
          marginTop: model.index === 0 ? paddingStart : undefined,
        };

    return {
      index: model.index,
      measureRef,
      props: {
        'aria-posinset': model.index + 1,
        'aria-setsize': rowCount,
        'data-index': model.index,
        style: itemStyle,
      },
    };
  }, [isVirtualFocusRow, measureRef, model.index, paddingEnd, paddingStart, rowCount]);

  return (
    <ComboboxVirtualItemContext.Provider value={contextValue}>
      {children(model.item, model.index)}
    </ComboboxVirtualItemContext.Provider>
  );
}

const ComboboxVirtualRow = React.memo(ComboboxVirtualRowImpl) as typeof ComboboxVirtualRowImpl;

/**
 * Renders only the visible items in the combobox list.
 * Renders a scrollable `<div>` element.
 *
 * Requires the `items` prop on `<Combobox.Root>` and must be the only item-rendering child of
 * `<Combobox.List>`.
 *
 * Documentation: [Base UI Combobox](https://base-ui.com/react/components/combobox)
 */
export const ComboboxVirtualizer = React.forwardRef(function ComboboxVirtualizer<Value>(
  componentProps: ComboboxVirtualizer.Props<Value>,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const {
    render,
    className,
    style,
    children,
    estimateSize,
    getItemKey,
    overscan = 1,
    paddingStart = 0,
    paddingEnd = 0,
    scrollPaddingStart = 0,
    scrollPaddingEnd = 0,
    enabled = true,
    ...elementProps
  } = componentProps;

  const store = useComboboxRootContext();
  const { flatFilteredItems } = useComboboxDerivedItemsContext();
  const activeIndex = useStore(store, selectors.activeIndex);
  const highlightType = useStore(store, selectors.highlightType);

  const scrollElementRef = React.useRef<HTMLDivElement | null>(null);
  const layout = useRefWithInit(
    () =>
      new LayoutList({
        container: scrollElementRef,
        scroller: scrollElementRef,
      }),
  ).current;

  const getEstimatedSize = React.useCallback(
    (index: number) => {
      const size = typeof estimateSize === 'function' ? estimateSize(index) : estimateSize;
      return Math.max(1, size);
    },
    [estimateSize],
  );

  const defaultEstimatedSize =
    flatFilteredItems.length === 0
      ? Math.max(1, typeof estimateSize === 'number' ? estimateSize : 1)
      : getEstimatedSize(0);

  const rows = React.useMemo<RowEntry[]>(
    () =>
      flatFilteredItems.map((item, index) => ({
        id: getItemKey ? getItemKey(item as Value, index) : index,
        model: { item, index },
      })),
    [flatFilteredItems, getItemKey],
  );

  const getFocusedVirtualCell = React.useCallback(() => {
    if (activeIndex == null || activeIndex < 0 || activeIndex >= rows.length) {
      return null;
    }

    return {
      columnIndex: 0,
      id: rows[activeIndex].id,
      rowIndex: activeIndex,
    };
  }, [activeIndex, rows]);

  const apiRef = React.useRef<Virtualizer['api'] | null>(null);

  const renderRow = React.useCallback(
    (params: {
      id: VirtualizerItemKey;
      model: Row;
      rowIndex: number;
      isVirtualFocusRow: boolean;
    }) => (
      <ComboboxVirtualRow
        key={params.id}
        apiRef={apiRef}
        id={params.id}
        model={params.model as ComboboxVirtualRowModel<Value>}
        rowCount={rows.length}
        paddingStart={paddingStart}
        paddingEnd={paddingEnd}
        isVirtualFocusRow={params.isVirtualFocusRow}
      >
        {children}
      </ComboboxVirtualRow>
    ),
    [children, paddingEnd, paddingStart, rows.length],
  );

  const getRowHeight = React.useCallback(() => 'auto' as const, []);
  const getEstimatedRowHeight = React.useCallback(
    (row: RowEntry) => getEstimatedSize((row.model as ComboboxVirtualRowModel<Value>).index),
    [getEstimatedSize],
  );
  const getRowSpacing = React.useCallback(
    (row: RowEntry) => {
      const index = (row.model as ComboboxVirtualRowModel<Value>).index;
      return {
        top: index === 0 ? paddingStart : 0,
        bottom: index === rows.length - 1 ? paddingEnd : 0,
      };
    },
    [paddingEnd, paddingStart, rows.length],
  );
  const range = React.useMemo(
    () =>
      rows.length === 0
        ? null
        : {
            firstRowIndex: 0,
            lastRowIndex: rows.length,
          },
    [rows.length],
  );

  const virtualizer = useVirtualizer({
    layout,
    dimensions: {
      rowHeight: defaultEstimatedSize,
    },
    virtualization: {
      rowBufferPx: Math.max(0, overscan) * defaultEstimatedSize,
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
    getRowSpacing,
    focusedVirtualCell: getFocusedVirtualCell,
    renderRow,
  });
  apiRef.current = virtualizer.api;

  useIsoLayoutEffect(() => {
    store.update({
      virtualizerMounted: true,
      virtualized: true,
    });

    return () => {
      store.update({
        virtualizerMounted: false,
        virtualized: store.state.externalVirtualized,
      });
    };
  }, [store]);

  useIsoLayoutEffect(() => {
    // The regular composite list clears its element registry when the virtualizer takes over.
    // Preserve the logical collection length so keyboard navigation can move through unmounted
    // rows; rendered rows populate their own slots as the window changes.
    store.state.listRef.current.length = rows.length;
  }, [rows.length, store]);

  useIsoLayoutEffect(() => {
    const virtualization = virtualizer.store.state.virtualization;

    if (
      virtualization.enabled === enabled &&
      virtualization.enabledForRows === enabled &&
      virtualization.enabledForColumns === false
    ) {
      return;
    }

    virtualizer.store.set('virtualization', {
      ...virtualization,
      enabled,
      enabledForColumns: false,
      enabledForRows: enabled,
    });
    virtualizer.api.scheduleUpdateRenderContext();
  }, [enabled, virtualizer.api, virtualizer.store]);

  const scrollActiveItemIntoView = useStableCallback((index: number) => {
    const scrollElement = scrollElementRef.current;
    const row = rows[index];

    if (!scrollElement || !row) {
      return;
    }

    const rowsMeta = virtualizer.store.state.rowsMeta;
    const start = rowsMeta.positions[index];
    const end = rowsMeta.positions[index + 1] ?? rowsMeta.currentPageTotalHeight;

    if (start == null || end == null) {
      return;
    }

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
        rowsMeta.currentPageTotalHeight - scrollElement.clientHeight,
      );
      scrollElement.scrollTo({
        top: Math.max(0, Math.min(nextScrollTop, maxScrollTop)),
      });
    }
  });

  useIsoLayoutEffect(() => {
    if (
      !enabled ||
      highlightType === 'pointer' ||
      activeIndex == null ||
      activeIndex < 0 ||
      activeIndex >= rows.length
    ) {
      return;
    }

    scrollActiveItemIntoView(activeIndex);
  }, [activeIndex, enabled, highlightType, rows.length, scrollActiveItemIntoView]);

  const totalSize = virtualizer.store.use(Dimensions.selectors.contentHeight);
  const containerProps = virtualizer.store.use(LayoutList.selectors.containerProps);
  const contentProps = virtualizer.store.use(LayoutList.selectors.contentProps);
  const positionerProps = virtualizer.store.use(LayoutList.selectors.positionerProps);
  const renderContext = virtualizer.store.use(Virtualization.selectors.renderContext);

  const renderedRows = virtualizer.api.getters.getRows();

  // `getRows` treats `lastRowIndex` as exclusive when rendering the range, but uses a strict
  // greater-than comparison when deciding whether to append the focused virtual row.
  if (activeIndex === renderContext.lastRowIndex && activeIndex < rows.length) {
    const row = rows[activeIndex];
    renderedRows.push(
      renderRow({
        id: row.id,
        model: row.model,
        rowIndex: activeIndex,
        isVirtualFocusRow: true,
      }),
    );
  }

  const { ref: containerRef, style: containerStyle, ...restContainerProps } = containerProps;

  const state: ComboboxVirtualizerState = {
    empty: rows.length === 0,
    totalSize,
  };

  const defaultProps: HTMLProps = {
    ...restContainerProps,
    style: {
      ...containerStyle,
      ['--total-size' as string]: `${totalSize}px`,
      overflow: 'auto',
    } as React.CSSProperties,
    children: (
      <React.Fragment>
        <div {...contentProps} />
        <div role="presentation" {...positionerProps} />
        {renderedRows}
      </React.Fragment>
    ),
  };

  return useRenderElement('div', componentProps, {
    state,
    ref: [forwardedRef, containerRef],
    props: [defaultProps, elementProps],
  });
}) as {
  <Value = any>(
    props: ComboboxVirtualizer.Props<Value> & React.RefAttributes<HTMLDivElement>,
  ): React.JSX.Element;
};

/**
 * State metadata exposed to the `Combobox.Virtualizer` render props.
 */
export interface ComboboxVirtualizerState {
  /**
   * Whether the virtualized collection has no items.
   */
  empty: boolean;
  /**
   * Total virtual content size in pixels.
   */
  totalSize: number;
}

/**
 * Props for the `Combobox.Virtualizer` component.
 */
export interface ComboboxVirtualizerProps<Value = any> extends Omit<
  BaseUIComponentProps<'div', ComboboxVirtualizerState>,
  'children'
> {
  /**
   * Renders an item for the given value and logical index.
   */
  children: (item: Value, index: number) => React.ReactNode;
  /**
   * Estimated item size used before item elements have been measured.
   */
  estimateSize: number | ((index: number) => number);
  /**
   * Returns a stable key for the item value and logical index.
   */
  getItemKey?: ((item: Value, index: number) => string | number) | undefined;
  /**
   * Number of extra estimated items to render before and after the visible range.
   * @default 1
   */
  overscan?: number | undefined;
  /**
   * Empty space before the first item in the virtual content.
   * @default 0
   */
  paddingStart?: number | undefined;
  /**
   * Empty space after the last item in the virtual content.
   * @default 0
   */
  paddingEnd?: number | undefined;
  /**
   * Start-side viewport padding used when scrolling an item into view.
   * @default 0
   */
  scrollPaddingStart?: number | undefined;
  /**
   * End-side viewport padding used when scrolling an item into view.
   * @default 0
   */
  scrollPaddingEnd?: number | undefined;
  /**
   * Whether virtualization is enabled. When `false`, all items are rendered.
   * @default true
   */
  enabled?: boolean | undefined;
}

/**
 * Type helpers for the `Combobox.Virtualizer` component.
 */
export namespace ComboboxVirtualizer {
  /**
   * State metadata exposed to render props.
   */
  export type State = ComboboxVirtualizerState;
  /**
   * Props accepted by the component.
   */
  export type Props<Value = any> = ComboboxVirtualizerProps<Value>;
}
