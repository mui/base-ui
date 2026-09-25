'use client';
import * as React from 'react';
import { useControlled } from '@base-ui/utils/useControlled';
import { useStableCallback } from '@base-ui/utils/useStableCallback';
import { useMenubarContext } from '../../menubar/MenubarContext';
import { FilterDropdownRoot } from '../../filter-dropdown/root/FilterDropdownRoot';
import { useFilterDropdownCloseQuery } from '../../filter-dropdown/root/useFilterDropdownCloseQuery';
import type { FilterDropdownFilter } from '../../filter-dropdown/root/FilterDropdownRootContext';
import { useMenuRootContext } from '../root/MenuRootContext';
import { REASONS } from '../../internals/reasons';
import type { BaseUIEvent, HTMLProps } from '../../internals/types';
import type { MenuFilterProvider } from '../filter-provider/MenuFilterProvider';
import { MenuFilterImplContext } from './MenuFilterContext';
import { MENU_FILTER_IMPL } from './MenuFilterImpl';
import { useMenuFilterKeyDown } from './useMenuFilterKeyDown';

export interface MenuFilterDropdownProps {
  value: string | undefined;
  defaultValue: string | undefined;
  onValueChange: MenuFilterProvider.Props['onValueChange'];
  filter: FilterDropdownFilter | null | undefined;
  autoHighlight: boolean | 'always';
  locale: Intl.LocalesArgument | undefined;
  children?: React.ReactNode;
}

/**
 * Reads the menu store, which is only available below the menu root, and hands the filter
 * substrate the list the menu navigates and the command that moves its highlight. The query is
 * owned here; the menu root keeps sole ownership of the open state.
 */
export function MenuFilterDropdown(props: MenuFilterDropdownProps) {
  const { value: valueProp, defaultValue = '', onValueChange, ...dropdownProps } = props;

  const { store } = useMenuRootContext();
  const isInMenubar = useMenubarContext(true) != null;

  const open = store.useState('open');
  const mounted = store.useState('mounted');
  const keyboardOpen = store.useState('keyboardOpen');
  const triggerId = store.useState('activeTriggerId');
  const triggerElement = store.useState('activeTriggerElement');
  const disabled = store.useState('disabled');

  const [value, setValue] = useControlled({
    controlled: valueProp,
    default: defaultValue,
    name: 'MenuFilterProvider',
    state: 'value',
  });

  const handleValueChange = useStableCallback(
    (nextValue: string, details: MenuFilterProvider.ValueChangeEventDetails) => {
      onValueChange?.(nextValue, details);
      if (!details.isCanceled) {
        setValue(nextValue);
      }
    },
  );

  const query = useFilterDropdownCloseQuery({
    open,
    mounted,
    value,
    onValueChange: handleValueChange,
  });

  const handleInputKeyDown = useMenuFilterKeyDown(value !== '');

  const setActiveIndex = useStableCallback((index: number | null) => {
    store.setActiveIndex(index, REASONS.none);
  });

  // The trigger announces a dialog and routes list navigation typed on it as the input would,
  // since the input holds real focus while the popup is open.
  const filterTriggerProps = React.useMemo<HTMLProps>(
    () => ({
      'aria-haspopup': 'dialog',
      onKeyDown(event: BaseUIEvent<React.KeyboardEvent<HTMLElement>>) {
        const focusOwner = store.context.virtualFocusRef?.current;
        if (!store.select('open') || !focusOwner || isInMenubar) {
          return;
        }

        const isVerticalArrow = event.key === 'ArrowUp' || event.key === 'ArrowDown';
        const isTypeaheadKey =
          event.key.length === 1 &&
          event.key !== ' ' &&
          !event.ctrlKey &&
          !event.metaKey &&
          !event.altKey;

        if (isVerticalArrow) {
          focusOwner.focus({ preventScroll: true });
          handleInputKeyDown(event);
          event.preventDefault();
          event.preventBaseUIHandler();
        } else if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
          // Cross-axis keys drive submenu open/close, which the trigger must not relay.
          event.preventBaseUIHandler();
        } else if (isTypeaheadKey) {
          focusOwner.focus({ preventScroll: true });
        }
      },
    }),
    [store, isInMenubar, handleInputKeyDown],
  );

  store.useSyncedValue('filterTriggerProps', filterTriggerProps);

  return (
    <MenuFilterImplContext.Provider value={MENU_FILTER_IMPL}>
      <FilterDropdownRoot
        {...dropdownProps}
        open={open}
        inputFocusVisible={keyboardOpen}
        value={value}
        query={query}
        onValueChange={handleValueChange}
        disabled={disabled}
        // Trust the rendered element's id once it exists: an explicitly empty id must not
        // fall back to a registered id that no element carries.
        triggerId={triggerElement ? triggerElement.id || null : triggerId}
        listRef={store.context.itemDomElements}
        setActiveIndex={setActiveIndex}
        inputRef={store.context.virtualFocusRef}
      />
    </MenuFilterImplContext.Provider>
  );
}
