'use client';
import * as React from 'react';
import type { UseMenuItemParameters, UseMenuItemReturnValue } from './useMenuItem.types';
import { MenuActionTypes } from '../Root/menuReducer';
import { useButton } from '../../useButton';
import { useForkRef } from '../../utils/useForkRef';
import { mergeReactProps } from '../../utils/mergeReactProps';
import { GenericHTMLProps } from '../../utils/types';
import { useCompoundItem } from '../../useCompound';
import { ListItemMetadata } from '../../useList';

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
    rootDispatch,
    id,
    label,
    rootRef: externalRef,
    closeOnClick,
    highlighted,
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

  const { getRootProps: getButtonProps, rootRef: buttonRefHandler } = useButton({
    disabled,
    focusableWhenDisabled: true,
  });

  const handleRef = useForkRef(buttonRefHandler, externalRef, itemRef);

  const getRootProps = React.useCallback(
    (externalProps?: GenericHTMLProps): GenericHTMLProps => {
      return mergeReactProps(
        externalProps,
        {
          ref: handleRef,
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
    [closeOnClick, getButtonProps, handleRef, rootDispatch, highlighted, id],
  );

  return {
    getRootProps,
    rootRef: handleRef,
  };
}
