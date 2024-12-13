'use client';
import * as React from 'react';
import { FloatingEvents } from '@floating-ui/react';
import { useButton } from '../../use-button';
import { mergeReactProps } from '../../utils/mergeReactProps';
import { GenericHTMLProps } from '../../utils/types';
import { MuiCancellableEvent } from '../../utils/MuiCancellableEvent';
import { useForkRef } from '../../utils/useForkRef';

export function useMenuItem(params: useMenuItem.Parameters): useMenuItem.ReturnValue {
  const {
    closeOnClick,
    disabled = false,
    highlighted,
    id,
    menuEvents,
    ref: externalRef,
    allowMouseUpTriggerRef,
    typingRef,
  } = params;

  const itemRef = React.useRef<HTMLElement | null>(null);

  const { getButtonProps, buttonRef: mergedRef } = useButton({
    disabled,
    focusableWhenDisabled: true,
    buttonRef: useForkRef(externalRef, itemRef),
  });

  const getRootProps = React.useCallback(
    (externalProps?: GenericHTMLProps): GenericHTMLProps => {
      return getButtonProps(
        mergeReactProps(externalProps, {
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
          onMouseUp: (event: React.MouseEvent) => {
            if (itemRef.current && allowMouseUpTriggerRef.current) {
              // This fires whenever the user clicks on the trigger, moves the cursor, and releases it over the item.
              // We trigger the click and override the `closeOnClick` preference to always close the menu.
              itemRef.current.click();
              menuEvents.emit('close', event);
            }
          },
        }),
      );
    },
    [closeOnClick, getButtonProps, highlighted, id, menuEvents, allowMouseUpTriggerRef, typingRef],
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
     * Whether to close the menu when the item is clicked.
     */
    closeOnClick: boolean;
    /**
     * Whether the component should ignore user interaction.
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
     * Whether to treat mouseup events as clicks.
     */
    allowMouseUpTriggerRef: React.RefObject<boolean>;
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
