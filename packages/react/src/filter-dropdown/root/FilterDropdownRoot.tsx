'use client';
import * as React from 'react';
import { useRefWithInit } from '@base-ui/utils/useRefWithInit';
import { useStableCallback } from '@base-ui/utils/useStableCallback';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
import { NOOP } from '@base-ui/utils/empty';
import { getFilter } from '../../internals/filter';
import { useBaseUiId } from '../../internals/useBaseUiId';
import { useItemRegistry } from '../../internals/useItemRegistry';
import {
  FilterDropdownRootContext,
  FilterDropdownItemContext,
  FilterDropdownValueContext,
} from './FilterDropdownRootContext';
import type {
  FilterDropdownItemRegistration,
  FilterDropdownFilter,
  FilterDropdownRoot as FilterDropdownRootNamespace,
} from './FilterDropdownRootContext';
import { FilterDropdownStore } from '../store';

/**
 * Holds the filter query, matches it against the registered items, and publishes the result. The
 * host owns list navigation; this root moves the highlight through `setActiveIndex`.
 *
 * @internal
 */
export function FilterDropdownRoot(props: FilterDropdownRoot.Props): React.JSX.Element {
  const {
    children,
    open,
    disabled = false,
    openedByKeyboard = false,
    locale,
    value,
    query,
    onValueChange,
    filter,
    autoHighlight = false,
    triggerId: triggerIdProp,
    listRef,
    getActiveIndex,
    setActiveIndex,
    focusOwnerRef: focusOwnerRefProp,
  } = props;

  const parentItemContext = React.useContext(FilterDropdownItemContext);

  const [renderedListId, setRenderedListId] = React.useState<string | undefined>(undefined);
  const [inputFocusVisible, setInputFocusVisible] = React.useState(openedByKeyboard);
  const [keyboardModality, setKeyboardModality] = React.useState(openedByKeyboard);
  const [previousOpenedByKeyboard, setPreviousOpenedByKeyboard] = React.useState(openedByKeyboard);

  // Both reset when the host reports a new value; doing it during render skips an extra commit.
  if (openedByKeyboard !== previousOpenedByKeyboard) {
    setPreviousOpenedByKeyboard(openedByKeyboard);
    setInputFocusVisible(openedByKeyboard);
    setKeyboardModality(openedByKeyboard);
  }

  const {
    items: registeredItems,
    registerItem,
    liveItems,
  } = useItemRegistry<symbol, FilterDropdownItemRegistration>();

  const defaultId = useBaseUiId();
  const store = useRefWithInit(() => new FilterDropdownStore()).current;

  const fallbackFocusOwnerRef = React.useRef<HTMLElement | null>(null);
  const lastFilterQueryRef = React.useRef<string | null>(null);

  const defaultMatchItem = React.useMemo(() => getFilter({ locale }).contains, [locale]);

  const focusOwnerRef = focusOwnerRefProp ?? fallbackFocusOwnerRef;
  const filterQuery = (query ?? value).trim();
  // An unused inline filter must not re-run auto-highlighting when the consumer re-renders.
  const matchItem = filterQuery === '' || filter === null ? null : (filter ?? defaultMatchItem);
  const autoHighlightEnabled =
    open && (autoHighlight === 'always' || (autoHighlight && filterQuery !== ''));
  // React 17 resolves generated ids in an effect, so they must be read live rather than captured
  // in a state initializer.
  const defaultListId = defaultId ? `${defaultId}-list` : undefined;
  const listId = (renderedListId ?? defaultListId) || undefined;
  // The host owns the trigger. `null` and `''` both mean no element carries an id to point at.
  const triggerId = triggerIdProp || undefined;

  const handleValueChange = useStableCallback(onValueChange ?? NOOP);

  const handleItemsChange = useStableCallback((previousItems: readonly (HTMLElement | null)[]) => {
    const items = listRef.current;
    const activeIndex = getActiveIndex();

    // A positional highlight must not silently move to another item. A change that leaves the
    // highlighted item in place keeps it, such as an item appended after it or one that renders
    // once before the query filters it out. A query change already reset the highlight.
    if (
      activeIndex != null &&
      items[activeIndex] != null &&
      items[activeIndex] === previousItems[activeIndex]
    ) {
      return;
    }

    setActiveIndex(autoHighlightEnabled && items.length > 0 ? 0 : null);
  });

  store.useSyncedValue('registeredItemCount', registeredItems.size);

  // Re-runs on the registry snapshot published once every item in the commit has registered,
  // and on the committed query, because a controlled consumer can reject a proposed change. It
  // reads the live registry so items registered in this commit count before their snapshot.
  useIsoLayoutEffect(() => {
    if (!open && query === undefined) {
      return;
    }

    const queryChanged =
      lastFilterQueryRef.current !== null && lastFilterQueryRef.current !== filterQuery;
    lastFilterQueryRef.current = filterQuery;

    // With no query or external filtering, every registered item is visible. External filtering
    // still follows `autoHighlight`; otherwise the item set invalidates the highlight.
    if (matchItem === null) {
      store.set('visibleItemIds', null);
      // Registry updates, such as an item's text changing, keep the current highlight.
      if (autoHighlightEnabled && liveItems.size > 0) {
        if (queryChanged || getActiveIndex() == null) {
          setActiveIndex(0);
        }
      } else if (filterQuery === '' && queryChanged) {
        setActiveIndex(null);
      }
      return;
    }

    const currentIds = store.state.visibleItemIds;
    // The popup's content mounts a commit after the root opens. Publishing an empty result before
    // anything registered would hide every item as it arrives and remount the matches.
    if (currentIds === null && liveItems.size === 0) {
      return;
    }

    const nextIds = new Set<symbol>();
    let hasNewMatch = currentIds === null;
    liveItems.forEach(({ getText }, id) => {
      const text = getText();
      if (text != null && matchItem(text, filterQuery)) {
        nextIds.add(id);
        hasNewMatch ||= !currentIds?.has(id);
      }
    });

    // New matches or a smaller result set invalidate the previous item identities.
    if (hasNewMatch || currentIds?.size !== nextIds.size) {
      // The first filtered snapshot can land after initial keyboard navigation in React 18. It
      // has no prior result identity to invalidate, unless the controlled query itself changed.
      if (autoHighlightEnabled && nextIds.size > 0) {
        setActiveIndex(0);
      } else if (currentIds !== null || queryChanged) {
        setActiveIndex(null);
      }
      store.set('visibleItemIds', nextIds);
    } else if (autoHighlightEnabled && queryChanged && nextIds.size > 0) {
      setActiveIndex(0);
    }
  }, [
    open,
    query,
    filterQuery,
    registeredItems,
    liveItems,
    matchItem,
    autoHighlightEnabled,
    store,
    setActiveIndex,
    getActiveIndex,
  ]);

  const contextValue: FilterDropdownRootContext = React.useMemo(
    () => ({
      open,
      disabled,
      inputFocusVisible,
      setInputFocusVisible,
      keyboardModality,
      setKeyboardModality,
      autoHighlight,
      store,
      triggerId,
      defaultListId,
      listId,
      setRenderedListId,
      focusOwnerRef,
      setActiveIndex,
      onItemsChange: handleItemsChange,
      onValueChange: handleValueChange,
    }),
    [
      open,
      disabled,
      inputFocusVisible,
      keyboardModality,
      autoHighlight,
      store,
      triggerId,
      defaultListId,
      listId,
      focusOwnerRef,
      setActiveIndex,
      handleItemsChange,
      handleValueChange,
    ],
  );

  const itemContextValue: FilterDropdownItemContext = React.useMemo(
    () => ({
      parent: parentItemContext,
      store,
      registerItem,
      listRef,
    }),
    [parentItemContext, store, registerItem, listRef],
  );

  return (
    <FilterDropdownItemContext.Provider value={itemContextValue}>
      <FilterDropdownRootContext.Provider value={contextValue}>
        <FilterDropdownValueContext.Provider value={query ?? value}>
          {children}
        </FilterDropdownValueContext.Provider>
      </FilterDropdownRootContext.Provider>
    </FilterDropdownItemContext.Provider>
  );
}

export interface FilterDropdownRootProps {
  children?: React.ReactNode;
  /**
   * Whether the popup is currently open.
   */
  open: boolean;
  /** Whether the filter controls should be disabled. */
  disabled?: boolean | undefined;
  /** Whether the popup opened from the keyboard, so the input starts with its focus ring. */
  openedByKeyboard?: boolean | undefined;
  /**
   * Locale used for filtering comparisons.
   */
  locale?: Intl.LocalesArgument | undefined;
  /**
   * The filter input value.
   */
  value: string;
  /**
   * Query used for filtering when it differs from the input value, such as while closing.
   */
  query?: string | undefined;
  /**
   * Event handler called when the filter input value changes.
   */
  onValueChange?:
    | ((value: string, eventDetails: FilterDropdownRootNamespace.ChangeEventDetails) => void)
    | undefined;
  /**
   * Custom filter logic used when filtering items. Pass `null` to turn filtering off.
   */
  filter?: FilterDropdownFilter | null | undefined;
  /** Whether the first matching item should be highlighted automatically. */
  autoHighlight?: boolean | 'always' | undefined;
  /**
   * ID of a trigger rendered outside this root, which cannot register itself through the context.
   */
  triggerId?: string | null | undefined;
  /**
   * The host's DOM-ordered list of item elements.
   */
  listRef: React.RefObject<Array<HTMLElement | null>>;
  /**
   * Reads the host's highlighted index.
   */
  getActiveIndex: () => number | null;
  /**
   * Moves the host's highlight.
   */
  setActiveIndex: (index: number | null) => void;
  /**
   * The host's ref for the input, which holds real focus while the list is navigated virtually.
   */
  focusOwnerRef?: React.RefObject<HTMLElement | null> | undefined;
}

export namespace FilterDropdownRoot {
  export type Props = FilterDropdownRootProps;
  export type ChangeEventReason = FilterDropdownRootNamespace.ChangeEventReason;
  export type ChangeEventDetails = FilterDropdownRootNamespace.ChangeEventDetails;
}
