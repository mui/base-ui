import * as React from 'react';
import { useMenuItem } from '../item/useMenuItem';
import { GenericHTMLProps } from '../../utils/types';
import { mergeReactProps } from '../../utils/mergeReactProps';

export function useMenuRadioItem(
  params: useMenuRadioItem.Parameters,
): useMenuRadioItem.ReturnValue {
  const { checked, setChecked, ...other } = params;

  const { getItemProps: getMenuItemProps, ...menuItem } = useMenuItem(other);

  const getItemProps = React.useCallback(
    (externalProps?: GenericHTMLProps): GenericHTMLProps => {
      return getMenuItemProps(
        mergeReactProps(externalProps, {
          role: 'menuitemradio',
          'aria-checked': checked,
          onClick: (event: React.MouseEvent) => {
            setChecked(event.nativeEvent);
          },
        }),
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
