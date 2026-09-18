'use client';
import * as React from 'react';
import { useStableCallback } from '@base-ui/utils/useStableCallback';
import { FilterDropdownRoot } from '../../filter-dropdown/root/FilterDropdownRoot';
import type { FilterDropdownFilter } from '../../filter-dropdown/root/FilterDropdownRootContext';
import { useSelectRootContext, useSelectRootPropsContext } from '../root/SelectRootContext';
import type { HTMLProps } from '../../internals/types';
import type { SelectFilterRoot } from './SelectFilterRoot';
import { SelectFilterImplContext } from './SelectFilterContext';
import { SELECT_FILTER_IMPL } from './SelectFilterImpl';

export interface SelectFilterDropdownProps {
  open: boolean;
  inputFocusVisible: boolean;
  value: string;
  query: string;
  filter: FilterDropdownFilter | null | undefined;
  autoHighlight: boolean | 'always';
  locale: Intl.LocalesArgument | undefined;
  inputProps: HTMLProps;
  onValueChange: (value: string, details: SelectFilterRoot.InputValueChangeEventDetails) => void;
  children?: React.ReactNode;
}

/**
 * Reads the select store, which is only available below the root, and hands the filter
 * substrate the list the select navigates plus the props for the input that holds real focus.
 */
export function SelectFilterDropdown(props: SelectFilterDropdownProps) {
  const store = useSelectRootContext();
  const { disabled } = useSelectRootPropsContext();
  const id = store.useState('id');
  const triggerElement = store.useState('triggerElement');
  const activeIndex = store.useState('activeIndex');

  const setActiveIndex = useStableCallback((index: number | null) => {
    store.set('activeIndex', index);
  });

  return (
    <SelectFilterImplContext.Provider value={SELECT_FILTER_IMPL}>
      <FilterDropdownRoot
        {...props}
        disabled={disabled}
        // Trust the rendered element's id once it exists: an explicitly empty id must not
        // fall back to a registered id that no element carries.
        triggerId={triggerElement ? triggerElement.id || null : id}
        listRef={store.context.listRef}
        activeIndex={activeIndex}
        setActiveIndex={setActiveIndex}
        inputRef={store.context.virtualFocusRef}
      />
    </SelectFilterImplContext.Provider>
  );
}
