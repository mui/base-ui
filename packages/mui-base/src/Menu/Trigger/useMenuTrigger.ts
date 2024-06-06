'use client';
import * as React from 'react';
import { unstable_useForkRef as useForkRef } from '@mui/utils';
import { UseMenuTriggerParameters, UseMenuTriggerReturnValue } from './useMenuTrigger.types';
import { MenuRootContext } from '../Root/MenuRootContext';
import { DropdownActionTypes } from '../Root/useMenuRoot.types';
import { useButton } from '../../useButton/useButton';
import { EventHandlers } from '../../utils/types';
import { MuiCancellableEvent } from '../../utils/MuiCancellableEvent';
import { combineHooksSlotProps } from '../../utils/combineHooksSlotProps';
import { extractEventHandlers } from '../../utils';

/**
 *
 * Demos:
 *
 * - [Menu](https://mui.com/base-ui/react-menu/#hooks)
 *
 * API:
 *
 * - [useMenuButton API](https://mui.com/base-ui/react-menu/hooks-api/#use-menu-button)
 */
export function useMenuTrigger(
  parameters: UseMenuTriggerParameters = {},
): UseMenuTriggerReturnValue {
  const { disabled = false, focusableWhenDisabled, rootRef: externalRef } = parameters;

  const menuContext = React.useContext(MenuRootContext);
  if (menuContext === null) {
    throw new Error('useMenuButton: no menu context available.');
  }

  const { state, dispatch, registerTrigger, popupId } = menuContext;

  const {
    getRootProps: getButtonRootProps,
    rootRef: buttonRootRef,
    active,
  } = useButton({
    disabled,
    focusableWhenDisabled,
    rootRef: externalRef,
  });

  const handleRef = useForkRef(buttonRootRef, registerTrigger);

  const createHandleClick =
    (otherHandlers: EventHandlers) => (event: React.MouseEvent & MuiCancellableEvent) => {
      otherHandlers.onClick?.(event);
      if (event.defaultMuiPrevented) {
        return;
      }

      dispatch({
        type: DropdownActionTypes.toggle,
        event,
      });
    };

  const createHandleKeyDown =
    (otherHandlers: EventHandlers) => (event: React.KeyboardEvent & MuiCancellableEvent) => {
      otherHandlers.onKeyDown?.(event);
      if (event.defaultMuiPrevented) {
        return;
      }

      if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
        event.preventDefault();
        dispatch({
          type: DropdownActionTypes.open,
          event,
        });
      }
    };

  const getOwnRootProps = (otherHandlers: EventHandlers = {}) => ({
    onClick: createHandleClick(otherHandlers),
    onKeyDown: createHandleKeyDown(otherHandlers),
  });

  const getRootProps = <ExternalProps extends Record<string, unknown> = {}>(
    externalProps: ExternalProps = {} as ExternalProps,
  ) => {
    const externalEventHandlers = extractEventHandlers(externalProps);
    const getCombinedProps = combineHooksSlotProps(getOwnRootProps, getButtonRootProps);

    return {
      'aria-haspopup': 'menu' as const,
      'aria-expanded': state.open,
      'aria-controls': popupId,
      ...externalProps,
      ...externalEventHandlers,
      ...getCombinedProps(externalEventHandlers),
      tabIndex: 0, // this is needed to make the button focused after click in Safari
      ref: handleRef,
    };
  };

  return {
    active,
    getRootProps,
    open: state.open,
    rootRef: handleRef,
  };
}
