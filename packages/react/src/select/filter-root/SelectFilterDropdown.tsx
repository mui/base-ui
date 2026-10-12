'use client';
import * as React from 'react';
import { useStableCallback } from '@base-ui/utils/useStableCallback';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
import { FilterDropdownRoot } from '../../filter-dropdown/root/FilterDropdownRoot';
import { useFilterDropdownCloseQuery } from '../../filter-dropdown/root/useFilterDropdownCloseQuery';
import type { FilterDropdownFilter } from '../../filter-dropdown/root/FilterDropdownRootContext';
import { useSelectRootContext } from '../root/SelectRootContext';
import type { HTMLProps } from '../../internals/types';
import type { SelectFilterRoot } from './SelectFilterRoot';
import { SelectFilterImplContext, SelectFilterNavigationContext } from './SelectFilterContext';
import { SELECT_FILTER_IMPL } from './SelectFilterImpl';

export interface SelectFilterDropdownProps {
  openedByKeyboard: boolean;
  value: string;
  filter: FilterDropdownFilter | null | undefined;
  autoHighlight: boolean | 'always';
  locale: Intl.LocalesArgument | undefined;
  navigationProps: HTMLProps;
  onValueChange: (value: string, details: SelectFilterRoot.InputValueChangeEventDetails) => void;
  children?: React.ReactNode;
}

/**
 * Reads the select store, which is only available below the root, and hands the filter
 * engine the list the select navigates plus the props for the input that holds real focus.
 */
export function SelectFilterDropdown(props: SelectFilterDropdownProps) {
  const { navigationProps, ...dropdownProps } = props;

  const store = useSelectRootContext();
  const open = store.useState('open');
  const mounted = store.useState('mounted');
  const disabled = store.useState('disabled');
  const id = store.useState('id');
  const triggerElement = store.useState('triggerElement');
  const activeIndex = store.useState('activeIndex');

  const query = useFilterDropdownCloseQuery({
    open,
    mounted,
    value: props.value,
    onValueChange: props.onValueChange,
  });

  const getActiveIndex = useStableCallback(() => store.state.activeIndex);
  const setActiveIndex = useStableCallback((index: number | null) => {
    store.set('activeIndex', index);
  });

  const [activeItemId, setActiveItemId] = React.useState<string | undefined>(undefined);

  // Runs when `activeIndex` commits and again when the option registry settles, since an index
  // can come to point at a different element while its value stays the same.
  const syncActiveItem = useStableCallback(() => {
    const index = store.state.activeIndex;
    const item = index === null ? undefined : store.context.listRef.current[index];
    // An option removed in this commit stays registered until the list flushes, which calls back
    // here with the settled registry.
    if (item?.isConnected === false) {
      return;
    }
    setActiveItemId(item?.id || undefined);
  });

  useIsoLayoutEffect(syncActiveItem, [activeIndex, syncActiveItem]);

  const navigationContext: SelectFilterNavigationContext = React.useMemo(
    () => ({ navigationProps, activeItemId, syncActiveItem }),
    [navigationProps, activeItemId, syncActiveItem],
  );

  return (
    <SelectFilterImplContext.Provider value={SELECT_FILTER_IMPL}>
      <SelectFilterNavigationContext.Provider value={navigationContext}>
        <FilterDropdownRoot
          {...dropdownProps}
          open={open}
          disabled={disabled}
          query={query}
          // Trust the rendered element's id once it exists: an explicitly empty id must not
          // fall back to a registered id that no element carries.
          triggerId={triggerElement ? triggerElement.id || null : id}
          listRef={store.context.listRef}
          getActiveIndex={getActiveIndex}
          setActiveIndex={setActiveIndex}
          focusOwnerRef={store.context.virtualFocusRef}
        />
      </SelectFilterNavigationContext.Provider>
    </SelectFilterImplContext.Provider>
  );
}
