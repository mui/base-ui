'use client';
import * as React from 'react';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
import { useRefWithInit } from '@base-ui/utils/useRefWithInit';
import { useStableCallback } from '@base-ui/utils/useStableCallback';
import { warn } from '@base-ui/utils/warn';
import { areArraysEqual } from '../areArraysEqual';
import type {
  ListVirtualizationRegistry,
  ListVirtualizerActions,
  ListVirtualizerHandle,
  ListVirtualizerScrollToIndexOptions,
} from './ListVirtualizationRegistry';
import type {
  ListVirtualizationHost,
  ListVirtualizationListState,
} from './ListVirtualizationHostContext';
import type {
  ListVirtualizerItemMetadata,
  ListVirtualizerItemRowModel,
  ListVirtualizerRenderRowParameters,
  ListVirtualizerRow,
} from './types';

type ComponentName = string;
type VirtualizerItemKey = string;

const DEFAULT_ESTIMATED_ITEM_HEIGHT = 32;

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
          'Each <ListVirtualizer> item renderer must render exactly one ' +
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
    previous.virtualItemContext === next.virtualItemContext
  );
}

const ListVirtualizerItemRow = React.memo(
  ListVirtualizerItemRowImpl,
  areListVirtualizerItemRowPropsEqual,
) as typeof ListVirtualizerItemRowImpl;

export interface UseListVirtualizerAdapterParameters<Item> {
  actionsRef: React.RefObject<ListVirtualizerActions | null> | undefined;
  children: (item: Item, index: number) => React.ReactElement;
  /**
   * Whether virtualization is requested. The resolved window can still be inactive while the list
   * needs every row mounted, and a disabled virtualizer renders every row, so the list root must
   * fall back to the scrolling it uses for static collections.
   */
  enabled: boolean;
  estimatedItemHeight: number | ((item: Item, index: number) => number) | undefined;
  getItemKey: ((item: Item) => string | number) | undefined;
  host: ListVirtualizationHost;
  listState: ListVirtualizationListState;
}

/**
 * Binds `<ListVirtualizer>` to its surrounding list: turns the filtered collection into stable
 * rows, supplies each row's item metadata, and registers the imperative handle with the list.
 */
export function useListVirtualizerAdapter<Item>(
  parameters: UseListVirtualizerAdapterParameters<Item>,
) {
  const {
    actionsRef,
    children,
    enabled: enabledProp,
    estimatedItemHeight,
    getItemKey,
    host,
    listState,
  } = parameters;

  const { componentName, registry, virtualItemContext, warnUnsupportedConfiguration } = host;
  const { activeIndex, renderAllRows, renderAllRowsRestoreVersion, scrollActiveIntoView } =
    listState;
  const items = listState.items as ReadonlyArray<Item>;

  if (process.env.NODE_ENV !== 'production') {
    // The build-time environment never changes during a component's lifetime.
    // eslint-disable-next-line react-hooks/rules-of-hooks
    React.useEffect(() => {
      // Only a mounted virtualizer makes an unwindowable configuration a problem worth reporting.
      warnUnsupportedConfiguration?.();
    }, [warnUnsupportedConfiguration]);
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
      const rawKey = hasGetItemKey ? getItemKey(item) : undefined;
      const key = hasGetItemKey
        ? normalizeItemKey(rawKey)
        : getDefaultItemKey(item, objectKeyRegistry);

      if (process.env.NODE_ENV !== 'production') {
        if (isObjectValue(item) && !hasGetItemKey) {
          warn(
            '<ListVirtualizer> requires `getItemKey` when item values are objects. ' +
              'Return a stable string or number that uniquely identifies each item.',
          );
        }
        if (keys?.has(key)) {
          warn(
            '<ListVirtualizer> received the duplicate item key ' +
              `\`${String(rawKey ?? item)}\`. Each item must have a unique key.`,
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
  }, [getItemKey, hasGetItemKey, items, objectKeyRegistry]);

  const focusedRowIndex = activeIndex == null ? undefined : activeIndex;
  const scrollToRowIndex = scrollActiveIntoView ? focusedRowIndex : undefined;

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

  // Some list-level operations need every item mounted briefly (for example, collecting rendered
  // labels for browser autofill), which suspends windowing until they finish. The list root reads
  // this off the registry to know whether the virtualizer currently owns scrolling.
  const enabled = enabledProp && !renderAllRows;

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
        warn(`<${componentName}.Root> must not contain more than one <ListVirtualizer>.`);
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
      '<ListVirtualizer> must have a constrained height or maximum height. ' +
        'Without one, all items are rendered and virtualization provides no benefit.',
    );
  });

  React.useImperativeHandle(actionsRef, () => ({ scrollToIndex }), [scrollToIndex]);

  return {
    apiRef,
    enabled,
    estimatedItemHeight: resolvedEstimatedItemHeight,
    onUnconstrainedHeight,
    pinnedRowIndex: focusedRowIndex,
    renderRow,
    restoreViewportVersion: renderAllRowsRestoreVersion,
    rows,
    scrollToRowIndex,
  };
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
      '<ListVirtualizer>. Render every list item through the virtualizer.',
  );
}
