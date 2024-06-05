import * as React from 'react';
import { Simplify } from '@mui/types';
import { ListAction } from '../../useList';
import { PopupProps } from '../../Unstable_Popup';

export interface MenuRootSlotPropsOverrides {}
export interface MenuListboxSlotPropsOverrides {}

export interface MenuActions {
  /**
   * Dispatches an action that can cause a change to the menu's internal state.
   */
  dispatch: (action: ListAction<string>) => void;
  /**
   * Resets the highlighted item.
   */
  resetHighlight: () => void;
}

export interface MenuPopupProps {
  /**
   * A ref with imperative actions that can be performed on the menu.
   */
  actions?: React.Ref<MenuActions>;
  /**
   * The element based on which the menu is positioned.
   */
  anchor?: PopupProps['anchor'];
  children?: React.ReactNode;
  className?: string;
  /**
   * Function called when the items displayed in the menu change.
   */
  onItemsChange?: (items: string[]) => void;
}

export type MenuPopupOwnerState = Simplify<
  MenuPopupProps & {
    open: boolean;
  }
>;
