'use client';
import * as React from 'react';
import { useSyncExternalStore } from 'use-sync-external-store/shim';
import { useStore } from '@base-ui/utils/store';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
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
import {
  useComboboxDerivedItemsContext,
  useComboboxRootContext,
} from '../root/ComboboxRootContext';
import { selectors } from '../store';
import { ComboboxVirtualItemContext } from './ComboboxVirtualItemContext';
import { ComboboxVirtualizerCssVars } from './ComboboxVirtualizerCssVars';

type VirtualizerItemKey = string;

interface ComboboxVirtualItemRowModel<Value> {
  item: Value;
  itemIndex: number;
  type: 'item';
  virtualRowIndex: number;
}

type ComboboxVirtualRowModel<Value> = ComboboxVirtualItemRowModel<Value>;

interface ComboboxVirtualRowProps<Value> {
  children: (item: Value, index: number) => React.ReactElement;
  itemCount: number;
  model: ComboboxVirtualRowModel<Value>;
}

/**
 * Renders a virtual row and provides its logical index and accessibility metadata to the
 * contained `<Combobox.Item>`.
 */
function ComboboxVirtualRowImpl<Value>(props: ComboboxVirtualRowProps<Value>) {
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
          'Each <Combobox.Virtualizer> item renderer must render exactly one ' +
            '<Combobox.Item>. Rendered ' +
            `${registeredItemCountRef.current} items for the value at index ${model.itemIndex}.`,
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

  const item = (
    <ComboboxVirtualItemContext.Provider value={contextValue}>
      {children(model.item, model.itemIndex)}
    </ComboboxVirtualItemContext.Provider>
  );

  return item;
}

function areVirtualRowPropsEqual<Value>(
  previous: ComboboxVirtualRowProps<Value>,
  next: ComboboxVirtualRowProps<Value>,
) {
  return (
    previous.children === next.children &&
    previous.itemCount === next.itemCount &&
    previous.model.item === next.model.item &&
    previous.model.itemIndex === next.model.itemIndex &&
    previous.model.virtualRowIndex === next.model.virtualRowIndex
  );
}

/**
 * Memoized virtual row that avoids rerendering item content while its row metadata is unchanged.
 */
const ComboboxVirtualRow = React.memo(
  ComboboxVirtualRowImpl,
  areVirtualRowPropsEqual,
) as typeof ComboboxVirtualRowImpl;

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
    children,
    estimatedItemHeight,
    getItemKey,
    overscanPx,
    enabled = true,
    ...elementProps
  } = componentProps;

  const store = useComboboxRootContext();
  const { flatFilteredItems, hasItems, isGrouped } = useComboboxDerivedItemsContext();
  const activeIndex = useStore(store, selectors.activeIndex);
  const externallyVirtualized = useStore(store, selectors.externallyVirtualized);
  const grid = useStore(store, selectors.grid);
  const highlightType = useStore(store, selectors.highlightType);
  const insideList = useVirtualizationListContext();

  const objectKeyRegistry = useRefWithInit(createObjectKeyRegistry).current;

  // Some list-level operations need every item mounted briefly (for example, collecting rendered
  // labels for browser autofill). The registry coordinates that mode across generic list
  // virtualizers without relying on an imperative handle that may not be registered yet.
  const renderAllRows = useSyncExternalStore(
    store.state.virtualizationRegistry.subscribeRenderAllRows,
    store.state.virtualizationRegistry.getRenderAllRows,
    store.state.virtualizationRegistry.getRenderAllRows,
  );
  const renderAllRowsRestoreVersion = useSyncExternalStore(
    store.state.virtualizationRegistry.subscribeRenderAllRows,
    store.state.virtualizationRegistry.getRenderAllRowsRestoreVersion,
    store.state.virtualizationRegistry.getRenderAllRowsRestoreVersion,
  );
  const virtualizationEnabled = enabled && !renderAllRows;

  const getEstimatedItemHeight = React.useCallback(
    (item: Value, index: number) => {
      const size =
        typeof estimatedItemHeight === 'function'
          ? estimatedItemHeight(item, index)
          : estimatedItemHeight;
      return Math.max(1, size);
    },
    [estimatedItemHeight],
  );

  const rows = React.useMemo<ListVirtualizerRow<ComboboxVirtualRowModel<Value>>[]>(() => {
    const keys = process.env.NODE_ENV === 'production' ? undefined : new Set<VirtualizerItemKey>();

    return flatFilteredItems.map((item, itemIndex) => {
      // Row ids are both React keys and MUI X measurement-cache identities. Normalize all
      // supplied keys because React stringifies them (`1` and `"1"` would otherwise collide).
      const rawKey = getItemKey ? getItemKey(item as Value) : undefined;
      const key = getItemKey
        ? normalizeItemKey(rawKey)
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
            `<Combobox.Virtualizer> received the duplicate item key \`${String(rawKey ?? item)}\`. ` +
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
        },
      };
    });
  }, [flatFilteredItems, getItemKey, objectKeyRegistry]);

  // Item and virtual-row indexes are identical while grouped rows are unsupported.
  const focusedRowIndex = activeIndex == null ? undefined : activeIndex;
  const pinnedRowIndexes = React.useMemo(
    () => (focusedRowIndex == null ? [] : [focusedRowIndex]),
    [focusedRowIndex],
  );

  const renderRow = React.useCallback(
    (params: ListVirtualizerRenderRowParameters<ComboboxVirtualRowModel<Value>>) => (
      <ComboboxVirtualRow itemCount={flatFilteredItems.length} model={params.row.model}>
        {children}
      </ComboboxVirtualRow>
    ),
    [children, flatFilteredItems.length],
  );

  const estimateRowHeight = React.useCallback(
    (model: ComboboxVirtualRowModel<Value>) =>
      getEstimatedItemHeight(model.item, model.virtualRowIndex),
    [getEstimatedItemHeight],
  );

  const listVirtualizerRef = React.useRef<ListVirtualizerHandle | null>(null);
  const resetScroll = useStableCallback(() => listVirtualizerRef.current?.resetScroll());
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

  if (process.env.NODE_ENV !== 'production') {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    React.useEffect(() => {
      if (!hasItems) {
        warn('<Combobox.Virtualizer> requires the `items` prop on <Combobox.Root>.');
      }
      if (!insideList) {
        warn('<Combobox.Virtualizer> must be placed inside <Combobox.List>.');
      }
      if (externallyVirtualized) {
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
    }, [externallyVirtualized, grid, hasItems, insideList, isGrouped]);
  }

  const handleUnconstrainedHeight = useStableCallback(() => {
    warn(
      '<Combobox.Virtualizer> must have a constrained height or maximum height. ' +
        'Without one, all items are rendered and virtualization provides no benefit.',
    );
  });

  const scrollToRowIndex = highlightType === 'pointer' ? undefined : focusedRowIndex;
  const resolvedEstimatedItemHeight =
    typeof estimatedItemHeight === 'number' ? estimatedItemHeight : estimateRowHeight;

  return (
    <ListVirtualizer
      {...elementProps}
      apiRef={listVirtualizerRef}
      enabled={virtualizationEnabled}
      estimatedItemHeight={resolvedEstimatedItemHeight}
      onUnconstrainedHeight={handleUnconstrainedHeight}
      overscanPx={overscanPx}
      pinnedRowIndexes={pinnedRowIndexes}
      ref={forwardedRef}
      renderRow={renderRow}
      restoreViewportVersion={renderAllRowsRestoreVersion}
      rows={rows}
      scrollToRowIndex={scrollToRowIndex}
      totalSizeCssVariable={ComboboxVirtualizerCssVars.totalSize}
    />
  );
}) as {
  <Value>(
    props: ComboboxVirtualizer.Props<Value> & React.RefAttributes<HTMLDivElement>,
  ): React.JSX.Element;
};

/**
 * Creates an identity registry used to generate stable keys for object and symbol item values.
 */
function createObjectKeyRegistry() {
  return {
    // Objects and symbols cannot be represented injectively by String(value). Preserve identity
    // for the lifetime of this virtualizer instead. Public object values still require getItemKey
    // because recreated object instances need an application-level stable identity.
    objectKeys: new WeakMap<object, number>(),
    symbolKeys: new Map<symbol, number>(),
    nextObjectKey: 0,
    nextSymbolKey: 0,
  };
}

/**
 * Returns a stable virtualizer key for an item when the consumer does not provide `getItemKey`.
 */
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
  children: (item: Value, index: number) => React.ReactElement;
  /**
   * Estimated item height in CSS pixels used before item elements have been measured.
   */
  estimatedItemHeight: number | ((item: Value, index: number) => number);
  /**
   * Pixel buffer rendered before and after the visible range.
   * Defaults to the larger of 150px and the estimated size of the first item.
   */
  overscanPx?: number | undefined;
  /**
   * Whether virtualization is enabled. When `false`, all items are rendered.
   * @default true
   */
  enabled?: boolean | undefined;
}

type ComboboxVirtualizerKeyProps<Value> = unknown extends Value
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
