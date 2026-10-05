'use client';
import * as React from 'react';
import { warn } from '@base-ui/utils/warn';
import { EMPTY_ARRAY } from '@base-ui/utils/empty';
import { useBaseUiId } from '../useBaseUiId';
import { useVirtualizerHost, useVirtualizerHostState } from '../../virtualizer/host';
import type { VirtualizerHost, VirtualizerHostState } from '../../virtualizer/host';
import type {
  VirtualizerActiveIndex,
  VirtualizerActiveItem,
  VirtualizerGroup,
  VirtualizerItemAria,
  VirtualizerItemProps,
  VirtualizerRenderGroupHeader,
  VirtualizerScrollAlignment,
} from '../../virtualizer/types';
import { isGroupedItems } from '../resolveValueLabel';
import { isGroupHeaderRow } from './types';
import { VirtualizerGroupHeaderRow, VirtualizerItemRow } from './VirtualizerRows';
import type { VirtualizerRenderRowParameters, VirtualizerRowModel } from './types';

export interface UseListBindingParameters<Item> {
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
  /**
   * Whether the collection is the virtualizer's own, given through `items`, rather than a host's.
   * Nobody else can scroll it into place then, whether or not it is windowed.
   */
  hasOwnCollection: boolean;
  /**
   * Whether windowing is asked for. A list asking for every row suspends it, and the virtualizer
   * can still find it has nothing to window against.
   */
  windowingRequested: boolean;
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
  /** Whether the activation asks for its item to be scrolled into view. */
  scrollsActiveItem: boolean;
  scrollToRowAlignment: VirtualizerScrollAlignment;
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
 * surrounding host's collection and highlight state, and supplies each row's item metadata.
 *
 * The collection's source and the row's item channel are independent: a virtualizer given its own
 * `items` inside a host still publishes metadata through that host's `<Item>` context.
 */
export function useListBinding<Item>(
  parameters: UseListBindingParameters<Item>,
): ListBinding<Item> {
  const {
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
  const hosted = host != null;
  const rendersItemPart = host?.rendersItemPart === true;
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
  // An activation says for itself whether it scrolls; a bare index is one that does.
  const scrollActiveIntoView = activeItem?.scroll ?? true;
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
            hosted={hosted}
            rowProps={params.rowProps}
          />
        );
      }

      return (
        <VirtualizerItemRow
          collectionAria={collectionAria}
          componentName={componentName}
          hosted={hosted}
          itemCount={totalItems ?? items.length}
          model={model}
          rendersItemPart={rendersItemPart}
          rowProps={params.rowProps}
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
      hosted,
      rendersItemPart,
      totalItems,
    ],
  );

  // Some list-level operations need every item mounted briefly (for example, collecting rendered
  // labels for browser autofill), which suspends windowing until they finish.
  const windowingRequested = enabledProp && !windowingSuspended;

  return {
    getGroupHeaderId,
    groups,
    hasOwnCollection,
    items,
    pinnedItemIndex: focusedItemIndex,
    renderRow,
    scrollsActiveItem: scrollActiveIntoView,
    scrollToRowAlignment: scrollActiveAlignment,
    scrollToRowPaddingEnd: scrollActivePaddingEnd,
    scrollToRowPaddingStart: scrollActivePaddingStart,
    windowingRequested,
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
