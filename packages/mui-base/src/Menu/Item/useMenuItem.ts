'use client';
import * as React from 'react';
import type { UseMenuItemParameters, UseMenuItemReturnValue } from './useMenuItem.types';
import { MenuActionTypes } from '../Root/useMenuRoot.types';
import { useButton } from '../../useButton';
import { ListItemMetadata, useListItem } from '../../useList';
import { useForkRef } from '../../utils/useForkRef';
import { mergeReactProps } from '../../utils/mergeReactProps';
import { GenericHTMLProps } from '../../utils/types';
import { useCompoundItem } from '../../useCompound';

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
    compoundParentContext,
    disabled = false,
    disableFocusOnHover = false,
    dispatch,
    highlighted,
    id,
    label,
    rootRef: externalRef,
    closeOnClick,
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

  function getRootProps(externalProps?: GenericHTMLProps): GenericHTMLProps {
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
              dispatch({
                type: MenuActionTypes.close,
                event,
              });
            }
          },
        }),
      ),
    );
  }

  return {
    getRootProps,
    rootRef: handleRef,
  };
}
