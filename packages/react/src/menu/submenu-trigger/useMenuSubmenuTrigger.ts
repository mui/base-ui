'use client';
import * as React from 'react';
import { FloatingEvents } from '@floating-ui/react';
import { useMenuItem } from '../item/useMenuItem';
import { useForkRef } from '../../utils/useForkRef';
import { GenericHTMLProps } from '../../utils/types';
import { mergeReactProps } from '../../utils/mergeReactProps';

type MenuKeyboardEvent = {
  key: 'ArrowRight' | 'ArrowLeft' | 'ArrowUp' | 'ArrowDown';
} & React.KeyboardEvent;

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
    setActiveIndex,
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
      return mergeReactProps(externalProps, {
        ...getMenuItemProps({
          'aria-haspopup': 'menu' as const,
          onKeyDown: (event: MenuKeyboardEvent) => {
            if (event.key === 'ArrowRight' && highlighted) {
              // Clear parent menu's highlight state when entering submenu
              // This prevents multiple highlighted items across menu levels
              setActiveIndex(null);
            }
          },
          onClick: () => highlighted && setActiveIndex(null),
        }),
        ref: menuTriggerRef,
      });
    },
    [getMenuItemProps, menuTriggerRef, highlighted, setActiveIndex],
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
     * Whether to treat mouseup events as clicks.
     */
    allowMouseUpTriggerRef: React.RefObject<boolean>;
    /**
     * A ref that is set to `true` when the user is using the typeahead feature.
     */
    typingRef: React.RefObject<boolean>;
    /**
     * Callback to update the active (highlighted) item index.
     * Set to null to remove highlighting from all items.
     */
    setActiveIndex: (index: number | null) => void;
  }

  export interface ReturnValue {
    getRootProps: (externalProps?: GenericHTMLProps) => GenericHTMLProps;
  }
}
