'use client';
import * as React from 'react';
import { useControlled } from '@base-ui/utils/useControlled';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
import { useStableCallback } from '@base-ui/utils/useStableCallback';
import { createChangeEventDetails } from '../../internals/createBaseUIEventDetails';
import { REASONS } from '../../internals/reasons';
import {
  FilterDropdownRoot,
  type FilterDropdownRoot as FilterDropdownRootNamespace,
} from '../../filter-dropdown/root/FilterDropdownRoot';
import type { FilterDropdownFilter } from '../../filter-dropdown/root/FilterDropdownRootContext';
import { MenuRoot } from '../../menu/root/MenuRoot';
import { useMenuRootContext } from '../../menu/root/MenuRootContext';

export function FilterMenuRoot<Payload>(props: FilterMenuRoot.Props<Payload>): React.JSX.Element {
  const {
    children,
    open: openProp,
    defaultOpen = false,
    onOpenChange,
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
  const previousOpenRef = React.useRef(open);

  function handleOpenChange(nextOpen: boolean, details: FilterMenuRoot.ChangeEventDetails) {
    onOpenChange?.(nextOpen, details);
    if (details.isCanceled) {
      return;
    }

    setOpen(nextOpen);

    const event = details.event as MouseEvent | undefined;
    setInputFocusVisible(
      nextOpen &&
        (details.reason === REASONS.listNavigation ||
          (details.reason === REASONS.triggerPress && event?.detail === 0)),
    );
  }

  const handleInputValueChange = useStableCallback(
    (nextValue: string, details: FilterMenuRoot.InputValueChangeEventDetails) => {
      onInputValueChange?.(nextValue, details);
      if (!details.isCanceled) {
        setInputValue(nextValue);
      }
    },
  );

  useIsoLayoutEffect(() => {
    if (previousOpenRef.current && !open && inputValue !== '') {
      handleInputValueChange('', createChangeEventDetails(REASONS.popupClose));
    }
    previousOpenRef.current = open;
  }, [handleInputValueChange, open, inputValue]);

  function renderChildren(payload: { payload: Payload | undefined }) {
    return (
      <FilterMenuRootContent
        open={open}
        disabled={disabled}
        inputFocusVisible={inputFocusVisible}
        value={inputValue}
        filter={filter}
        onValueChange={handleInputValueChange}
      >
        {typeof children === 'function' ? children(payload) : children}
      </FilterMenuRootContent>
    );
  }

  return (
    <MenuRoot {...menuProps} disabled={disabled} open={open} onOpenChange={handleOpenChange}>
      {renderChildren}
    </MenuRoot>
  );
}

interface FilterMenuRootContentProps {
  open: boolean;
  disabled?: boolean | undefined;
  inputFocusVisible: boolean;
  value: string;
  filter?: FilterDropdownFilter | undefined;
  onValueChange: (value: string, details: FilterMenuRoot.InputValueChangeEventDetails) => void;
  children?: React.ReactNode;
}

function FilterMenuRootContent(props: FilterMenuRootContentProps) {
  const { store } = useMenuRootContext();
  const triggerId = store.useState('activeTriggerId');
  const triggerElement = store.useState('activeTriggerElement');

  return (
    <FilterDropdownRoot
      open={props.open}
      disabled={props.disabled}
      inputFocusVisible={props.inputFocusVisible}
      value={props.value}
      filter={props.filter}
      triggerId={triggerId}
      triggerElement={triggerElement}
      listRef={store.context.itemDomElements}
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
