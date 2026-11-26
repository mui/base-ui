'use client';
import * as React from 'react';
import { useControlled } from '@base-ui/utils/useControlled';
import { useStableCallback } from '@base-ui/utils/useStableCallback';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
import { FilterDropdownRoot } from '../../filter-dropdown/root/FilterDropdownRoot';
import { useKeyboardOpenReset } from '../../filter-dropdown/root/useKeyboardOpenReset';
import { useFilterDropdownCloseQuery } from '../../filter-dropdown/root/useFilterDropdownCloseQuery';
import { createChangeEventDetails } from '../../internals/createBaseUIEventDetails';
import { REASONS } from '../../internals/reasons';
import { findItemIndex } from '../../internals/itemEquality';
import { useSelectRootContext } from '../root/SelectRootContext';
import type { SelectFilterProvider } from '../filter-provider/SelectFilterProvider';
import type { SelectFilterProviderOptions } from '../filter-provider/SelectFilterProviderOptions';
import { SelectFilterImplContext, SelectFilterNavigationContext } from './SelectFilterContext';
import { SELECT_FILTER_IMPL } from './SelectFilterImpl';

export interface SelectFilterDropdownProps extends SelectFilterProviderOptions {
  children?: React.ReactNode;
}

/**
 * Reads the select store, which is only available below the select root, and hands the filter
 * engine the list the select navigates and the command that moves its highlight. The query is
 * owned here; the select root keeps sole ownership of the open state and the selection.
 */
export function SelectFilterDropdown(props: SelectFilterDropdownProps) {
  const {
    value: valueProp,
    defaultValue = '',
    onValueChange,
    filter,
    autoHighlight = false,
    locale,
    children,
  } = props;

  const store = useSelectRootContext();

  const open = store.useState('open');
  const mounted = store.useState('mounted');
  const disabled = store.useState('disabled');
  const keyboardOpen = store.useState('keyboardOpen');
  const id = store.useState('id');
  const triggerElement = store.useState('triggerElement');

  const [value, setValue] = useControlled({
    controlled: valueProp,
    default: defaultValue,
    name: 'SelectFilterProvider',
    state: 'value',
  });

  // Navigation starts from the selected option until the query changes during this open. It
  // stays off through the exit, so closing doesn't highlight the selected option.
  const [queryChanged, setQueryChanged] = React.useState(false);
  const [previousOpen, setPreviousOpen] = React.useState(open);
  if (open !== previousOpen) {
    setPreviousOpen(open);
    if (open) {
      setQueryChanged(false);
    }
  }

  // The value a multiple select toggled while filtering, to highlight once the query clears.
  const toggledItemRef = React.useRef<{ value: unknown } | null>(null);
  const virtualPressRef = React.useRef(false);

  const handleValueChange = useStableCallback(
    (nextValue: string, eventDetails: SelectFilterProvider.ChangeEventDetails) => {
      onValueChange?.(nextValue, eventDetails);
      if (eventDetails.isCanceled) {
        return;
      }
      setValue(nextValue);
      // A reopen during the exit settles the pending close reset, which is no query change.
      if (eventDetails.reason !== REASONS.popupClose) {
        setQueryChanged(true);
      }
    },
  );

  // Like a combobox with its input in the popup, a multiple select clears the query when an item
  // is pressed.
  store.useContextCallback('onItemToggle', (itemValue, eventDetails) => {
    if (value.trim() === '') {
      return;
    }
    toggledItemRef.current = { value: itemValue };
    const clearDetails = createChangeEventDetails(
      REASONS.inputClear,
      eventDetails.event,
      undefined,
      { isItemPress: true },
    );
    handleValueChange('', clearDetails);
    if (clearDetails.isCanceled) {
      toggledItemRef.current = null;
    }
  });

  const query = useFilterDropdownCloseQuery({
    open,
    mounted,
    value,
    onValueChange: handleValueChange,
  });

  store.useSyncedValue('navigateFromSelected', value === '' && !queryChanged);

  useKeyboardOpenReset(store, open, keyboardOpen);

  const getActiveIndex = useStableCallback(() => store.state.activeIndex);
  const setActiveIndex = useStableCallback((index: number | null) => {
    store.set('activeIndex', index);
  });

  // An item a multiple select toggled while filtering stays highlighted once the query clears.
  // The press commits with the clear, so a controlled query that ignores it drops the item.
  useIsoLayoutEffect(() => {
    const toggled = toggledItemRef.current;
    toggledItemRef.current = null;
    if (toggled === null || query !== '') {
      return;
    }
    // The options that the clear mounts publish their indexes in follow-up commits, each of
    // which resets the positional highlight, so restore it once React's cascade has finished.
    queueMicrotask(() => {
      if (!store.state.open) {
        return;
      }
      const index = findItemIndex(
        store.context.valuesRef.current,
        toggled.value,
        store.state.isItemEqualToValue,
      );
      if (index !== -1) {
        store.set('activeIndex', index);
      }
    });
  });

  // Read by every option, so it holds nothing that changes with the highlight.
  const navigationContext: SelectFilterNavigationContext = React.useMemo(
    () => ({ virtualPressRef }),
    [],
  );

  // Trust the rendered element's id once it exists: an explicitly empty id must not fall back to a
  // registered id that no element carries.
  const triggerId = triggerElement ? triggerElement.id || null : id;

  return (
    <SelectFilterImplContext.Provider value={SELECT_FILTER_IMPL}>
      <SelectFilterNavigationContext.Provider value={navigationContext}>
        <FilterDropdownRoot
          open={open}
          openedByKeyboard={keyboardOpen}
          disabled={disabled}
          value={value}
          // A query kept while fully closed would leave only its matches registered for the
          // trigger's typeahead.
          query={mounted ? query : ''}
          onValueChange={handleValueChange}
          filter={filter}
          autoHighlight={autoHighlight}
          locale={locale}
          triggerId={triggerId}
          listRef={store.context.listRef}
          getActiveIndex={getActiveIndex}
          setActiveIndex={setActiveIndex}
        >
          {children}
        </FilterDropdownRoot>
      </SelectFilterNavigationContext.Provider>
    </SelectFilterImplContext.Provider>
  );
}
