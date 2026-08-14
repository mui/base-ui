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
import { MenuRoot } from '../../menu/root/MenuRoot';
import { useMenuRootContext } from '../../menu/root/MenuRootContext';

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
    disabled,
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
    <MenuRoot
      {...menuProps}
      disabled={disabled}
      open={open}
      onOpenChange={handleOpenChange}
      onOpenChangeComplete={closeQuery.handleOpenChangeComplete}
      virtualFocus
    >
      {(payload) => (
        <FilterMenuProvider
          open={open}
          inputFocusVisible={inputFocusVisible}
          value={inputValue}
          query={closeQuery.query}
          filter={filter}
          onValueChange={handleInputValueChange}
        >
          {typeof children === 'function' ? children(payload) : children}
        </FilterMenuProvider>
      )}
    </MenuRoot>
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
  onValueChange: (value: string, details: FilterMenuRoot.InputValueChangeEventDetails) => void;
  children?: React.ReactNode;
}

/**
 * Reads the menu store, which is only available below `Menu.Root`, and hands the filter root the
 * list the menu navigates plus the props for the input that holds real focus.
 */
export function FilterMenuProvider(props: FilterMenuProviderProps) {
  const { store } = useMenuRootContext();
  const triggerId = store.useState('activeTriggerId');
  const triggerElement = store.useState('activeTriggerElement');
  const activeIndex = store.useState('activeIndex');
  const inputProps = store.useState('inputProps');
  const disabled = store.useState('disabled');

  const setActiveIndex = useStableCallback((index: number | null) => {
    store.set('activeIndex', index);
  });

  return (
    <FilterDropdownRoot
      open={props.open}
      disabled={disabled}
      inputFocusVisible={props.inputFocusVisible}
      value={props.value}
      query={props.query ?? props.value}
      filter={props.filter}
      triggerId={triggerId}
      triggerElement={triggerElement}
      listRef={store.context.itemDomElements}
      activeIndex={activeIndex}
      setActiveIndex={setActiveIndex}
      inputProps={inputProps}
      inputRef={store.context.inputRef}
      onValueChange={props.onValueChange}
    >
      {props.children}
    </FilterDropdownRoot>
  );
}

export interface FilterMenuRootFilterProps {
  filter?: FilterDropdownFilter | undefined;
  defaultInputValue?: string | undefined;
  inputValue?: string | undefined;
  onInputValueChange?:
    | ((value: string, eventDetails: FilterMenuRoot.InputValueChangeEventDetails) => void)
    | undefined;
}

export namespace FilterMenuRoot {
  export type Props<Payload = unknown> = Omit<
    MenuRoot.Props<Payload>,
    'open' | 'defaultOpen' | 'onOpenChange'
  > & {
    open?: boolean | undefined;
    defaultOpen?: boolean | undefined;
    onOpenChange?: ((open: boolean, eventDetails: MenuRoot.ChangeEventDetails) => void) | undefined;
  } & FilterMenuRootFilterProps;
  export type State = MenuRoot.State;
  export type Actions = MenuRoot.Actions;
  export type ChangeEventReason = MenuRoot.ChangeEventReason;
  export type ChangeEventDetails = MenuRoot.ChangeEventDetails;
  export type InputValueChangeEventReason = FilterDropdownRootNamespace.ChangeEventReason;
  export type InputValueChangeEventDetails = FilterDropdownRootNamespace.ChangeEventDetails;
}
