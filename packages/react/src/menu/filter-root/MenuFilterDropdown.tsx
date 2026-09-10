'use client';
import * as React from 'react';
import { useStableCallback } from '@base-ui/utils/useStableCallback';
import { FilterDropdownRoot } from '../../filter-dropdown/root/FilterDropdownRoot';
import type { FilterDropdownFilter } from '../../filter-dropdown/root/FilterDropdownRootContext';
import { useMenuRootContext } from '../root/MenuRootContext';
import { REASONS } from '../../internals/reasons';
import type { HTMLProps } from '../../internals/types';
import type { MenuFilterRoot } from './MenuFilterRoot';
import { MenuFilterImplContext } from './MenuFilterContext';
import { MENU_FILTER_IMPL } from './MenuFilterImpl';

export interface MenuFilterDropdownProps {
  open: boolean;
  inputFocusVisible: boolean;
  value: string;
  query: string;
  filter: FilterDropdownFilter | null | undefined;
  autoHighlight: boolean | 'always';
  locale: Intl.LocalesArgument | undefined;
  closeLabel: string | undefined;
  inputProps: HTMLProps;
  onValueChange: (value: string, details: MenuFilterRoot.InputValueChangeEventDetails) => void;
  onInputAutoFocusChange: (autoFocus: boolean) => void;
  children?: React.ReactNode;
}

/**
 * Reads the menu store, which is only available below the menu root, and hands the filter
 * substrate the list the menu navigates plus the props for the input that holds real focus.
 */
export function MenuFilterDropdown(props: MenuFilterDropdownProps) {
  const { store, virtualFocusRef } = useMenuRootContext();
  const triggerId = store.useState('activeTriggerId');
  const triggerElement = store.useState('activeTriggerElement');
  const activeIndex = store.useState('activeIndex');
  const disabled = store.useState('disabled');

  const setActiveIndex = useStableCallback((index: number | null) => {
    store.setActiveIndex(index, REASONS.none);
  });

  return (
    <MenuFilterImplContext.Provider value={MENU_FILTER_IMPL}>
      <FilterDropdownRoot
        {...props}
        disabled={disabled}
        // Trust the rendered element's id once it exists: an explicitly empty id must not
        // fall back to a registered id that no element carries.
        triggerId={triggerElement ? triggerElement.id || null : triggerId}
        listRef={store.context.itemDomElements}
        activeIndex={activeIndex}
        setActiveIndex={setActiveIndex}
        inputRef={virtualFocusRef}
      />
    </MenuFilterImplContext.Provider>
  );
}
