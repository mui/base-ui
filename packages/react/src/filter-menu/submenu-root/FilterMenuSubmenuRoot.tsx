'use client';
import * as React from 'react';
import { useControlled } from '@base-ui/utils/useControlled';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
import { useStableCallback } from '@base-ui/utils/useStableCallback';
import { createChangeEventDetails } from '../../internals/createBaseUIEventDetails';
import { REASONS } from '../../internals/reasons';
import {
  MenuSubmenuRoot,
  type MenuSubmenuRootProps,
} from '../../menu/submenu-root/MenuSubmenuRoot';
import { FilterDropdownRoot } from '../../filter-dropdown/root/FilterDropdownRoot';
import type { FilterDropdownFilter } from '../../filter-dropdown/root/FilterDropdownRootContext';
import { useMenuRootContext } from '../../menu/root/MenuRootContext';
import { FilterMenuProvider, isKeyboardOpen } from '../root/FilterMenuRoot';

export function FilterMenuSubmenuRoot(props: FilterMenuSubmenuRoot.Props): React.JSX.Element {
  const {
    open: openProp,
    defaultOpen = false,
    onOpenChange,
    inputValue: inputValueProp,
    defaultInputValue = '',
    onInputValueChange,
    filter,
    disabled: disabledProp,
    children,
    ...submenuProps
  } = props;

  const { store: parentStore } = useMenuRootContext();
  const parentDisabled = parentStore.useState('disabled');
  const disabled = parentDisabled || disabledProp;

  const [open, setOpen] = useControlled({
    controlled: openProp,
    default: defaultOpen,
    name: 'FilterMenuSubmenu',
    state: 'open',
  });
  const [inputValue, setInputValue] = useControlled({
    controlled: inputValueProp,
    default: defaultInputValue,
    name: 'FilterMenuSubmenu',
    state: 'inputValue',
  });
  const [inputFocusVisible, setInputFocusVisible] = React.useState(false);
  const previousOpenRef = React.useRef(open);

  function handleOpenChange(nextOpen: boolean, details: FilterMenuSubmenuRoot.ChangeEventDetails) {
    onOpenChange?.(nextOpen, details);
    if (details.isCanceled) {
      return;
    }

    setOpen(nextOpen);
    setInputFocusVisible(nextOpen && isKeyboardOpen(details));
  }

  const handleInputValueChange = useStableCallback(
    (nextValue: string, details: FilterMenuSubmenuRoot.InputValueChangeEventDetails) => {
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

  return (
    <MenuSubmenuRoot
      {...submenuProps}
      disabled={disabled}
      open={open}
      onOpenChange={handleOpenChange}
      virtualFocus
    >
      <FilterMenuProvider
        open={open}
        inputFocusVisible={inputFocusVisible}
        value={inputValue}
        filter={filter}
        onValueChange={handleInputValueChange}
      >
        {children}
      </FilterMenuProvider>
    </MenuSubmenuRoot>
  );
}

export namespace FilterMenuSubmenuRoot {
  export type Props = Omit<
    MenuSubmenuRootProps,
    'open' | 'defaultOpen' | 'onOpenChange' | 'virtualFocus'
  > & {
    open?: boolean | undefined;
    defaultOpen?: boolean | undefined;
    onOpenChange?:
      | ((open: boolean, eventDetails: MenuSubmenuRoot.ChangeEventDetails) => void)
      | undefined;
    filter?: FilterDropdownFilter | undefined;
    defaultInputValue?: string | undefined;
    inputValue?: string | undefined;
    onInputValueChange?:
      | ((value: string, eventDetails: FilterMenuSubmenuRoot.InputValueChangeEventDetails) => void)
      | undefined;
    children?: React.ReactNode;
  };
  export type State = MenuSubmenuRoot.State;
  export type ChangeEventReason = MenuSubmenuRoot.ChangeEventReason;
  export type ChangeEventDetails = MenuSubmenuRoot.ChangeEventDetails;
  export type InputValueChangeEventReason = FilterDropdownRoot.ChangeEventReason;
  export type InputValueChangeEventDetails = FilterDropdownRoot.ChangeEventDetails;
}
