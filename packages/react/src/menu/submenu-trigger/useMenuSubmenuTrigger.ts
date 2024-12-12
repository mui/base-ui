'use client';
import * as React from 'react';
import { FloatingEvents } from '@floating-ui/react';
import { useMenuItem } from '../item/useMenuItem';
import { useForkRef } from '../../utils/useForkRef';
import { GenericHTMLProps } from '../../utils/types';

export function useMenuSubmenuTrigger(
  parameters: useSubmenuTrigger.Parameters,
): useSubmenuTrigger.ReturnValue {
  const {
    id,
    highlighted,
    disabled,
    ref: externalRef,
    menuEvents,
    setTriggerElement,
    allowMouseUpTriggerRef,
    typingRef,
  } = parameters;

  const { getRootProps: getMenuItemProps, rootRef: menuItemRef } = useMenuItem({
    closeOnClick: false,
    disabled,
    highlighted,
    id,
    menuEvents,
    ref: externalRef,
    allowMouseUpTriggerRef,
    typingRef,
  });

  const menuTriggerRef = useForkRef(menuItemRef, setTriggerElement);

  const getRootProps = React.useCallback(
    (externalProps?: GenericHTMLProps) => {
      return {
        ...getMenuItemProps({
          'aria-haspopup': 'menu' as const,
          ...externalProps,
        }),
        ref: menuTriggerRef,
      };
    },
    [getMenuItemProps, menuTriggerRef],
  );

  return React.useMemo(
    () => ({
      getRootProps,
      rootRef: menuTriggerRef,
    }),
    [getRootProps, menuTriggerRef],
  );
}

export namespace useSubmenuTrigger {
  export interface Parameters {
    id: string | undefined;
    highlighted: boolean;
    /**
     * Whether the component should ignore user interaction.
     */
    disabled: boolean;
    /**
     * The ref of the item.
     */
    ref?: React.Ref<Element>;
    /**
     * The FloatingEvents instance of the menu's root.
     */
    menuEvents: FloatingEvents;
    /**
     * A callback to set the trigger element whenever it's mounted.
     */
    setTriggerElement: (element: HTMLElement | null) => void;
    /**
     * If `true`, the menu item will listen for mouseup events and treat them as clicks.
     */
    allowMouseUpTriggerRef: React.RefObject<boolean>;
    /**
     * A ref that is set to `true` when the user is using the typeahead feature.
     */
    typingRef: React.RefObject<boolean>;
  }

  export interface ReturnValue {
    getRootProps: (externalProps?: GenericHTMLProps) => GenericHTMLProps;
  }
}
