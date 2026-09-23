'use client';
import * as React from 'react';
import { useStableCallback } from '@base-ui/utils/useStableCallback';
import { ownerWindow } from '@base-ui/utils/owner';
import { useMenubarContext } from '../../menubar/MenubarContext';
import { FilterDropdownRoot } from '../../filter-dropdown/root/FilterDropdownRoot';
import type { FilterDropdownFilter } from '../../filter-dropdown/root/FilterDropdownRootContext';
import { useMenuRootContext } from '../root/MenuRootContext';
import { REASONS } from '../../internals/reasons';
import type { BaseUIEvent, HTMLProps } from '../../internals/types';
import type { MenuFilterProvider } from '../filter-provider/MenuFilterProvider';
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
  inputProps: HTMLProps;
  onValueChange: (value: string, details: MenuFilterProvider.ValueChangeEventDetails) => void;
  children?: React.ReactNode;
}

/**
 * Reads the menu store, which is only available below the menu root, and hands the filter
 * substrate the list the menu navigates plus the props for the input that holds real focus.
 */
export function MenuFilterDropdown(props: MenuFilterDropdownProps) {
  const { store } = useMenuRootContext();
  const isInMenubar = useMenubarContext(true) != null;

  const triggerId = store.useState('activeTriggerId');
  const triggerElement = store.useState('activeTriggerElement');
  const activeIndex = store.useState('activeIndex');
  const disabled = store.useState('disabled');

  const setActiveIndex = useStableCallback((index: number | null) => {
    store.setActiveIndex(index, REASONS.none);
  });

  // Only read when the popup takes focus, so it stays out of React state.
  const setInputAutoFocus = useStableCallback((autoFocus: boolean) => {
    store.context.virtualFocusAutoFocus = autoFocus;
  });

  // The trigger announces a dialog and relays list navigation typed on it to the input, which
  // holds real focus while the popup is open.
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
          const KeyboardEventConstructor = ownerWindow(focusOwner).KeyboardEvent;
          focusOwner.dispatchEvent(new KeyboardEventConstructor(event.type, event.nativeEvent));
          // Let the forwarded navigation commit before focus would seed the first item.
          queueMicrotask(() => focusOwner.focus({ preventScroll: true }));
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
    [store, isInMenubar],
  );

  store.useSyncedValue('filterTriggerProps', filterTriggerProps);

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
        inputRef={store.context.virtualFocusRef}
        onInputAutoFocusChange={setInputAutoFocus}
      />
    </MenuFilterImplContext.Provider>
  );
}
