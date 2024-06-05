import * as React from 'react';
import { Simplify } from '@mui/types';

export type MenuItemOwnerState = Simplify<
  MenuItemProps & {
    disabled: boolean;
    focusVisible: boolean;
    highlighted: boolean;
  }
>;

export interface MenuItemProps {
  children?: React.ReactNode;
  className?: string;
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

export interface MenuItemState {
  disabled: boolean;
  highlighted: boolean;
}
