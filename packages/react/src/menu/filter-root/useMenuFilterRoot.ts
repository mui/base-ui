'use client';
import * as React from 'react';
import { platform } from '@base-ui/utils/platform';
import { useControlled } from '@base-ui/utils/useControlled';
import { useStableCallback } from '@base-ui/utils/useStableCallback';
import { useFilterDropdownCloseQuery } from '../../filter-dropdown/root/useFilterDropdownCloseQuery';
import { useIsHydrating } from '../../utils/useIsHydrating';
import type { MenuFilterRoot } from './MenuFilterRoot';
import { isKeyboardOpen } from './isKeyboardOpen';

/** Shared query, open state, and focus options for filterable roots and submenus. */
export function useMenuFilterRoot<Payload>(props: MenuFilterRoot.Props<Payload>, name: string) {
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
    ...otherProps
  } = props;

  const [open, setOpen] = useControlled({
    controlled: openProp,
    default: defaultOpen,
    name,
    state: 'open',
  });
  const [inputValue, setInputValue] = useControlled({
    controlled: inputValueProp,
    default: defaultInputValue,
    name,
    state: 'inputValue',
  });
  const [inputFocusVisible, setInputFocusVisible] = React.useState(false);
  const [inputAutoFocus, setInputAutoFocus] = React.useState(false);

  const focusOwnerRef = React.useRef<HTMLElement | null>(null);
  const hydrating = useIsHydrating();

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

  return {
    children,
    rootProps: {
      ...otherProps,
      open,
      onOpenChange: handleOpenChange,
      onOpenChangeComplete: closeQuery.handleOpenChangeComplete,
      virtualFocus: true,
      virtualFocusInitialHighlight: inputFocusVisible,
      // WebKit needs selection state to follow a searchbox's active descendant into a menu.
      // Wait until after hydration so server and client markup agree.
      webkitItemSelected: !hydrating && platform.engine.webkit,
      virtualFocusRef: focusOwnerRef,
      virtualFocusAutoFocus: inputAutoFocus,
      allowEscape: !autoHighlight,
      resetOnPointerLeave: autoHighlight !== 'always',
    },
    dropdownProps: {
      open,
      inputFocusVisible,
      value: inputValue,
      query: closeQuery.query,
      filter,
      autoHighlight,
      locale,
      onValueChange: handleInputValueChange,
      onInputAutoFocusChange: setInputAutoFocus,
    },
  };
}
