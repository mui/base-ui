'use client';
import * as React from 'react';
import type { UseMenuItemParameters, UseMenuItemReturnValue } from './useMenuItem.types';
import { MenuActionTypes } from '../Root/useMenuRoot.types';
import { useButton } from '../../useButton';
import { useListItem } from '../../useList';
import { useForkRef } from '../../utils/useForkRef';
import { mergeReactProps } from '../../utils/mergeReactProps';
import { GenericHTMLProps } from '../../utils/types';

/**
 *
 * Demos:
 *
 * - [Menu](https://mui.com/base-ui/react-menu/#hooks)
 *
 * API:
 *
 * - [useMenuItem API](https://mui.com/base-ui/react-menu/hooks-api/#use-menu-item)
 */
export function useMenuItem(params: UseMenuItemParameters): UseMenuItemReturnValue {
  const {
    dispatch,
    disabled = false,
    id,
    rootRef: externalRef,
    disableFocusOnHover = false,
    highlighted,
  } = params;

  const itemRef = React.useRef<HTMLElement>(null);

  const { getRootProps: getListItemProps } = useListItem({
    dispatch,
    item: id ?? '',
    handlePointerOverEvents: !disableFocusOnHover,
    highlighted,
    focusable: true,
    selected: false,
  });

  const { getRootProps: getButtonProps, rootRef: buttonRefHandler } = useButton({
    disabled,
    focusableWhenDisabled: true,
  });

  const handleRef = useForkRef(buttonRefHandler, externalRef, itemRef);

  function getRootProps(externalProps?: GenericHTMLProps): GenericHTMLProps {
    return mergeReactProps(
      externalProps,
      {
        id,
        ref: handleRef,
        role: 'menuitem',
        onClick: (event: React.MouseEvent) => {
          dispatch({
            type: MenuActionTypes.close,
            event,
          });
        },
      },
      getButtonProps(),
      getListItemProps(),
    );
  }

  return {
    getRootProps,
    rootRef: handleRef,
  };
}
