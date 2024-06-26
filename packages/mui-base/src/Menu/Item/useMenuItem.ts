'use client';
import * as React from 'react';
import type { UseMenuItemParameters, UseMenuItemReturnValue } from './useMenuItem.types';
import { MenuActionTypes } from '../Root/useMenuRoot.types';
import { useButton } from '../../useButton';
import { ListDirection, ListItemMetadata, ListOrientation, useListItem } from '../../useList';
import { useForkRef } from '../../utils/useForkRef';
import { mergeReactProps } from '../../utils/mergeReactProps';
import { GenericHTMLProps } from '../../utils/types';
import { useCompoundItem } from '../../useCompound';

/**
 *
 * API:
 *
 * - [useMenuItem API](https://mui.com/base-ui/api/use-menu-item/)
 */
export function useMenuItem(params: UseMenuItemParameters): UseMenuItemReturnValue {
  const {
    compoundParentContext,
    disabled = false,
    disableFocusOnHover = false,
    dispatch,
    rootDispatch,
    highlighted,
    id,
    label,
    rootRef: externalRef,
    closeOnClick,
    isNested,
    orientation,
    direction,
  } = params;

  const itemRef = React.useRef<HTMLElement>(null);

  const itemMetadata: ListItemMetadata = React.useMemo(
    () => ({
      id,
      valueAsString: label ?? itemRef.current?.innerText,
      ref: itemRef,
      disabled,
    }),
    [id, label, disabled],
  );

  useCompoundItem({
    key: id ?? '',
    itemMetadata,
    parentContext: compoundParentContext,
  });

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

  const getRootProps = React.useCallback(
    (externalProps?: GenericHTMLProps): GenericHTMLProps => {
      const closeKey = getSubmenuCloseKey(orientation, direction);

      return mergeReactProps(
        externalProps,
        {
          ref: handleRef,
        },
        getButtonProps(
          getListItemProps({
            id,
            role: 'menuitem',
            onClick: (event: React.MouseEvent) => {
              if (closeOnClick) {
                rootDispatch({
                  type: MenuActionTypes.close,
                  event,
                });
              }
            },
            onKeyDown: (event: React.KeyboardEvent) => {
              if (isNested && event.key === closeKey) {
                dispatch({
                  type: MenuActionTypes.close,
                  event,
                });
              }
            },
          }),
        ),
      );
    },
    [
      closeOnClick,
      dispatch,
      direction,
      getButtonProps,
      getListItemProps,
      handleRef,
      isNested,
      orientation,
      rootDispatch,
      id,
    ],
  );

  return {
    getRootProps,
    rootRef: handleRef,
  };
}

function getSubmenuCloseKey(orientation: ListOrientation, direction: ListDirection) {
  if (orientation === 'horizontal') {
    return 'ArrowUp';
  }

  return direction === 'ltr' ? 'ArrowLeft' : 'ArrowRight';
}
