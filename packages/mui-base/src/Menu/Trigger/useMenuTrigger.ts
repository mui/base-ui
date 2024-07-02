'use client';
import * as React from 'react';
import { unstable_useForkRef as useForkRef } from '@mui/utils';
import { UseMenuTriggerParameters, UseMenuTriggerReturnValue } from './useMenuTrigger.types';
import { MenuActionTypes } from '../Root/menuReducer';
import { useButton } from '../../useButton/useButton';
import { GenericHTMLProps } from '../../utils/types';
import { mergeReactProps } from '../../utils/mergeReactProps';
import { ownerDocument } from '../../utils/owner';
/**
 *
 * API:
 *
 * - [useMenuTrigger API](https://mui.com/base-ui/api/use-menu-trigger/)
 */
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

  const getRootProps = React.useCallback(
    (externalProps?: GenericHTMLProps): GenericHTMLProps => {
      return mergeReactProps(
        externalProps,
        {
          'aria-haspopup': 'menu' as const,
          'aria-expanded': menuState.open,
          'aria-controls': menuState.popupId ?? undefined,
          tabIndex: 0, // this is needed to make the button focused after click in Safari
          ref: handleRef,
          onMouseDown: (event: MouseEvent) => {
            dispatch({ type: MenuActionTypes.open, event });
            const mousedownTarget = event.target as Element;
            function handleDocumentMouseUp(mouseUpEvent: MouseEvent) {
              const mouseupTarget = mouseUpEvent.target as HTMLElement;
              if (mouseupTarget?.dataset?.handleMouseup === 'true') {
                mouseupTarget.click();
              }

              dispatch({ type: MenuActionTypes.resetClickAndDragging });
              ownerDocument(mousedownTarget).removeEventListener('mouseup', handleDocumentMouseUp);
            }

            ownerDocument(mousedownTarget).addEventListener('mouseup', handleDocumentMouseUp);
          },
        },
        getButtonRootProps(),
      );
    },
    [dispatch, getButtonRootProps, handleRef, menuState.open, menuState.popupId],
  );

  return React.useMemo(
    () => ({
      getRootProps,
      rootRef: handleRef,
    }),
    [getRootProps, handleRef],
  );
}
