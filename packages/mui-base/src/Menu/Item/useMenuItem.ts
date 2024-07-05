'use client';
import * as React from 'react';
import type { UseMenuItemParameters, UseMenuItemReturnValue } from './useMenuItem.types';
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
    closeOnClick,
    disabled = false,
    highlighted,
    id,
    menuEvents,
    rootRef: externalRef,
  } = params;

  const { getRootProps: getButtonProps, rootRef: buttonRefHandler } = useButton({
    disabled,
    focusableWhenDisabled: true,
  });

  const [clickAndDrag, setClickAndDrag] = React.useState(false);

  React.useLayoutEffect(() => {
    function handleClickAndDragEnabled() {
      setClickAndDrag(true);
    }

    function handleClickAndDragDisabled() {
      setClickAndDrag(false);
    }

    menuEvents.on('click-and-drag:enabled', handleClickAndDragEnabled);
    menuEvents.on('click-and-drag:disabled', handleClickAndDragDisabled);

    return () => {
      menuEvents.off('click-and-drag:enabled', handleClickAndDragEnabled);
      menuEvents.off('click-and-drag:disabled', handleClickAndDragDisabled);
    };
  }, [menuEvents]);

  const handleRef = useForkRef(buttonRefHandler, externalRef);

  const getRootProps = React.useCallback(
    (externalProps?: GenericHTMLProps): GenericHTMLProps => {
      return mergeReactProps(
        externalProps,
        {
          ref: handleRef,
          'data-handle-mouseup': clickAndDrag || undefined,
        },
        getButtonProps({
          id,
          role: 'menuitem',
          tabIndex: highlighted ? 0 : -1,
          onClick: (event: React.MouseEvent) => {
            if (closeOnClick) {
              menuEvents.emit('close', event);
            }
          },
        }),
      );
    },
    [closeOnClick, getButtonProps, handleRef, highlighted, id, menuEvents, clickAndDrag],
  );

  return {
    getRootProps,
    rootRef: handleRef,
  };
}
