'use client';
import * as React from 'react';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
import { useRefWithInit } from '@base-ui/utils/useRefWithInit';
import { useStableCallback } from '@base-ui/utils/useStableCallback';
import { warn } from '@base-ui/utils/warn';
import type { BaseUIComponentProps, HTMLProps } from '../types';
import type {
  ListVirtualizerRenderRowParameters,
  ListVirtualizerRow,
  ListVirtualizerState,
} from './ListVirtualizer';
import type {
  ListVirtualizationRegistry,
  ListVirtualizerHandle,
  ListVirtualizerScrollToIndexOptions,
} from './ListVirtualizationRegistry';

type ComponentName = 'Combobox' | 'Select';
type VirtualizerItemKey = string;

/**
 * Row model shared by flat collection virtualizers.
 */
export interface ListVirtualizerItemRowModel<Item> {
  item: Item;
  itemIndex: number;
  type: 'item';
  virtualRowIndex: number;
}

/**
 * Metadata provided to an item rendered by a built-in list virtualizer.
 */
export interface ListVirtualizerItemMetadata {
  /** Logical index in the full collection. */
  index: number;
  /** Accessibility and collection metadata applied to the item. */
  props: HTMLProps & {
    /** Logical index exposed as a DOM data attribute. */
    'data-index': number;
  };
  /** Registers the item rendered for this virtual row. */
  registerItem: (() => () => void) | undefined;
}

interface ListVirtualizerItemRowProps<Item> {
  children: (item: Item, index: number) => React.ReactElement;
  componentName: ComponentName;
  itemCount: number;
  model: ListVirtualizerItemRowModel<Item>;
  virtualItemContext: React.Context<ListVirtualizerItemMetadata | undefined>;
}

function ListVirtualizerItemRowImpl<Item>(props: ListVirtualizerItemRowProps<Item>) {
  const { children, componentName, itemCount, model, virtualItemContext } = props;
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
          `Each <${componentName}.Virtualizer> item renderer must render exactly one ` +
            `<${componentName}.Item>. Rendered ${registeredItemCountRef.current} items for the ` +
            `value at index ${model.itemIndex}.`,
        );
      }
    });
  }

  const contextValue = React.useMemo<ListVirtualizerItemMetadata>(
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

  const VirtualItemContext = virtualItemContext;
  return (
    <VirtualItemContext.Provider value={contextValue}>
      {children(model.item, model.itemIndex)}
    </VirtualItemContext.Provider>
  );
}

function areListVirtualizerItemRowPropsEqual<Item>(
  previous: ListVirtualizerItemRowProps<Item>,
  next: ListVirtualizerItemRowProps<Item>,
) {
  return (
    previous.children === next.children &&
    previous.componentName === next.componentName &&
    previous.itemCount === next.itemCount &&
    previous.model.item === next.model.item &&
    previous.model.itemIndex === next.model.itemIndex &&
    previous.model.virtualRowIndex === next.model.virtualRowIndex &&
    previous.virtualItemContext === next.virtualItemContext
  );
}

const ListVirtualizerItemRow = React.memo(
  ListVirtualizerItemRowImpl,
  areListVirtualizerItemRowPropsEqual,
) as typeof ListVirtualizerItemRowImpl;

export interface UseListVirtualizerAdapterParameters<Value, Item> {
  actionsRef: React.RefObject<ListVirtualizerAdapterActions | null> | undefined;
  activeIndex: number | null;
  children: (item: Item, index: number) => React.ReactElement;
  componentName: ComponentName;
  estimatedItemHeight: number | ((item: Item, index: number) => number);
  getItemKey: ((item: Item) => string | number) | undefined;
  getItemValue: (item: Item) => Value;
  items: ReadonlyArray<Item>;
  registry: ListVirtualizationRegistry;
  virtualItemContext: React.Context<ListVirtualizerItemMetadata | undefined>;
}

/**
 * Builds and registers the component-agnostic parts of a flat collection virtualizer adapter.
 */
export function useListVirtualizerAdapter<Value, Item>(
  parameters: UseListVirtualizerAdapterParameters<Value, Item>,
) {
  const {
    actionsRef,
    activeIndex,
    children,
    componentName,
    estimatedItemHeight,
    getItemKey,
    getItemValue,
    items,
    registry,
    virtualItemContext,
  } = parameters;

  const objectKeyRegistry = useRefWithInit(createObjectKeyRegistry).current;
  // These callbacks run during render, so use render-safe refs to keep their wrappers stable.
  const getItemKeyRef = React.useRef(getItemKey);
  getItemKeyRef.current = getItemKey;
  const getItemKeyStable = React.useCallback((item: Item) => getItemKeyRef.current?.(item), []);
  const getItemValueRef = React.useRef(getItemValue);
  getItemValueRef.current = getItemValue;
  const getItemValueStable = React.useCallback((item: Item) => getItemValueRef.current(item), []);
  const hasGetItemKey = getItemKey != null;
  const estimatedItemHeightRef = React.useRef(estimatedItemHeight);
  estimatedItemHeightRef.current = estimatedItemHeight;

  const getEstimatedItemHeight = React.useCallback((item: Item, index: number) => {
    const currentEstimatedItemHeight = estimatedItemHeightRef.current;
    const size =
      typeof currentEstimatedItemHeight === 'function'
        ? currentEstimatedItemHeight(item, index)
        : currentEstimatedItemHeight;
    return Math.max(1, size);
  }, []);

  const rows = React.useMemo<ListVirtualizerRow<ListVirtualizerItemRowModel<Item>>[]>(() => {
    const keys = process.env.NODE_ENV === 'production' ? undefined : new Set<VirtualizerItemKey>();

    return items.map((item, itemIndex) => {
      const itemValue = getItemValueStable(item);
      const rawKey = hasGetItemKey ? getItemKeyStable(item) : undefined;
      const key = hasGetItemKey
        ? normalizeItemKey(rawKey)
        : getDefaultItemKey(itemValue, objectKeyRegistry);

      if (process.env.NODE_ENV !== 'production') {
        if (isObjectValue(itemValue) && !hasGetItemKey) {
          warn(
            `<${componentName}.Virtualizer> requires \`getItemKey\` when item values are objects. ` +
              'Return a stable string or number that uniquely identifies each item.',
          );
        }
        if (keys?.has(key)) {
          warn(
            `<${componentName}.Virtualizer> received the duplicate item key ` +
              `\`${String(rawKey ?? itemValue)}\`. Each item must have a unique key.`,
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
        },
      };
    });
  }, [
    componentName,
    getItemKeyStable,
    getItemValueStable,
    hasGetItemKey,
    items,
    objectKeyRegistry,
  ]);

  const focusedRowIndex = activeIndex == null ? undefined : activeIndex;
  const pinnedRowIndexes = React.useMemo(
    () => (focusedRowIndex == null ? [] : [focusedRowIndex]),
    [focusedRowIndex],
  );

  const renderRow = React.useCallback(
    (params: ListVirtualizerRenderRowParameters<ListVirtualizerItemRowModel<Item>>) => (
      <ListVirtualizerItemRow
        componentName={componentName}
        itemCount={items.length}
        model={params.row.model}
        virtualItemContext={virtualItemContext}
      >
        {children}
      </ListVirtualizerItemRow>
    ),
    [children, componentName, items.length, virtualItemContext],
  );

  const estimateRowHeight = React.useCallback(
    (model: ListVirtualizerItemRowModel<Item>) =>
      getEstimatedItemHeight(model.item, model.virtualRowIndex),
    [getEstimatedItemHeight],
  );
  const resolvedEstimatedItemHeight =
    typeof estimatedItemHeight === 'number' ? estimatedItemHeight : estimateRowHeight;

  const apiRef = React.useRef<ListVirtualizerHandle | null>(null);
  const getRowMetrics = useStableCallback(
    (rowIndex: number) => apiRef.current?.getRowMetrics(rowIndex) ?? null,
  );
  const resetScroll = useStableCallback(() => apiRef.current?.resetScroll());
  const scrollToIndex = useStableCallback(
    (index: number, options?: ListVirtualizerScrollToIndexOptions) =>
      apiRef.current?.scrollToIndex(index, options),
  );
  const virtualizerHandle = React.useMemo(
    () => ({ getRowMetrics, resetScroll, scrollToIndex }),
    [getRowMetrics, resetScroll, scrollToIndex],
  );
  const virtualizerId = useRefWithInit(() => Symbol('Base UI list virtualizer')).current;

  useIsoLayoutEffect(() => {
    if (process.env.NODE_ENV !== 'production') {
      if (registry.virtualizers.size > 0) {
        warn(
          `<${componentName}.Root> must not contain more than one <${componentName}.Virtualizer>.`,
        );
      }
      if (registry.nonVirtualItemCount > 0) {
        warnAboutStaticItems(componentName);
      }
    }

    registry.virtualizers.set(virtualizerId, virtualizerHandle);
    return () => {
      registry.virtualizers.delete(virtualizerId);
    };
  }, [componentName, registry, virtualizerHandle, virtualizerId]);

  const onUnconstrainedHeight = useStableCallback(() => {
    warn(
      `<${componentName}.Virtualizer> must have a constrained height or maximum height. ` +
        'Without one, all items are rendered and virtualization provides no benefit.',
    );
  });

  React.useImperativeHandle(actionsRef, () => ({ scrollToIndex }), [scrollToIndex]);

  return {
    apiRef,
    estimatedItemHeight: resolvedEstimatedItemHeight,
    focusedRowIndex,
    onUnconstrainedHeight,
    pinnedRowIndexes,
    renderRow,
    rows,
  };
}

/**
 * Imperative actions exposed by a built-in list virtualizer.
 */
export interface ListVirtualizerAdapterActions {
  /**
   * Scrolls an item into view by its logical collection index.
   */
  scrollToIndex: (index: number, options?: ListVirtualizerScrollToIndexOptions) => void;
}

export interface UseNonVirtualizedItemRegistrationParameters {
  componentName: ComponentName;
  insideList: boolean;
  registry: ListVirtualizationRegistry;
  virtualized: boolean;
}

/**
 * Tracks static items so mixed static and built-in-virtualized lists can warn in either mount order.
 */
export function useNonVirtualizedItemRegistration(
  parameters: UseNonVirtualizedItemRegistrationParameters,
) {
  const { componentName, insideList, registry, virtualized } = parameters;

  if (process.env.NODE_ENV !== 'production') {
    // The build-time environment never changes during a component's lifetime.
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useIsoLayoutEffect(() => {
      if (virtualized || !insideList) {
        return undefined;
      }

      registry.nonVirtualItemCount += 1;

      if (registry.virtualizers.size > 0) {
        warnAboutStaticItems(componentName);
      }

      return () => {
        registry.nonVirtualItemCount -= 1;
      };
    }, [componentName, insideList, registry, virtualized]);
  }
}

/**
 * Shared public state exposed by flat collection virtualizer adapters.
 */
export type ListVirtualizerAdapterState = ListVirtualizerState;

/**
 * Shared public props for flat collection virtualizer adapters.
 */
export interface ListVirtualizerAdapterProps<
  Item,
  State extends ListVirtualizerAdapterState = ListVirtualizerAdapterState,
> extends Omit<BaseUIComponentProps<'div', State>, 'children'> {
  /** Renders exactly one item for the given value and logical index. */
  children: (item: Item, index: number) => React.ReactElement;
  /** Estimated item height in CSS pixels used before item elements have been measured. */
  estimatedItemHeight: number | ((item: Item, index: number) => number);
  /**
   * Pixel buffer rendered before and after the visible range.
   * Defaults to the larger of 150px and the estimated size of the first item.
   */
  overscanPx?: number | undefined;
  /** Whether virtualization is enabled. When `false`, all items are rendered. @default true */
  enabled?: boolean | undefined;
}

/**
 * Makes stable keys optional for primitive values and required for object or unknown values.
 */
export type ListVirtualizerKeyProps<Value, Item> = unknown extends Value
  ? {
      /**
       * Returns a stable key for the item value.
       *
       * Primitive item values use the value itself by default. Required when item values are
       * objects or the item type cannot be inferred.
       */
      getItemKey: (item: Item) => string | number;
    }
  : [Extract<Value, object>] extends [never]
    ? {
        /**
         * Returns a stable key for the item value.
         *
         * Primitive item values use the value itself by default. Required when item values are
         * objects.
         */
        getItemKey?: ((item: Item) => string | number) | undefined;
      }
    : {
        /**
         * Returns a stable key for the item value.
         *
         * Primitive item values use the value itself by default. Required when item values are
         * objects.
         */
        getItemKey: (item: Item) => string | number;
      };

/**
 * Creates an identity registry used to generate stable keys for object and symbol item values.
 */
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
  // React coerces keys to strings, so include the primitive type before that coercion happens.
  return `${typeof key}:${String(key)}`;
}

function isObjectValue(value: unknown): value is object {
  return (typeof value === 'object' && value !== null) || typeof value === 'function';
}

function warnAboutStaticItems(componentName: ComponentName) {
  warn(
    `<${componentName}.List> must not render static <${componentName}.Item> elements alongside ` +
      `<${componentName}.Virtualizer>. Render every list item through the virtualizer.`,
  );
}
