'use client';
import * as React from 'react';
import { FloatingEvents } from '@floating-ui/react';
import { useMenuItem } from '../item/useMenuItem';
import { useForkRef } from '../../utils/useForkRef';
import { HTMLProps } from '../../utils/types';
import { useMenuRootContext } from '../root/MenuRootContext';

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
    allowMouseUpTriggerRef,
    typingRef,
    setActiveIndex,
  } = parameters;

  const { open } = useMenuRootContext();

  const { getItemProps, rootRef: menuItemRef } = useMenuItem({
    closeOnClick: false,
    disabled,
    highlighted,
    id,
    menuEvents,
    ref: externalRef,
    allowMouseUpTriggerRef,
    typingRef,
  });

  const triggerRef = React.useRef<HTMLDivElement | null>(null);
  const menuTriggerRef = useForkRef(triggerRef, menuItemRef, setTriggerElement);

  const getTriggerProps = React.useCallback(
    (externalProps?: HTMLProps) => {
      return {
        ...getItemProps(externalProps),
        tabIndex: open || highlighted ? 0 : -1,
        ref: menuTriggerRef,
        onBlur() {
          if (highlighted) {
            setActiveIndex(null);
          }
        },
      };
    },
    [getItemProps, highlighted, menuTriggerRef, open, setActiveIndex],
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
     * Whether to treat mouseup events as clicks.
     */
    allowMouseUpTriggerRef: React.RefObject<boolean>;
    /**
     * A ref that is set to `true` when the user is using the typeahead feature.
     */
    typingRef: React.RefObject<boolean>;
    /**
     * A callback to set the active index of the menu.
     */
    setActiveIndex: React.Dispatch<React.SetStateAction<number | null>>;
  }

  export interface ReturnValue {
    getTriggerProps: (externalProps?: HTMLProps) => HTMLProps;
  }
}
