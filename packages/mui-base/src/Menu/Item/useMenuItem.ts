'use client';
import * as React from 'react';
import { FloatingEvents } from '@floating-ui/react';
import { useButton } from '../../useButton';
import { mergeReactProps } from '../../utils/mergeReactProps';
import { GenericHTMLProps } from '../../utils/types';

export function useMenuItem(params: useMenuItem.Parameters): useMenuItem.ReturnValue {
  const {
    closeOnClick,
    disabled = false,
    highlighted,
    id,
    menuEvents,
    ref: externalRef,
    treatMouseupAsClick,
  } = params;

  const { getRootProps: getButtonProps, rootRef: mergedRef } = useButton({
    disabled,
    focusableWhenDisabled: true,
    rootRef: externalRef,
  });

  const getRootProps = React.useCallback(
    (externalProps?: GenericHTMLProps): GenericHTMLProps => {
      return getButtonProps(
        mergeReactProps(externalProps, {
          'data-handle-mouseup': treatMouseupAsClick || undefined,
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
    [closeOnClick, getButtonProps, highlighted, id, menuEvents, treatMouseupAsClick],
  );

  return React.useMemo(
    () => ({
      getRootProps,
      rootRef: mergedRef,
    }),
    [getRootProps, mergedRef],
  );
}

export namespace useMenuItem {
  export interface Parameters {
    /**
     * If `true`, the menu will close when the menu item is clicked.
     */
    closeOnClick: boolean;
    /**
     * If `true`, the menu item will be disabled.
     */
    disabled: boolean;
    /**
     * Determines if the menu item is highlighted.
     */
    highlighted: boolean;
    /**
     * The id of the menu item.
     */
    id: string | undefined;
    /**
     * The FloatingEvents instance of the menu's root.
     */
    menuEvents: FloatingEvents;
    /**
     * The ref of the trigger element.
     */
    ref?: React.Ref<Element>;
    /**
     * If `true`, the menu item will listen for mouseup events and treat them as clicks.
     */
    treatMouseupAsClick: boolean;
  }

  export interface ReturnValue {
    /**
     * Resolver for the root slot's props.
     * @param externalProps event handlers for the root slot
     * @returns props that should be spread on the root slot
     */
    getRootProps: (externalProps?: GenericHTMLProps) => GenericHTMLProps;
    /**
     * The ref to the component's root DOM element.
     */
    rootRef: React.RefCallback<Element> | null;
  }
}
