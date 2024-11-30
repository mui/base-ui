import * as React from 'react';
import { useMenuItem } from '../item/useMenuItem';
import { GenericHTMLProps } from '../../utils/types';
import { mergeReactProps } from '../../utils/mergeReactProps';

/**
 *
 * API:
 *
 * - [useMenuRadioItem API](https://mui.com/base-ui/api/use-menu-radio-item/)
 */
export function useMenuRadioItem(
  params: useMenuRadioItem.Parameters,
): useMenuRadioItem.ReturnValue {
  const { checked, setChecked, ...other } = params;

  const { getRootProps: getMenuItemRootProps, ...menuItem } = useMenuItem(other);

  const getRootProps = React.useCallback(
    (externalProps?: GenericHTMLProps): GenericHTMLProps => {
      return getMenuItemRootProps(
        mergeReactProps(externalProps, {
          role: 'menuitemradio',
          'aria-checked': checked,
          onClick: (event: React.MouseEvent) => {
            setChecked(event.nativeEvent);
          },
        }),
      );
    },
    [checked, getMenuItemRootProps, setChecked],
  );

  return {
    ...menuItem,
    getRootProps,
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
