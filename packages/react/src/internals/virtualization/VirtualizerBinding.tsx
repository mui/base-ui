'use client';
import * as React from 'react';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
import { useRefWithInit } from '@base-ui/utils/useRefWithInit';
import { useStableCallback } from '@base-ui/utils/useStableCallback';
import { warn } from '@base-ui/utils/warn';
import { EMPTY_ARRAY } from '@base-ui/utils/empty';
import { areArraysEqual } from '@base-ui/utils/areArraysEqual';
import type {
  ListVirtualizationRegistry,
  VirtualizerActions,
  VirtualizerHandle,
  VirtualizerScrollToIndexOptions,
} from './ListVirtualizationRegistry';
import type {
  ListVirtualizationHost,
  ListVirtualizationListState,
} from './ListVirtualizationHostContext';
import type {
  VirtualizerActiveIndex,
  VirtualizerItemMetadata,
  VirtualizerItemProps,
  VirtualizerItemRowModel,
  VirtualizerRenderRowParameters,
  VirtualizerRow,
} from './types';

type ComponentName = string;
type VirtualizerItemKey = string;

const DEFAULT_ESTIMATED_ITEM_HEIGHT = 32;

interface VirtualizerItemRowProps<Item> {
  children: (item: Item, index: number, itemProps: VirtualizerItemProps) => React.ReactElement;
  componentName: ComponentName | undefined;
  itemCount: number;
  model: VirtualizerItemRowModel<Item>;
  /**
   * The owning list's item channel, or `undefined` when the virtualizer renders standalone rows
   * that have no `<Item>` to publish metadata to.
   */
  virtualItemContext: React.Context<VirtualizerItemMetadata | undefined> | undefined;
}

function VirtualizerItemRowImpl<Item>(props: VirtualizerItemRowProps<Item>) {
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
      // Only a list's own `<Item>` registers itself, so standalone rows have nothing to count.
      if (virtualItemContext != null && registeredItemCountRef.current !== 1) {
        warn(
          'Each <Virtualizer> item renderer must render exactly one ' +
            `<${componentName}.Item>. Rendered ${registeredItemCountRef.current} items for the ` +
            `value at index ${model.itemIndex}.`,
        );
      }
    });
  }

  const contextValue = React.useMemo<VirtualizerItemMetadata>(
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

  // The metadata reaches a list's `<Item>` through the list's own context, and everything else
  // through the renderer's third argument. Both describe the same row, so a row rendered inside a
  // list can mix them: a `<Combobox.Item>` keeps working next to a plain element that spreads them.
  const content = children(model.item, model.itemIndex, contextValue.props);

  if (virtualItemContext == null) {
    return content;
  }

  const VirtualItemContext = virtualItemContext;
  return <VirtualItemContext.Provider value={contextValue}>{content}</VirtualItemContext.Provider>;
}

function areVirtualizerItemRowPropsEqual<Item>(
  previous: VirtualizerItemRowProps<Item>,
  next: VirtualizerItemRowProps<Item>,
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

const VirtualizerItemRow = React.memo(
  VirtualizerItemRowImpl,
  areVirtualizerItemRowPropsEqual,
) as typeof VirtualizerItemRowImpl;

export interface UseVirtualizerBindingParameters<Item> {
  actionsRef: React.RefObject<VirtualizerActions | null> | undefined;
  /**
   * The item to keep mounted and scroll to, for a virtualizer given its own collection.
   * Ignored when the collection comes from the surrounding list, which tracks its own highlight.
   */
  activeIndex: VirtualizerActiveIndex | null | undefined;
  children: (item: Item, index: number, itemProps: VirtualizerItemProps) => React.ReactElement;
  /**
   * Whether virtualization is requested. The resolved window can still be inactive while the list
   * needs every row mounted, and a disabled virtualizer renders every row, so the list root must
   * fall back to the scrolling it uses for static collections.
   */
  enabled: boolean;
  estimatedItemHeight: number | ((item: Item, index: number) => number) | undefined;
  getItemKey: ((item: Item) => string | number) | undefined;
  host: ListVirtualizationHost | undefined;
  /**
   * The collection to window, when the virtualizer is given one directly. Takes precedence over a
   * surrounding list's collection.
   */
  items: ReadonlyArray<Item> | undefined;
  listState: ListVirtualizationListState | undefined;
  /**
   * Size of the whole collection when the rendered items are only part of it, such as a page of a
   * larger result set. Defaults to the number of items given.
   */
  totalItems: number | undefined;
}

/**
 * Resolves what `<Virtualizer>` windows, from either of its two sources: an `items` prop, or
 * the surrounding list's collection and highlight state. Turns that collection into stable rows,
 * supplies each row's item metadata, and registers the imperative handle with the list, if any.
 *
 * The collection's source and the row's item channel are independent: a virtualizer given its own
 * `items` inside a list still publishes metadata through that list's `<Item>` context.
 */
export function useVirtualizerBinding<Item>(parameters: UseVirtualizerBindingParameters<Item>) {
  const {
    actionsRef,
    activeIndex: activeIndexProp,
    children,
    enabled: enabledProp,
    estimatedItemHeight,
    getItemKey,
    host,
    items: itemsProp,
    listState,
    totalItems,
  } = parameters;

  const componentName = host?.componentName;
  const virtualItemContext = host?.virtualItemContext;
  const warnUnsupportedConfiguration = host?.warnUnsupportedConfiguration;

  // An `items` prop is the virtualizer's own collection, and everything derived from a collection
  // comes with it. Mixing the two sources would window one list's items against another's state.
  const hasOwnCollection = itemsProp != null;
  const items = (
    hasOwnCollection ? itemsProp : (listState?.items ?? EMPTY_ARRAY)
  ) as ReadonlyArray<Item>;
  // The activation is read down to primitives here so an inline object cannot make an unchanged
  // activation look like a new one, and so the scroll decision cannot drift from the index it
  // belongs to.
  const activeItem =
    activeIndexProp != null && typeof activeIndexProp === 'object' ? activeIndexProp : null;
  const propActiveIndex = activeItem
    ? activeItem.index
    : ((activeIndexProp as number | null) ?? null);
  const activeIndex = hasOwnCollection ? propActiveIndex : (listState?.activeIndex ?? null);
  const scrollActiveIntoView = hasOwnCollection
    ? (activeItem?.scroll ?? true)
    : listState?.scrollActiveIntoView === true;
  const scrollActiveAlignment = (hasOwnCollection && activeItem?.align) || 'auto';
  // Only a list asks for every row at once, and only a list restores its viewport afterwards.
  const renderAllRows = hasOwnCollection ? false : (listState?.renderAllRows ?? false);
  const renderAllRowsRestoreVersion = hasOwnCollection
    ? 0
    : (listState?.renderAllRowsRestoreVersion ?? 0);

  if (process.env.NODE_ENV !== 'production') {
    // The build-time environment never changes during a component's lifetime.
    // eslint-disable-next-line react-hooks/rules-of-hooks
    React.useEffect(() => {
      // Only a mounted virtualizer makes an unwindowable configuration a problem worth reporting.
      warnUnsupportedConfiguration?.();
    }, [warnUnsupportedConfiguration]);

    // eslint-disable-next-line react-hooks/rules-of-hooks
    React.useEffect(() => {
      if (hasOwnCollection && componentName != null) {
        warn(
          `<Virtualizer> received an \`items\` prop inside <${componentName}.List>, which ` +
            "windows that collection instead of the list's own. Item indices must match the " +
            `list's filtered collection, so remove \`items\` unless you are reproducing it exactly.`,
        );
      }
    }, [componentName, hasOwnCollection]);
  }

  const objectKeyRegistry = useRefWithInit(createObjectKeyRegistry).current;
  const hasGetItemKey = getItemKey != null;
  // Read through a ref so the collection, not the callback's identity, decides when these run
  // again. A feature layer writes them inline, which makes a new identity on each of its renders;
  // keying on that would re-derive a key and an estimate for every item each time, in the
  // component whose whole purpose is not to touch every item. They are contracted as pure
  // functions of the item, and `remeasure()` is how a change in what they return is announced.
  const getItemKeyRef = React.useRef(getItemKey);
  getItemKeyRef.current = getItemKey;
  const rowsCacheRef = React.useRef<VirtualizerRow<VirtualizerItemRowModel<Item>>[] | null>(null);
  const rows = React.useMemo<VirtualizerRow<VirtualizerItemRowModel<Item>>[]>(() => {
    const keys = process.env.NODE_ENV === 'production' ? undefined : new Set<VirtualizerItemKey>();

    const nextRows = items.map((item, itemIndex) => {
      const rawKey = hasGetItemKey ? getItemKeyRef.current!(item) : undefined;
      const key = hasGetItemKey
        ? normalizeItemKey(rawKey)
        : getDefaultItemKey(item, objectKeyRegistry);

      if (process.env.NODE_ENV !== 'production') {
        if (isObjectValue(item) && !hasGetItemKey) {
          warn(
            '<Virtualizer> requires `getItemKey` when item values are objects. ' +
              'Return a stable string or number that uniquely identifies each item.',
          );
        }
        if (keys?.has(key)) {
          warn(
            '<Virtualizer> received the duplicate item key ' +
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
    if (previousRows != null && areVirtualizerRowsEqual(previousRows, nextRows)) {
      return previousRows;
    }

    rowsCacheRef.current = nextRows;
    return nextRows;
  }, [hasGetItemKey, items, objectKeyRegistry]);

  const focusedRowIndex = activeIndex == null ? undefined : activeIndex;
  const scrollToRowIndex = scrollActiveIntoView ? focusedRowIndex : undefined;

  const renderRow = React.useCallback(
    (params: VirtualizerRenderRowParameters<VirtualizerItemRowModel<Item>>) => (
      <VirtualizerItemRow
        componentName={componentName}
        itemCount={totalItems ?? items.length}
        model={params.row.model}
        virtualItemContext={virtualItemContext}
      >
        {children}
      </VirtualizerItemRow>
    ),
    [children, componentName, items.length, totalItems, virtualItemContext],
  );

  const estimatedItemHeightCacheRef = React.useRef<{
    callback: (model: VirtualizerItemRowModel<Item>, rowIndex: number) => number;
    rows: VirtualizerRow<VirtualizerItemRowModel<Item>>[];
    values: number[];
  } | null>(null);
  const estimatedItemHeightRef = React.useRef(estimatedItemHeight);
  estimatedItemHeightRef.current = estimatedItemHeight;

  let resolvedEstimatedItemHeight:
    | number
    | ((model: VirtualizerItemRowModel<Item>, rowIndex: number) => number) =
    typeof estimatedItemHeight === 'number' ? estimatedItemHeight : DEFAULT_ESTIMATED_ITEM_HEIGHT;

  if (typeof estimatedItemHeight === 'function') {
    const cache = estimatedItemHeightCacheRef.current;
    if (cache != null && cache.rows === rows) {
      resolvedEstimatedItemHeight = cache.callback;
    } else {
      const estimate = estimatedItemHeightRef.current as (item: Item, index: number) => number;
      const values = items.map((item, index) => estimate(item, index));
      const cachedValues = cache?.values;
      // The engine rehydrates row metadata when this callback's identity changes, so the previous
      // one is kept when the new collection resolves to the same estimates: a re-derived array of
      // equal numbers is not a geometry change.
      const valuesAreEqual =
        cachedValues != null &&
        cachedValues.length === values.length &&
        values.every((value, index) => Object.is(value, cachedValues[index]));
      const nextCache =
        valuesAreEqual && cache != null
          ? { ...cache, rows }
          : {
              callback: (_model: VirtualizerItemRowModel<Item>, rowIndex: number) =>
                values[rowIndex] ?? 1,
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

  const apiRef = React.useRef<VirtualizerHandle | null>(null);
  const getItemMetrics = useStableCallback(
    (index: number) => apiRef.current?.getItemMetrics(index) ?? null,
  );
  const getIndexAtOffset = useStableCallback(
    (offset: number) => apiRef.current?.getIndexAtOffset(offset) ?? null,
  );
  const [, bumpEstimateRevision] = React.useReducer((value: number) => value + 1, 0);
  const remeasure = useStableCallback(() => {
    // A per-item estimate resolves against the layout too, and it is derived per collection
    // rather than per render, so an invalidation has to reach it as well. Re-rendering is what
    // re-derives it, and the engine rehydrates again once the new estimates arrive.
    estimatedItemHeightCacheRef.current = null;
    bumpEstimateRevision();
    apiRef.current?.remeasure();
  });
  const resetScroll = useStableCallback(() => apiRef.current?.resetScroll());
  const scrollToIndex = useStableCallback(
    (index: number, options?: VirtualizerScrollToIndexOptions) =>
      apiRef.current?.scrollToIndex(index, options),
  );
  const virtualizerHandle = React.useMemo(
    () => ({ enabled, getIndexAtOffset, getItemMetrics, remeasure, resetScroll, scrollToIndex }),
    [enabled, getIndexAtOffset, getItemMetrics, remeasure, resetScroll, scrollToIndex],
  );

  useIsoLayoutEffect(() => {
    // A standalone virtualizer has no list root to coordinate scrolling and item registration with.
    if (host == null) {
      return undefined;
    }

    const { registry } = host;

    if (process.env.NODE_ENV !== 'production') {
      if (registry.virtualizer != null) {
        warn(`<${host.componentName}.Root> must not contain more than one <Virtualizer>.`);
      }
      if (registry.nonVirtualItemCount > 0) {
        warnAboutStaticItems(host.componentName);
      }
    }

    registry.virtualizer = virtualizerHandle;
    return () => {
      if (registry.virtualizer === virtualizerHandle) {
        registry.virtualizer = null;
      }
    };
  }, [host, virtualizerHandle]);

  const onUnconstrainedHeight = useStableCallback(() => {
    warn(
      '<Virtualizer> must have a constrained height or maximum height. ' +
        'Without one, all items are rendered and virtualization provides no benefit.',
    );
  });

  React.useImperativeHandle(
    actionsRef,
    () => ({ getIndexAtOffset, getItemMetrics, remeasure, scrollToIndex }),
    [getIndexAtOffset, getItemMetrics, remeasure, scrollToIndex],
  );

  return {
    apiRef,
    enabled,
    estimatedItemHeight: resolvedEstimatedItemHeight,
    onUnconstrainedHeight,
    pinnedRowIndex: focusedRowIndex,
    renderRow,
    restoreViewportVersion: renderAllRowsRestoreVersion,
    rows,
    scrollToRowAlignment: scrollActiveAlignment,
    scrollToRowIndex,
  };
}

export interface UseVirtualItemDiagnosticsParameters {
  componentName: ComponentName;
  disabledProp: boolean;
  hasIsItemDisabled: boolean;
  virtualItem: VirtualizerItemMetadata | undefined;
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

function areVirtualizerRowsEqual<Item>(
  previous: VirtualizerRow<VirtualizerItemRowModel<Item>>[],
  next: VirtualizerRow<VirtualizerItemRowModel<Item>>[],
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
      '<Virtualizer>. Render every list item through the virtualizer.',
  );
}
