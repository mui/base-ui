import * as React from 'react';
import { useMenuItem } from '../item/useMenuItem';
import { useControlled } from '../../utils/useControlled';
import { GenericHTMLProps } from '../../utils/types';
import { mergeReactProps } from '../../utils/mergeReactProps';

export function useMenuCheckboxItem(
  params: useMenuCheckboxItem.Parameters,
): useMenuCheckboxItem.ReturnValue {
  const { checked: checkedProp, defaultChecked, onCheckedChange, ...other } = params;

  const [checked, setChecked] = useControlled({
    controlled: checkedProp,
    default: defaultChecked ?? false,
    name: 'MenuCheckboxItem',
    state: 'checked',
  });

  const { getRootProps: getMenuItemRootProps, ...menuItem } = useMenuItem(other);

  const getRootProps = React.useCallback(
    (externalProps?: GenericHTMLProps): GenericHTMLProps => {
      return getMenuItemRootProps(
        mergeReactProps(externalProps, {
          role: 'menuitemcheckbox',
          'aria-checked': checked,
          onClick: (event: React.MouseEvent) => {
            setChecked((currentlyChecked) => !currentlyChecked);
            onCheckedChange?.(!checked, event.nativeEvent);
          },
        }),
      );
    },
    [checked, getMenuItemRootProps, onCheckedChange, setChecked],
  );

  return React.useMemo(
    () => ({
      ...menuItem,
      getRootProps,
      checked,
    }),
    [checked, getRootProps, menuItem],
  );
}

export namespace useMenuCheckboxItem {
  export interface Parameters extends useMenuItem.Parameters {
    checked?: boolean;
    defaultChecked?: boolean;
    onCheckedChange?: (checked: boolean, event: Event) => void;
  }

  export interface ReturnValue extends useMenuItem.ReturnValue {
    checked: boolean;
  }
}
