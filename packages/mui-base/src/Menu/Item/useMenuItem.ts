'use client';
import * as React from 'react';
import type { UseMenuItemParameters, UseMenuItemReturnValue } from './useMenuItem.types';
import { MenuActionTypes } from '../Root/menuReducer';
import { useButton } from '../../useButton';
import { useForkRef } from '../../utils/useForkRef';
import { mergeReactProps } from '../../utils/mergeReactProps';
import { GenericHTMLProps } from '../../utils/types';

/**
 *
 * API:
 *
 * - [useMenuItem API](https://mui.com/base-ui/api/use-menu-item/)
 */
export function useMenuItem(params: UseMenuItemParameters): UseMenuItemReturnValue {
  const {
    disabled = false,
    rootDispatch,
    id,
    rootRef: externalRef,
    closeOnClick,
    highlighted,
    clickAndDragSupport,
  } = params;

  const { getRootProps: getButtonProps, rootRef: buttonRefHandler } = useButton({
    disabled,
    focusableWhenDisabled: true,
  });

  const handleRef = useForkRef(buttonRefHandler, externalRef);

  const getRootProps = React.useCallback(
    (externalProps?: GenericHTMLProps): GenericHTMLProps => {
      return mergeReactProps(
        externalProps,
        {
          ref: handleRef,
          'data-handle-mouseup': clickAndDragSupport || undefined,
        },
        getButtonProps({
          id,
          role: 'menuitem',
          tabIndex: highlighted ? 0 : -1,
          onClick: (event: React.MouseEvent) => {
            if (closeOnClick) {
              rootDispatch({
                type: MenuActionTypes.close,
                event,
              });
            }
          },
        }),
      );
    },
    [closeOnClick, getButtonProps, handleRef, rootDispatch, highlighted, id, clickAndDragSupport],
  );

  return {
    getRootProps,
    rootRef: handleRef,
  };
}
