'use client';
import * as React from 'react';
import { FloatingEvents } from '@floating-ui/react';
import { useMenuItem } from '../item/useMenuItem';
import { useForkRef } from '../../utils/useForkRef';
import { GenericHTMLProps } from '../../utils/types';

export function useMenuSubmenuTrigger(
  parameters: useMenuSubmenuTrigger.Parameters,
): useMenuSubmenuTrigger.ReturnValue {
  const {
    id,
    highlighted,
    disabled,
    ref: externalRef,
    menuEvents,
    setTriggerElement,
    typingRef,
  } = parameters;

  const { getItemProps, rootRef: menuItemRef } = useMenuItem({
    closeOnClick: false,
    disabled,
    highlighted,
    id,
    menuEvents,
    ref: externalRef,
    allowMouseUpTriggerRef: { current: false },
    typingRef,
  });

  const menuTriggerRef = useForkRef(menuItemRef, setTriggerElement);

  const getTriggerProps = React.useCallback(
    (externalProps?: GenericHTMLProps) => {
      return {
        ...getItemProps(externalProps),
        'aria-haspopup': 'menu' as const,
        ref: menuTriggerRef,
      };
    },
    [getItemProps, menuTriggerRef],
  );

  return React.useMemo(
    () => ({
      getTriggerProps,
      rootRef: menuTriggerRef,
    }),
    [getTriggerProps, menuTriggerRef],
  );
}

export namespace useMenuSubmenuTrigger {
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
     * A ref that is set to `true` when the user is using the typeahead feature.
     */
    typingRef: React.RefObject<boolean>;
  }

  export interface ReturnValue {
    getTriggerProps: (externalProps?: GenericHTMLProps) => GenericHTMLProps;
  }
}
