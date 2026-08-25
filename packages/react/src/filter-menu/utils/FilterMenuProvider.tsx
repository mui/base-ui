'use client';
import * as React from 'react';
import { useStableCallback } from '@base-ui/utils/useStableCallback';
import { FilterDropdownRoot } from '../../filter-dropdown/root/FilterDropdownRoot';
import type { FilterDropdownFilter } from '../../filter-dropdown/root/FilterDropdownRootContext';
import { useMenuRootContext } from '../../menu/root/MenuRootContext';
import type { HTMLProps } from '../../internals/types';
import type { FilterMenuRoot } from '../root/FilterMenuRoot';

export interface FilterMenuProviderProps {
  open: boolean;
  inputFocusVisible: boolean;
  value: string;
  query: string;
  filter: FilterDropdownFilter | null | undefined;
  autoHighlight: boolean | 'always';
  locale: Intl.LocalesArgument | undefined;
  inline?: boolean | undefined;
  grid?: boolean | undefined;
  inputProps: HTMLProps;
  onValueChange: (value: string, details: FilterMenuRoot.InputValueChangeEventDetails) => void;
  onInputElementChange: (hasInput: boolean) => void;
  children?: React.ReactNode;
}

/**
 * Reads the menu store, which is only available below `Menu.Root`, and hands the filter root the
 * list the menu navigates plus the props for the input that holds real focus.
 */
export function FilterMenuProvider(props: FilterMenuProviderProps) {
  const { store, virtualFocusRef } = useMenuRootContext();
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
      grid={props.grid}
      disabled={disabled}
      inputFocusVisible={props.inputFocusVisible}
      value={props.value}
      query={props.query}
      filter={props.filter}
      autoHighlight={props.autoHighlight}
      locale={props.locale}
      // Trust the rendered element's id once it exists: an explicitly empty id must not
      // fall back to a registered id that no element carries.
      triggerId={triggerElement ? triggerElement.id || null : triggerId}
      listRef={store.context.itemDomElements}
      activeIndex={activeIndex}
      setActiveIndex={setActiveIndex}
      inputProps={props.inputProps}
      inputRef={virtualFocusRef}
      onValueChange={props.onValueChange}
      onInputElementChange={props.onInputElementChange}
    >
      {props.children}
    </FilterDropdownRoot>
  );
}
