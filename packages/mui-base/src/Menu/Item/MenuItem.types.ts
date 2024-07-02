import * as React from 'react';
import { BaseUIComponentProps } from '../../utils/types';

export type MenuItemOwnerState = {
  disabled: boolean;
  highlighted: boolean;
};

export interface MenuItemProps extends BaseUIComponentProps<'div', MenuItemOwnerState> {
  children?: React.ReactNode;
  onClick?: React.MouseEventHandler<HTMLElement>;
  /**
   * If `true`, the menu item will be disabled.
   * @default false
   */
  disabled?: boolean;
  /**
   * A text representation of the menu item's content.
   * Used for keyboard text navigation matching.
   */
  label?: string;
  /**
   * If `true`, the menu item won't receive focus when the mouse moves over it.
   *
   * @default false
   */
  disableFocusOnHover?: boolean;
  id?: string;
}
