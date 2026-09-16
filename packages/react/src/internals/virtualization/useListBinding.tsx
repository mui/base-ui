'use client';
import * as React from 'react';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
import { useStableCallback } from '@base-ui/utils/useStableCallback';
import { warn } from '@base-ui/utils/warn';
import { EMPTY_ARRAY } from '@base-ui/utils/empty';
import { useBaseUiId } from '../useBaseUiId';
import {
  useVirtualizerHost,
  useVirtualizerHostState,
  type VirtualizerHandle,
  type VirtualizerHost,
  type VirtualizerHostState,
  type VirtualizerRegistry,
} from '../../virtualizer/host';
import type {
  VirtualizerActions,
  VirtualizerActiveIndex,
  VirtualizerActiveItem,
  VirtualizerGroup,
  VirtualizerGroupHeaderMetadata,
  VirtualizerGroupHeaderProps,
  VirtualizerItemAria,
  VirtualizerItemMetadata,
  VirtualizerItemProps,
  VirtualizerRenderGroupHeader,
  VirtualizerRowProps,
  VirtualizerScrollAlignment,
  VirtualizerScrollToIndexOptions,
} from '../../virtualizer/types';
import { isGroupedItems } from '../resolveValueLabel';
import {
  isGroupHeaderRow,
  type VirtualizerItemRowModel,
  type VirtualizerRenderRowParameters,
  type VirtualizerRowModel,
} from './types';

type ComponentName = string;

interface VirtualizerGroupHeaderRowProps<Item> {
  group: VirtualizerGroup<Item>;
  groupIndex: number;
  id: string | undefined;
  renderGroupHeader: VirtualizerRenderGroupHeader<Item>;
  /**
   * Attributes the header element itself carries when the virtualizer renders no wrapper around
   * it, or `undefined` when a wrapper carries them.
   */
  rowProps: VirtualizerRowProps | undefined;
  /**
   * The owning list's group-label channel, or `undefined` when the virtualizer renders standalone
   * headers that have no `<GroupLabel>` to publish the id to.
   */
  virtualGroupContext: React.Context<VirtualizerGroupHeaderMetadata | undefined> | undefined;
}

function VirtualizerGroupHeaderRowImpl<Item>(props: VirtualizerGroupHeaderRowProps<Item>) {
  const { group, groupIndex, id, renderGroupHeader, rowProps, virtualGroupContext } = props;

  const headerProps = React.useMemo<VirtualizerGroupHeaderProps>(
    () => ({ ...rowProps, id, 'aria-hidden': true }),
    [id, rowProps],
  );
  const metadata = React.useMemo<VirtualizerGroupHeaderMetadata>(
    () => ({ id, groupIndex }),
    [groupIndex, id],
  );

  // The name reaches a list's `<GroupLabel>` through the list's own context, and everything else
  // through the renderer's third argument. Both describe the same header.
  const content = renderGroupHeader(group, groupIndex, headerProps);

  if (virtualGroupContext == null) {
    return content;
  }

  const VirtualGroupContext = virtualGroupContext;
  return <VirtualGroupContext.Provider value={metadata}>{content}</VirtualGroupContext.Provider>;
}

const VirtualizerGroupHeaderRow = React.memo(
  VirtualizerGroupHeaderRowImpl,
) as typeof VirtualizerGroupHeaderRowImpl;

interface VirtualizerItemRowProps<Item> {
  children: (item: Item, index: number, itemProps: VirtualizerItemProps) => React.ReactElement;
  componentName: ComponentName | undefined;
  /** Whether the item states its position in the flat collection. */
  collectionAria: boolean;
  itemCount: number;
  model: VirtualizerItemRowModel<Item>;
  /**
   * Attributes the item element itself carries when the virtualizer renders no wrapper around
   * it, or `undefined` when a wrapper carries them.
   */
  rowProps: VirtualizerRowProps | undefined;
  /**
   * The owning list's item channel, or `undefined` when the virtualizer renders standalone rows
   * that have no `<Item>` to publish metadata to.
   */
  virtualItemContext: React.Context<VirtualizerItemMetadata | undefined> | undefined;
}

function VirtualizerItemRowImpl<Item>(props: VirtualizerItemRowProps<Item>) {
  const {
    children,
    collectionAria,
    componentName,
    itemCount,
    model,
    rowProps,
    virtualItemContext,
  } = props;
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
        ...rowProps,
        // Position in the flat collection, which is the set only for a collection that is one.
        // A hierarchical or two-dimensional one states position relative to something else and
        // declines these, keeping the rest of the metadata.
        ...(collectionAria
          ? {
              'aria-posinset': model.itemIndex + 1,
              // `-1` is the ARIA convention for a collection whose size is not known, which is
              // what a list still loading pages of results has. Anything else is the size of the
              // whole collection, not of the part currently loaded.
              'aria-setsize': itemCount,
            }
          : null),
        'data-index': model.itemIndex,
      },
      registerItem: process.env.NODE_ENV === 'production' ? undefined : registerItem,
    }),
    [collectionAria, itemCount, model.itemIndex, registerItem, rowProps],
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
    previous.collectionAria === next.collectionAria &&
    previous.componentName === next.componentName &&
    previous.itemCount === next.itemCount &&
    previous.model.item === next.model.item &&
    previous.model.itemIndex === next.model.itemIndex &&
    previous.rowProps === next.rowProps &&
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
   * Ignored when the collection comes from a surrounding host, which publishes its own
   * activation.
   */
  activeIndex: VirtualizerActiveIndex | null | undefined;
  children: (item: Item, index: number, itemProps: VirtualizerItemProps) => React.ReactElement;
  /**
   * Whether virtualization is requested. The resolved window can still be inactive while the list
   * needs every row mounted, and a disabled virtualizer renders every row, so the list root must
   * fall back to the scrolling it uses for static collections.
   */
  enabled: boolean;
  host: VirtualizerHost | undefined;
  /**
   * Which ARIA an item states for its position in the collection, as asked for by the
   * `itemAria` prop; `undefined` leaves it to the host, which defaults to the flat collection's.
   */
  itemAria: VirtualizerItemAria | undefined;
  /**
   * The collection to window, flat or grouped, when the virtualizer is given one directly. Takes
   * precedence over a surrounding host's collection.
   */
  items: ReadonlyArray<Item> | ReadonlyArray<VirtualizerGroup<Item>> | undefined;
  hostState: VirtualizerHostState | undefined;
  /**
   * Renders a group's header. Without it a grouped collection is windowed as its flat items.
   */
  renderGroupHeader: VirtualizerRenderGroupHeader<Item> | undefined;
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
  /**
   * The id the wrapper of a group references, for the header carrying the given ordinal;
   * `undefined` while the id hook has not resolved (React 17, first render).
   */
  getGroupHeaderId: (ordinal: number) => string | undefined;
  /**
   * The grouped view of `items`, when the collection is grouped and a header renderer is given;
   * `undefined` otherwise, so a flat list never builds a grouped projection.
   */
  groups: ReadonlyArray<VirtualizerGroup<Item>> | undefined;
  /** The flat collection to window, from whichever of the two sources supplies it. */
  items: ReadonlyArray<Item>;
  /** The item to keep mounted even outside the window. */
  pinnedItemIndex: number | undefined;
  renderRow: (
    params: VirtualizerRenderRowParameters<VirtualizerRowModel<Item>>,
  ) => React.ReactElement;
  scrollToRowAlignment: VirtualizerScrollAlignment;
  /** The item to scroll into view. */
  scrollToItemIndex: number | undefined;
  /**
   * Inset at the end edge the activation asks its item to rest clear of, in place of the
   * scrollport's `scroll-padding-bottom`; `undefined` when it asks for none.
   */
  scrollToRowPaddingEnd: number | undefined;
  /**
   * Inset at the start edge the activation asks its item to rest clear of, in place of the
   * scrollport's `scroll-padding-top`; `undefined` when it asks for none.
   */
  scrollToRowPaddingStart: number | undefined;
  /**
   * Whether the host mounted every row at once for its own purposes. `enabled` is already false
   * then; this tells that apart from the consumer disabling virtualization.
   */
  windowingSuspended: boolean;
}

/**
 * Resolves what `<Virtualizer>` windows, from either of its two sources: an `items` prop, or the
 * surrounding host's collection and highlight state. Supplies each row's item metadata, and
 * registers the imperative handle with the host, if any.
 *
 * The collection's source and the row's item channel are independent: a virtualizer given its own
 * `items` inside a host still publishes metadata through that host's `<Item>` context.
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
    itemAria,
    items: itemsProp,
    hostState,
    renderGroupHeader,
    totalItems,
  } = parameters;

  const componentName = host?.componentName;
  const virtualItemContext = host?.virtualItemContext;
  const virtualGroupContext = host?.virtualGroupContext;
  const warnUnsupportedConfiguration = host?.warnUnsupportedConfiguration;

  // An `items` prop is the virtualizer's own collection, and everything derived from a collection
  // comes with it. Mixing the two sources would window one list's items against another's state.
  const hasOwnCollection = itemsProp != null;
  const ownCollectionIsGrouped = hasOwnCollection && isGroupedItems(itemsProp);
  // A flat collection is returned by identity: the rows derived from it are cached on it, so a
  // fresh array of the same items would rehydrate the engine's geometry for nothing. A grouped
  // one is flattened once per collection.
  const ownItems = React.useMemo((): ReadonlyArray<Item> => {
    if (itemsProp == null) {
      return EMPTY_ARRAY as ReadonlyArray<Item>;
    }
    return isGroupedItems(itemsProp)
      ? (itemsProp as ReadonlyArray<VirtualizerGroup<Item>>).flatMap((group) => group.items)
      : (itemsProp as ReadonlyArray<Item>);
  }, [itemsProp]);
  const items = hasOwnCollection
    ? ownItems
    : ((hostState?.items ?? EMPTY_ARRAY) as ReadonlyArray<Item>);
  let sourceGroups: ReadonlyArray<VirtualizerGroup<Item>> | undefined;
  if (hasOwnCollection) {
    sourceGroups = ownCollectionIsGrouped
      ? (itemsProp as ReadonlyArray<VirtualizerGroup<Item>>)
      : undefined;
  } else {
    sourceGroups = hostState?.groups as ReadonlyArray<VirtualizerGroup<Item>> | undefined;
  }
  // Headers are what make a group a group here. Without a renderer the collection is windowed
  // as its flat items, which is at least the list the consumer can see is wrong.
  const hasGroupHeaders = sourceGroups != null && renderGroupHeader != null;
  const groups = hasGroupHeaders ? sourceGroups : undefined;
  // The repo's id hook rather than `React.useId`, which React 17 — still supported — lacks. On
  // React 17 it resolves only after the first render, and until then neither the header nor the
  // wrapper carries an id: a stand-in generated per render would differ between a server and a
  // client and fail hydration, as the repo's other labelled parts also avoid.
  const groupHeaderIdPrefix = useBaseUiId();
  const getGroupHeaderId = React.useCallback(
    (ordinal: number) =>
      groupHeaderIdPrefix == null ? undefined : `${groupHeaderIdPrefix}-group-${ordinal}`,
    [groupHeaderIdPrefix],
  );
  // The activation comes from whichever source supplies the collection, and is read down to
  // primitives here so an inline object cannot make an unchanged activation look like a new one,
  // and so the scroll decision cannot drift from the index it belongs to.
  const activation = hasOwnCollection ? activeIndexProp : hostState?.activeIndex;
  const activeItem =
    activation != null && typeof activation === 'object'
      ? (activation as VirtualizerActiveItem)
      : null;
  const activeIndex = activeItem ? activeItem.index : ((activation as number | null) ?? null);
  // An activation says for itself whether it scrolls. A host publishing a bare index has only its
  // deprecated flag to say it with, and the virtualizer's own prop scrolls by default.
  let scrollActiveIntoView: boolean;
  if (activeItem != null) {
    scrollActiveIntoView = activeItem.scroll ?? true;
  } else {
    scrollActiveIntoView = hasOwnCollection ? true : hostState?.scrollActiveIntoView === true;
  }
  const scrollActiveAlignment = activeItem?.align ?? 'auto';
  const scrollActivePaddingStart = activeItem?.paddingStart;
  const scrollActivePaddingEnd = activeItem?.paddingEnd;
  // Only a host asks for every row at once. The virtualizer sees the end of that as its own mode
  // returning to windowed, which is the transition it restores its viewport on.
  const windowingSuspended = hasOwnCollection ? false : hostState?.windowingSuspended === true;

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

    // eslint-disable-next-line react-hooks/rules-of-hooks
    React.useEffect(() => {
      if (itemAria === 'none' && componentName != null && host?.itemAria !== 'none') {
        warn(
          `<Virtualizer itemAria="none"> is rendered inside <${componentName}.List>, whose items ` +
            'state their position in the flat collection because that is the set they belong ' +
            'to. Remove `itemAria` here; a list whose items are placed relative to something ' +
            'else declares that itself.',
        );
      }
    }, [componentName, host?.itemAria, itemAria]);

    // eslint-disable-next-line react-hooks/rules-of-hooks
    React.useEffect(() => {
      if (sourceGroups != null && renderGroupHeader == null) {
        warn(
          '<Virtualizer> received a grouped collection but no `renderGroupHeader` prop, so the ' +
            'items are rendered without group headers. Pass `renderGroupHeader` to render a ' +
            'header for each group, or flatten the collection.',
        );
      }
    }, [renderGroupHeader, sourceGroups]);
  }

  const focusedItemIndex = activeIndex == null ? undefined : activeIndex;
  // The prop is the last word, then what the host declares its items need, then the flat
  // collection's own position, which is what a listbox's options are described by.
  const collectionAria = (itemAria ?? host?.itemAria ?? 'set') === 'set';

  const renderRow = React.useCallback(
    (params: VirtualizerRenderRowParameters<VirtualizerRowModel<Item>>) => {
      const { model } = params.row;

      if (isGroupHeaderRow(model)) {
        return (
          <VirtualizerGroupHeaderRow
            // The current group object rather than one captured in the row: the row model outlives
            // a filter pass that recreates the group with the same key and shape.
            group={groups![model.groupIndex]}
            groupIndex={model.groupIndex}
            id={getGroupHeaderId(model.ordinal)}
            renderGroupHeader={renderGroupHeader!}
            rowProps={params.rowProps}
            virtualGroupContext={virtualGroupContext}
          />
        );
      }

      return (
        <VirtualizerItemRow
          collectionAria={collectionAria}
          componentName={componentName}
          itemCount={totalItems ?? items.length}
          model={model}
          rowProps={params.rowProps}
          virtualItemContext={virtualItemContext}
        >
          {children}
        </VirtualizerItemRow>
      );
    },
    [
      children,
      collectionAria,
      componentName,
      getGroupHeaderId,
      groups,
      items.length,
      renderGroupHeader,
      totalItems,
      virtualGroupContext,
      virtualItemContext,
    ],
  );

  // Some list-level operations need every item mounted briefly (for example, collecting rendered
  // labels for browser autofill), which suspends windowing until they finish. The list root reads
  // this off the registry to know whether the virtualizer currently owns scrolling.
  const enabled = enabledProp && !windowingSuspended;
  // A hosted list that is not windowed scrolls its own item elements (see `scrollActivation.ts`),
  // so it hands the virtualizer a request only while the virtualizer owns scrolling. A standalone
  // list has no one else to scroll it, in either mode.
  const scrollToItemIndex =
    scrollActiveIntoView && (hasOwnCollection || enabled) ? focusedItemIndex : undefined;

  const apiRef = React.useRef<VirtualizerHandle | null>(null);
  const getItemMetrics = useStableCallback(
    (index: number) => apiRef.current?.getItemMetrics(index) ?? null,
  );
  const getIndexAtOffset = useStableCallback(
    (offset: number) => apiRef.current?.getIndexAtOffset(offset) ?? null,
  );
  const remeasure = useStableCallback(() => apiRef.current?.remeasure());
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

  React.useImperativeHandle(
    actionsRef,
    () => ({ getIndexAtOffset, getItemMetrics, remeasure, scrollToIndex }),
    [getIndexAtOffset, getItemMetrics, remeasure, scrollToIndex],
  );

  return {
    apiRef,
    enabled,
    getGroupHeaderId,
    groups,
    items,
    pinnedItemIndex: focusedItemIndex,
    renderRow,
    scrollToRowAlignment: scrollActiveAlignment,
    scrollToItemIndex,
    scrollToRowPaddingEnd: scrollActivePaddingEnd,
    scrollToRowPaddingStart: scrollActivePaddingStart,
    windowingSuspended,
  };
}

/**
 * Returns the surrounding host's wiring and state, if there is one.
 *
 * A virtualizer given its own collection through the `items` prop renders without a host, so this
 * only throws when neither source is available.
 */
export function useVirtualizerSources(hasOwnCollection: boolean) {
  const host = useVirtualizerHost();
  const hostState = useVirtualizerHostState();

  if (!hasOwnCollection && (!host || !hostState)) {
    throw new Error(
      'Base UI: <Virtualizer> was rendered without an `items` prop and outside of a component ' +
        'that publishes a collection to virtualize, so it has no collection to render. Pass ' +
        '`items`, or place it inside a list that supports virtualization, such as ' +
        '<Combobox.List> or <Autocomplete.List>. ' +
        'Documentation: https://base-ui.com/react/utils/virtualizer',
    );
  }

  return { host, hostState };
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
  registry: VirtualizerRegistry;
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
