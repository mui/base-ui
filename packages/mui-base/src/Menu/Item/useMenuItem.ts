'use client';
import * as React from 'react';
import type { UseMenuItemParameters, UseMenuItemReturnValue } from './useMenuItem.types';
import { MenuActionTypes } from '../Root/useMenuRoot.types';
import { useButton } from '../../useButton';
import { useListItem } from '../../useList';
import { combineHooksSlotProps } from '../../legacy/utils/combineHooksSlotProps';
import { MuiCancellableEvent } from '../../utils/MuiCancellableEvent';
import { EventHandlers, GenericHTMLProps } from '../../utils/types';
import { extractEventHandlers } from '../../utils/extractEventHandlers';
import { useForkRef } from '../../utils/useForkRef';

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

  const { getRootProps: getListRootProps } = useListItem({
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

  const createHandleClick =
    (otherHandlers: EventHandlers) => (event: React.MouseEvent & MuiCancellableEvent) => {
      otherHandlers.onClick?.(event);
      if (event.defaultMuiPrevented) {
        return;
      }

      dispatch({
        type: MenuActionTypes.close,
        event,
      });
    };

  const getOwnHandlers = <ExternalProps extends EventHandlers>(
    otherHandlers: ExternalProps = {} as ExternalProps,
  ) => ({
    ...otherHandlers,
    onClick: createHandleClick(otherHandlers),
  });

  function getRootProps(externalProps?: GenericHTMLProps): GenericHTMLProps {
    const externalEventHandlers = extractEventHandlers(externalProps);
    const getCombinedRootProps = combineHooksSlotProps(
      getOwnHandlers,
      combineHooksSlotProps(getButtonProps, getListRootProps),
    );
    return {
      ...externalProps,
      ...externalEventHandlers,
      ...getCombinedRootProps(externalEventHandlers),
      id,
      ref: handleRef,
      role: 'menuitem',
    };
  }

  return {
    getRootProps,
    rootRef: handleRef,
  };
}
