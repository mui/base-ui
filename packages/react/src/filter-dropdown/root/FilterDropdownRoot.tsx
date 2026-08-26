'use client';
import * as React from 'react';
import { useRefWithInit } from '@base-ui/utils/useRefWithInit';
import { useStableCallback } from '@base-ui/utils/useStableCallback';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
import { EMPTY_OBJECT, NOOP } from '@base-ui/utils/empty';
import { getFilter } from '../../internals/filter';
import type { HTMLProps } from '../../internals/types';
import { useBaseUiId } from '../../internals/useBaseUiId';
import { useItemRegistry } from '../../internals/useItemRegistry';
import {
  FilterDropdownRootContext,
  FilterDropdownItemContext,
  FilterDropdownValueContext,
  type FilterDropdownItemRegistration,
  type FilterDropdownFilter,
  type FilterDropdownRoot as FilterDropdownRootNamespace,
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
    inline = false,
    grid = false,
    disabled = false,
    inputFocusVisible = false,
    locale,
    value,
    query,
    onValueChange,
    filter,
    autoHighlight = false,
    triggerId: externalTriggerId,
    listRef,
    activeIndex = null,
    setActiveIndex = NOOP,
    inputProps = EMPTY_OBJECT,
    inputRef: externalFocusOwnerRef,
    onInputElementChange,
    virtualized = false,
  } = props;

  const parentItemContext = React.useContext(FilterDropdownItemContext);
  const [registeredListId, setListId] = React.useState<string | undefined>(undefined);
  const [focusVisible, setFocusVisible] = React.useState(inputFocusVisible);
  const [keyboardModality, setKeyboardModality] = React.useState(inputFocusVisible);
  const [hasInput, setHasInput] = React.useState(false);
  const [registeredItems, registerItem] = useItemRegistry<symbol, FilterDropdownItemRegistration>();
  const defaultId = useBaseUiId();
  const store = useRefWithInit(
    () =>
      new FilterDropdownStore({
        activeIndex,
        inputProps,
      }),
  ).current;

  const ownFocusOwnerRef = React.useRef<HTMLElement | null>(null);
  const focusOwnerRef = externalFocusOwnerRef ?? ownFocusOwnerRef;
  const inputElementRef = React.useRef<HTMLInputElement | null>(null);
  const listElementRef = React.useRef<HTMLDivElement | null>(null);
  const lastFilterQueryRef = React.useRef<string | null>(null);
  const defaultMatches = React.useMemo(() => getFilter({ locale }).contains, [locale]);

  const handleValueChange = useStableCallback(onValueChange ?? NOOP);

  const setInputElement = useStableCallback((element: HTMLInputElement | null) => {
    inputElementRef.current = element;
    focusOwnerRef.current = element ?? listElementRef.current;
    setHasInput(element !== null);
    onInputElementChange?.(element !== null);
  });

  const setListElement = useStableCallback((element: HTMLDivElement | null) => {
    listElementRef.current = element;
    if (inputElementRef.current === null) {
      focusOwnerRef.current = element;
    }
  });

  const onItemsChange = useStableCallback((hasItems: boolean) => {
    const filterQuery = (query ?? value).trim();
    const autoHighlightEnabled =
      open && (autoHighlight === 'always' || (autoHighlight && filterQuery !== ''));
    setActiveIndex(autoHighlightEnabled && hasItems ? 0 : null);
  });

  // React 17 resolves generated ids in an effect, so they must be read live rather than captured
  // in a state initializer.
  const defaultPopupId = defaultId ? `${defaultId}-popup` : undefined;
  const defaultListId = defaultId ? `${defaultId}-list` : undefined;
  // The host owns the trigger. `null` and `''` both mean no element carries an id to point at.
  const triggerId = externalTriggerId || undefined;
  const listId = (registeredListId ?? defaultListId) || undefined;

  useIsoLayoutEffect(() => {
    setFocusVisible(inputFocusVisible);
    setKeyboardModality(inputFocusVisible);
  }, [inputFocusVisible]);

  useIsoLayoutEffect(() => {
    store.set('registeredItemCount', registeredItems.size);
  }, [registeredItems, store]);

  store.useSyncedValues({ activeIndex, inputProps });

  // Runs against the registry snapshot published once every item in the commit has registered,
  // and against the committed query, because a controlled consumer can reject a proposed change.
  useIsoLayoutEffect(() => {
    if (!open && query === undefined) {
      return;
    }

    const filterQuery = (query ?? value).trim();
    const queryChanged =
      lastFilterQueryRef.current !== null && lastFilterQueryRef.current !== filterQuery;
    lastFilterQueryRef.current = filterQuery;
    const autoHighlightEnabled =
      open && (autoHighlight === 'always' || (autoHighlight && filterQuery !== ''));
    if (filterQuery === '') {
      store.set('visibleItemIds', null);
      if (autoHighlightEnabled && registeredItems.size > 0) {
        setActiveIndex(0);
      } else if (queryChanged) {
        setActiveIndex(null);
      }
      return;
    }

    // `filter: null` hands matching to the consumer, so there is no match pass and no visible-set
    // change to react to. `autoHighlight` must still follow the query; a highlight left on the
    // wrong item is invalidated by the item set changing instead.
    if (filter === null) {
      store.set('visibleItemIds', null);
      if (autoHighlightEnabled && registeredItems.size > 0) {
        setActiveIndex(0);
      }
      return;
    }

    const nextIds = new Set<symbol>();
    registeredItems.forEach(({ getText, keywords }, id) => {
      const filterText = getText();
      let matches;
      if (filter) {
        matches = filterText != null && filter(filterText, filterQuery, keywords);
      } else {
        matches =
          (filterText != null && defaultMatches(filterText, filterQuery)) ||
          keywords?.some((keyword) => defaultMatches(keyword, filterQuery));
      }
      if (matches) {
        nextIds.add(id);
      }
    });

    const currentIds = store.state.visibleItemIds;
    if (currentIds === null || !isSetEqual(currentIds, nextIds)) {
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
    value,
    query,
    registeredItems,
    filter,
    autoHighlight,
    defaultMatches,
    store,
    setActiveIndex,
  ]);

  const contextValue: FilterDropdownRootContext = React.useMemo(
    () => ({
      open,
      inline,
      disabled,
      inputFocusVisible: focusVisible,
      setInputFocusVisible: setFocusVisible,
      keyboardModality,
      setKeyboardModality,
      autoHighlight,
      store,
      defaultPopupId,
      triggerId,
      defaultListId,
      listId,
      setListId,
      focusOwnerRef,
      setInputElement,
      setListElement,
      hasInput,
      virtualized,
      setActiveIndex,
      onItemsChange,
      onValueChange: handleValueChange,
    }),
    [
      open,
      inline,
      disabled,
      focusVisible,
      keyboardModality,
      autoHighlight,
      store,
      defaultPopupId,
      triggerId,
      defaultListId,
      listId,
      focusOwnerRef,
      setInputElement,
      setListElement,
      hasInput,
      virtualized,
      setActiveIndex,
      onItemsChange,
      handleValueChange,
    ],
  );

  const itemContextValue: FilterDropdownItemContext = React.useMemo(
    () => ({
      parent: parentItemContext,
      grid,
      store,
      registerItem,
      listRef,
    }),
    [parentItemContext, grid, store, registerItem, listRef],
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

function isSetEqual<T>(firstSet: ReadonlySet<T>, secondSet: ReadonlySet<T>) {
  if (firstSet.size !== secondSet.size) {
    return false;
  }

  for (const item of firstSet) {
    if (!secondSet.has(item)) {
      return false;
    }
  }

  return true;
}

export interface FilterDropdownRootProps {
  children?: React.ReactNode;
  /**
   * Whether the popup is currently open.
   */
  open: boolean;
  /** Whether the list is rendered inline without popup parts. */
  inline?: boolean | undefined;
  /** Whether the host presents items in a grid. */
  grid?: boolean | undefined;
  /** Whether the filter controls should be disabled. */
  disabled?: boolean | undefined;
  /** Whether the input should render its focus ring. */
  inputFocusVisible?: boolean | undefined;
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
   * The index the host currently highlights.
   */
  activeIndex?: number | null | undefined;
  /**
   * Moves the host's highlight.
   */
  setActiveIndex?: ((index: number | null) => void) | undefined;
  /**
   * The host's navigation props for the element holding real focus while the popup is open.
   */
  inputProps?: HTMLProps | undefined;
  /**
   * The host's ref for the input, or the list when no input is rendered.
   */
  inputRef?: React.RefObject<HTMLElement | null> | undefined;
  /**
   * Reports whether an input is currently registered.
   */
  onInputElementChange?: ((hasInput: boolean) => void) | undefined;
  /**
   * Whether the host's items are windowed by an external virtualizer, so a changed rendered set
   * does not invalidate the positional highlight.
   */
  virtualized?: boolean | undefined;
}

export namespace FilterDropdownRoot {
  export type Props = FilterDropdownRootProps;
  export type ChangeEventReason = FilterDropdownRootNamespace.ChangeEventReason;
  export type ChangeEventDetails = FilterDropdownRootNamespace.ChangeEventDetails;
}
