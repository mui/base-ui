import * as React from 'react';
import { ListDirection, ListItemMetadata, ListOrientation } from '@base_ui/react/useList';
import { CompoundParentContextValue } from '../../useCompound';
import { useMenuItem } from '../Item/useMenuItem';
import { useForkRef } from '../../utils/useForkRef';
import { MenuActionTypes, MenuReducerAction } from '../Root/useMenuRoot.types';
import { mergeReactProps } from '../../utils/mergeReactProps';
import { GenericHTMLProps } from '../../utils/types';

namespace useSubmenuTrigger {
  export interface Parameters {
    dispatch: React.Dispatch<MenuReducerAction>;
    parentDispatch: React.Dispatch<MenuReducerAction>;
    rootDispatch: React.Dispatch<MenuReducerAction>;
    id: string | undefined;
    highlighted: boolean;
    compoundParentContext: CompoundParentContextValue<string, ListItemMetadata>;
    disabled: boolean;
    label: string | undefined;
    rootRef?: React.Ref<Element>;
    orientation: ListOrientation;
    direction: ListDirection;
  }

  export interface ReturnValue {
    getRootProps: (externalProps?: GenericHTMLProps) => GenericHTMLProps;
  }
}

export function useSubmenuTrigger(
  parameters: useSubmenuTrigger.Parameters,
): useSubmenuTrigger.ReturnValue {
  const {
    dispatch,
    parentDispatch,
    rootDispatch,
    id,
    highlighted,
    compoundParentContext,
    disabled,
    label,
    rootRef,
    orientation,
    direction,
  } = parameters;

  const { getRootProps: getMenuItemProps, rootRef: menuItemRef } = useMenuItem({
    compoundParentContext,
    disabled,
    dispatch: parentDispatch,
    rootDispatch,
    highlighted,
    id,
    label,
    rootRef,
    closeOnClick: false,
    disableFocusOnHover: false,
    isNested: parentDispatch !== rootDispatch,
    orientation,
    direction,
  });

  const registerTrigger = React.useCallback(
    (element: HTMLElement | null) => {
      dispatch({
        type: MenuActionTypes.registerTrigger,
        triggerElement: element,
      });
    },
    [dispatch],
  );

  const menuTriggerRef = useForkRef(menuItemRef, registerTrigger);

  const getRootProps = React.useCallback(
    (externalProps?: GenericHTMLProps) => {
      const openSubmenuKey = getSubmenuOpenKey(orientation, direction);
      return mergeReactProps(
        externalProps,
        {
          ref: menuTriggerRef,
          onKeyDown: (event: React.KeyboardEvent) => {
            if (event.key === openSubmenuKey) {
              dispatch({
                type: MenuActionTypes.open,
                event,
              });
            }
          },
        },
        getMenuItemProps(),
      );
    },
    [getMenuItemProps, menuTriggerRef, dispatch, orientation, direction],
  );

  return React.useMemo(
    () => ({
      getRootProps,
      rootRef: menuTriggerRef,
    }),
    [getRootProps, menuTriggerRef],
  );
}

function getSubmenuOpenKey(orientation: ListOrientation, direction: ListDirection) {
  if (orientation === 'horizontal') {
    return 'ArrowDown';
  }

  return direction === 'ltr' ? 'ArrowRight' : 'ArrowLeft';
}
