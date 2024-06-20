'use client';
import * as React from 'react';
import { unstable_useForkRef as useForkRef } from '@mui/utils';
import { UseMenuTriggerParameters, UseMenuTriggerReturnValue } from './useMenuTrigger.types';
import { MenuActionTypes } from '../Root/useMenuRoot.types';
import { useButton } from '../../useButton/useButton';
import { GenericHTMLProps } from '../../utils/types';
import { mergeReactProps } from '../../utils/mergeReactProps';

export function useMenuTrigger(parameters: UseMenuTriggerParameters): UseMenuTriggerReturnValue {
  const {
    disabled = false,
    focusableWhenDisabled,
    rootRef: externalRef,
    menuState,
    dispatch,
  } = parameters;

  const { getRootProps: getButtonRootProps, rootRef: buttonRootRef } = useButton({
    disabled,
    focusableWhenDisabled,
    rootRef: externalRef,
  });

  const registerTrigger = React.useCallback(
    (element: HTMLElement | null) => {
      dispatch({
        type: MenuActionTypes.registerTrigger,
        triggerElement: element,
      });
    },
    [dispatch],
  );

  const handleRef = useForkRef(buttonRootRef, registerTrigger);

  const getRootProps = (externalProps?: GenericHTMLProps): GenericHTMLProps => {
    return mergeReactProps(
      externalProps,
      {
        'aria-haspopup': 'menu' as const,
        'aria-expanded': menuState.open,
        'aria-controls': menuState.popupId ?? undefined,
        tabIndex: 0, // this is needed to make the button focused after click in Safari
        ref: handleRef,
      },
      getButtonRootProps({
        onClick: (event: React.MouseEvent) => {
          if (!disabled) {
            dispatch({
              type: MenuActionTypes.toggle,
              event,
            });
          }
        },
        onKeyDown: (event: React.KeyboardEvent) => {
          if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
            event.preventDefault();
            if (!disabled) {
              dispatch({
                type: MenuActionTypes.open,
                event,
                highlightRequest: event.key === 'ArrowDown' ? 'first' : 'last',
              });
            }
          }
        },
      }),
    );
  };

  return {
    getRootProps,
    rootRef: handleRef,
  };
}
