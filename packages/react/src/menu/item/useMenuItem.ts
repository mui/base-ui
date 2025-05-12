'use client';
import * as React from 'react';
import { FloatingEvents } from '@floating-ui/react';
import { useButton } from '../../use-button';
import { mergeProps } from '../../merge-props';
import { HTMLProps, BaseUIEvent } from '../../utils/types';
import { useForkRef } from '../../utils/useForkRef';
import { useModernLayoutEffect } from '../../utils';
import { addHighlight, removeHighlight } from '../../utils/highlighted';

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

  useModernLayoutEffect(() => {
    if (highlighted) {
      addHighlight(itemRef);
    } else {
      removeHighlight(itemRef);
    }
  }, [highlighted]);

  const getItemProps = React.useCallback(
    (externalProps?: HTMLProps): HTMLProps => {
      return mergeProps(
        {
          id,
          role: 'menuitem',
          tabIndex: highlighted ? 0 : -1,
          onKeyUp: (event: BaseUIEvent<React.KeyboardEvent>) => {
            if (event.key === ' ' && typingRef.current) {
              event.preventBaseUIHandler();
            }
          },
          onClick: (event: React.MouseEvent | React.KeyboardEvent) => {
            if (closeOnClick) {
              menuEvents.emit('close', { domEvent: event, reason: 'item-press' });
            }
          },
          onMouseUp: (event: React.MouseEvent) => {
            if (itemRef.current && allowMouseUpTriggerRef.current) {
              // This fires whenever the user clicks on the trigger, moves the cursor, and releases it over the item.
              // We trigger the click and override the `closeOnClick` preference to always close the menu.
              itemRef.current.click();
              menuEvents.emit('close', { domEvent: event, reason: 'item-press' });
            }
          },
        },
        externalProps,
        getButtonProps,
      );
    },
    [getButtonProps, id, highlighted, typingRef, closeOnClick, menuEvents, allowMouseUpTriggerRef],
  );

  return React.useMemo(
    () => ({
      getItemProps,
      rootRef: mergedRef,
    }),
    [getItemProps, mergedRef],
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
    getItemProps: (externalProps?: HTMLProps) => HTMLProps;
    /**
     * The ref to the component's root DOM element.
     */
    rootRef: React.RefCallback<Element> | null;
  }
}
