'use client';
import * as React from 'react';
import { useControlled } from '@base-ui/utils/useControlled';
import { useStableCallback } from '@base-ui/utils/useStableCallback';
import { REASONS } from '../../internals/reasons';
import {
  FilterDropdownRoot,
  type FilterDropdownRoot as FilterDropdownRootNamespace,
} from '../../filter-dropdown/root/FilterDropdownRoot';
import type { FilterDropdownFilter } from '../../filter-dropdown/root/FilterDropdownRootContext';
import { useFilterDropdownCloseQuery } from '../../filter-dropdown/root/useFilterDropdownCloseQuery';
import { MenuRootInternal, type MenuRoot } from '../../menu/root/MenuRoot';
import { useMenuRootContext } from '../../menu/root/MenuRootContext';
import type { HTMLProps } from '../../internals/types';

export function FilterMenuRoot<Payload>(props: FilterMenuRoot.Props<Payload>): React.JSX.Element {
  const {
    children,
    open: openProp,
    defaultOpen = false,
    onOpenChange,
    onOpenChangeComplete,
    inputValue: inputValueProp,
    defaultInputValue = '',
    onInputValueChange,
    filter,
    locale,
    disabled,
    inline = false,
    ...menuProps
  } = props;

  const [open, setOpen] = useControlled({
    controlled: openProp,
    default: defaultOpen,
    name: 'FilterMenu',
    state: 'open',
  });
  const [inputValue, setInputValue] = useControlled({
    controlled: inputValueProp,
    default: defaultInputValue,
    name: 'FilterMenu',
    state: 'inputValue',
  });
  const [inputFocusVisible, setInputFocusVisible] = React.useState(false);
  const focusOwnerRef = React.useRef<HTMLElement | null>(null);
  const inputPropsRef = React.useRef<HTMLProps>({});

  const handleInputValueChange = useStableCallback(
    (nextValue: string, details: FilterMenuRoot.InputValueChangeEventDetails) => {
      onInputValueChange?.(nextValue, details);
      if (!details.isCanceled) {
        setInputValue(nextValue);
      }
    },
  );

  const closeQuery = useFilterDropdownCloseQuery({
    open,
    value: inputValue,
    onValueChange: handleInputValueChange,
    onOpenChangeComplete,
  });

  function handleOpenChange(nextOpen: boolean, details: FilterMenuRoot.ChangeEventDetails) {
    onOpenChange?.(nextOpen, details);
    if (details.isCanceled) {
      return;
    }

    closeQuery.handleOpenChange(nextOpen);
    setOpen(nextOpen);
    setInputFocusVisible(nextOpen && isKeyboardOpen(details));
  }

  return (
    <MenuRootInternal
      {...menuProps}
      disabled={disabled}
      open={open}
      onOpenChange={handleOpenChange}
      onOpenChangeComplete={closeQuery.handleOpenChangeComplete}
      inline={inline}
      virtualFocus
      virtualFocusRef={focusOwnerRef}
      virtualFocusPropsRef={inputPropsRef}
    >
      {(payload) => (
        <FilterMenuProvider
          open={open}
          inputFocusVisible={inputFocusVisible}
          value={inputValue}
          query={closeQuery.query}
          filter={filter}
          locale={locale}
          inline={inline}
          onValueChange={handleInputValueChange}
        >
          {typeof children === 'function' ? children(payload) : children}
        </FilterMenuProvider>
      )}
    </MenuRootInternal>
  );
}

/**
 * A keyboard open is the one that lands focus in the popup, so the input shows its focus ring.
 * Arrow keys report `list-navigation`; Enter and Space dispatch a click carrying no pointer detail.
 */
export function isKeyboardOpen(details: {
  reason: string | null;
  event: Event | undefined;
}): boolean {
  if (details.reason === REASONS.listNavigation) {
    return true;
  }
  return (
    (details.reason === REASONS.triggerPress || details.reason === REASONS.itemPress) &&
    (details.event as MouseEvent | undefined)?.detail === 0
  );
}

interface FilterMenuProviderProps {
  open: boolean;
  inputFocusVisible: boolean;
  value: string;
  query?: string | undefined;
  filter: FilterDropdownFilter | undefined;
  locale: Intl.LocalesArgument | undefined;
  inline?: boolean | undefined;
  onValueChange: (value: string, details: FilterMenuRoot.InputValueChangeEventDetails) => void;
  children?: React.ReactNode;
}

/**
 * Reads the menu store, which is only available below `Menu.Root`, and hands the filter root the
 * list the menu navigates plus the props for the input that holds real focus.
 */
export function FilterMenuProvider(props: FilterMenuProviderProps) {
  const { store, virtualFocusRef, virtualFocusPropsRef } = useMenuRootContext();
  const triggerId = store.useState('activeTriggerId');
  const triggerElement = store.useState('activeTriggerElement');
  const activeIndex = store.useState('activeIndex');
  const disabled = store.useState('disabled');

  const setActiveIndex = useStableCallback((index: number | null) => {
    store.set('activeIndex', index);
  });

  return (
    <FilterDropdownRoot
      open={props.open}
      inline={props.inline}
      disabled={disabled}
      inputFocusVisible={props.inputFocusVisible}
      value={props.value}
      query={props.query ?? props.value}
      filter={props.filter}
      locale={props.locale}
      triggerId={triggerElement?.id ?? triggerId}
      triggerElement={triggerElement}
      listRef={store.context.itemDomElements}
      activeIndex={activeIndex}
      setActiveIndex={setActiveIndex}
      inputProps={virtualFocusPropsRef?.current}
      inputRef={virtualFocusRef}
      onValueChange={props.onValueChange}
    >
      {props.children}
    </FilterDropdownRoot>
  );
}

interface FilterMenuRootFilterProps {
  /**
   * Replaces the default case-insensitive substring matching for item text.
   * Receives an item's filter text and the trimmed query. When provided, this function is
   * authoritative and item keywords are ignored.
   */
  filter?: FilterMenuFilter | undefined;
  /**
   * Locale used when comparing an item against the query.
   * Defaults to the runtime's default locale.
   */
  locale?: Intl.LocalesArgument | undefined;
  /**
   * The uncontrolled filter query when the menu is initially rendered.
   * To render a controlled query, use the `inputValue` prop instead.
   */
  defaultInputValue?: string | undefined;
  /**
   * The filter query. Use when controlled.
   * The query is cleared when the popup closes.
   */
  inputValue?: string | undefined;
  /**
   * Event handler called when the filter query changes.
   */
  onInputValueChange?:
    | ((value: string, eventDetails: FilterMenuRoot.InputValueChangeEventDetails) => void)
    | undefined;
}

/**
 * Determines whether an item matches the current filter query.
 */
export type FilterMenuFilter = (itemText: string, query: string) => boolean;

export type FilterMenuRootProps<Payload = unknown> = Omit<
  MenuRoot.Props<Payload>,
  'open' | 'defaultOpen' | 'onOpenChange'
> & {
  /**
   * Whether the list is rendered inline without using the component's own popup.
   * Specify `open` in conjunction with this prop so the list is considered visible.
   * @default false
   */
  inline?: boolean | undefined;
  /**
   * Whether the menu is currently open.
   */
  open?: boolean | undefined;
  /**
   * Whether the menu is initially open.
   *
   * To render a controlled menu, use the `open` prop instead.
   * @default false
   */
  defaultOpen?: boolean | undefined;
  /**
   * Event handler called when the menu is opened or closed.
   */
  onOpenChange?:
    ((open: boolean, eventDetails: FilterMenuRootChangeEventDetails) => void) | undefined;
} & FilterMenuRootFilterProps;

export type FilterMenuRootState = MenuRoot.State;
export type FilterMenuRootActions = MenuRoot.Actions;
export type FilterMenuRootChangeEventReason = MenuRoot.ChangeEventReason;
export type FilterMenuRootChangeEventDetails = MenuRoot.ChangeEventDetails;
export type FilterMenuRootInputValueChangeEventReason =
  FilterDropdownRootNamespace.ChangeEventReason;
export type FilterMenuRootInputValueChangeEventDetails =
  FilterDropdownRootNamespace.ChangeEventDetails;

export namespace FilterMenuRoot {
  export type Props<Payload = unknown> = FilterMenuRootProps<Payload>;
  export type State = FilterMenuRootState;
  export type Actions = FilterMenuRootActions;
  export type ChangeEventReason = FilterMenuRootChangeEventReason;
  export type ChangeEventDetails = FilterMenuRootChangeEventDetails;
  export type InputValueChangeEventReason = FilterMenuRootInputValueChangeEventReason;
  export type InputValueChangeEventDetails = FilterMenuRootInputValueChangeEventDetails;
}
