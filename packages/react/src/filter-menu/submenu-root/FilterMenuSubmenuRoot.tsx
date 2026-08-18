'use client';
import * as React from 'react';
import { useControlled } from '@base-ui/utils/useControlled';
import { useStableCallback } from '@base-ui/utils/useStableCallback';
import {
  MenuSubmenuRootInternal,
  type MenuSubmenuRoot,
  type MenuSubmenuRootProps,
} from '../../menu/submenu-root/MenuSubmenuRoot';
import { FilterDropdownRoot } from '../../filter-dropdown/root/FilterDropdownRoot';
import type { FilterMenuFilter } from '../root/FilterMenuRoot';
import { useFilterDropdownCloseQuery } from '../../filter-dropdown/root/useFilterDropdownCloseQuery';
import { useMenuRootContext } from '../../menu/root/MenuRootContext';
import { FilterMenuProvider, isKeyboardOpen } from '../root/FilterMenuRoot';

export function FilterMenuSubmenuRoot(props: FilterMenuSubmenuRoot.Props): React.JSX.Element {
  const {
    open: openProp,
    defaultOpen = false,
    onOpenChange,
    onOpenChangeComplete,
    inputValue: inputValueProp,
    defaultInputValue = '',
    onInputValueChange,
    filter,
    disabled: disabledProp,
    locale,
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

  const handleInputValueChange = useStableCallback(
    (nextValue: string, details: FilterMenuSubmenuRoot.InputValueChangeEventDetails) => {
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

  function handleOpenChange(nextOpen: boolean, details: FilterMenuSubmenuRoot.ChangeEventDetails) {
    onOpenChange?.(nextOpen, details);
    if (details.isCanceled) {
      return;
    }

    closeQuery.handleOpenChange(nextOpen);
    setOpen(nextOpen);
    setInputFocusVisible(nextOpen && isKeyboardOpen(details));
  }

  return (
    <MenuSubmenuRootInternal
      {...submenuProps}
      disabled={disabled}
      open={open}
      onOpenChange={handleOpenChange}
      onOpenChangeComplete={closeQuery.handleOpenChangeComplete}
      virtualFocus
    >
      <FilterMenuProvider
        open={open}
        inputFocusVisible={inputFocusVisible}
        value={inputValue}
        query={closeQuery.query}
        filter={filter}
        locale={locale}
        onValueChange={handleInputValueChange}
      >
        {children}
      </FilterMenuProvider>
    </MenuSubmenuRootInternal>
  );
}

export namespace FilterMenuSubmenuRoot {
  export type Props = Omit<MenuSubmenuRootProps, 'open' | 'defaultOpen' | 'onOpenChange'> & {
    /**
     * Whether the submenu is currently open.
     */
    open?: boolean | undefined;
    /**
     * Whether the submenu is initially open.
     *
     * To render a controlled submenu, use the `open` prop instead.
     * @default false
     */
    defaultOpen?: boolean | undefined;
    /**
     * Event handler called when the submenu is opened or closed.
     */
    onOpenChange?:
      ((open: boolean, eventDetails: FilterMenuSubmenuRoot.ChangeEventDetails) => void) | undefined;
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
     * The uncontrolled filter query when the submenu is initially rendered.
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
