import * as React from 'react';
import { useMenuItem } from '../item/useMenuItem';
import { useControlled } from '../../utils/useControlled';
import { HTMLProps } from '../../utils/types';
import { mergeProps } from '../../merge-props';

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

  const { getItemProps: getMenuItemProps, ...menuItem } = useMenuItem(other);

  const getItemProps = React.useCallback(
    (externalProps?: HTMLProps): HTMLProps => {
      return mergeProps(
        {
          role: 'menuitemcheckbox',
          'aria-checked': checked,
          onClick: (event: React.MouseEvent) => {
            setChecked((currentlyChecked) => !currentlyChecked);
            onCheckedChange?.(!checked, event.nativeEvent);
          },
        },
        externalProps,
        getMenuItemProps,
      );
    },
    [checked, getMenuItemProps, onCheckedChange, setChecked],
  );

  return React.useMemo(
    () => ({
      ...menuItem,
      getItemProps,
      checked,
    }),
    [checked, getItemProps, menuItem],
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
