import * as React from 'react';
import { BaseUIComponentProps } from '../../utils/types';

export interface MenuPopupProps extends BaseUIComponentProps<'div', MenuPopupOwnerState> {
  /**
   * A ref with imperative actions that can be performed on the menu.
   */
  children?: React.ReactNode;
  id?: string;
}

export type MenuPopupOwnerState = {};
