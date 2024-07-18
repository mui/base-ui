import * as React from 'react';
import { FloatingEvents } from '@floating-ui/react';
import { useMenuItem } from '../Item/useMenuItem';
import { useForkRef } from '../../utils/useForkRef';
import { mergeReactProps } from '../../utils/mergeReactProps';
import { GenericHTMLProps } from '../../utils/types';

/**
 *
 * API:
 *
 * - [useSubmenuTrigger API](https://mui.com/base-ui/api/use-submenu-trigger/)
 */
export function useSubmenuTrigger(
  parameters: useSubmenuTrigger.Parameters,
): useSubmenuTrigger.ReturnValue {
  const {
    id,
    highlighted,
    disabled,
    ref: externalRef,
    menuEvents,
    setTriggerElement,
    treatMouseupAsClick,
  } = parameters;

  const { getRootProps: getMenuItemProps, rootRef: menuItemRef } = useMenuItem({
    closeOnClick: false,
    disabled,
    highlighted,
    id,
    menuEvents,
    ref: externalRef,
    treatMouseupAsClick,
  });

  const menuTriggerRef = useForkRef(menuItemRef, setTriggerElement);

  const getRootProps = React.useCallback(
    (externalProps?: GenericHTMLProps) => {
      return getMenuItemProps(
        mergeReactProps(externalProps, {
          'aria-haspopup': 'menu' as const,
          ref: menuTriggerRef,
        }),
      );
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
     * If `true`, the menu item will be disabled.
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
    treatMouseupAsClick: boolean;
  }

  export interface ReturnValue {
    getRootProps: (externalProps?: GenericHTMLProps) => GenericHTMLProps;
  }
}
