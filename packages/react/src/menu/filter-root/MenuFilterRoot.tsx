'use client';
import * as React from 'react';
import { useControlled } from '@base-ui/utils/useControlled';
import { useStableCallback } from '@base-ui/utils/useStableCallback';
import type { FilterDropdownRoot as FilterDropdownRootNamespace } from '../../filter-dropdown/root/FilterDropdownRoot';
import { useFilterDropdownCloseQuery } from '../../filter-dropdown/root/useFilterDropdownCloseQuery';
import { MenuRootInternal, type MenuRoot } from '../root/MenuRoot';
import type { MenuHandle } from '../store/MenuHandle';
import type { MenuFilterRootFilterProps } from './MenuFilterRootFilterProps';
import { MenuFilterDropdown } from './MenuFilterDropdown';
import { MenuFilterImplContext } from './MenuFilterContext';
import { MENU_FILTER_IMPL } from './MenuFilterImpl';
import { isKeyboardOpen } from './isKeyboardOpen';
import { useMenuFilterWebkitItemSelected } from './useMenuFilterWebkitItemSelected';

/**
 * The filterable implementation of `Menu.Root`, rendered in its place when the root sits inside
 * `Menu.FilterProvider`. Reached through the provider only, so a plain menu never bundles it.
 *
 * @internal
 */
export function MenuFilterRoot<Payload>(props: MenuFilterRoot.Props<Payload>): React.JSX.Element {
  const {
    children,
    open: openProp,
    defaultOpen = false,
    onOpenChange,
    onOpenChangeComplete,
    inputValue: inputValueProp,
    defaultInputValue = '',
    onInputValueChange,
    filter,
    autoHighlight = false,
    locale,
    inline = false,
    handle,
    ...menuProps
  } = props;

  React.useEffect(() => {
    if (process.env.NODE_ENV !== 'production' && handle && !handle.filterable) {
      console.warn(
        'Base UI: a filterable <Menu.Root> received a handle created without `filterable: true`. ' +
          'Detached triggers announce a plain menu until the root attaches, which can ' +
          'mismatch on hydration. Create it with `Menu.createHandle({ filterable: true })`.',
      );
    }
  }, [handle]);

  const [open, setOpen] = useControlled({
    controlled: openProp,
    default: defaultOpen,
    name: 'MenuFilterRoot',
    state: 'open',
  });
  const [inputValue, setInputValue] = useControlled({
    controlled: inputValueProp,
    default: defaultInputValue,
    name: 'MenuFilterRoot',
    state: 'inputValue',
  });
  const [inputFocusVisible, setInputFocusVisible] = React.useState(false);
  const [inputAutoFocus, setInputAutoFocus] = React.useState(false);

  const focusOwnerRef = React.useRef<HTMLElement | null>(null);
  const webkitItemSelected = useMenuFilterWebkitItemSelected();

  const handleInputValueChange = useStableCallback(
    (nextValue: string, details: MenuFilterRoot.InputValueChangeEventDetails) => {
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

  const handleOpenChange = useStableCallback(
    (nextOpen: boolean, details: MenuFilterRoot.ChangeEventDetails) => {
      onOpenChange?.(nextOpen, details);
      if (details.isCanceled) {
        return;
      }

      closeQuery.handleOpenChange(nextOpen);
      setOpen(nextOpen);
      setInputFocusVisible(nextOpen && isKeyboardOpen(details));
    },
  );

  return (
    <MenuRootInternal
      {...menuProps}
      handle={handle}
      open={open}
      onOpenChange={handleOpenChange}
      onOpenChangeComplete={closeQuery.handleOpenChangeComplete}
      inline={inline}
      virtualFocus
      webkitItemSelected={webkitItemSelected}
      virtualFocusRef={focusOwnerRef}
      virtualFocusAutoFocus={inputAutoFocus}
      // Escaping past either end of the list returns the highlight to the input.
      allowEscape={!autoHighlight}
      resetOnPointerLeave={autoHighlight !== 'always'}
      renderVirtualFocusChildren={(payload, inputProps) => (
        <MenuFilterImplContext.Provider value={MENU_FILTER_IMPL}>
          <MenuFilterDropdown
            open={open}
            inputFocusVisible={inputFocusVisible}
            value={inputValue}
            query={closeQuery.query}
            filter={filter}
            autoHighlight={autoHighlight}
            locale={locale}
            inline={inline}
            inputProps={inputProps}
            onValueChange={handleInputValueChange}
            onInputAutoFocusChange={setInputAutoFocus}
          >
            {typeof children === 'function' ? children(payload) : children}
          </MenuFilterDropdown>
        </MenuFilterImplContext.Provider>
      )}
    />
  );
}

/**
 * Determines whether an item matches the current filter query.
 *
 * @param text The item's `label`, rendered text, or one of its `keywords`.
 * @param query The trimmed filter query.
 */
export type MenuFilterFunction = (text: string, query: string) => boolean;

export type MenuFilterRootProps<Payload = unknown> = Omit<
  MenuRoot.Props<Payload>,
  'actionsRef' | 'closeParentOnEsc' | 'handle' | 'onOpenChange' | 'orientation'
> &
  MenuFilterRootFilterProps & {
    /**
     * A ref to imperative actions.
     */
    actionsRef?: React.RefObject<MenuFilterRootActions | null> | undefined;
    /**
     * A handle that associates the menu with detached triggers.
     */
    handle?: MenuHandle<Payload> | undefined;
    /**
     * @ignore
     */
    inline?: boolean | undefined;
    /**
     * Event handler called when the menu is opened or closed.
     */
    onOpenChange?:
      ((open: boolean, eventDetails: MenuFilterRootChangeEventDetails) => void) | undefined;
  };

export interface MenuFilterRootState extends MenuRoot.State {}
export type MenuFilterRootActions = MenuRoot.Actions;
export type MenuFilterRootChangeEventReason = MenuRoot.ChangeEventReason;
export type MenuFilterRootChangeEventDetails = MenuRoot.ChangeEventDetails;
export type MenuFilterRootInputValueChangeEventReason =
  FilterDropdownRootNamespace.ChangeEventReason;
export type MenuFilterRootInputValueChangeEventDetails =
  FilterDropdownRootNamespace.ChangeEventDetails;

export namespace MenuFilterRoot {
  export type Props<Payload = unknown> = MenuFilterRootProps<Payload>;
  export type State = MenuFilterRootState;
  export type Actions = MenuFilterRootActions;
  export type ChangeEventReason = MenuFilterRootChangeEventReason;
  export type ChangeEventDetails = MenuFilterRootChangeEventDetails;
  export type InputValueChangeEventReason = MenuFilterRootInputValueChangeEventReason;
  export type InputValueChangeEventDetails = MenuFilterRootInputValueChangeEventDetails;
}
