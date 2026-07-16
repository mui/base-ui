'use client';
import * as React from 'react';
import { ownerWindow } from '@base-ui/utils/owner';
import { useStore } from '@base-ui/utils/store';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
import { useRefWithInit } from '@base-ui/utils/useRefWithInit';
import { useStableCallback } from '@base-ui/utils/useStableCallback';
import { warn } from '@base-ui/utils/warn';
import {
  Dimensions,
  LayoutList,
  Virtualization,
  useVirtualizer,
  type Row,
  type RowEntry,
  type Virtualizer,
} from '@mui/x-virtualizer';
import type { StateAttributesMapping } from '../../internals/getStateAttributesProps';
import type { BaseUIComponentProps, HTMLProps } from '../../internals/types';
import { useRenderElement } from '../../internals/useRenderElement';
import { useVirtualizationListContext } from '../../internals/virtualization/VirtualizationListContext';
import {
  useComboboxDerivedItemsContext,
  useComboboxRootContext,
} from '../root/ComboboxRootContext';
import { selectors } from '../store';
import { ComboboxVirtualItemContext } from './ComboboxVirtualItemContext';
import { ComboboxVirtualizerCssVars } from './ComboboxVirtualizerCssVars';

type VirtualizerItemKey = string | number;

interface ComboboxVirtualItemRowModel<Value> {
  item: Value;
  itemIndex: number;
  type: 'item';
  virtualRowIndex: number;
}

type ComboboxVirtualRowModel<Value> = ComboboxVirtualItemRowModel<Value>;

interface ComboboxVirtualRowProps<Value> {
  apiRef: React.RefObject<Virtualizer['api'] | null>;
  children: (item: Value, index: number) => React.ReactElement | null;
  id: VirtualizerItemKey;
  isVirtualFocusRow: boolean;
  itemCount: number;
  model: ComboboxVirtualRowModel<Value>;
  paddingEnd: number;
  paddingStart: number;
  rowCount: number;
  rowIndex: number;
}

const focusProxyStyle: React.CSSProperties = {
  height: 0,
  left: 0,
  opacity: 0,
  overflow: 'hidden',
  pointerEvents: 'none',
  position: 'absolute',
  top: 0,
  width: 0,
};

function ComboboxVirtualRowImpl<Value>(props: ComboboxVirtualRowProps<Value>) {
  const {
    apiRef,
    children,
    id,
    isVirtualFocusRow,
    itemCount,
    model,
    paddingEnd,
    paddingStart,
    rowCount,
    rowIndex,
  } = props;

  const registeredItemCountRef = React.useRef(0);

  const measureRef = useStableCallback((element: HTMLElement | null) => {
    return element ? apiRef.current?.rowsMeta.observeRowHeight(element, id) : undefined;
  });

  const registerItem = React.useCallback(() => {
    registeredItemCountRef.current += 1;
    return () => {
      registeredItemCountRef.current -= 1;
    };
  }, []);

  useIsoLayoutEffect(() => {
    if (!isVirtualFocusRow) {
      apiRef.current?.rowsMeta.setLastMeasuredRowIndex(rowIndex);
    }
  }, [apiRef, isVirtualFocusRow, rowIndex]);

  useIsoLayoutEffect(() => {
    if (process.env.NODE_ENV !== 'production' && registeredItemCountRef.current !== 1) {
      warn(
        'Each <Combobox.Virtualizer> item renderer must render exactly one ' +
          '<Combobox.Item>. Rendered ' +
          `${registeredItemCountRef.current} items for the value at index ${model.itemIndex}.`,
      );
    }
  });

  const spacing = getRowSpacing(rowIndex, rowCount, paddingStart, paddingEnd);
  const contextValue = React.useMemo(
    () => ({
      index: model.itemIndex,
      measureRef: isVirtualFocusRow ? undefined : measureRef,
      props: {
        'aria-posinset': model.itemIndex + 1,
        'aria-setsize': itemCount,
        'data-index': model.itemIndex,
        style: isVirtualFocusRow
          ? undefined
          : {
              marginBottom: spacing.bottom || undefined,
              marginTop: spacing.top || undefined,
            },
      },
      registerItem: process.env.NODE_ENV === 'production' ? undefined : registerItem,
    }),
    [
      isVirtualFocusRow,
      itemCount,
      measureRef,
      model.itemIndex,
      registerItem,
      spacing.bottom,
      spacing.top,
    ],
  );

  const item = (
    <ComboboxVirtualItemContext.Provider value={contextValue}>
      {children(model.item, model.itemIndex)}
    </ComboboxVirtualItemContext.Provider>
  );

  return isVirtualFocusRow ? (
    <div role="presentation" style={focusProxyStyle}>
      {item}
    </div>
  ) : (
    item
  );
}

function areVirtualRowPropsEqual<Value>(
  previous: ComboboxVirtualRowProps<Value>,
  next: ComboboxVirtualRowProps<Value>,
) {
  return (
    previous.apiRef === next.apiRef &&
    previous.children === next.children &&
    previous.id === next.id &&
    previous.isVirtualFocusRow === next.isVirtualFocusRow &&
    previous.itemCount === next.itemCount &&
    previous.model.item === next.model.item &&
    previous.model.itemIndex === next.model.itemIndex &&
    previous.model.virtualRowIndex === next.model.virtualRowIndex &&
    previous.paddingEnd === next.paddingEnd &&
    previous.paddingStart === next.paddingStart &&
    previous.rowCount === next.rowCount &&
    previous.rowIndex === next.rowIndex
  );
}

const ComboboxVirtualRow = React.memo(
  ComboboxVirtualRowImpl,
  areVirtualRowPropsEqual,
) as typeof ComboboxVirtualRowImpl;

const stateAttributesMapping: StateAttributesMapping<ComboboxVirtualizerState> = {
  totalSize: () => null,
};

/**
 * Renders a window of visible and overscanned items in a flat combobox list.
 * Renders a scrollable `<div>` element.
 *
 * Requires the `items` prop on `<Combobox.Root>` and must be the only item-rendering child of
 * `<Combobox.List>`. The element must have a constrained height or maximum height for
 * virtualization to limit the number of mounted items.
 *
 * Grouped collections and grid mode are not currently supported.
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
    overscanPx,
    paddingStart = 0,
    paddingEnd = 0,
    enabled = true,
    ...elementProps
  } = componentProps;

  const store = useComboboxRootContext();
  const { flatFilteredItems, hasItems, isGrouped } = useComboboxDerivedItemsContext();
  const activeIndex = useStore(store, selectors.activeIndex);
  const externalVirtualized = useStore(store, selectors.externalVirtualized);
  const grid = useStore(store, selectors.grid);
  const highlightType = useStore(store, selectors.highlightType);
  const insideList = useVirtualizationListContext();

  const scrollElementRef = React.useRef<HTMLDivElement | null>(null);
  const layout = useRefWithInit(
    () =>
      new LayoutList({
        container: scrollElementRef,
        scroller: scrollElementRef,
      }),
  ).current;
  const objectKeyRegistry = useRefWithInit(createObjectKeyRegistry).current;

  const getEstimatedSize = React.useCallback(
    (item: Value, index: number) => {
      const size = typeof estimateSize === 'function' ? estimateSize(item, index) : estimateSize;
      return Math.max(1, size);
    },
    [estimateSize],
  );

  const defaultEstimatedSize =
    flatFilteredItems.length === 0
      ? Math.max(1, typeof estimateSize === 'number' ? estimateSize : 1)
      : getEstimatedSize(flatFilteredItems[0] as Value, 0);

  const rows = React.useMemo<RowEntry[]>(() => {
    const keys = process.env.NODE_ENV === 'production' ? undefined : new Set<VirtualizerItemKey>();

    return flatFilteredItems.map((item, itemIndex) => {
      const key = getItemKey
        ? getItemKey(item as Value)
        : getDefaultItemKey(item as Value, objectKeyRegistry);

      if (process.env.NODE_ENV !== 'production') {
        if (isObjectValue(item) && !getItemKey) {
          warn(
            '<Combobox.Virtualizer> requires `getItemKey` when item values are objects. ' +
              'Return a stable string or number that uniquely identifies each item.',
          );
        }
        if (keys?.has(key)) {
          warn(
            `<Combobox.Virtualizer> received the duplicate item key \`${String(key)}\`. ` +
              'Each item must have a unique key.',
          );
        }
        keys?.add(key);
      }

      return {
        id: key,
        model: {
          item,
          itemIndex,
          type: 'item',
          virtualRowIndex: itemIndex,
        } satisfies ComboboxVirtualRowModel<Value>,
      };
    });
  }, [flatFilteredItems, getItemKey, objectKeyRegistry]);

  const rowIndexByItemIndex = React.useMemo(() => {
    const map = new Map<number, number>();
    rows.forEach((row, rowIndex) => {
      const model = row.model as ComboboxVirtualRowModel<Value>;
      if (model.type === 'item') {
        map.set(model.itemIndex, rowIndex);
      }
    });
    return map;
  }, [rows]);
  const rowIndexByItemIndexRef = React.useRef(rowIndexByItemIndex);
  rowIndexByItemIndexRef.current = rowIndexByItemIndex;

  const focusedVirtualCellRef = React.useRef<{
    columnIndex: number;
    id: VirtualizerItemKey;
    rowIndex: number;
  } | null>(null);
  const focusedRowIndex = activeIndex == null ? undefined : rowIndexByItemIndex.get(activeIndex);
  focusedVirtualCellRef.current =
    focusedRowIndex == null
      ? null
      : {
          columnIndex: 0,
          id: rows[focusedRowIndex].id,
          rowIndex: focusedRowIndex,
        };

  const getFocusedVirtualCell = React.useCallback(() => focusedVirtualCellRef.current, []);
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
        itemCount={flatFilteredItems.length}
        rowCount={rows.length}
        rowIndex={params.rowIndex}
        paddingStart={paddingStart}
        paddingEnd={paddingEnd}
        isVirtualFocusRow={params.isVirtualFocusRow}
      >
        {children}
      </ComboboxVirtualRow>
    ),
    [children, flatFilteredItems.length, paddingEnd, paddingStart, rows.length],
  );

  const getRowHeight = React.useCallback(() => 'auto' as const, []);
  const getEstimatedRowHeight = useStableCallback((row: RowEntry) => {
    const model = row.model as ComboboxVirtualRowModel<Value>;
    return getEstimatedSize(model.item, model.itemIndex);
  });
  const getRowSpacingProp = useStableCallback((row: RowEntry) => {
    const model = row.model as ComboboxVirtualRowModel<Value>;
    return getRowSpacing(model.virtualRowIndex, rows.length, paddingStart, paddingEnd);
  });
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
      rowBufferPx: Math.max(0, overscanPx ?? defaultEstimatedSize),
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
    getRowSpacing: paddingStart === 0 && paddingEnd === 0 ? undefined : getRowSpacingProp,
    focusedVirtualCell: getFocusedVirtualCell,
    renderRow,
  });
  apiRef.current = virtualizer.api;

  const totalSize = virtualizer.store.use(Dimensions.selectors.contentHeight);
  const containerProps = virtualizer.store.use(LayoutList.selectors.containerProps);
  const contentProps = virtualizer.store.use(LayoutList.selectors.contentProps);
  const positionerProps = virtualizer.store.use(LayoutList.selectors.positionerProps);
  const renderContext = virtualizer.store.use(Virtualization.selectors.renderContext);

  const resetScroll = useStableCallback(() => {
    scrollElementRef.current?.scrollTo({
      behavior: 'instant' as ScrollBehavior,
      top: 0,
    });
  });
  const virtualizerHandle = React.useMemo(() => ({ resetScroll }), [resetScroll]);
  const virtualizerId = useRefWithInit(() => Symbol('Base UI list virtualizer')).current;

  useIsoLayoutEffect(() => {
    const registry = store.state.virtualizationRegistry;

    if (process.env.NODE_ENV !== 'production') {
      if (registry.virtualizers.size > 0) {
        warn('<Combobox.Root> must not contain more than one <Combobox.Virtualizer>.');
      }
      if (registry.nonVirtualItemCount > 0) {
        warn(
          '<Combobox.List> must not render static <Combobox.Item> elements alongside ' +
            '<Combobox.Virtualizer>. Render every list item through the virtualizer.',
        );
      }
    }

    registry.virtualizers.set(virtualizerId, virtualizerHandle);

    return () => {
      registry.virtualizers.delete(virtualizerId);
    };
  }, [store, virtualizerHandle, virtualizerId]);

  React.useEffect(() => {
    if (process.env.NODE_ENV === 'production') {
      return;
    }
    if (!hasItems) {
      warn('<Combobox.Virtualizer> requires the `items` prop on <Combobox.Root>.');
    }
    if (!insideList) {
      warn('<Combobox.Virtualizer> must be placed inside <Combobox.List>.');
    }
    if (externalVirtualized) {
      warn(
        '<Combobox.Root> must not use the `virtualized` prop together with ' +
          '<Combobox.Virtualizer>. The prop is only for external virtualization.',
      );
    }
    if (isGrouped) {
      warn(
        '<Combobox.Virtualizer> does not currently support grouped collections. ' +
          'Render a flat item collection instead.',
      );
    }
    if (grid) {
      warn(
        '<Combobox.Virtualizer> does not currently support grid mode. ' +
          'Use a flat listbox instead.',
      );
    }
  }, [externalVirtualized, grid, hasItems, insideList, isGrouped]);

  React.useEffect(() => {
    const element = scrollElementRef.current;
    if (
      process.env.NODE_ENV !== 'production' &&
      enabled &&
      rows.length >= 100 &&
      element &&
      totalSize > 0 &&
      element.clientHeight >= totalSize
    ) {
      warn(
        '<Combobox.Virtualizer> must have a constrained height or maximum height. ' +
          'Without one, all items are rendered and virtualization provides no benefit.',
      );
    }
  }, [enabled, rows.length, totalSize]);

  useIsoLayoutEffect(() => {
    const virtualization = virtualizer.store.state.virtualization;

    if (
      virtualization.enabled === enabled &&
      virtualization.enabledForRows === enabled &&
      virtualization.enabledForColumns === false
    ) {
      return;
    }

    virtualizer.api.scheduleUpdateRenderContext();
    virtualizer.store.set('virtualization', {
      ...virtualization,
      enabled,
      enabledForColumns: false,
      enabledForRows: enabled,
    });
  }, [enabled, virtualizer.api, virtualizer.store]);

  const scrollActiveItemIntoView = useStableCallback((itemIndex: number) => {
    const scrollElement = scrollElementRef.current;
    const rowIndex = rowIndexByItemIndexRef.current.get(itemIndex);

    if (!scrollElement || rowIndex == null) {
      return false;
    }

    const rowsMeta = virtualizer.store.state.rowsMeta;
    const start = rowsMeta.positions[rowIndex];
    const end = rowsMeta.positions[rowIndex + 1] ?? rowsMeta.currentPageTotalHeight;

    if (start == null || end == null) {
      return false;
    }

    const styles = ownerWindow(scrollElement).getComputedStyle(scrollElement);
    const scrollPaddingStart = Number.parseFloat(styles.scrollPaddingTop) || 0;
    const scrollPaddingEnd = Number.parseFloat(styles.scrollPaddingBottom) || 0;
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
        behavior: 'instant' as ScrollBehavior,
        top: Math.max(0, Math.min(nextScrollTop, maxScrollTop)),
      });
    }

    return true;
  });

  const pendingScrollItemIndexRef = React.useRef<number | null>(null);

  useIsoLayoutEffect(() => {
    if (
      !enabled ||
      highlightType === 'pointer' ||
      activeIndex == null ||
      activeIndex < 0 ||
      !rowIndexByItemIndexRef.current.has(activeIndex)
    ) {
      pendingScrollItemIndexRef.current = null;
      return;
    }

    pendingScrollItemIndexRef.current = activeIndex;
    if (scrollActiveItemIntoView(activeIndex)) {
      pendingScrollItemIndexRef.current = null;
    }
  }, [activeIndex, enabled, highlightType, scrollActiveItemIntoView]);

  useIsoLayoutEffect(() => {
    const itemIndex = pendingScrollItemIndexRef.current;
    if (itemIndex != null && scrollActiveItemIntoView(itemIndex)) {
      pendingScrollItemIndexRef.current = null;
    }
  }, [scrollActiveItemIntoView, totalSize]);

  const renderedRows = virtualizer.api.getters.getRows();

  // `getRows` treats `lastRowIndex` as exclusive when rendering the range, but uses a strict
  // greater-than comparison when deciding whether to append the focused virtual row.
  if (focusedRowIndex === renderContext.lastRowIndex && focusedRowIndex < rows.length) {
    const row = rows[focusedRowIndex];
    renderedRows.push(
      renderRow({
        id: row.id,
        model: row.model,
        rowIndex: focusedRowIndex,
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
      [ComboboxVirtualizerCssVars.totalSize as string]: `${totalSize}px`,
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
    stateAttributesMapping,
    ref: [forwardedRef, containerRef],
    props: [defaultProps, elementProps],
  });
}) as {
  <Value = unknown>(
    props: ComboboxVirtualizer.Props<Value> & React.RefAttributes<HTMLDivElement>,
  ): React.JSX.Element;
};

function createObjectKeyRegistry() {
  return {
    keys: new WeakMap<object, number>(),
    nextKey: 0,
  };
}

function getDefaultItemKey<Value>(
  item: Value,
  registry: ReturnType<typeof createObjectKeyRegistry>,
): VirtualizerItemKey {
  if (isObjectValue(item)) {
    const objectItem = item as object;
    let key = registry.keys.get(objectItem);
    if (key === undefined) {
      key = registry.nextKey;
      registry.nextKey += 1;
      registry.keys.set(objectItem, key);
    }
    return key;
  }

  if (typeof item === 'number' || typeof item === 'string') {
    return item;
  }

  return `${typeof item}:${String(item)}`;
}

function isObjectValue(value: unknown): value is object {
  return (typeof value === 'object' && value !== null) || typeof value === 'function';
}

function getRowSpacing(
  rowIndex: number,
  rowCount: number,
  paddingStart: number,
  paddingEnd: number,
) {
  return {
    top: rowIndex === 0 ? paddingStart : 0,
    bottom: rowIndex === rowCount - 1 ? paddingEnd : 0,
  };
}

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

interface ComboboxVirtualizerBaseProps<Value> extends Omit<
  BaseUIComponentProps<'div', ComboboxVirtualizerState>,
  'children'
> {
  /**
   * Renders exactly one item for the given value and logical index.
   */
  children: (item: Value, index: number) => React.ReactElement | null;
  /**
   * Estimated item size used before item elements have been measured.
   */
  estimateSize: number | ((item: Value, index: number) => number);
  /**
   * Pixel buffer rendered before and after the visible range.
   * Defaults to the estimated size of the first item.
   */
  overscanPx?: number | undefined;
  /**
   * Empty space in pixels before the first virtual row.
   * @default 0
   */
  paddingStart?: number | undefined;
  /**
   * Empty space in pixels after the last virtual row.
   * @default 0
   */
  paddingEnd?: number | undefined;
  /**
   * Whether virtualization is enabled. When `false`, all items are rendered.
   * @default true
   */
  enabled?: boolean | undefined;
}

type ComboboxVirtualizerKeyProps<Value> = [Extract<Value, object>] extends [never]
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

/**
 * Props for the `Combobox.Virtualizer` component.
 */
export type ComboboxVirtualizerProps<Value = unknown> = ComboboxVirtualizerBaseProps<Value> &
  ComboboxVirtualizerKeyProps<Value>;

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
  export type Props<Value = unknown> = ComboboxVirtualizerProps<Value>;
}
