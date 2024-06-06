import * as React from 'react';
import { ListAction } from '../../useList';
import { BaseUIComponentProps } from '../../utils/BaseUI.types';

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

export interface MenuPopupProps extends BaseUIComponentProps<'div', MenuPopupOwnerState> {
  /**
   * A ref with imperative actions that can be performed on the menu.
   */
  actions?: React.Ref<MenuActions>;
  children?: React.ReactNode;
  /**
   * Function called when the items displayed in the menu change.
   */
  onItemsChange?: (items: string[]) => void;
}

export type MenuPopupOwnerState = {
  open: boolean;
};
