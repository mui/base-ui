import * as React from 'react';
import { FloatingEvents } from '@floating-ui/react';
import { useMenuItem } from '../Item/useMenuItem';
import { useForkRef } from '../../utils/useForkRef';
import { mergeReactProps } from '../../utils/mergeReactProps';
import { GenericHTMLProps } from '../../utils/types';

namespace useSubmenuTrigger {
  export interface Parameters {
    id: string | undefined;
    highlighted: boolean;
    disabled: boolean;
    rootRef?: React.Ref<Element>;
    menuEvents: FloatingEvents;
    setTriggerElement: (element: HTMLElement | null) => void;
    clickAndDragEnabled: boolean;
  }

  export interface ReturnValue {
    getRootProps: (externalProps?: GenericHTMLProps) => GenericHTMLProps;
  }
}

/**
 *
 * API:
 *
 * - [useSubmenuTrigger API](https://mui.com/base-ui/api/use-submenu-trigger/)
 */
export function useSubmenuTrigger(
  parameters: useSubmenuTrigger.Parameters,
): useSubmenuTrigger.ReturnValue {
  const { id, highlighted, disabled, rootRef, menuEvents, setTriggerElement, clickAndDragEnabled } =
    parameters;

  const { getRootProps: getMenuItemProps, rootRef: menuItemRef } = useMenuItem({
    closeOnClick: false,
    disabled,
    highlighted,
    id,
    menuEvents,
    rootRef,
    clickAndDragEnabled,
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
