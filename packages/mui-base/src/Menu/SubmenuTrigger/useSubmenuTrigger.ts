import * as React from 'react';
import { ListDirection, ListItemMetadata, ListOrientation } from '@base_ui/react/useList';
import { CompoundParentContextValue } from '../../useCompound';
import { useMenuItem } from '../Item/useMenuItem';
import { useForkRef } from '../../utils/useForkRef';
import { MenuActionTypes, MenuReducerAction, MenuReducerState } from '../Root/menuReducer';
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
    state: MenuReducerState;
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
    state,
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
      return getMenuItemProps(
        mergeReactProps(externalProps, {
          'aria-haspopup': 'menu' as const,
          'aria-expanded': state.open,
          'aria-controls': state.popupId ?? undefined,
          ref: menuTriggerRef,
        }),
      );
    },
    [getMenuItemProps, menuTriggerRef, state.open, state.popupId],
  );

  return React.useMemo(
    () => ({
      getRootProps,
      rootRef: menuTriggerRef,
    }),
    [getRootProps, menuTriggerRef],
  );
}
