'use client';
import * as React from 'react';
import { useStore } from '@base-ui/utils/store';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
import { useMergedRefs } from '@base-ui/utils/useMergedRefs';
import { useRefWithInit } from '@base-ui/utils/useRefWithInit';
import { useStableCallback } from '@base-ui/utils/useStableCallback';
import { warn } from '@base-ui/utils/warn';
import type { BaseUIComponentProps } from '../../internals/types';
import {
  ListVirtualizer,
  type ListVirtualizerRenderRowParameters,
  type ListVirtualizerRow,
} from '../../internals/virtualization/ListVirtualizer';
import type { ListVirtualizerHandle } from '../../internals/virtualization/ListVirtualizationRegistry';
import { useVirtualizationListContext } from '../../internals/virtualization/VirtualizationListContext';
import { useSelectDerivedItemsContext, useSelectRootContext } from '../root/SelectRootContext';
import { selectors } from '../store';
import type { SelectItemData } from '../utils/resolveSelectItems';
import { SelectVirtualItemContext } from './SelectVirtualItemContext';
import { SelectVirtualizerCssVars } from './SelectVirtualizerCssVars';
import { mergeProps } from '../../merge-props';

type VirtualizerItemKey = string;

interface SelectVirtualRowModel<Value> {
  item: SelectItemData<Value>;
  itemIndex: number;
  type: 'item';
  virtualRowIndex: number;
}

interface SelectVirtualRowProps<Value> {
  children: (item: SelectItemData<Value>, index: number) => React.ReactElement;
  itemCount: number;
  model: SelectVirtualRowModel<Value>;
}

function SelectVirtualRowImpl<Value>(props: SelectVirtualRowProps<Value>) {
  const { children, itemCount, model } = props;
  const registeredItemCountRef = React.useRef(0);

  const registerItem = React.useCallback(() => {
    registeredItemCountRef.current += 1;
    return () => {
      registeredItemCountRef.current -= 1;
    };
  }, []);

  if (process.env.NODE_ENV !== 'production') {
    // The build-time environment never changes during a component's lifetime.
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useIsoLayoutEffect(() => {
      if (registeredItemCountRef.current !== 1) {
        warn(
          'Each <Select.Virtualizer> item renderer must render exactly one <Select.Item>. ' +
            `Rendered ${registeredItemCountRef.current} items for the value at index ${model.itemIndex}.`,
        );
      }
    });
  }

  const contextValue = React.useMemo(
    () => ({
      index: model.itemIndex,
      props: {
        'aria-posinset': model.itemIndex + 1,
        'aria-setsize': itemCount,
        'data-index': model.itemIndex,
      },
      registerItem: process.env.NODE_ENV === 'production' ? undefined : registerItem,
    }),
    [itemCount, model.itemIndex, registerItem],
  );

  return (
    <SelectVirtualItemContext.Provider value={contextValue}>
      {children(model.item, model.itemIndex)}
    </SelectVirtualItemContext.Provider>
  );
}

function areVirtualRowPropsEqual<Value>(
  previous: SelectVirtualRowProps<Value>,
  next: SelectVirtualRowProps<Value>,
) {
  return (
    previous.children === next.children &&
    previous.itemCount === next.itemCount &&
    previous.model.item === next.model.item &&
    previous.model.itemIndex === next.model.itemIndex &&
    previous.model.virtualRowIndex === next.model.virtualRowIndex
  );
}

const SelectVirtualRow = React.memo(
  SelectVirtualRowImpl,
  areVirtualRowPropsEqual,
) as typeof SelectVirtualRowImpl;

/**
 * Renders a window of visible and overscanned items in a flat select list.
 * Renders a scrollable `<div>` element.
 *
 * Requires the `items` prop on `<Select.Root>` and must be the only item-rendering child of
 * `<Select.List>`. Grouped collections are not currently supported.
 *
 * Documentation: [Base UI Select](https://base-ui.com/react/components/select)
 */
export const SelectVirtualizer = React.forwardRef(function SelectVirtualizer<Value>(
  componentProps: SelectVirtualizer.Props<Value>,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const {
    children,
    estimatedItemHeight,
    getItemKey,
    overscanPx,
    enabled = true,
    ...elementProps
  } = componentProps;

  const { store, scrollHandlerRef } = useSelectRootContext();
  const { flatItems, hasItems, isGrouped } = useSelectDerivedItemsContext();
  const activeIndex = useStore(store, selectors.activeIndex);
  const highlightType = useStore(store, selectors.highlightType);
  const insideList = useVirtualizationListContext();
  const objectKeyRegistry = useRefWithInit(createObjectKeyRegistry).current;

  const getEstimatedItemHeight = React.useCallback(
    (item: SelectItemData<Value>, index: number) => {
      const size =
        typeof estimatedItemHeight === 'function'
          ? estimatedItemHeight(item, index)
          : estimatedItemHeight;
      return Math.max(1, size);
    },
    [estimatedItemHeight],
  );

  const rows = React.useMemo<ListVirtualizerRow<SelectVirtualRowModel<Value>>[]>(() => {
    const keys = process.env.NODE_ENV === 'production' ? undefined : new Set<VirtualizerItemKey>();

    return flatItems.map((item, itemIndex) => {
      const typedItem = item as SelectItemData<Value>;
      const rawKey = getItemKey ? getItemKey(typedItem) : undefined;
      const key = getItemKey
        ? normalizeItemKey(rawKey)
        : getDefaultItemKey(typedItem.value, objectKeyRegistry);

      if (process.env.NODE_ENV !== 'production') {
        if (isObjectValue(typedItem.value) && !getItemKey) {
          warn(
            '<Select.Virtualizer> requires `getItemKey` when item values are objects. ' +
              'Return a stable string or number that uniquely identifies each item.',
          );
        }
        if (keys?.has(key)) {
          warn(
            `<Select.Virtualizer> received the duplicate item key \`${String(rawKey ?? typedItem.value)}\`. ` +
              'Each item must have a unique key.',
          );
        }
        keys?.add(key);
      }

      return {
        id: key,
        model: {
          item: typedItem,
          itemIndex,
          type: 'item',
          virtualRowIndex: itemIndex,
        },
      };
    });
  }, [flatItems, getItemKey, objectKeyRegistry]);

  const focusedRowIndex = activeIndex == null ? undefined : activeIndex;
  const pinnedRowIndexes = React.useMemo(
    () => (focusedRowIndex == null ? [] : [focusedRowIndex]),
    [focusedRowIndex],
  );

  const renderRow = React.useCallback(
    (params: ListVirtualizerRenderRowParameters<SelectVirtualRowModel<Value>>) => (
      <SelectVirtualRow itemCount={flatItems.length} model={params.row.model}>
        {children}
      </SelectVirtualRow>
    ),
    [children, flatItems.length],
  );

  const estimateRowHeight = React.useCallback(
    (model: SelectVirtualRowModel<Value>) =>
      getEstimatedItemHeight(model.item, model.virtualRowIndex),
    [getEstimatedItemHeight],
  );

  const listVirtualizerRef = React.useRef<ListVirtualizerHandle | null>(null);
  const getRowMetrics = useStableCallback(
    (rowIndex: number) => listVirtualizerRef.current?.getRowMetrics(rowIndex) ?? null,
  );
  const resetScroll = useStableCallback(() => listVirtualizerRef.current?.resetScroll());
  const virtualizerHandle = React.useMemo(
    () => ({ getRowMetrics, resetScroll }),
    [getRowMetrics, resetScroll],
  );
  const virtualizerId = useRefWithInit(() => Symbol('Base UI list virtualizer')).current;

  useIsoLayoutEffect(() => {
    const registry = store.state.virtualizationRegistry;

    if (process.env.NODE_ENV !== 'production') {
      if (registry.virtualizers.size > 0) {
        warn('<Select.Root> must not contain more than one <Select.Virtualizer>.');
      }
      if (registry.nonVirtualItemCount > 0) {
        warn(
          '<Select.List> must not render static <Select.Item> elements alongside ' +
            '<Select.Virtualizer>. Render every list item through the virtualizer.',
        );
      }
    }

    registry.virtualizers.set(virtualizerId, virtualizerHandle);
    return () => {
      registry.virtualizers.delete(virtualizerId);
    };
  }, [store, virtualizerHandle, virtualizerId]);

  if (process.env.NODE_ENV !== 'production') {
    // The build-time environment never changes during a component's lifetime.
    // eslint-disable-next-line react-hooks/rules-of-hooks
    React.useEffect(() => {
      if (!hasItems) {
        warn('<Select.Virtualizer> requires the `items` prop on <Select.Root>.');
      }
      if (!insideList) {
        warn('<Select.Virtualizer> must be placed inside <Select.List>.');
      }
      if (isGrouped) {
        warn(
          '<Select.Virtualizer> does not currently support grouped collections. ' +
            'Render a flat item collection instead.',
        );
      }
    }, [hasItems, insideList, isGrouped]);
  }

  const handleUnconstrainedHeight = useStableCallback(() => {
    warn(
      '<Select.Virtualizer> must have a constrained height or maximum height. ' +
        'Without one, all items are rendered and virtualization provides no benefit.',
    );
  });

  const setVirtualizerElement = store.useStateSetter('virtualizerElement');
  const mergedRef = useMergedRefs(forwardedRef, setVirtualizerElement);
  const mergedElementProps = mergeProps(
    {
      onScroll(event: React.UIEvent<HTMLDivElement>) {
        scrollHandlerRef.current?.(event.currentTarget);
      },
    },
    elementProps,
  );
  const resolvedEstimatedItemHeight =
    typeof estimatedItemHeight === 'number' ? estimatedItemHeight : estimateRowHeight;
  const scrollToRowIndex = highlightType === 'pointer' ? undefined : focusedRowIndex;

  return (
    <ListVirtualizer
      {...mergedElementProps}
      apiRef={listVirtualizerRef}
      enabled={enabled}
      estimatedItemHeight={resolvedEstimatedItemHeight}
      onUnconstrainedHeight={handleUnconstrainedHeight}
      overscanPx={overscanPx}
      pinnedRowIndexes={pinnedRowIndexes}
      ref={mergedRef}
      renderRow={renderRow}
      rows={rows}
      scrollToRowIndex={scrollToRowIndex}
      totalSizeCssVariable={SelectVirtualizerCssVars.totalSize}
    />
  );
}) as {
  <Value>(
    props: SelectVirtualizer.Props<Value> & React.RefAttributes<HTMLDivElement>,
  ): React.JSX.Element;
};

function createObjectKeyRegistry() {
  return {
    objectKeys: new WeakMap<object, number>(),
    symbolKeys: new Map<symbol, number>(),
    nextObjectKey: 0,
    nextSymbolKey: 0,
  };
}

function getDefaultItemKey<Value>(
  item: Value,
  registry: ReturnType<typeof createObjectKeyRegistry>,
): VirtualizerItemKey {
  if (isObjectValue(item)) {
    const objectItem = item as object;
    let key = registry.objectKeys.get(objectItem);
    if (key === undefined) {
      key = registry.nextObjectKey;
      registry.nextObjectKey += 1;
      registry.objectKeys.set(objectItem, key);
    }
    return `object:${key}`;
  }

  if (typeof item === 'symbol') {
    let key = registry.symbolKeys.get(item);
    if (key === undefined) {
      key = registry.nextSymbolKey;
      registry.nextSymbolKey += 1;
      registry.symbolKeys.set(item, key);
    }
    return `symbol:${key}`;
  }

  return normalizeItemKey(item);
}

function normalizeItemKey(key: unknown): VirtualizerItemKey {
  if (key === null) {
    return 'null';
  }
  return `${typeof key}:${String(key)}`;
}

function isObjectValue(value: unknown): value is object {
  return (typeof value === 'object' && value !== null) || typeof value === 'function';
}

export interface SelectVirtualizerState {
  /** Whether the virtualized collection has no items. */
  empty: boolean;
  /** Total virtual content size in pixels. */
  totalSize: number;
}

interface SelectVirtualizerBaseProps<Value> extends Omit<
  BaseUIComponentProps<'div', SelectVirtualizerState>,
  'children'
> {
  /** Renders exactly one item for the given item data and logical index. */
  children: (item: SelectItemData<Value>, index: number) => React.ReactElement;
  /** Estimated item height in CSS pixels used before item elements have been measured. */
  estimatedItemHeight: number | ((item: SelectItemData<Value>, index: number) => number);
  /**
   * Pixel buffer rendered before and after the visible range.
   * Defaults to the larger of 150px and the estimated size of the first item.
   */
  overscanPx?: number | undefined;
  /** Whether virtualization is enabled. When `false`, all items are rendered. @default true */
  enabled?: boolean | undefined;
}

type SelectVirtualizerKeyProps<Value> = unknown extends Value
  ? {
      /** Returns a stable key for the item. */
      getItemKey: (item: SelectItemData<Value>) => string | number;
    }
  : [Extract<Value, object>] extends [never]
    ? {
        /** Returns a stable key for the item. */
        getItemKey?: ((item: SelectItemData<Value>) => string | number) | undefined;
      }
    : {
        /** Returns a stable key for the item. Required when item values are objects. */
        getItemKey: (item: SelectItemData<Value>) => string | number;
      };

export type SelectVirtualizerProps<Value = unknown> = SelectVirtualizerBaseProps<Value> &
  SelectVirtualizerKeyProps<Value>;

export namespace SelectVirtualizer {
  export type State = SelectVirtualizerState;
  export type Props<Value = unknown> = SelectVirtualizerProps<Value>;
}
