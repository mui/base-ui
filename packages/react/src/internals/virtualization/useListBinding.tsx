'use client';
import * as React from 'react';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
import { useStableCallback } from '@base-ui/utils/useStableCallback';
import { warn } from '@base-ui/utils/warn';
import { EMPTY_ARRAY } from '@base-ui/utils/empty';
import type {
  ListVirtualizationRegistry,
  VirtualizerActions,
  VirtualizerHandle,
  VirtualizerScrollAlignment,
  VirtualizerScrollToIndexOptions,
} from './ListVirtualizationRegistry';
import type {
  ListVirtualizationHost,
  ListVirtualizationListState,
} from './ListVirtualizationHostContext';
import type { HTMLProps } from '../types';
import type {
  VirtualizerActiveIndex,
  VirtualizerItemMetadata,
  VirtualizerItemProps,
  VirtualizerItemRowModel,
  VirtualizerRenderRowParameters,
} from './types';

type ComponentName = string;

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

export interface UseListBindingParameters<Item> {
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

export interface ListBinding<Item> {
  /** The virtualizer's own imperative handle, which this binding republishes to the list. */
  apiRef: React.RefObject<VirtualizerHandle | null>;
  /** Whether the window may be active. A list asking for every row suspends it. */
  enabled: boolean;
  /** The collection to window, from whichever of the two sources supplies it. */
  items: ReadonlyArray<Item>;
  onUnconstrainedHeight: () => void;
  /** The row to keep mounted even outside the window. */
  pinnedRowIndex: number | undefined;
  renderRow: (
    params: VirtualizerRenderRowParameters<VirtualizerItemRowModel<Item>>,
  ) => React.ReactElement;
  /** Props the owning list contributes to the scrollport, if any. */
  scrollportProps: HTMLProps | undefined;
  scrollToRowAlignment: VirtualizerScrollAlignment;
  scrollToRowIndex: number | undefined;
}

/**
 * Resolves what `<Virtualizer>` windows, from either of its two sources: an `items` prop, or the
 * surrounding list's collection and highlight state. Supplies each row's item metadata, and
 * registers the imperative handle with the list, if any.
 *
 * The collection's source and the row's item channel are independent: a virtualizer given its own
 * `items` inside a list still publishes metadata through that list's `<Item>` context.
 */
export function useListBinding<Item>(
  parameters: UseListBindingParameters<Item>,
): ListBinding<Item> {
  const {
    actionsRef,
    activeIndex: activeIndexProp,
    children,
    enabled: enabledProp,
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
  // Only a list asks for every row at once. The virtualizer sees the end of that as its own mode
  // returning to windowed, which is the transition it restores its viewport on.
  const windowingSuspended = hasOwnCollection ? false : listState?.windowingSuspended === true;

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

  // Some list-level operations need every item mounted briefly (for example, collecting rendered
  // labels for browser autofill), which suspends windowing until they finish. The list root reads
  // this off the registry to know whether the virtualizer currently owns scrolling.
  const enabled = enabledProp && !windowingSuspended;

  const apiRef = React.useRef<VirtualizerHandle | null>(null);
  const getItemMetrics = useStableCallback(
    (index: number) => apiRef.current?.getItemMetrics(index) ?? null,
  );
  const getIndexAtOffset = useStableCallback(
    (offset: number) => apiRef.current?.getIndexAtOffset(offset) ?? null,
  );
  const getScrollElement = useStableCallback(() => apiRef.current?.getScrollElement() ?? null);
  const remeasure = useStableCallback(() => apiRef.current?.remeasure());
  const resetScroll = useStableCallback(() => apiRef.current?.resetScroll());
  const scrollToIndex = useStableCallback(
    (index: number, options?: VirtualizerScrollToIndexOptions) =>
      apiRef.current?.scrollToIndex(index, options),
  );
  const virtualizerHandle = React.useMemo(
    () => ({
      enabled,
      getIndexAtOffset,
      getItemMetrics,
      getScrollElement,
      remeasure,
      resetScroll,
      scrollToIndex,
    }),
    [
      enabled,
      getIndexAtOffset,
      getItemMetrics,
      getScrollElement,
      remeasure,
      resetScroll,
      scrollToIndex,
    ],
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
    registry.onVirtualizerChange?.(virtualizerHandle);
    return () => {
      if (registry.virtualizer === virtualizerHandle) {
        registry.virtualizer = null;
        registry.onVirtualizerChange?.(null);
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
    items,
    onUnconstrainedHeight,
    pinnedRowIndex: focusedRowIndex,
    renderRow,
    scrollportProps: listState?.scrollportProps,
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

function warnAboutStaticItems(componentName: ComponentName) {
  warn(
    `<${componentName}.List> must not render static <${componentName}.Item> elements alongside ` +
      '<Virtualizer>. Render every list item through the virtualizer.',
  );
}
