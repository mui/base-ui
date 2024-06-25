import * as React from 'react';
import { ListItemMetadata } from '@base_ui/react/useList';
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
      return mergeReactProps(
        externalProps,
        {
          ref: menuTriggerRef,
        },
        getMenuItemProps(),
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
