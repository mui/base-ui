import * as React from 'react';
import { useMenuItem } from '../item/useMenuItem';
import { HTMLProps } from '../../utils/types';
import { mergeProps } from '../../merge-props';

export function useMenuRadioItem(
  params: useMenuRadioItem.Parameters,
): useMenuRadioItem.ReturnValue {
  const { checked, setChecked, ...other } = params;

  const { getItemProps: getMenuItemProps, ...menuItem } = useMenuItem(other);

  const getItemProps = React.useCallback(
    (externalProps?: HTMLProps): HTMLProps => {
      return mergeProps(
        {
          role: 'menuitemradio',
          'aria-checked': checked,
          onClick: (event: React.MouseEvent) => {
            setChecked(event.nativeEvent);
          },
        },
        externalProps,
        getMenuItemProps,
      );
    },
    [checked, getMenuItemProps, setChecked],
  );

  return {
    ...menuItem,
    getItemProps,
    checked,
  };
}

export namespace useMenuRadioItem {
  export interface Parameters extends useMenuItem.Parameters {
    checked: boolean;
    setChecked: (event: Event) => void;
  }

  export interface ReturnValue extends useMenuItem.ReturnValue {
    checked: boolean;
  }
}
