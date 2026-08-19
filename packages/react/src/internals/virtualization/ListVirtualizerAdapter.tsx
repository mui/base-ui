'use client';
import * as React from 'react';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
import { useRefWithInit } from '@base-ui/utils/useRefWithInit';
import { useStableCallback } from '@base-ui/utils/useStableCallback';
import { warn } from '@base-ui/utils/warn';
import { areArraysEqual } from '@base-ui/utils/areArraysEqual';
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
import { useVirtualizationListContext } from './VirtualizationListContext';

type ComponentName = 'Combobox' | 'Select';
type VirtualizerItemKey = string;

const DEFAULT_ESTIMATED_ITEM_HEIGHT = 32;

/**
 * Row model shared by flat collection virtualizers.
 */
export interface ListVirtualizerItemRowModel<Item> {
  item: Item;
  itemIndex: number;
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

  const registerItem = useStableCallback(() => {
    registeredItemCountRef.current += 1;
    return () => {
      registeredItemCountRef.current -= 1;
    };
  });

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
        // `-1` is the ARIA convention for a collection whose size is not known, which is what a
        // list still loading pages of results has. Anything else is the size of the whole
        // collection, not of the part currently loaded.
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
  /**
   * Whether the virtual window is active. A disabled virtualizer renders every row, so the list
   * root must fall back to the scrolling it uses for static collections.
   */
  enabled: boolean;
  estimatedItemHeight: number | ((item: Item, index: number) => number) | undefined;
  getItemKey: ((item: Item) => string | number) | undefined;
  getItemValue: (item: Item) => Value;
  hasItems: boolean;
  highlightType: 'none' | 'keyboard' | 'pointer';
  isGrouped: boolean;
  items: ReadonlyArray<Item>;
  registry: ListVirtualizationRegistry;
  /**
   * Size of the whole collection when the rendered items are only part of it, such as a page of a
   * larger result set. Defaults to the number of items given.
   */
  totalItems: number | undefined;
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
    enabled,
    estimatedItemHeight,
    getItemKey,
    getItemValue,
    hasItems,
    highlightType,
    isGrouped,
    items,
    registry,
    totalItems,
    virtualItemContext,
  } = parameters;

  const insideList = useVirtualizationListContext();

  if (process.env.NODE_ENV !== 'production') {
    // The build-time environment never changes during a component's lifetime.
    // eslint-disable-next-line react-hooks/rules-of-hooks
    React.useEffect(() => {
      if (!hasItems) {
        warn(
          `<${componentName}.Virtualizer> requires the \`items\` prop on <${componentName}.Root>.`,
        );
      }
      if (!insideList) {
        warn(`<${componentName}.Virtualizer> must be placed inside <${componentName}.List>.`);
      }
      if (isGrouped) {
        warn(
          `<${componentName}.Virtualizer> does not currently support grouped collections. ` +
            'Render a flat item collection instead.',
        );
      }
    }, [componentName, hasItems, insideList, isGrouped]);
  }

  const objectKeyRegistry = useRefWithInit(createObjectKeyRegistry).current;
  const hasGetItemKey = getItemKey != null;
  // A new callback can either be an equivalent inline function or resolve different keys.
  // Re-evaluate it, then retain the row array when the resolved identity is unchanged.
  const rowsCacheRef = React.useRef<ListVirtualizerRow<ListVirtualizerItemRowModel<Item>>[] | null>(
    null,
  );
  const rows = React.useMemo<ListVirtualizerRow<ListVirtualizerItemRowModel<Item>>[]>(() => {
    const keys = process.env.NODE_ENV === 'production' ? undefined : new Set<VirtualizerItemKey>();

    const nextRows = items.map((item, itemIndex) => {
      const itemValue = getItemValue(item);
      const rawKey = hasGetItemKey ? getItemKey(item) : undefined;
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
        },
      };
    });

    const previousRows = rowsCacheRef.current;
    if (previousRows != null && areListVirtualizerRowsEqual(previousRows, nextRows)) {
      return previousRows;
    }

    rowsCacheRef.current = nextRows;
    return nextRows;
  }, [componentName, getItemKey, getItemValue, hasGetItemKey, items, objectKeyRegistry]);

  const focusedRowIndex = activeIndex == null ? undefined : activeIndex;
  // Pointer highlights follow the cursor; scrolling to them would move the list under it.
  const scrollToRowIndex = highlightType === 'pointer' ? undefined : focusedRowIndex;

  const renderRow = React.useCallback(
    (params: ListVirtualizerRenderRowParameters<ListVirtualizerItemRowModel<Item>>) => (
      <ListVirtualizerItemRow
        componentName={componentName}
        itemCount={totalItems ?? items.length}
        model={params.row.model}
        virtualItemContext={virtualItemContext}
      >
        {children}
      </ListVirtualizerItemRow>
    ),
    [children, componentName, items.length, totalItems, virtualItemContext],
  );

  const estimatedItemHeightCacheRef = React.useRef<{
    callback: (model: ListVirtualizerItemRowModel<Item>, rowIndex: number) => number;
    source: (item: Item, index: number) => number;
    rows: ListVirtualizerRow<ListVirtualizerItemRowModel<Item>>[];
    values: number[];
  } | null>(null);

  let resolvedEstimatedItemHeight:
    | number
    | ((model: ListVirtualizerItemRowModel<Item>, rowIndex: number) => number) =
    typeof estimatedItemHeight === 'number' ? estimatedItemHeight : DEFAULT_ESTIMATED_ITEM_HEIGHT;

  if (typeof estimatedItemHeight === 'function') {
    const cache = estimatedItemHeightCacheRef.current;
    if (cache != null && cache.source === estimatedItemHeight && cache.rows === rows) {
      resolvedEstimatedItemHeight = cache.callback;
    } else {
      const values = items.map((item, index) => estimatedItemHeight(item, index));
      const cachedValues = cache?.values;
      const valuesAreEqual =
        cachedValues != null &&
        cachedValues.length === values.length &&
        values.every((value, index) => Object.is(value, cachedValues[index]));
      const nextCache =
        valuesAreEqual && cache != null
          ? {
              ...cache,
              source: estimatedItemHeight,
              rows,
            }
          : {
              callback: (_model: ListVirtualizerItemRowModel<Item>, rowIndex: number) =>
                values[rowIndex] ?? 1,
              source: estimatedItemHeight,
              rows,
              values,
            };
      estimatedItemHeightCacheRef.current = nextCache;
      resolvedEstimatedItemHeight = nextCache.callback;
    }
  }

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
    () => ({ enabled, getRowMetrics, resetScroll, scrollToIndex }),
    [enabled, getRowMetrics, resetScroll, scrollToIndex],
  );

  useIsoLayoutEffect(() => {
    if (process.env.NODE_ENV !== 'production') {
      if (registry.virtualizer != null) {
        warn(
          `<${componentName}.Root> must not contain more than one <${componentName}.Virtualizer>.`,
        );
      }
      if (registry.nonVirtualItemCount > 0) {
        warnAboutStaticItems(componentName);
      }
    }

    registry.virtualizer = virtualizerHandle;
    return () => {
      if (registry.virtualizer === virtualizerHandle) {
        registry.virtualizer = null;
      }
    };
  }, [componentName, registry, virtualizerHandle]);

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
    renderRow,
    rows,
    scrollToRowIndex,
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

export interface UseVirtualItemDiagnosticsParameters {
  componentName: ComponentName;
  disabledProp: boolean;
  hasIsItemDisabled: boolean;
  virtualItem: ListVirtualizerItemMetadata | undefined;
}

/**
 * Development-only diagnostics for an item rendered through a built-in list virtualizer.
 */
export function useVirtualItemDiagnostics(parameters: UseVirtualItemDiagnosticsParameters) {
  const { componentName, disabledProp, hasIsItemDisabled, virtualItem } = parameters;

  if (process.env.NODE_ENV !== 'production') {
    // The build-time environment never changes during a component's lifetime.
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useIsoLayoutEffect(() => virtualItem?.registerItem?.(), [virtualItem]);
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useIsoLayoutEffect(() => {
      if (virtualItem != null && disabledProp && !hasIsItemDisabled) {
        warn(
          `A virtualized <${componentName}.Item> is disabled, but <${componentName}.Root> does ` +
            'not have an `isItemDisabled` prop. The disabled state will be unavailable while ' +
            `the item is unmounted. Pass \`isItemDisabled\` to <${componentName}.Root> so ` +
            'keyboard navigation can skip it.',
        );
      }
    }, [componentName, disabledProp, hasIsItemDisabled, virtualItem]);
  }
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

      if (registry.virtualizer != null) {
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

function areListVirtualizerRowsEqual<Item>(
  previous: ListVirtualizerRow<ListVirtualizerItemRowModel<Item>>[],
  next: ListVirtualizerRow<ListVirtualizerItemRowModel<Item>>[],
) {
  return areArraysEqual(
    previous,
    next,
    (previousRow, nextRow) =>
      previousRow.id === nextRow.id &&
      previousRow.model.item === nextRow.model.item &&
      previousRow.model.itemIndex === nextRow.model.itemIndex,
  );
}

/**
 * Shared public props for flat collection virtualizer adapters.
 */
export interface ListVirtualizerAdapterProps<
  Item,
  State extends ListVirtualizerAdapterState = ListVirtualizerAdapterState,
> extends Omit<BaseUIComponentProps<'div', State>, 'children'> {
  /** Renders exactly one item for the given value and logical index. */
  children: (item: Item, index: number) => React.ReactElement;
  /**
   * Estimated item height in CSS pixels used before item elements have been measured.
   * A static number is automatically refined with the running average of measured items.
   * Provide a function to keep full control over per-item estimates.
   * @default 32
   */
  estimatedItemHeight?: number | ((item: Item, index: number) => number) | undefined;
  /**
   * Pixel buffer rendered before and after the visible range.
   * Defaults to the larger of 150px and the estimated size of the first item. The render buffer
   * always includes at least one estimated row, even when this prop is `0`.
   */
  overscanPx?: number | undefined;
  /**
   * Number of items in the whole collection, when the items given are only part of it — a page of
   * a larger result set, say. Rendered items report it as their `aria-setsize`, so assistive
   * technology describes the collection rather than the part of it currently loaded.
   *
   * Pass `-1` when the size is not known yet, which is the ARIA convention for it.
   * @default items.length
   */
  totalItems?: number | undefined;
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
