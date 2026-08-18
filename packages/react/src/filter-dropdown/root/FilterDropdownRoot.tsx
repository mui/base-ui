'use client';
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { ownerDocument } from '@base-ui/utils/owner';
import { useRefWithInit } from '@base-ui/utils/useRefWithInit';
import { visuallyHidden } from '@base-ui/utils/visuallyHidden';
import { useStableCallback } from '@base-ui/utils/useStableCallback';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
import { Store } from '@base-ui/utils/store';
import { EMPTY_OBJECT, NOOP } from '@base-ui/utils/empty';
import { getFilter } from '../../internals/filter';
import type { HTMLProps } from '../../internals/types';
import { useBaseUiId } from '../../internals/useBaseUiId';
import { useItemRegistry } from '../../internals/useItemRegistry';
import {
  FilterDropdownRootContext,
  FilterDropdownValueContext,
  type FilterDropdownItemRegistration,
  type FilterDropdownFilter,
  type FilterDropdownRoot as FilterDropdownRootNamespace,
} from './FilterDropdownRootContext';
import type { State as StoreState } from '../store';

/**
 * Holds the filter query, matches it against the registered items, and publishes the result. The
 * host owns list navigation; this root only reads the index the host highlights.
 *
 * @internal
 */
export function FilterDropdownRoot(props: FilterDropdownRoot.Props): React.JSX.Element {
  const {
    children,
    open,
    inline = false,
    disabled = false,
    inputFocusVisible = false,
    locale,
    value,
    query,
    onValueChange,
    filter,
    autoHighlight = false,
    triggerId: externalTriggerId,
    triggerElement: externalTriggerElement,
    listRef,
    activeIndex = null,
    setActiveIndex = NOOP,
    inputProps = EMPTY_OBJECT,
    inputRef: externalFocusOwnerRef,
  } = props;

  const parentContext = React.useContext(FilterDropdownRootContext);
  const [liveRegionElement, setLiveRegionElement] = React.useState<HTMLDivElement | null>(null);
  const [registeredTriggerElement, setTriggerElement] = React.useState<HTMLElement | null>(null);
  const [registeredTriggerId, setTriggerId] = React.useState<string | undefined>(undefined);
  const [registeredPopupId, setPopupId] = React.useState<string | undefined>(undefined);
  const [registeredListId, setListId] = React.useState<string | undefined>(undefined);
  const [focusVisible, setFocusVisible] = React.useState(inputFocusVisible);
  const [keyboardModality, setKeyboardModality] = React.useState(inputFocusVisible);
  const [hasInput, setHasInput] = React.useState(false);
  const [registeredItems, registerItem] = useItemRegistry<symbol, FilterDropdownItemRegistration>();
  const defaultId = useBaseUiId();
  const store = useRefWithInit(
    () => new Store<StoreState>({ visibleItemIds: null, registeredItemCount: 0 }),
  ).current;

  const ownFocusOwnerRef = React.useRef<HTMLElement | null>(null);
  const focusOwnerRef = externalFocusOwnerRef ?? ownFocusOwnerRef;
  const inputElementRef = React.useRef<HTMLInputElement | null>(null);
  const listElementRef = React.useRef<HTMLDivElement | null>(null);
  const lastFilterQueryRef = React.useRef<string | null>(null);

  const handleValueChange = useStableCallback(onValueChange ?? NOOP);
  const setInputElement = useStableCallback((element: HTMLInputElement | null) => {
    inputElementRef.current = element;
    focusOwnerRef.current = element ?? listElementRef.current;
    setHasInput(element !== null);
  });
  const setListElement = useStableCallback((element: HTMLDivElement | null) => {
    listElementRef.current = element;
    if (inputElementRef.current === null) {
      focusOwnerRef.current = element;
    }
  });
  const defaultMatches = React.useMemo(() => getFilter({ locale }).contains, [locale]);

  // React 17 resolves generated ids in an effect, so they must be read live rather than captured
  // in a state initializer.
  const defaultTriggerId = defaultId ? `${defaultId}-trigger` : undefined;
  const defaultPopupId = defaultId ? `${defaultId}-popup` : undefined;
  const defaultListId = defaultId ? `${defaultId}-list` : undefined;
  const triggerElement = externalTriggerElement ?? registeredTriggerElement;
  const triggerId = externalTriggerId ?? registeredTriggerId ?? defaultTriggerId;
  const popupId = registeredPopupId ?? defaultPopupId;
  const listId = registeredListId ?? defaultListId;

  useIsoLayoutEffect(() => {
    setFocusVisible(inputFocusVisible);
    setKeyboardModality(inputFocusVisible);
  }, [inputFocusVisible]);

  // Filtering runs against the registry snapshot published after every item in the commit has
  // registered, and against the committed query, because a controlled consumer can reject a
  // proposed change.
  useIsoLayoutEffect(() => {
    store.set('registeredItemCount', registeredItems.size);
  }, [registeredItems, store]);

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
      if (store.state.visibleItemIds !== null) {
        store.set('visibleItemIds', null);
        if (!autoHighlightEnabled) {
          setActiveIndex(null);
        }
      }
      if (autoHighlightEnabled && registeredItems.size > 0) {
        setActiveIndex(0);
      }
      return;
    }

    const nextIds = new Set<symbol>();
    registeredItems.forEach(({ getText, keywords }, id) => {
      const filterText = getText();
      const matches = filter
        ? filterText != null && filter(filterText, filterQuery)
        : (filterText != null && defaultMatches(filterText, filterQuery)) ||
          keywords?.some((keyword) => defaultMatches(keyword, filterQuery));
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
      parent: parentContext,
      open,
      inline,
      disabled,
      inputFocusVisible: focusVisible,
      setInputFocusVisible: setFocusVisible,
      keyboardModality,
      setKeyboardModality,
      store,
      defaultPopupId,
      popupId,
      setPopupId,
      defaultTriggerId,
      triggerId,
      setTriggerId,
      defaultListId,
      listId,
      setListId,
      liveRegionElement,
      setTriggerElement,
      focusOwnerRef,
      setInputElement,
      setListElement,
      hasInput,
      registerItem,
      listRef,
      activeIndex,
      setActiveIndex,
      inputProps,
      onValueChange: handleValueChange,
    }),
    [
      parentContext,
      open,
      inline,
      disabled,
      focusVisible,
      keyboardModality,
      store,
      defaultPopupId,
      popupId,
      defaultTriggerId,
      triggerId,
      defaultListId,
      listId,
      liveRegionElement,
      focusOwnerRef,
      setInputElement,
      setListElement,
      hasInput,
      registerItem,
      listRef,
      activeIndex,
      setActiveIndex,
      inputProps,
      handleValueChange,
    ],
  );

  return (
    <FilterDropdownRootContext.Provider value={contextValue}>
      <FilterDropdownValueContext.Provider value={query ?? value}>
        {children}
      </FilterDropdownValueContext.Provider>
      {triggerElement &&
        ReactDOM.createPortal(
          <div
            ref={setLiveRegionElement}
            role="status"
            aria-live="polite"
            aria-atomic="true"
            style={visuallyHidden}
          />,
          ownerDocument(triggerElement).body,
        )}
    </FilterDropdownRootContext.Provider>
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
  /** Whether the filter controls should be disabled. */
  disabled?: boolean | undefined;
  /** Whether the input should render its focus ring. */
  inputFocusVisible?: boolean | undefined;
  /**
   * Locale used for filtering comparisons.
   */
  locale?: Intl.LocalesArgument | undefined;
  /**
   * The filter input value. Use when controlled.
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
   * Custom filter logic used when filtering items.
   */
  filter?: FilterDropdownFilter | undefined;
  /** Whether the first matching item should be highlighted automatically. */
  autoHighlight?: boolean | 'always' | undefined;
  /**
   * ID of a trigger rendered outside this root, which cannot register itself through the context.
   */
  triggerId?: string | null | undefined;
  /**
   * Trigger rendered outside this root, used to mount the live region in the trigger's document.
   */
  triggerElement?: Element | null | undefined;
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
}

export namespace FilterDropdownRoot {
  export type Props = FilterDropdownRootProps;
  export type ChangeEventReason = FilterDropdownRootNamespace.ChangeEventReason;
  export type ChangeEventDetails = FilterDropdownRootNamespace.ChangeEventDetails;
}
