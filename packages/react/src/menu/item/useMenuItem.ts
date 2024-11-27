'use client';
import * as React from 'react';
import { FloatingEvents } from '@floating-ui/react';
import { useButton } from '../../use-button';
import { mergeReactProps } from '../../utils/mergeReactProps';
import { GenericHTMLProps } from '../../utils/types';
import { MuiCancellableEvent } from '../../utils/MuiCancellableEvent';

export function useMenuItem(params: useMenuItem.Parameters): useMenuItem.ReturnValue {
  const {
    closeOnClick,
    disabled = false,
    highlighted,
    id,
    menuEvents,
    ref: externalRef,
    treatMouseupAsClick,
    typingRef,
  } = params;

  const { getButtonProps, buttonRef: mergedRef } = useButton({
    disabled,
    focusableWhenDisabled: true,
    buttonRef: externalRef,
  });

  const getRootProps = React.useCallback(
    (externalProps?: GenericHTMLProps): GenericHTMLProps => {
      return getButtonProps(
        mergeReactProps(externalProps, {
          'data-handle-mouseup': treatMouseupAsClick || undefined,
          id,
          role: 'menuitem',
          tabIndex: highlighted ? 0 : -1,
          onKeyUp: (event: React.KeyboardEvent & MuiCancellableEvent) => {
            if (event.key === ' ' && typingRef.current) {
              event.defaultMuiPrevented = true;
            }
          },
          onClick: (event: React.MouseEvent | React.KeyboardEvent) => {
            if (event.type === 'keydown') {
              if ((event as React.KeyboardEvent).key === 'Enter') {
                menuEvents.emit('close', event);
                return;
              }
            }

            if (closeOnClick) {
              menuEvents.emit('close', event);
            }
          },
        }),
      );
    },
    [closeOnClick, getButtonProps, highlighted, id, menuEvents, treatMouseupAsClick, typingRef],
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
    /**
     * A ref that is set to `true` when the user is using the typeahead feature.
     */
    typingRef: React.RefObject<boolean>;
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
